<template>
  <navigation />

  <div class="content-wrapper">
    <!-- PROFILE CONTAINER (TOP) -->
    <div class="profile-container">
      <div class="profile-header">
        <h2><i class="fas fa-user"></i> PROFILE INFORMATION</h2>
        <button class="logout-icon" @click="showLogoutModal = true">
          <i class="fas fa-sign-out-alt icon"></i>
        </button>
      </div>
      <div class="info">
        <p><strong>Username: {{ userName }}</strong></p>
        <p><strong>Email: {{ userEmail }}</strong></p>
      </div>
    </div>

    <!-- MAIN CONTENT CONTAINER -->
    <div class="main-content">
      <!-- PERSONAL SUMMARY CONTAINER (LEFT) -->
      <div class="personal-summary">
        <h3 class="section-title">Personal Log Overview</h3>
        
        <div class="month-year-selector">
          <div class="year-selector">
            <label for="year">Year:</label>
            <select id="year" v-model="selectedYear" @change="loadYearData">
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          
          <div class="month-buttons">
            <button 
              v-for="month in availableMonths" 
              :key="month.value"
              @click="selectMonth(month.value)"
              :class="{ active: selectedMonth === month.value }"
            >
              {{ month.label.substring(0, 3) }}
            </button>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-item">
            <span>Total Budget:</span>
            <span>{{ formatCurrency(currentBudget?.budget_amount || 0) }}</span>
          </div>

          <div class="summary-item">
            <span>Total Expenses:</span>
            <span>{{ formatCurrency(totalExpenses) }}</span>
          </div>

          <div class="summary-item remaining">
            <span>Remaining Budget:</span>
            <span :class="{ 'negative': remainingBudget < 0 }">
              {{ formatCurrency(remainingBudget) }}
            </span>
          </div>

          <div class="progress-bar">
            <div 
              class="progress" 
              :class="{ 'exceeded': isBudgetExceeded }"
              :style="{ width: budgetPercentage + '%' }"
            ></div>
          </div>
          <div class="percentage" :class="{ 'exceeded-text': isBudgetExceeded }">
            {{ budgetPercentage.toFixed(0) }}%
          </div>
        </div>
      </div>
      <!-- GROUP SUMMARY CONTAINER (RIGHT) -->
      <div class="group-summary">
        <h3 class="section-title">Group Log Overview</h3>
        <div class="group-selector">
          <label for="group">Group Name:</label>
          <select v-model="selectedGroup" @change="onGroupChange">
            <option v-for="group in availableGroups" :key="group.id" :value="group">
              {{ group.group_name }}
            </option>
          </select>
        </div>
        <div class="summary-box">
          <div class="summary-item">
      <span>Group Budget:</span>
      <span>{{ formatCurrency(groupBudget) }}</span>
    </div>
    
    <div class="summary-item">
      <span>Group Expenses:</span>
      <span>{{ formatCurrency(groupExpenses) }}</span>
    </div>
    
    <div class="summary-item remaining">
      <span>Remaining Budget:</span>
      <span :class="{ 'negative': groupRemaining < 0 }">
        {{ formatCurrency(groupRemaining) }}
      </span>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar">
      <div 
        class="progress" 
        :class="{ 'exceeded': isGroupBudgetExceeded }"
        :style="{ width: groupBudgetPercentage + '%' }"
      ></div>
    </div>
    <div class="percentage" :class="{ 'exceeded-text': isGroupBudgetExceeded }">
      {{ groupBudgetPercentage.toFixed(0) }}%
    </div>
  </div>
</div>
</div>

    <!-- Welcome Modal -->
<div v-if="showWelcomeModal" class="modal-backdrop" @click.self="showWelcomeModal = false">
  <div class="modal-card1 welcome-modal">
    <h3>{{ welcomeMessage.title }}</h3>
    <p>{{ welcomeMessage.content }}</p>
    <button class="btn confirm1" @click="showWelcomeModal = false">
      Get Started
    </button>
  </div>
</div>

    <!-- LOGOUT MODAL -->
    <div v-if="showLogoutModal" class="modal-backdrop1" @click.self="closeModal">
  <div class="modal-card logout-modal">
    <h3><i class="fas fa-sign-out-alt"></i> Log out?</h3>
        <p>Are you sure you want to log out?</p>

        <div class="btn-row">
          <button class="btn cancel" @click="closeModal">Cancel</button>
          <button class="btn confirm" @click="performLogout">Yes, log out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from "./navigation.vue";
import { mapGetters, mapActions } from 'vuex'; 

export default {
  components: { Navigation },

  data() {
    return {
      showWelcomeModal: false,
      isFirstLogin: false,
      welcomeMessage: {
      title: '',
      content: ''
      },
      filterMonth: '', 
      wasBudgetExceeded: false,
      showLogoutModal: false,
      userEmail: "",
      userName: "",
      selectedYear: new Date().getFullYear().toString(),
      selectedMonth: (new Date().getMonth() + 1).toString().padStart(2, "0"),
      yearFilter: new Date().getFullYear().toString(), 
      showYearFilter: false,
      availableGroups: [],
      selectedGroup: null,
      groupBudget: 0,
      groupExpenses: 0,
      groupRemainingDisplay: 0,
      groupBudgets: {},
      groupExpensesByGroup: {},
      groupRemainingByGroup: {},
      monthlyData: {}
    };
  },

    computed: {
    ...mapGetters(['getViewExpenses', 'getPersonalBudgets', 'getViewPageMonthYear']),
    
    groupRemaining() {
    return this.groupBudget - this.groupExpenses;
  },

  groupBudgetPercentage() {
    if (this.groupBudget <= 0) return 0;
    return Math.min(100, (this.groupExpenses / this.groupBudget) * 100);
  },

  isGroupBudgetExceeded() {
    return this.groupExpenses > this.groupBudget;
  },

    totalExpenses() {
    return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  },
  
    yearlyExpensesByCategory() {
  if (!this.showYearFilter || !this.yearFilter) return 0;
  
  return this.getViewExpenses.reduce((sum, expense) => {
    // Skip if expense doesn't match the selected year
    if (!expense.expense_date || new Date(expense.expense_date).getFullYear() != this.yearFilter) {
      return sum;
    }

    // Handle "All" filter
    if (this.filterCategory === 'All') {
      return sum + (Number(expense.item_price) || 0);
    }
    
    // Handle "Other" filter
    if (this.filterCategory === 'Other') {
      const standardCategories = [
        'Food', 'Bill', 'Transportation', 
        'Entertainment', 'Healthcare', 'Shopping'
      ];
      const isStandardCategory = standardCategories.includes(expense.expense_type);
      return isStandardCategory ? sum : sum + (Number(expense.item_price) || 0);
    }
    
    // Handle specific category filter
    return expense.expense_type === this.filterCategory ? 
      sum + (Number(expense.item_price) || 0) : 
      sum;
  }, 0);
},
    
  yearlyRemainingByCategory() {
    return this.yearlyBudgetsTotal - this.yearlyExpensesByCategory;
  },

  yearlyBudgetPercentageByCategory() {
  if (!this.yearlyBudgetsTotal || this.yearlyBudgetsTotal <= 0) return 0;
  return Math.min(100, (this.yearlyExpensesByCategory / this.yearlyBudgetsTotal) * 100);
},

    yearlyExpensesTotal() {
    if (!this.showYearFilter || !this.yearFilter) return 0;
    return this.getViewExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.item_price) || 0);
    }, 0);
  },


  yearlyBudgetsTotal() {
    if (!this.showYearFilter || !this.yearFilter) return 0;
    return this.getPersonalBudgets.reduce((sum, budget) => {
      if (budget.month_year && budget.month_year.startsWith(this.yearFilter)) {
        return sum + (Number(budget.budget_amount) || 0);
      }
      return sum;
    }, 0);
  },

  yearlyRemainingBudget() {
    return this.yearlyBudgetsTotal - this.yearlyExpensesTotal;
  },

  // Calculate budget percentage for the year
  yearlyBudgetPercentage() {
    if (!this.yearlyBudgetsTotal) return 0;
    return Math.min(100, (this.yearlyExpensesTotal / this.yearlyBudgetsTotal) * 100);
  },

  // Check if yearly budget is exceeded
  isYearlyBudgetExceeded() {
    return this.yearlyExpensesByCategory > this.yearlyBudgetsTotal;
  },

    availableYears() {
  const years = new Set();
  this.getViewExpenses.forEach(expense => {
    if (expense.expense_date) {
      years.add(new Date(expense.expense_date).getFullYear());
    }
  });
  this.getPersonalBudgets.forEach(budget => {
    if (budget.month_year) {
      years.add(parseInt(budget.month_year.split('-')[0]));
    }
  });
  return Array.from(years).sort((a, b) => b - a); // Descending order
},

    usdExchangeRate() {
      return this.$store.state.usdExchangeRate || 0.018045;
    },

   selectedMonthYear: {
    get() {
      return this.$store.state.viewPageMonthYear;
    },
    set(value) {
      this.$store.commit('SET_VIEW_PAGE_MONTH_YEAR', value);
    }
  },

    expenses() {   
      return (this.getViewExpenses || []).map(expense => ({
        ...expense,
        category: expense.expense_type,
        name: expense.item_name,
        amount: Number(expense.item_price),
        date: this.formatDateForView(expense.expense_date)
      }));
    },

    availableYears() {
      const years = new Set();
      this.expenses.forEach(expense => {
        if (expense.date) {
          const year = expense.date.split('-')[0];
          years.add(year);
        }
      });
      return Array.from(years).sort().reverse();
    },
    
    availableMonths() {
      return [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
      ];
    },

    filteredExpenses() {
  let expenses = this.getViewExpenses || [];
  
  // Apply year filter if enabled
  if (this.showYearFilter && this.yearFilter) {
    expenses = expenses.filter(expense => {
      if (!expense.expense_date) return false;
      return new Date(expense.expense_date).getFullYear() == this.yearFilter;
    });
  } 
  // Apply month filter if not in year view
  else {
    const currentBudget = this.$store.getters.getCurrentBudget(
      `${this.selectedYear}-${this.selectedMonth}`
    );
    
    if (!currentBudget?.id) return [];
    
    expenses = expenses.filter(expense => 
      expense.personal_budget_id === currentBudget.id
    );
  }

  if (this.filterCategory && this.filterCategory !== 'All') {
    expenses = expenses.filter(expense => {

      if (this.filterCategory.toLowerCase() === 'other') {
        const isStandardCategory = [
          'food', 'bill', 'transportation', 
          'entertainment', 'healthcare', 'shopping'
        ].includes(expense.expense_type?.toLowerCase());
        

        return !isStandardCategory;
      } else {

        const expenseCategory = expense.expense_type ? expense.expense_type.trim().toLowerCase() : '';
        const filterCategory = this.filterCategory ? this.filterCategory.trim().toLowerCase() : '';
        return expenseCategory === filterCategory;
      }
    });
  }

  return expenses.map(expense => ({
    ...expense,
    category: expense.expense_type,
    name: expense.item_name,
    amount: Number(expense.item_price),
    date: this.formatDateForView(expense.expense_date)
  }));
},

toggleYearFilter() {
  this.showYearFilter = !this.showYearFilter;
  this.updateExpenseView();
},

  currentBudget() {
    const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
    return this.$store.getters.getCurrentBudget(monthYear) || {
      month_year: monthYear,
      budget_amount: 0
    };
  },

    totalAmount() {
      return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    },

    currentBudget() {
  const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
  return this.$store.getters.getCurrentBudget(monthYear);
},
  
    remainingBudget() {
      if (!this.currentBudget) return 0;
      return this.currentBudget.budget_amount - this.totalAmount;
    },

    budgetPercentage() {
      if (!this.currentBudget || this.currentBudget.budget_amount <= 0) return 0;
      return Math.min(100, (this.totalAmount / this.currentBudget.budget_amount) * 100);
    },

    isBudgetExceeded() {
      if (!this.currentBudget?.budget_amount) return false;
      return this.totalAmount > this.currentBudget.budget_amount;
    }
  },

  watch: {
    selectedMonth(newVal) {
      this.updateSelectedMonthYear();
    },
    selectedYear(newVal) {
      this.updateSelectedMonthYear();
    },
    totalAmount(newVal) {
      if (this.isBudgetExceeded) {
        this.$notify({
          title: 'Budget Exceeded',
          text: 'You have exceeded your monthly budget!',
          type: 'warning',
          duration: 0 
        });
      }
    }
  },

  created() {
    this.fetchViewExpenses();
    this.fetchPersonalBudgets();
    this.fetchExchangeRate();
  },

   methods: {
    ...mapActions(['fetchViewExpenses', 'fetchPersonalBudgets', 'fetchExchangeRate']),
   
    checkFirstLogin() {
        const userData = JSON.parse(localStorage.getItem("user"));
        
        // Skip if already shown in this session
        if (sessionStorage.getItem('welcomeShown')) return;

        if (userData?.isFirstLogin) {
            this.welcomeMessage = {
                title: 'Welcome to Money Log 🎉',
                content: 'Track your expenses, manage budgets, and join groups to share expenses with others!'
            };
            // Mark as no longer first login
            userData.isFirstLogin = false;
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            this.welcomeMessage = {
                title: 'Welcome back! 👋',
                content: 'Good to see you again! Ready to track your finances?'
            };
        }

        // Mark welcome as shown for this session
        sessionStorage.setItem('welcomeShown', 'true');
        this.showWelcomeModal = true;
    },

    formatUsd(value) {
    const rate = this.$store.state.usdExchangeRate || 0.018045;
    const usdAmount = parseFloat(value) * rate;
    return `$${usdAmount.toFixed(2)}`;
  },

    filterExpenses(category) {
      this.filterCategory = category;
    },

    selectMonth(month) {
      this.selectedMonth = month;
      this.filterCategory = 'All';
    },

    updateSelectedMonthYear() {
  const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
  this.$store.commit('SET_VIEW_PAGE_MONTH_YEAR', monthYear);
  
  this.$store.dispatch('fetchViewExpenses', monthYear)
    .then(() => {
      console.log('Successfully fetched expenses for:', monthYear);
    })
    .catch((error) => {
      console.error('Error fetching expenses:', error);
    });
},
    
updateExpenseView() {
  if (this.showYearFilter) {
    this.$store.dispatch('fetchViewExpenses', { year: this.yearFilter });
  } else {
    const monthYear = `${this.selectedYear}-${this.selectedMonth}`;
    this.$store.dispatch('fetchViewExpenses', { monthYear });
  }
},

    formatCurrency(value) {
      if (value == null || isNaN(value)) return '₱0.00';
      return '₱' + parseFloat(value).toFixed(2);
    },
    
    formatDateForView(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    },

    showBudgetWarning() {
      this.$notify({
        title: 'Budget Exceeded',
        text: `Current spending: ${this.formatCurrency(this.totalAmount)}\nBudget: ${this.formatCurrency(this.currentBudget?.budget_amount)}`,
        type: 'error',
        duration: 0
      });
    },
    async loadAllGroupsData() {
      try {
        const token = localStorage.getItem('jsontoken');
        const groupListResponse = await this.$axios.get(
          'http://localhost:3000/api/grp_expenses/my-groups',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (
          groupListResponse.data?.success === 1 &&
          Array.isArray(groupListResponse.data.data) &&
          groupListResponse.data.data.length > 0
        ) {
          const groups = groupListResponse.data.data;
          this.availableGroups = groups;
          localStorage.setItem('all_groups', JSON.stringify(groups));

          await this.loadYear();

          for (const group of groups) {
            const groupId = group.id;

            await this.$store.dispatch('group/fetchGroup', groupId);
            const budgetData = await this.$store.dispatch('group/fetchGroupBudget', groupId);

            const monthYear = `${this.selectedYear}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
            await this.$store.dispatch('group/fetchExpenses', { groupId, monthYear });

            const groupBudgetAmount = budgetData?.budget_amount || 0;
            const groupExpensesList = this.$store.state.group.expenses || [];
            const groupTotalExpense = groupExpensesList.reduce(
              (sum, item) => sum + Number(item.item_price),
              0
            );
            const groupRemaining = groupBudgetAmount - groupTotalExpense;

            // Instead of localStorage, save in reactive state:
            this.groupBudgets = {
              ...this.groupBudgets,
              [groupId]: groupBudgetAmount,
            };
            this.groupExpensesByGroup = {
              ...this.groupExpensesByGroup,
              [groupId]: groupTotalExpense,
            };
            this.groupRemainingByGroup = {
              ...this.groupRemainingByGroup,
              [groupId]: groupRemaining,
            };
          }
          this.selectedGroup = groups[0];
          this.setGroupData(this.selectedGroup);
        } else {
          console.warn('No groups found for user.');
        }
      } catch (error) {
        console.error('Failed to load group data:', error);
      }
    },

    setGroupData(group) {
      if (!group || !group.id) return;
      const id = group.id;

      this.groupBudget = this.groupBudgets[id] || 0;
      this.groupExpenses = this.groupExpensesByGroup[id] || 0;
      this.groupRemainingDisplay = this.groupRemainingByGroup[id] || 0;
    },

    async loadYear() {
      try {
        // Fetch for the selected year - this will update Vuex store
        await this.fetchViewExpenses({ 
          year: this.selectedYear 
        });
        
        // Load budgets for the year - this will update Vuex store
        await this.fetchPersonalBudgets(this.selectedYear);
        
        // No need to assign to this.expenses - the getViewExpenses getter will update automatically
      } catch (error) {
        console.error('Error in loadYear:', error);
      }
    },

    reloadLocal() {
      this.expenses = JSON.parse(localStorage.getItem("personal_expenses")) || [];
    },

    onGroupChange() {
      this.setGroupData(this.selectedGroup);
    },
    closeModal() {
    this.showLogoutModal = false;
    },
    
    performLogout() {
    const token = localStorage.getItem('jsontoken');
    
    this.$axios.post('http://localhost:3000/api/users/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
        localStorage.clear();
        sessionStorage.clear();
        this.$store.dispatch("logout");  
        this.showLogoutModal = false;
        this.$router.push("/login");
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Still proceed with client-side cleanup
        localStorage.clear();
        sessionStorage.clear();
        this.$store.dispatch("logout");  
        this.showLogoutModal = false;
        this.$router.push("/login");
    });
}
    },

    async mounted() {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
        this.userEmail = userData.email;
        this.userName = userData.username;
    }
    await this.loadAllGroupsData();
    
    // Only show welcome message if not already shown this session
    if (!sessionStorage.getItem('welcomeShown')) {
        this.checkFirstLogin();
    }
  }
};
</script>

  
<style scoped>

  * {
    box-sizing: border-box;
  }

  .modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6); /* slightly darker for better focus */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px); /* adds a subtle blur behind the modal */
  animation: fadeIn 0.3s ease-in-out;
}

.modal-card1.welcome-modal {
  background-color: white;
  padding: 0.8rem 2rem 2rem 2rem;
  border-radius: 1.25rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 420px;
  width: 90%;
  color: #4f7a6b;
  font-family: 'Segoe UI', sans-serif;
  animation: popIn 0.4s ease-out;
}

.modal-card1.welcome-modal h3 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #4f7a6b;
}

.modal-card1.welcome-modal p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.75rem;
  color: black;
}

.btn.confirm1 {
  background: linear-gradient(135deg, #6a9c89, #4f7a6b);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.5px;
}

.btn.confirm1:hover {
  background: linear-gradient(135deg, #8bbcae, #6a9c89);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}


/* Optional fade-in animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.month-year-selector {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.year-selector {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.year-selector label {
  margin-right: 0.5rem;
  color: #486858;
  font-weight: 500;
}

.year-selector select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #bdd9cd;
  background: #f9fcfb;
  color: #4f7a6b;
  font-size: 1rem;
  font-weight: 500;
  transition: border 0.2s ease;
}

.year-selector select:focus {
  outline: none;
  border-color: #6a9c89;
}

.month-buttons {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.month-buttons button {
  padding: 0.5rem 1rem;
  border: 2px solid #c5e0d5;
  border-radius: 6px;
  background: #f7fbfa;
  color: #4f7a6b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.month-buttons button:hover {
  background: #e2f2eb;
  border-color: #6a9c89;
  color: #3f6557;
}

.month-buttons button.active {
  background: #4f7a6b;
  color: #ffffff;
  border-color: #4f7a6b;
}

.summary-box {
  background: linear-gradient(135deg, #f9fdfb, #ecf9f4, #def4ec);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
  border: 1px solid #e0f1e9;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  backdrop-filter: blur(1px);
}

.summary-box:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.4rem 0.6rem;
  color: #4f7a6b;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  border-bottom: 1px dashed #cde1d5;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.summary-item:hover {
  background: #f5fbf7;
  border-radius: 6px;
}

.summary-item.remaining {
  font-weight: bold;
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2eee7;
  color: #486858;
}

.negative {
  color: #f44336;
}

.progress-bar {
  height: 12px;
  background: #eee;
  border-radius: 6px;
  margin-top: 1rem;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.progress {
  height: 100%;
  background: linear-gradient(135deg, #8bbcae, #6a9c89, #4f7a6b);
  transition: width 0.3s ease;
}

/* Red color if the value exceeds limit */
.progress.exceeded {
  background: #f44336;
}

.percentage {
  text-align: right;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #4f7a6b;
  font-weight: 500;
}

.percentage.exceeded-text {
  color: #f44336;
  font-weight: bold;
} /**NEWWWWWWWW */
  .content-wrapper {
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
  
.profile-container {
  background: linear-gradient(135deg, #f9fdfb, #ecf9f4, #def4ec);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  margin: 100px 10px 20px 20px;
  position: relative;
  border-left: 6px solid #6a9c89;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.profile-container:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.profile-container .info p {
  margin: 12px 0;
  font-family: 'Poppins', sans-serif;
  font-size: 19px;
  font-style: italic;
  color: #333;
  padding-left: 10px;
  border-left: 3px solid #6a9c89;
}
.main-content {
  display: flex;
  gap: 24px;
  padding: 0 20px;
  flex-wrap: wrap;
}

.personal-summary {
  flex: 2;
  background: linear-gradient(135deg, #fdfdfd, #f5faf7);
  padding: 30px 30px 15px 30px; /* top right bottom left */
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  border-left: 6px solid #6a9c89;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.personal-summary:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

  .info strong {
  font-style: normal;
  color: #4f7a6b;
}

.infos {
  gap: 1.5rem;
  margin-top: 20px;
  margin-left: 15px;
  text-align: start;
}

.infos strong {
  font-size: 16px;
}
  
  .group-summary {
  flex: 1;
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  border-left: 6px solid #8bbcae;
  transition: box-shadow 0.3s ease;
  max-height: 410px; 
}

.group-summary:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.group-summary p {
  margin: 15px 0 10px 0;
  font-size: 19px; 
  font-family: 'Poppins', sans-serif;
  color: #2f4f3e;
  line-height: 1.6;
  letter-spacing: 0.3px;
}

.group-selector {
  display: flex;
  flex-wrap: wrap;
  font-family: 'Poppins', sans-serif;
  margin-top: 20px;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.group-selector label {
  font-weight: 500;
  font-size: 18px;
  color: #4f7a6b;
  min-width: 100px;
}

.group-selector select {
  padding: 8px 12px;
  font-size: 14px;
  border: 2px solid #6a9c89;
  border-radius: 6px;
  font-family: 'Poppins', sans-serif;
  max-width: 160px;
  background-color: #f6fdfc;
  color: #2a4935;
  transition: border-color 0.2s;
}

.group-selector select:focus {
  outline: none;
  border-color: #4f7a6b;
}


.section-title {
  width: 100%;
  margin-bottom: 20px;
  margin-top: 0px;
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size:30px;
  text-align: center;
  color: #4f7a6b;
  border-bottom: 2px solid #8bbcae;
  padding-bottom: 6px;
  letter-spacing: 0.5px;
}

.year-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  font-family: "Poppins", sans-serif;
}

.year-selector label {
  font-weight: 500;
  color: #4f7a6b;
}

.year-selector select {
  padding: 8px 12px;
  border: 2px solid #6a9c89;
  border-radius: 6px;
  font-family: "Poppins", sans-serif;
  font-size: 14px;
  color: #2a4935;
  background-color: #f9fdf9;
}



.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  border-bottom: 2px solid #8bbcae;  
  padding-bottom: 10px;
  position: relative;
}

.profile-header h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 28px;
  color: #4f7a6b;
  border-bottom: 0px solid white;
  padding-bottom: 10px;
  margin: 0; 
  line-height: 1; 
  position: relative;
  z-index: 1;
}

.logout-icon {
  background: linear-gradient(135deg, #8bbcae, #6a9c89);
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  box-shadow: 0 4px 10px rgba(106, 156, 137, 0.3);
  transition: background 0.3s ease, transform 0.2s ease;
}

.logout-icon:hover {
  background: #4f7a6b;
  transform: scale(1.05);
}

.logout-icon .icon {
  font-size: 20px;
  color: #ffffff;
  transition: transform 0.2s ease;
}

.logout-icon:hover .icon {
  transform: scale(1.1);
}

.modal-backdrop1 {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6); /* slightly darker for better focus */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px); /* adds a subtle blur behind the modal */
  animation: fadeIn 0.3s ease-in-out;
}

.modal-card.logout-modal {
  background: linear-gradient(135deg, #8bbcae, #6a9c89);
  padding: 0.8rem 2rem 2rem 2rem; /* top right bottom left */
  border-radius: 1.25rem;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 380px;
  width: 90%;
  color: white;
  animation: popIn 0.4s ease-out;
  font-family: 'Segoe UI', sans-serif;
}

.modal-card.logout-modal h3 {
  font-size: 1.6rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.modal-card.logout-modal p {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: #f1f1f1;
}

.btn-row {
  display: flex;
  justify-content: space-evenly;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn.cancel {
  background: #cccccc;
  color: #333;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn.cancel:hover {
  background: #b5b5b5;
}

.btn.confirm {
  background: linear-gradient(135deg, #6a9c89, #4f7a6b);
  color: white;
  border: none;
  padding: 0.6rem 1.4rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn.confirm:hover {
  background: linear-gradient(135deg, #8bbcae, #6a9c89);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Animation reuse */
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}


  
  /* Responsive Design */
  @media screen and (max-width: 1048px) {
    .content-wrapper {
      padding-top: 70px;
      padding-left: 20px;
      padding-right: 20px;
    }
  
    .profile-container p {
      font-size: 15px;
    }
  }
  
  @media screen and (max-width: 768px) {
    .content-wrapper {
      padding-top: 60px;
      padding-left: 10px;
      padding-right: 10px;
    }

    .columns {
      flex-direction: column;
    }
    .column,
    .column1 {
      max-width: 100% !important;
    }

    .months-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
    .profile-container {
      padding: 16px 12px;
    }
  
    .profile-container p {
      font-size: 14px;
    }
  }
  
  @media screen and (max-width: 480px) {
    .content-wrapper {
      padding-top: 60px;
      padding-left: 5px;
      padding-right: 5px;
    }
  
    .profile-container {
      padding: 12px 10px;
    }

    .profile-container h2 {
      font-size: 24px;
    }
  
    .profile-container p {
      font-size: 14px;
    }

    .months-grid {
    grid-template-columns: repeat(2, 1fr);
  }

    .infos strong {
      font-size: 13px;
    }
  }
  </style>
