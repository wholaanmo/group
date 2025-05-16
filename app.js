require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.APP_PORT || 3000;

//ROUTERS
const userRouter = require("./api/users/user.router");
const expenseRouter = require("./api/expenses/expenses.router");
const personal_budgetRouter = require("./api/expenses/personal-budgets.router");
const groupRouter = require('./api/grp_expenses/group.router');
const expensePredictionRouter = require("./api/expenses/expensePrediction.router");
const ExpenseClassifier = require('./api/expenses/expenseClassifier.service'); 
const groupExpensesRouter = require('./api/grp_expenses/groupExpenses.router');
const groupBudgetRouter = require('./api/grp_expenses/group-budget.router');
const cors = require('cors')

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to: ${req.url}`);
  next();
}); 

app.use('/api/users', userRouter);
app.use('/api/expenses', expenseRouter)
app.use('/api/personal-budgets', personal_budgetRouter)
app.use('/api/grp_expenses', groupRouter);
app.use('/api/predictions', expensePredictionRouter);
app.use('/api/grp_expenses', groupExpensesRouter); 
app.use('/api/grp_expenses', groupBudgetRouter);

async function initializeServer() {
  try {
    console.log('Initializing classifier...');
    await ExpenseClassifier.loadTrainingData();
    
    startPeriodicPersistence();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    await runTestPredictions();
    
  } catch (err) {
    console.error('Server initialization failed:', err);
    process.exit(1);
  }
}

function startPeriodicPersistence() {
  // Initial immediate persistence
  ExpenseClassifier.persistCorrections()
    .then(() => console.log('Initial corrections persistence completed'))
    .catch(err => console.error('Initial persistence failed:', err));
  
  // Set up periodic persistence (every 5 minutes)
  const persistenceInterval = setInterval(async () => {
    try {
      await ExpenseClassifier.persistCorrections();
      console.log('Periodic corrections persistence completed');
    } catch (err) {
      console.error('Periodic persistence failed:', err);
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
  
  // Cleanup on process exit
  process.on('SIGTERM', () => {
    clearInterval(persistenceInterval);
    console.log('Stopped periodic persistence');
  });
  
  process.on('SIGINT', () => {
    clearInterval(persistenceInterval);
    console.log('Stopped periodic persistence');
    process.exit(0);  
  });
}

async function runTestPredictions() {
  try {
    const testCases = [
      { input: "jeep", expected: "Transportation" },
      { input: "burger", expected: "Food" }
    ];
    
    for (const test of testCases) {
      const result = await ExpenseClassifier.predict(test.input);
      console.log(`Test prediction: "${test.input}" => ${result}`, 
        result === test.expected ? "✓" : "✗");
    }
  } catch (err) {
    console.error('Test predictions failed:', err);
  }
}

initializeServer();
