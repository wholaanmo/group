<template>
  <navigation/>
  <div class="main-layout smooth-scroll">
    <div v-if="showBudgetExceededAlert" class="budget-alert">
      <div class="alert-content">
        <span class="alert-icon">⚠️</span>
        <span>You have exceeded your monthly budget by {{ formatPHP(Math.abs(remainingBudget)) }}!</span>
        <button @click="dismissAlert" class="dismiss-btn">×</button>
      </div>
      </div>

      <div v-if="showDeleteConfirmation" class="floating-alert alert alert-warning" role="alert">
        <span class="alert-icon"><i class="fas fa-trash"></i></span>
        <span style="margin-left: 25px;">
    Are you sure you want to delete {{ expenseToDelete?.item_name }} ({{ formatPHP(expenseToDelete?.item_price) }})?
  </span>
      <button @click="confirmDeleteExpense" class="btn-confirm">Yes</button>
      <button @click="cancelDeleteExpense" class="btn-cancel1">No</button>
    </div>

    <div v-if="error" class="error-message">
        An error occurred: {{ error }}
        <button @click="resetError">Try Again</button>
    </div>

      <div v-else>
    <div class="top-row"> 
  <div class="budget-container">
    <div class="budget-content">
    <div v-if="budgetSuccessMessage" class="budget-success-message" :class="{ hide: budgetHideMessage }">
      {{ budgetSuccessMessage }}
    </div>

    <div class="budget-display">
        <div class="budget-header">
          <h3>Budget for <br> {{ formatMonthYear(currentMonthYear) }}</h3>
          <button v-if="!hasExistingBudget" @click="showAddBudgetForm" class="btn-add">
            Add Budget
          </button>
          <button v-else @click="showEditBudgetForm" class="btn-edit">
            Edit Budget
          </button>
        </div>

    <div v-if="isBudgetLoading" class="loading">Loading budget...</div>

    <div v-else class="budget-details">
          <div class="month-selector">
            <button @click="prevMonth">&lt;</button>
            <span>{{ formatMonthYear(currentMonthYear) }}</span>
            <button @click="nextMonth">&gt;</button>
          </div>
          

  <div class="budget-amount">
    <span>BUDGET AMOUNT:</span>
    <strong class="amount-value">{{ formatPHP(currentMonthBudget.budget_amount) }}</strong>
  </div>

  <div class="expenses-summary">
  <div class="expenses-summary1">
          <div class="expenses-amount">
          <span>TOTAL EXPENSES:</span>
          <strong>{{ formatPHP(totalExpensesForMonth) }}</strong>
          </div>

          <div class="remaining-budget">
          <span>REMAINING BUDGET:</span>
          <strong :class="{ 'text-danger': remainingBudget < 0 }">
            {{ formatPHP(remainingBudget) }}
          </strong>
        </div>
        </div> 
        </div> 

          <div class="budget-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: budgetProgress + '%' }"
                :class="{ 'exceeded': budgetProgress >= 100 }"
              ></div>
            </div>
            <div class="progress-text">
              {{ budgetProgress.toFixed(1) }}% 
            </div>
          </div>
        </div>

        <!-- Budget Form Modal -->
        <div v-if="isAddingBudget || isEditingBudget" class="budget-form-modal">
          <div class="budget-form">
            <h3 class="form-title">{{ isEditingBudget ? 'EDIT' : 'ADD' }} BUDGET</h3>
            <div class="form-group1">
              <label>Month:</label>
              <input 
        v-if="isAddingBudget"
          type="text" 
          :value="formatMonthYear(currentMonthYear)" 
          class="form-input"
          disabled
        >
      <input 
        v-else
        type="text" 
          :value="formatMonthYear(currentMonthYear)" 
          class="form-input"
          disabled
        >
            </div>

            <div class="form-group1">
              <label>Budget Amount (₱):</label>
              <input 
                type="text" 
                v-model="budgetAmount" 
                placeholder="Enter budget amount"
                @input="formatCurrencyInput"
              required>
            </div>
            <div class="form-actions">
              <button @click="isEditingBudget ? updateBudget() : submitAddBudget()" class="btn-save">
                {{ isEditingBudget ? 'Update' : 'Save' }} Budget
              </button>
              <button @click="cancelBudgetForm" class="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>


  <!--ADDING EXPENSESSSS-->
    <div class="content-wrapper">
      <form @submit.prevent="handleSubmit" class="expense-form" ref="expenseForm"> 
         <input type="hidden" v-model="action" />
         <input type="hidden" v-if="editId" v-model="editId" />


         <div class="form-group">
          <h3> Add your Expenses</h3>
           <label>CATEGORY:</label>
           <div class="input-with-voice">
           <select v-model="expenseType" required @change="checkExpenseType">
            <option value="">Select a category</option> 
            <option value="Food">Food</option>
             <option value="Bill">Bill</option>
             <option value="Transportation">Transportation</option>
             <option value="Entertainment">Entertainment</option>
             <option value="Healthcare">Healthcare</option>
             <option value="Shopping">Shopping</option> 
             <option value="Other">Other</option>
            </select>
            <button 
      @click="startVoiceInput('category')" 
      class="voice-btn" 
      :class="{ active: isListening && voiceInputActiveField === 'category' }"
      title="Set category by voice"
    >
      <i class="fas fa-microphone"></i>
    </button>
    </div>
</div>

<div v-if="expenseType === 'Other'" class="form-group">
  <label>CUSTOM CATEGORY:</label>
  <div class="input-with-voice">
    <input 
      type="text" 
      v-model="customExpenseType" 
      placeholder="Enter custom category" 
    />
    <button 
      @click="startVoiceInput('customType')" 
      class="voice-btn" 
      :class="{ active: isListening && voiceInputActiveField === 'customType' }"
      title="Set custom type by voice"
    >
      <i class="fas fa-microphone"></i>
    </button>
  </div>
</div>

 
         <div class="form-group">
  <label>ITEM NAME:</label>
  <div class="input-with-voice">
    <input type="text" v-model="itemName" @input="onItemNameChange" placeholder="Enter item name" required />
    <button 
      @click="startVoiceInput('item')" 
      class="voice-btn" 
      :class="{ active: isListening && voiceInputActiveField === 'item' }"
      title="Set item name by voice"
    >
      <i class="fas fa-microphone"></i>
    </button>
  </div>
</div>
 
<div class="form-group">
  <label>ITEM PRICE:</label>
  <div class="input-with-voice">
    <input type="number" v-model.number="itemPrice" placeholder="Enter item price" required step="0.01" />
    <button 
      @click="startVoiceInput('amount')" 
      class="voice-btn" 
      :class="{ active: isListening && voiceInputActiveField === 'amount' }"
      title="Set amount by voice"
    >
      <i class="fas fa-microphone"></i>
    </button>
  </div>
</div>

         <button class="btn" type="submit"   :disabled="!hasBudgetForCurrentMonth">{{ editId ? 'Update Expense' : 'Add Expense' }}</button>
         <div v-if="!hasBudgetForCurrentMonth" class="no-budget-warning">
         <p>Please create a budget for {{ formatMonthYear(currentMonthYear) }} before adding expenses</p>
        </div>
         <div v-if="expenseSuccessMessage" class="expense-success-message" :class="{ hide: expenseHideMessage }">{{ expenseSuccessMessage }}</div>
      </form>

      </div>
      </div>

      <div v-if="showVoiceHelpModal" class="voice-help-modal">
  <div class="voice-help-content">
    <div class="voice-help-header">
      <h3><i class="fas fa-microphone"></i> Voice Commands Help</h3>
    </div>
    <div class="voice-help-body">
      <div class="voice-command" v-for="(command, index) in voiceCommandsHelp" :key="index">
        <div class="command-prefix">•</div>
        <div class="command-details">
          <span class="command-example">{{ command.example }}</span>
        </div>
      </div>
    </div>
    <div class="voice-help-footer">
      <button @click="showVoiceHelpModal = false" class="btn-ok">Got it!</button>
    </div>
  </div>
</div>

<button @click="showVoiceHelp()" class="voice-help-btn" title="Voice commands help">
  <i class="fas fa-question-circle"></i> Voice Help
</button>

      <!--YOUR LIST OF EXPENSES-->
      <div class="expenses-container smooth-scroll" ref="expensesContainer">
      <div class="expenses-section"> 
        <h3><i class="fas fa-coins"></i> <span>YOUR EXPENSES</span></h3> 
         <div class="expenses-table"> 
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Item Name</th>
                <th>Item Price</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense?.id">
  <td>{{ expense?.expense_type || 'N/A' }}</td>
  <td>{{ expense?.item_name || 'N/A' }}</td>
  <td>{{ expense?.item_price ? formatPHP(expense.item_price) : '₱0.00' }}</td>
  <td>{{ formatDate(expense?.expense_date) }}</td>
  <td class="actions">
    <button @click="editExpense(expense)" class="edit-btn">Edit</button>
    <button @click="deleteExpenseHandler(expense)" class="delete-btn">Delete</button>
                </td>
                </tr>
            </tbody>
          </table>
        </div>
       </div>
       
     <div class="total">
      Total: <strong>₱{{ totalAmount.toFixed(2) }}</strong> (≈ {{ formatUsd(convertPhpToUsd(totalAmount)) }} USD)
     </div>
    </div>
  </div>
  </div>
 </template>
 
 <script>
 import Navigation from "./navigation.vue";
 import { mapState, mapGetters, mapActions } from 'vuex'
 
 export default {
   name: 'Personal',
   components: { Navigation },
   data() {
     return {
      showVoiceHelpModal: false,
      isListening: false,
      voiceInput: '',
      voiceCommands: [],
      recognition: null,
      voiceInputActiveField: null,
       expenseType: '',
       customExpenseType: '',
       itemName: '',
       itemPrice: '',
       editId: null,
       action: 'add',
       hideMessage: false,
       successTimeout: null,
       budgetAmount: '',
       budgetEditId: null, 
       isAddingBudget: false,
       isEditingBudget: false,
       messageContext: '',
       budgetSuccessMessage: '',
       budgetHideMessage: false,
       budgetSuccessTimeout: null,
       expenseSuccessMessage: '',
       expenseHideMessage: false,
       expenseSuccessTimeout: null,
       filterMonth: null,
       error: null,
       selectedBudget: null,
       newBudgetMonthYear: this.getCurrentMonthYear(),
       isBudgetLoading: false,
       currentMonthYear: this.getCurrentMonthYear(),
       showBudgetExceededAlert: false,
       alertDismissed: false,
       dismissedAlerts: {},
       showDeleteConfirmation: false,
       expenseToDelete: null,
       lastCheckedMonthYear: null,
       isPredicting: false,
       showPredictionFeedback: false,
       predictionDebounce: null,
       exchangeRateError: null,
       voiceCommandsHelp: [
      {
        example: "Click the voice recorder button before speaking, and click it again when you're done."
      },
      {
        example: "Say the category (e.g., 'Transportation')."
  },
      {
        example: "If you selected 'Other', say your custom category (e.g., 'Pet supplies')."
      },
      {
        example: "Say the item name (e.g., 'Jeepney')." 
      },
      {
        example: "Say the item price (e.g., 'eleven pesos')."
      }
    ]
     };
   },
   
   
   computed: {
    ...mapState(['addExpenses', 'personalBudgets', 'usdExchangeRate']),
  ...mapGetters(['getTotalAmount', 'getCurrentBudget', 'getAvailableMonths', 'getAddExpenseMonthYear']),
  
  hasBudgetForCurrentMonth() {
    return this.currentMonthBudget?.budget_amount > 0;
  },

  safeExchangeRate() {
    return this.usdExchangeRate || 0.018045;
  },

  currentMonthExpenses() {
    return this.filteredExpenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      const selectedDate = new Date(this.currentMonthYear);
      return (
        expenseDate.getFullYear() === selectedDate.getFullYear() &&
        expenseDate.getMonth() === selectedDate.getMonth()
      );
    });
  },
  
  currentMonthBudget() {
    return this.$store.getters.getCurrentBudget(this.currentMonthYear) || {
      month_year: this.currentMonthYear,
      budget_amount: 0
    };
  },
  
  totalExpensesForMonth() {
    return this.filteredExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.item_price) || 0);
    }, 0);
  },
  
  remainingBudget() {
    const budgetAmount = this.currentMonthBudget?.budget_amount || 0;
    const totalExpenses = this.totalExpensesForMonth;
    return budgetAmount - totalExpenses; 
  },

  currentBudgetDisplay() {
    if (this.selectedBudget) {
      return this.formatPHP(this.selectedBudget.budget_amount);
    }
    return this.formatPHP(0);
  },

  budgetProgress() {
    if (this.currentMonthBudget.budget_amount <= 0) return 0;
    const progress = (this.totalExpensesForMonth / this.currentMonthBudget.budget_amount) * 100;
    return Math.min(progress, 100); 
  },

  shouldShowExpenses() {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.selectedMonthYear === currentMonthYear;
  },

  filteredExpenses() {
  const currentBudget = this.currentMonthBudget;
  if (!currentBudget?.id) return [];
  
  return this.addExpenses.filter(expense => {
    return expense.personal_budget_id === currentBudget.id;
    
  });
},

  selectedMonthYear: {
  get() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },
  set(value) {

    console.log("Month selection is locked in Add Expense page");
  }
},

currentBudget() {
  const currentMonthYear = this.getCurrentMonthYear();
  return this.$store.getters.getCurrentBudget(currentMonthYear);
},

     safeSelectedMonthYear() {
      return this.selectedMonthYear || this.currentMonthYear;
    },
 
    totalAmount() {
    return this.filteredExpenses.reduce((sum, expense) => {
      return sum + (Number(expense?.item_price) || 0);
    }, 0);
  },
 
     totalInUsd() {
      return this.convertPhpToUsd(this.totalAmount);
     },
 
     currentBudgetAmount() {
    return this.currentBudget.budget_amount;
  },
     
  hasExistingBudget() {
    return !!(this.selectedBudget && this.selectedBudget.id);
  },

  isBudgetExceeded() {
    if (!this.currentBudget?.budget_amount) return false;
    return this.totalAmount > this.currentBudget.budget_amount;
  }
},

   async mounted() {
  try {
    this.isLoading = true;
    const savedDismissedAlerts = localStorage.getItem('dismissedAlerts');
    if (savedDismissedAlerts) {
      this.dismissedAlerts = savedDismissedAlerts ? JSON.parse(savedDismissedAlerts) : {};
    }
    
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await this.setSelectedMonthYear(currentMonthYear);

    this.setupVoiceRecognition();

    await Promise.all([
      this.fetchExchangeRate(),
      this.fetchPersonalBudgets(),
      this.fetchAddExpenses(),
      this.loadBudgetForMonth(currentMonthYear)
    ]);
    
    this.checkBudgetStatus();
    
    if (this.editId) {
      this.$nextTick(() => {
        const formElement = this.$refs.expenseForm;
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    
  } catch (error) {
    console.error("Initialization error:", error);
    this.error = error.message || 'Failed to load data';
  } finally {
    this.isLoading = false;
  }
},

  beforeUnmount() {
    clearInterval(this.monthCheckInterval);
  },


  watch: {
  filteredExpenses: {
    deep: true,
    handler() {
      this.checkBudgetStatus();
    }
  },

  currentMonthBudget: {
    deep: true,
    handler() {
      this.checkBudgetStatus();
    }
  },
  
  currentMonthYear: {
    immediate: true,
    handler(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.checkBudgetStatus(true);
      }
    }
  }
  },

   methods: {
     ...mapActions([
       'fetchExchangeRate',
       'fetchExpenses',
       'fetchPersonalBudgets',
       'addExpense',
       'updateExpense',
       'deleteExpense',
       'addBudget',
       'updateBudget',
       'setSelectedMonthYear' ,
       'fetchAddExpenses' 
     ]),

     showVoiceHelp() {
    this.showVoiceHelpModal = true;
  },

     prevMonth() {
    const date = new Date(this.currentMonthYear);
    date.setMonth(date.getMonth() - 1);
    const now = new Date();
    const newMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const newDate = new Date(newMonthYear);
  
  if (newDate.getFullYear() < now.getFullYear() || 
      (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() < now.getMonth())) {

    this.showBudgetSuccessMessage('Cannot navigate to past months');
    return;
  }
  
  this.changeMonth(date);
},

  nextMonth() {
    const date = new Date(this.currentMonthYear);
    date.setMonth(date.getMonth() + 1);
    this.changeMonth(date);
  },

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      this.voiceInput = transcript;
      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.recognition.start();
      }
    };

    // Define voice commands
    this.voiceCommands = [
      {
        pattern: /^(set|select|choose) category (.*)/i,
        action: (match) => this.setCategoryFromVoice(match[2])
      },
      {
        pattern: /^(add|enter|set) item (.*)/i,
        action: (match) => this.setItemNameFromVoice(match[2])
      },
      {
        pattern: /^(set|enter) amount (.*)/i,
        action: (match) => this.setAmountFromVoice(match[2])
      },
      {
        pattern: /^submit|save|add expense/i,
        action: () => this.handleSubmit()
      },
      {
        pattern: /^help|what can i say/i,
        action: () => this.showVoiceHelp()
      }
    ];
  },

  startVoiceInput(field = null) {
    if (!this.recognition) {
      alert('Voice recognition is not supported in your browser');
      return;
    }

    this.stopVoiceInput();

    this.voiceInputActiveField = field;
    this.isListening = true;
    this.voiceInput = ''; 
    try {
      this.recognition.start();
      this.$toast.info("Listening... Speak now");
    } catch (err) {
      console.error('Speech recognition error:', err);
      this.$toast.error("Error starting voice recognition");
      this.isListening = false;
    }
  },

  stopVoiceInput() {
    if (this.isListening) {
      this.isListening = false;
      this.voiceInputActiveField = null;
      try {
        if (this.recognition) {
          this.recognition.stop();
        }
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      this.$toast.info("Stopped listening");
    }
  },

  processVoiceCommand(transcript) {
    if (!this.isListening) return;

    // Clean the transcript
    transcript = transcript.trim().toLowerCase();
    this.voiceInput = transcript;

    // Handle field-specific input
    if (this.voiceInputActiveField) {
      switch (this.voiceInputActiveField) {
        case 'category':
          this.handleCategoryInput(transcript);
          break;
        case 'item':
          this.handleItemInput(transcript);
          break;
        case 'amount':
          this.handleAmountInput(transcript);
          break;
          case 'customType': 
    this.handleCustomTypeInput(transcript);
    break;
      }
      this.stopVoiceInput(); // Auto-stop after field input
      return;
    }

 this.handleGeneralCommands(transcript);
  },

  handleCategoryInput(transcript) {
    const category = this.matchCategory(transcript);
    this.expenseType = category;
    this.$toast.success(`Category set to: ${category}`);
  },

  handleCustomTypeInput(transcript) {
  this.customExpenseType = transcript;
  this.$toast.success(`Custom type set to: ${transcript}`);
},

  handleItemInput(transcript) {
    this.itemName = transcript;
    this.$toast.success(`Item set to: ${transcript}`);
  },

  handleAmountInput(transcript) {
    const amount = this.extractNumber(transcript);
    if (amount !== null) {
      this.itemPrice = amount;
      this.$toast.success(`Amount set to: ${this.formatPHP(amount)}`);
    } else {
      this.$toast.error("Couldn't understand the amount. Please try again.");
    }
  },

  handleGeneralCommands(transcript) {
    if (transcript.startsWith('set category ') || transcript.startsWith('select category ')) {
      const category = transcript.replace(/^(set|select) category /i, '').trim();
      this.handleCategoryInput(category);
      return;
    }

    if (transcript.startsWith('set custom type ') || 
    transcript.startsWith('enter custom type ')) {
  const customType = transcript.replace(/^(set|enter) custom type /i, '').trim();
  this.handleCustomTypeInput(customType);
  return;
}
    
    // Command: Add item
    if (transcript.startsWith('add item ') || transcript.startsWith('set item ')) {
      const item = transcript.replace(/^(add|set) item /i, '').trim();
      this.handleItemInput(item);
      return;
    }
    
    // Command: Set amount
    if (transcript.startsWith('set amount ') || transcript.startsWith('enter amount ')) {
      const amount = transcript.replace(/^(set|enter) amount /i, '').trim();
      this.handleAmountInput(amount);
      return;
    }
    
    // Command: Submit
    if (transcript.includes('submit') || transcript.includes('save')) {
      this.handleSubmit();
      return;
    }
    
    // Command: Stop
    if (transcript.includes('stop') || transcript.includes('cancel')) {
      this.stopVoiceInput();
      return;
    }
    
    // Command: Help
    if (transcript.includes('help')) {
      this.showVoiceHelp();
      return;
    }
    
    // Fallback - if we don't recognize the command
    this.$toast.info("Command not recognized. Say 'help' for available commands.");
  },

  matchCategory(spokenCategory) {
  const categories = ['Food', 'Bill', 'Transportation', 'Entertainment', 'Healthcare', 'Shopping', 'Other'];
  const lowerSpoken = spokenCategory.toLowerCase().trim();
  
  // 1. First check for exact match
  const exactMatch = categories.find(cat => cat.toLowerCase() === lowerSpoken);
  if (exactMatch) return exactMatch;
  
  // 2. Fuzzy matching for each category
  if (['food', 'eat', 'meal', 'restaurant', 'groceries', 'dining', 'lunch', 'dinner', 'breakfast', 'snack'].some(term => lowerSpoken.includes(term))) {
    return 'Food';
  }
  
  if (['bill', 'payment', 'rent', 'electric', 'water', 'internet', 'phone', 'utility', 'subscription', 'mortgage'].some(term => lowerSpoken.includes(term))) {
    return 'Bill';
  }
  
  if (['transport', 'bus', 'train', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'subway', 'uber', 'lyft', 'car', 'maintenance'].some(term => lowerSpoken.includes(term))) {
    return 'Transportation';
  }
  
  if (['entertain', 'movie', 'game', 'concert', 'hobby', 'sport', 'netflix', 'spotify', 'music', 'party', 'bar', 'alcohol'].some(term => lowerSpoken.includes(term))) {
    return 'Entertainment';
  }
  
  if (['health', 'doctor', 'hospital', 'pharmacy', 'medicine', 'drug', 'insurance', 'dental', 'optical', 'checkup', 'clinic'].some(term => lowerSpoken.includes(term))) {
    return 'Healthcare';
  }
  
  if (['shop', 'clothes', 'gift', 'mall', 'store', 'amazon', 'online', 'purchase', 'buy', 'market'].some(term => lowerSpoken.includes(term))) {
    return 'Shopping';
  }
  
  // 3. Amount detection patterns (optional)
  if (/\d/.test(lowerSpoken)) {
    // If the spoken text contains numbers but no category was matched
    return 'Other';
  }
  
  // 4. Default fallback
  return 'Other';
},

  extractNumber(spokenAmount) {
    // Extract numbers like "twenty five pesos" -> 25
    const wordsToNumbers = {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
      'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17,
      'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30,
      'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
      'eighty': 80, 'ninety': 90
    };

    // Try to extract direct number
    const directNumberMatch = spokenAmount.match(/(\d+(\.\d+)?)/);
    if (directNumberMatch) {
      return parseFloat(directNumberMatch[1]);
    }

    // Try to convert words to number
    const words = spokenAmount.toLowerCase().split(/\s+/);
    let total = 0;
    let current = 0;
    
    for (const word of words) {
      const num = wordsToNumbers[word];
      if (num !== undefined) {
        if (num >= 20) {
          current = num;
        } else {
          current += num;
        }
      } else if (word === 'hundred') {
        current *= 100;
      } else if (word === 'thousand') {
        current *= 1000;
        total += current;
        current = 0;
      }
    }
    
    total += current;
    return total > 0 ? total : null;
  },

  setCategoryFromVoice(category) {
    const matchedCategory = this.matchCategory(category);
    this.expenseType = matchedCategory;
    this.$toast.success(`Category set to: ${matchedCategory}`);
  },

  setItemNameFromVoice(itemName) {
    this.itemName = itemName;
    this.$toast.success(`Item name set to: ${itemName}`);
  },

  setAmountFromVoice(amount) {
    const numericAmount = this.extractNumber(amount);
    if (numericAmount) {
      this.itemPrice = numericAmount;
      this.$toast.success(`Amount set to: ${this.formatPHP(numericAmount)}`);
    } else {
      this.$toast.error("Couldn't understand the amount");
    }
  },


  async changeMonth(date) {
    const newMonthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  this.currentMonthYear = newMonthYear;

  await Promise.all([
    this.$store.dispatch('fetchAddExpenses'),
    this.loadBudgetForMonth(newMonthYear)
  ]);
  
  this.checkBudgetStatus(true);

  this.dismissedAlerts[newMonthYear] = false;
  localStorage.setItem('dismissedAlerts', JSON.stringify(this.dismissedAlerts));
},

    checkMonthChange() {
    const lastAccessedMonth = localStorage.getItem('lastAccessedMonth');
    const currentMonth = new Date().getMonth();
    
    if (lastAccessedMonth && parseInt(lastAccessedMonth) !== currentMonth) {
        console.log('New month detected - resetting view');
        localStorage.removeItem('budgetAlertDismissed');
        this.alertDismissed = false;

        const newMonthYear = this.getCurrentMonthYear();
        this.setSelectedMonthYear(newMonthYear);
        
        Promise.all([
      this.fetchAddExpenses(), 
      this.fetchPersonalBudgets()
    ]).then(() => {
      this.checkBudgetStatus();
    });
  }
      
      localStorage.setItem('lastAccessedMonth', currentMonth);
    },

     onItemNameChange() {
      clearTimeout(this.predictionDebounce);
      
      // Only predict if item name has at least 3 characters and no category is selected
      if (this.itemName.length < 3 || this.expenseType) return;
      
      this.predictionDebounce = setTimeout(() => {
        this.predictCategory();
      }, 500); // Debounce to avoid too many requests
    },
    
    async handleLearningData(expenseData) { 
  try {
    // Skip if missing required fields
    if (!expenseData.item_name?.trim() || !expenseData.expense_type) {
      console.log('Skipping learning - missing required fields');
      return { success: false, reason: 'Missing required fields' };
    }

    const payload = {
      item_name: expenseData.item_name.trim(),
      expense_type: expenseData.expense_type,
      item_price: expenseData.item_price ? Number(expenseData.item_price) : null,
      personal_budget_id: expenseData.personal_budget_id || null,
      userId: this.$store.state.user?.id || null
    };

    console.log('Attempting to send learning data:', payload);
      
    const response = await this.$axios.post('/api/predictions/learn', payload, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Learning response:', response.data);
    return { success: true, data: response.data };

  } catch (error) {
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      config: error.config
    };
    
    console.error('Learning failed (non-critical):', errorDetails);
    
    // Return error details but don't throw - learning failure shouldn't block UI
    return { 
      success: false, 
      error: errorDetails,
      isCritical: false 
    };
  }
},

async predictCategory() {
  if (this.isPredicting || !this.itemName || this.itemName.length < 3) return;
  
  try {
    this.isPredicting = true;
    
    const response = await this.$axios.post('/api/predictions/predict', {
      item_name: this.itemName.trim() // Add trim() to clean input
    }, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`,
        'Content-Type': 'application/json' // Explicit content type
      }
    });
    
    if (response.data.success) {
      const predictedCategory = response.data.data.expense_type;
      const confidence = response.data.data.confidence;
    //  this.expenseType = predictedCategory;
      
    this.showPredictionFeedback = (confidence < 0.7) || (predictedCategory === 'Other');
      this.expenseType = predictedCategory;
    }
  } catch (error) {
    console.error('Prediction failed:', error);
    this.$toast.error("Prediction service unavailable. Please try later.");
  } finally {
    this.isPredicting = false;
  }
},

shouldSuggestAlternative(itemName) {
  const lowerItem = itemName.toLowerCase();
  const words = lowerItem.split(/\s+/);
  
  const categoryKeywords = {
        Food: [
          "burger", "burgei", "burgir", "hamburger", "jollibee", 
          "pizza", "piza", "pasta", "sandwich", "fries", "milktea",
          "rice", "noodles", "chicken", "mcdo", "kfc"
        ],
        Bill: [
          "electric bill", "water bill", "internet bill", "phone bill",
          "cable bill", "utility bill", "rent", "mortgage", "electricity",
          "water payment", "internet payment"
        ],
        Transportation: [
          "gasoline", "gas", "petrol", "diesel", "jeepney fare",
          "bus", "mrt", "grab", "angkas", "taxi",
          "lrt fare", "tricycle fare", "parking fee", "car maintenance"
        ],
        Entertainment: [
          "movie tickets", "netflix", "spotify", "youtube premium",
          "concert tickets", "videoke", "arcade", "theme park",
          "movie", "cinema", "streaming", "game", "video game"
        ],
        Healthcare: [
          "doctor visit", "hospital", "medicine", "vitamins",
          "checkup", "dentist", "vaccine", "medical supplies",
          "pharmacy", "drugstore", "clinic", "xray", "laboratory"
        ],
        Shopping: [
          'shoes', 'clothes', 'shirt', 'pants', 'dress',
          'gadget', 'phone', 'laptop', 'accessories', 'bag',
          'watch', 'perfume', 'makeup', 'groceries', 'market',
          'office chair', 'desk', 'monitor', 'keyboard', 'mouse',
          'furniture', 'stationery', 'notebook', 'pen', 'backpack'
        ]
      };
  const isUnknown = !Object.values(categoryKeywords).some(keywords => 
    keywords.some(keyword =>
      keyword.includes(' ') ? 
        lowerItem.includes(keyword) : 
        words.includes(keyword)
    )
  );

  return isUnknown;
},

async submitPredictionFeedback(isCorrect) {
  try {
    const payload = {
      item_name: this.itemName.trim(),
      expense_type: isCorrect ? this.expenseType : 'Other', // Use correct type or 'Other'
      correction_source: isCorrect ? 'manual' : 'auto',
      userId: this.$store.state.user?.id, // Match your column name (userId not user_id)
      // Optional fields you might want to include:
      // item_price: this.itemPrice, // If available
      // expense_date: new Date(), // Will use default if not provided
      // confidence_score: this.confidenceScore // If available
    };

    // For both correct and incorrect cases
    await this.$axios.post('/api/predictions/learn', payload, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
      }
    });

    if (isCorrect) {
      this.$toast.success("Category confirmed!");
    } else {
      this.expenseType = '';
      this.$toast.info("Prediction rejected. Will learn from this.");
    }

    this.showPredictionFeedback = false;
  } catch (error) {
    console.error('Feedback error:', error);
    this.$toast.error("Feedback submission failed");
  }
},

  dismissAlert() {
    this.showBudgetExceededAlert = false;
    this.dismissedAlerts = {
    ...this.dismissedAlerts,
    [this.currentMonthYear]: true
  };
  localStorage.setItem('dismissedAlerts', JSON.stringify(this.dismissedAlerts));
},

  checkBudgetStatus(forceShow = false) {
    const budget = this.currentMonthBudget;

  if (!budget?.budget_amount || budget.budget_amount <= 0) {
    this.showBudgetExceededAlert = false;
    return;
  }
  
  const expensesForSelectedMonth = this.filteredExpenses.reduce((sum, expense) => {
    return sum + (Number(expense.item_price) || 0);
  }, 0);

  const isExceeded = expensesForSelectedMonth > budget.budget_amount;
  const isDismissed = this.dismissedAlerts[this.currentMonthYear] || false;

  this.showBudgetExceededAlert = isExceeded && (forceShow || !isDismissed);
},
  
     getCurrentMonthYear() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    },
 
     handleMonthYearChange(newMonthYear) {
       this.setSelectedMonthYear(newMonthYear);  
       this.fetchExpenses();
     },
 
     formatMonthYear(monthYear) {
       try {
         if (!monthYear) {
           const now = new Date();
           return now.toLocaleString('default', { month: 'long', year: 'numeric' });
         }
         
         if (typeof monthYear === 'string') {
           const [year, month] = monthYear.split('-').map(Number);
           if (!isNaN(year) && !isNaN(month)) {
             const date = new Date(year, month - 1);
             return date.toLocaleString('default', { 
               month: 'long', 
               year: 'numeric' 
             });
           }
         }
         
         // Fallback for invalid input
         const now = new Date();
         return now.toLocaleString('default', { month: 'long', year: 'numeric' });
       } catch (e) {
         console.error('Error formatting month/year:', e);
         return 'Invalid date';
       }
     },
 
     // Budget Form Methods - REPLACED submitBudget with these two methods
     showAddBudgetForm() {
    this.isAddingBudget = true;
    this.isEditingBudget = false;
    this.budgetAmount = '';
    this.newBudgetMonthYear = this.currentMonthYear;
  },

     
     showEditBudgetForm() {
      this.isEditingBudget = true;
      this.isAddingBudget = false;
      this.budgetAmount = this.selectedBudget.budget_amount;
     },
     
     cancelBudgetForm() {
       this.isAddingBudget = false;
       this.isEditingBudget = false;
     },
 
     async loadBudgetForMonth(monthYear) {
    this.isBudgetLoading = true;
    try {
      const budget = await this.$store.dispatch('fetchBudgetForMonth', monthYear);
     
      this.selectedBudget = budget && budget.id ? budget : {
      month_year: monthYear,
      budget_amount: 0
    };
    
  } catch (error) {
    console.error('Error loading budget:', error);
    this.selectedBudget = {
      month_year: monthYear,
      budget_amount: 0
    };
  } finally {
    this.isBudgetLoading = false;
  }
},
     async submitAddBudget() {
    try {
      if (!this.budgetAmount) {
        throw new Error('Please enter a budget amount');
      }

      const monthYear = this.isAddingBudget ? 
        this.newBudgetMonthYear : 
        this.currentMonthYear;

      const budgetData = {
        month_year: monthYear,
        budget_amount: this.parseCurrency(this.budgetAmount)
      };
      
      const result = await this.addBudget(budgetData); 
      
      if (result.success) {
        this.showBudgetSuccessMessage(result.message || 'Budget added successfully!');
        await this.fetchPersonalBudgets();

        if (this.isAddingBudget && monthYear !== this.currentMonthYear) {
          this.currentMonthYear = monthYear;
          await this.loadBudgetForMonth(monthYear);
        }

        this.cancelBudgetForm();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Budget add error:', error);
      this.showBudgetSuccessMessage(error.message || 'Failed to add budget');
    }
  },
 
     async updateBudget() {
      try {
      if (!this.selectedBudget?.id) {
        throw new Error('No budget found for current month');
      }

      if (!this.budgetAmount) {
        throw new Error('Please enter a budget amount');
      }
 
      const budgetData = {
        id: this.selectedBudget.id,
        month_year: this.currentMonthYear,
        budget_amount: this.parseCurrency(this.budgetAmount)
      };
         
         const result = await this.$store.dispatch('updateBudget', budgetData);
         
         if (result.success) {
           this.showBudgetSuccessMessage(result.message || 'Budget updated successfully!');
           await this.loadBudgetForMonth(this.currentMonthYear);
           await this.fetchPersonalBudgets();
           this.cancelBudgetForm();
         } else {
           throw new Error(result.message);
         }
       } catch (error) {
         this.showBudgetSuccessMessage(error.message || 'Failed to update budget');
       }
     },
 
     parseCurrency(value) {
       if (!value) return 0;
       const numericValue = String(value).replace(/[^\d.]/g, '');
       return parseFloat(numericValue) || 0;
     },
     
     convertPhpToUsd(phpAmount) {
      const rate = this.safeExchangeRate;
      const usdAmount = parseFloat(phpAmount) * rate;
      return parseFloat(usdAmount.toFixed(6)); 
    },
     
     formatUsd(value) {
       return '$' + parseFloat(value).toFixed(2);
     },
     
     formatPHP(value) {
  try {
    const numericValue = typeof value === 'string' ? this.parseCurrency(value) : value;
    const amount = Number(numericValue) || 0;
    
    return amount.toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).replace('₱', '₱'); 
  } catch (e) {
    console.error('Error formatting PHP:', e);
    return '₱0.00'; // Fallback value
  }
},

     
     formatDate(dateString) {
       if (!dateString || dateString === 'N/A') return 'N/A';
       
       try {
         const options = { 
           day: 'numeric',   
           month: 'short',   
           year: 'numeric'    
         };
         return new Date(dateString).toLocaleDateString('en-US', options);
       } catch (e) {
         console.error('Date formatting error:', e);
         return 'N/A';
       }
     },
 
     // Expense Methods
     async handleSubmit() {
  try {
    if (!this.hasBudgetForCurrentMonth) {
      this.showExpenseSuccessMessage('Please create a budget for this month before adding expenses');
      return;
    }

    if (!this.validateExpenseForm()) return;

    const currentMonthYear = this.currentMonthYear;
    let budget = await this.$store.dispatch('fetchBudgetForMonth', currentMonthYear);

    if (!budget?.id) {
      budget = await this.$store.dispatch('addBudget', {
        month_year: currentMonthYear,
        budget_amount: 0
      });
    }

    const expenseData = {
  item_price: Number(this.itemPrice),
  expense_type: this.expenseType === 'Other' ? this.customExpenseType : this.expenseType,
  item_name: this.itemName,
  personal_budget_id: budget.id,
};

    console.log('Submitting expense:', expenseData);
    
    let result;
    if (this.editId) {
      result = await this.updateExpense({
        id: this.editId,
        expenseData: expenseData
      });
    } else {
      result = await this.addExpense(expenseData);
      
      if (result.success) {
        await this.handleLearningData({
          item_name: expenseData.item_name,
          expense_type: expenseData.expense_type,
          item_price: expenseData.item_price,
          personal_budget_id: expenseData.personal_budget_id,
         // custom_type: expenseData.custom_type
        });
      }
    }

    if (result.success) {
      console.log('Expense added successfully:', result.data);
      
      // Refresh data
      await Promise.all([
        this.fetchAddExpenses(),
        this.fetchPersonalBudgets()
      ]);
      
      this.checkBudgetStatus(true);
      
      this.showExpenseSuccessMessage(this.editId ? 'Expense updated!' : 'Expense added!');
      this.resetForm();
      
      this.$nextTick(() => {
        const target = this.editId ? this.$refs.expenseForm : this.$refs.expensesContainer;
        target?.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      console.error('Failed to add expense:', result.message);
      this.showExpenseSuccessMessage(result.message || 'Failed to add expense');
    }
  } catch (error) {
    console.error('Submit error:', error);
    this.showExpenseSuccessMessage(error.message || 'Failed to save expense');
  }
},

validateExpenseForm() {
    if (!this.itemPrice || isNaN(Number(this.itemPrice)) || Number(this.itemPrice) <= 0) {
    this.showExpenseSuccessMessage('Please enter a valid positive amount');
    return false;
  }

  if (!this.itemPrice || isNaN(Number(this.itemPrice))) {
    this.showExpenseSuccessMessage('Please enter a valid amount');
    return false;
  }

  if (!this.expenseType) {
    this.showExpenseSuccessMessage('Please select an expense type');
    return false;
  }

  if (!this.itemName?.trim()) {
    this.showExpenseSuccessMessage('Please enter an item name');
    return false;
  }

  if (!this.currentBudget?.id) {
    this.showExpenseSuccessMessage('No valid budget selected');
    return false;
  }

  return true;
},
 
editExpense(expense) {
  if (!expense?.id) {
    console.error('Cannot edit - invalid expense:', expense);
    this.showExpenseSuccessMessage('Cannot edit this expense');
    return;
  }
  
  this.editId = expense.id;
  this.expenseType = expense.expense_type || '';
  this.customExpenseType = this.expenseType === 'Other' ? expense.expense_type : '';
  this.itemName = expense.item_name || '';
  this.itemPrice = expense.item_price || '';
  this.action = 'edit'; // Make sure this is set

  this.$nextTick(() => {
    this.$refs.expenseForm.scrollIntoView({ behavior: 'smooth' });
  });
},
 
async deleteExpenseHandler(expense) {
  this.showDeleteConfirmation = true;
  this.expenseToDelete = expense; // Store the entire expense object
},

  confirmDeleteExpense() {
    const id = this.expenseToDelete?.id;
  if (!id) {
    this.showExpenseSuccessMessage('No expense selected for deletion');
    this.showDeleteConfirmation = false;
    return;
  }

    this.deleteExpense(id).then(result => {
      if (result.success) {
        this.showExpenseSuccessMessage('Expense deleted successfully!');
        this.checkBudgetStatus(true)
      } else {
        this.showExpenseSuccessMessage(result.message || 'Failed to delete expense');
      }
      this.showDeleteConfirmation = false; // Hide confirmation after the operation
      this.expenseToDelete = null; // Clear the stored expense id
    });
  },

  cancelDeleteExpense() {
    this.showDeleteConfirmation = false; // Hide confirmation if user cancels
    this.expenseToDelete = null; // Clear the stored expense id
  },

     handleError(error) {
    console.error('Component error:', error);
    this.error = error.message || 'An unexpected error occurred';
  },
  resetError() {
    this.error = null;
    this.mounted(); // Retry initialization
  },
     
     resetForm() {
       this.expenseType = '';
       this.customExpenseType = '';
       this.itemName = '';
       this.itemPrice = '';
       this.editId = null;
       this.action = 'add';
     },
 
     showBudgetSuccessMessage(message) {
       if (this.budgetSuccessTimeout) {
         clearTimeout(this.budgetSuccessTimeout);
       }
       
       this.budgetHideMessage = false;
       this.budgetSuccessMessage = message;
       
       this.budgetSuccessTimeout = setTimeout(() => {
         this.budgetHideMessage = true;
         setTimeout(() => {
           this.budgetSuccessMessage = '';
         }, 500);
       }, 2500);
     },
     
     showExpenseSuccessMessage(message) {
  if (this.expenseSuccessTimeout) {
    clearTimeout(this.expenseSuccessTimeout);
    this.expenseSuccessTimeout = null;
  }
  
  this.expenseHideMessage = false;
  this.expenseSuccessMessage = message;
  
  this.expenseSuccessTimeout = setTimeout(() => {
    this.expenseHideMessage = true;
    this.expenseSuccessTimeout = setTimeout(() => {
      this.expenseSuccessMessage = '';
      this.expenseSuccessTimeout = null;
    }, 500);
  }, 2500);
},
 
     getCurrentBudgetId() {
       return this.getCurrentBudget ? this.getCurrentBudget.id : null;
     }
   }
  };
 </script>

 
<style scoped>
.btn-confirm, .btn-cancel1 {
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  color: #fff;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.btn-confirm {
  background: linear-gradient(135deg, #8bbcae, #6a9c89, #4f7a6b);
  color: white;
  box-shadow: 0 2px 5px rgba(106, 156, 137, 0.4);
}
.btn-cancel1 {
  background: linear-gradient(135deg, #e57373, #d32f2f, #b71c1c);
  color: white;
  box-shadow: 0 2px 5px rgba(211, 47, 47, 0.4);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #7aa98c, #5e8873, #486858);
  box-shadow: 0 4px 10px rgba(74, 109, 92, 0.6);
}

.btn-cancel1:hover{
  background: linear-gradient(135deg, #d32f2f, #b71c1c, #7f0000);
  box-shadow: 0 4px 10px rgba(123, 0, 0, 0.6);
}

.voice-help-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.voice-help-content {
  background-color: #fefefe;
  border-radius: 16px;
  width: 90%;
  max-width: 440px;
  max-height: 70vh; /* Limit height to 70% of the viewport */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out;
  font-family: "Segoe UI", sans-serif;
  display: flex;
  flex-direction: column;
}


.voice-help-header {
  background: linear-gradient(135deg, #8bbcae, #6a9c89, #4f7a6b);
  color: white;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.voice-help-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 5px;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
}

.voice-help-body {
  padding: 18px 20px;
  max-height: 55vh;
  overflow-y: auto;
}

.voice-command {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.command-prefix {
  font-size: 1.4rem;
  color: #6a9c89;
  margin-right: 12px;
}

.command-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.command-example {
  font-weight: 800;
  color: #4f7a6b;
  font-family: 'Courier New', monospace;
  font-size: 0.93rem;
}

.command-description {
  color: #555;
  font-size: 0.88rem;
}

.voice-help-footer {
  padding: 14px 20px;
  background-color: #f0f2f1;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ddd;
}

.btn-ok {
  background-color: #6a9c89;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.2s;
}

.btn-ok:hover {
  background-color: #4f7a6b;
  transform: translateY(-2px);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.voice-help-btn {
  position: fixed;
  bottom: 20px;
  right: 3px;
  background: linear-gradient(135deg, #8bbcae, #6a9c89, #4f7a6b);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  font-size: 0.9rem;
}

.voice-help-btn:hover {
  background: #8bbcae;
}

/* Animation */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .voice-help-content {
    width: 95%;
  }
  
  .command-details {
    flex-direction: column;
  }
}
.input-with-voice {
  position: relative;
  display: flex;
  align-items: center;
}

.voice-btn {
  background: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.voice-btn:hover {
  color: #42b983;
}

.voice-btn.active {
  background: #ff4444;
  color: white;
  animation: pulse 1.5s infinite;
}

.voice-controls {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.voice-control-btn {
  padding: 10px 15px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-control-btn.active {
  background: #ff4444;
}

.voice-feedback {
  margin-top: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.voice-input-preview {
  font-style: italic;
  color: #666;
}

.voice-help-text {
  font-size: 0.8em;
  color: #999;
  margin-top: 5px;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.expenses-section h3 i {
  margin-right: 8px; 
}
.smooth-scroll {
  scroll-behavior: smooth;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-budget-warning {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
}
.text-danger {
  color: #c62828;
}
.budget-form input[type="month"] {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
}

.month-selector button:hover {
  background: #e0e0e0;
}

.month-selector span {
  min-width: 150px;
  padding: 0 12px;
  text-align: center;
  font-weight: bold;
}

.predicting-text {
  color: #555;
  font-style: italic;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: block;
  margin-top: 2px;
  opacity: 0.85;
}

.prediction-feedback {
  margin-top: 10px;
  padding: 5px;
  background: linear-gradient(to right, #fafafa, #f0f0f0);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
}

.feedback-btn {
  margin-right: 8px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease, transform 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.feedback-btn.correct {
  background: #4CAF50;
  color: white;
}

.feedback-btn.correct:hover {
  background: #45a049;
  transform: scale(1.05);
}

.feedback-btn.incorrect {
  background: #f44336;
  color: white;
}

.feedback-btn.incorrect:hover {
  background: #e53935;
  transform: scale(1.05);
}


.budget-alert {
  position: fixed;
  top: 290px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 20px 30px; /* Increased padding */
  min-width: 320px;    /* Optional: ensures a wider box */
  color: #c62828;
  font-weight: bold;
  font-size: 1.2em;    /* Increased font size */
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 1.5em;
}

.dismiss-btn {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.8em;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.dismiss-btn:hover {
  background-color: rgba(198, 40, 40, 0.1); /* light red tint */
  color: #b71c1c;
  transform: scale(1.05);
}



/* Floating Delete Confirmation Alert */
.floating-alert {
  position: fixed;
  top: 290px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  border-radius: 6px;
  padding: 20px 30px; /* Increased padding */
  min-width: 350px;    /* Optional: ensures a wider box */
  color: #c62828;
  font-weight: bold;
  font-size: 1.2em;    /* Increased font size */
  z-index: 1000;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  animation: slideDown 0.3s ease-out;
}

.floating-alert button {
  padding: 10px 10px;
  margin-left: 10px;
  width: 80px;
}


@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
} /*NEWWWWWWWWWWWW */

.main-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
}

.top-row {
  margin-top: 100px;
  display: flex;
  flex-wrap: nowrap; /* prevent wrapping by default */
  gap: 20px;
  width: 100%;
  flex-direction: row;
} 

/* Budget Container Styles */
.budget-container {
  flex: 1 1 30%;
  min-width: 150px;
  background-color: #daf9da; 
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #2e4e38;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  height: auto;
  color: #1e3a2b;
  font-size: 1.05rem;
}

.budget-header {
  flex-wrap: wrap;
  justify-content: space-between;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.budget-header h3 {
  color: #183d2a;
  font-size: 1.8rem;
  margin-right: 25px;
  margin-bottom: 20px;
  font-weight: bold;
}

.budget-content {
  width: 100%;
}

.btn-add, .btn-edit {
  background: linear-gradient(135deg, #2a4935, #3d6b4d);
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  max-width: 72px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  /* Creative additions */
  position: relative;
  overflow: hidden;
  font-weight: 600;
  letter-spacing: 0.05em;
}

/* Subtle radial highlight effect */
.btn-add::before,
.btn-edit::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
  pointer-events: none;
}

.btn-add:hover::before,
.btn-edit:hover::before {
  opacity: 1;
}

/* Hover effect */
.btn-add:hover, .btn-edit:hover {
  background: #e6e6e6;
  color: #2a2a2a;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  font-weight: 700;
  letter-spacing: 0.1em;
}


.budget-display {
  flex-wrap: wrap;
  background: rgba(32, 28, 28, 0.05);
  padding: 20px;
  border-radius: 10px;
}

.budget-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-month-row, .budget-amount-row {
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-label {
  font-weight: 500;
  font-size: 1rem;
}
.budget-month, .budget-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.budget-amount {
  background-color: #ffffff;           /* clean white for contrast */
  border: 2px solid #6A9C89;           /* soft green border */
  padding: 12px 16px;
  border-radius: 10px;
  color: #388e3c;                      /* dark green for label */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  font-weight: 650;
  font-size: 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
}

.budget-form .form-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}


.amount-value {
  color: #2e7d32;                      /* slightly darker green */
  font-size: 18px;
}

.budget-form label {
  min-width: 60px;
}

.budget-form input, .budget-form select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
}

.budget-form-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  box-sizing: border-box;
  margin-top: 20px;
  width: 100%;
}

.budget-btn {
  padding: 12px 0;
  background-color: #2a4935;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  flex: 1;
}

.budget-btn:hover {
  background: #dcdcdc; 
  color: #333333;
  transform: translateY(-2px);
}

.cancel-btn {
  background-color: #6c757d;
}

.cancel-btn:hover {
  background-color: #4b5256;
  color: white;
}

.budget-success-message {
  background-color: #d4edda;
  color: #1d4d2b;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
  font-size: 1rem;
}
  
.budget-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.month-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 1.2rem;
  color: #1b3d2f;
}

.month-selector button {
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.3s;
  background: #2a4935;
  color: white;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 1rem;
}

.expenses-summary {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}


.expenses-summary1 {
  background-color: #f5f5f5; ;            
  border: 2px solid #697565;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  width: 100%;
  margin-top: 10px;
}

.expenses-amount,
.remaining-budget {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  font-weight: 550;
  margin-bottom: 8px;
  color: #444;
}


.budget-progress {
  margin-top: 2px;
}

.progress-bar {
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #2a4935;
  transition: width 0.3s;
}

.progress-fill.exceeded {
  background-color: #f44336;
}

.progress-text {
  text-align: right;
  font-size: 1.1rem;
  color: #1a3d2c;
}

.budget-form-modal {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.budget-form {
  background: linear-gradient(145deg, #fefefe, #f0fdfa);
  color: #2e4e40;
  padding: 20px;
  border-radius: 14px;
  width: 92%;
  max-width: 380px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  animation: fadeSlideUp 0.3s ease;
  font-family: "Segoe UI", sans-serif;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  gap: 8px;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}

.btn-save {
  background-color: #4f7a6b;
  color: #fff;
  border: none;
}

.btn-save:hover {
  background-color: #6a9c89;
  transform: scale(1.03);
}

.btn-cancel {
  background-color: #f8f8f8;
  color: #555;
  border: 1px solid #ccc;
}

.btn-cancel:hover {
  background-color: #e9f2f0;
  transform: scale(1.02);
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading {
  text-align: center;
  padding: 20px;
}

.expense-success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
} /* for expenses*/

.budget-success-message.hide,
.expense-success-message.hide {
  opacity: 0;
}


.uneditable-month {
  display: inline-block;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-weight: bold;
  text-align: center;
  min-width: 50px;
  width: 120px;
}
 
 .content-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  flex: 1 1 65%;
  min-width: 280px;
  background-color: #c5f8cc;
  border: 2px solid #365c42;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  height: auto;
}

.expenses-container {
  max-width: 100%; 
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  border: 3px solid #6A9C89;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin-top: 30px;
  transition: box-shadow 0.3s ease;
  transition: all 0.3s ease;
}
 
.expenses-container:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

 .expense-form {
  text-align: center;
  width: 100%; 
  transition: all 0.3s ease;
  scroll-margin-top: 200px;
}  
 

.expenses-section {
  margin-top: 10px;   
}

.expenses-section h3 {
  text-align: center;
  align-content: center;
  margin-top: 10px;
  color: #2e2e2e;
  font-size: 1.5rem; 
  padding-bottom: 10px;
  border-bottom: 2px solid #e1e1e1; 
  font-weight: 600;
} 

h3{
  margin-bottom: 0;
}

.expenses-table {
  overflow-x: auto;
  margin: 30px 0; 
}  

table {
  width: 100%;
  border-collapse: separate; 
  border-spacing: 0 10px; 
  margin-bottom: 20px; 
}  

th, td {
  padding: 6px 20px; 
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  color: #444;
  font-size: 0.95rem;
} 

th {
  background-color: #6A9C89;
  font-weight: 700;
  font-size: 1rem; 
  padding: 12px 20px; 
  color: white;
  border-bottom: 3px solid #4f7a6b; 
} 

tr {
  background-color: #ecfdf5;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
  margin-bottom: 15px; 
  transition: all 0.2s ease;
}

tr:hover {
  background-color: #f9f9f9;
  transform: translateY(-2px); 
  box-shadow: 0 6px 12px rgba(0,0,0,0.08); 
  transition: all 0.2s ease; 
} 

td, th {
  vertical-align: middle;
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
} 

.edit-btn, .delete-btn {
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  color: #fff;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.edit-btn {
  background: linear-gradient(135deg, #8bbcae, #6a9c89, #4f7a6b);
  color: white;
  box-shadow: 0 2px 5px rgba(106, 156, 137, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #e57373, #d32f2f, #b71c1c);
  color: white;
  box-shadow: 0 2px 5px rgba(211, 47, 47, 0.4);
}

.edit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7aa98c, #5e8873, #486858);
  box-shadow: 0 4px 10px rgba(74, 109, 92, 0.6);
}

.delete-btn:hover:not(:disabled)  {
  background: linear-gradient(135deg, #d32f2f, #b71c1c, #7f0000);
  box-shadow: 0 4px 10px rgba(123, 0, 0, 0.6);
}

@keyframes pulse {
  0% {
    transform: translateY(-2px) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.05);
  }
  100% {
    transform: translateY(-2px) scale(1);
  }
}

.edit-btn:active, .delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.total {
     font-size: 20px;
     font-weight: bold;
     color: #333;
     padding: 20px;
     background-color: #d0ebdd;
     box-sizing: border-box;
     box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
     text-align: center;
     width: 100%;
     position: relative; 
     bottom: 0;   
     border-radius: 12px;
     margin-top: -20px;
}

.form-title {
  background: linear-gradient(to right, #8bbcae, #6a9c89);
  color: #ffffff;
  padding: 14px 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}


.form-group1,
.form-group {
  margin-bottom: 20px;
}

.form-group1 label,
.form-group label {
  margin-bottom: 4px;
  color: #4f7a6b;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;
  margin-left: 4px;
  display: block;
}

.form-group h3 {
  font-size: 1.35rem;
  font-weight: 700;
  margin-bottom: 20px;
  margin-top: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #8bbcae, #4f7a6b);
  padding: 20px 16px;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

.form-group h3::before {
  content: "📝";
  margin-right: 10px;
  font-size: 1.1rem;
  vertical-align: middle;
}


.form-input,
input[type="text"],
input[type="number"],
select {
  width: 100%;
  padding: 8px 10px;
  font-size: 0.95rem;
  border-radius: 8px;
  border: 1.8px solid #6a9c89;
  background-color: #f7f9f8;
  color: #333;
  box-sizing: border-box;
  min-height: 32px;
  transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus,
input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: #4f7a6b;
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(143, 176, 163, 0.2);
}

.form-input[disabled],
input[disabled],
select[disabled] {
  background-color: #f1f1f1;
  color: #777;
  cursor: not-allowed;
}

 
.btn {
  padding: 12px 50px;
  background: linear-gradient(135deg, #2a4935, #3d6b4d); /* subtle gradient */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.4px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.4s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  background: #dcdcdc;
  color: #2a4935;
  transform: translateY(-2px);
}


.btn1 {
    padding: 12px 50px;
    background-color: white;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
    color: black;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 15px;
    margin-top: 10px; /* Add vertical spacing instead */
    margin-left: 430px;
    transition: background-color 0.3s, color 0.3s;
}

.btn1:hover {
    background-color: rgb(26, 25, 25); /* Change to any color you want */
    color: white; /* Text color on hover */
}


@media (max-width: 1200px) {
  .month-selector span{
    min-width: 80px;
    padding: 10px;
    text-align: center;
    font-weight: bold;
  }
}

@media (max-width: 760px) {
  .top-row {
    flex-wrap: wrap;
    flex-direction: column;
  }
  .month-selector span{
    min-width: 150px;
    padding: 10px;
  }
  .expenses-container {
    min-width: 340px;
  }
}

</style>
