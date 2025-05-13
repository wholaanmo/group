<template>
  <Navigation />
  <div class="group-header-decoration">

  <div class="group-container">

    <!-- Add this container for the group list -->
    <div v-if="showGroupList" class="group-list-container">
      <div class="group-list-header">
        <h3>Your Groups</h3>
        <button @click="toggleGroupList" class="close-group-list">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="group-list">
        <div 
          v-for="group in userGroups" 
          :key="group.id" 
          class="group-item"
          @click="navigateToGroup(group.id)"
          :class="{ active: group.id === $route.params.groupId }"
        >
          <div class="group-info">
            <h4>{{ group.group_name }}</h4>
            <p>Members: {{ group.member_count }}</p>
          </div>
          <div class="group-actions">
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading group data...</p>
    </div>

    <div v-else-if="expensesError" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchGroupData" class="retry-button">Retry</button>
    </div>

    <div v-else class="group-content">
    <div class="group-header">
      <div class="header-top-row">
        <div class="group-title-section">
          <h1 class="group-name">{{ group.group_name || 'Loading...' }}</h1>
          <div class="group-code-badge" v-if="group.group_code">
            <span>Code: {{ group.group_code }}</span>
            <button @click="copyGroupCode" class="copy-button">
              <i class="far fa-copy"></i>
            </button>
          </div>
        </div>
        <div class="group-action-buttons">
          <button @click="toggleGroupList" class="my-groups-btn">
            <i class="fas fa-users"></i> My Groups
          </button>
          <button @click="goToGroupManagement" class="manage-groups-btn">
            <i class="fas fa-users-cog"></i> New Group
          </button>
        </div>
      </div>

      <div class="group-meta-info">
        <div class="meta-item">
          <i class="fas fa-user"></i>
          <span>Created by: {{ creatorName || 'Loading...' }}</span>
        </div>
        <div class="meta-item" v-if="group.created_at">
          <i class="fas fa-calendar"></i>
          <span>Created: {{ formatDate(group.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="group-con">
    <div class="budget-total-container">
    <div class="budget-container">
      <div v-if="budgetSuccessMessage" class="budget-success-message" :class="{ hide: budgetHideMessage }">
        {{ budgetSuccessMessage }}
      </div>

      <div v-if="showBudgetExceededAlert" class="floating-alert">
        <div class="alert-content">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>{{ budgetExceededMessage }}</span>
                  <button @click="closeAlert" class="close-alert-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="budget-display">
              <div class="budget-header">
                <h3>Allotted Budget</h3>
                <button v-if="!hasBudget" @click="showAddBudgetForm" class="btn-add">Add</button>
                <button v-else @click="showEditBudgetForm" class="btn-edit">Edit</button>
              </div>


              <div v-if="!isBudgetLoading">
                <div v-if="hasBudget" class="budget-details">
                  <div class="budget-name">
                    <span>Budget Name:</span>
                    <strong>{{ groupBudget?.budget_name || 'General Budget' }}</strong>
                  </div>
                  
    
                  <div class="budget-amount">
                    <span>Budget Amount:</span>
                    <strong>{{ formatPHP(groupBudget?.budget_amount || 0) }}</strong>
                  </div>
                  
                  <div class="remaining-budget">
                    <span>Remaining:</span>
                    <strong :class="{ 'text-danger': remainingBudget < 0 }">
                      {{ formatPHP(remainingBudget) }}
                    </strong>
                  </div>
    
                  <div class="budget-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: budgetProgress + '%' }"
                        :class="{ exceeded: budgetProgress >= 100 }"
                      ></div>
                    </div>
                    <div class="progress-text">{{ budgetProgress.toFixed(1) }}% used</div>
                  </div>
                </div>

                <div v-else>
                  <p>No budget set for this group</p>
                </div>
              </div>
              <div v-else>
                <div class="loading-spinner"></div>
              </div>

        <!-- Budget Form Modal -->
        <div v-if="isAddingBudget || isEditingBudget" class="budget-form-modal">
          <div class="budget-form">
              <h2>{{ isEditingBudget ? 'Edit' : 'Add' }} Allotted Budget</h2>

              <div class="form-group">
              <label>Budget Name:</label>
              <input
                type="text"
                v-model="budgetName"
                placeholder="e.g. Birthday Party"
                required
              />
            </div>

            <div class="form-group">
      <label>Amount (₱)</label>
      <input v-model="budgetAmountInput" type="number" min="0" step="0.01" @input="formatCurrencyInput">
    </div>

            <div class="form-actions">
              <button @click="isEditingBudget ? updateBudget() : submitAddBudget()" class="btn-save">
                {{ isEditingBudget ? 'Update' : 'Save' }}
              </button>
              <button @click="cancelBudgetForm" class="btn-cancel">Cancel</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <div class="group-wrapper">
    <div class="group-body">
      <div class="group-tabs">
        <button 
          @click="activeTab = 'expenses'" 
          :class="{ active: activeTab === 'expenses' }"
        >
          Expenses
        </button>
        <button @click="activeTab = 'members'" :class="{ active: activeTab === 'members' }">
        Members ({{ members?.length || 0 }})
        </button>
        <button 
          v-if="isAdmin"
          @click="activeTab = 'settings'" 
          :class="{ active: activeTab === 'settings' }"
        >
          Settings
        </button>
      </div>

      <div class="tab-content">
        <!-- Expenses Tab -->
        <div v-if="activeTab === 'expenses'" class="expenses-tab">
          <div class="expense-controls">
            <div class="month-selector">
              <button @click="prevMonth">&lt;</button>
              <span>{{ currentMonthYear }}</span>
              <button @click="nextMonth">&gt;</button>
            </div>
            <button @click="showAddExpenseModal = true" class="add-expense-button">
              <i class="fas fa-plus"></i> Add Expense
            </button>
          </div>

          <div v-if="expensesLoading" class="loading-expenses">
            <div class="spinner small"></div>
          </div>

          <div v-else-if="expensesError" class="error-message">
            Error loading expenses: {{ expensesError }}
            <button @click="loadExpenses" class="retry-btn">Retry</button>
          </div>
  
          <div v-else-if="!expenses">
            <p>Expenses data not loaded</p>
            <button @click="loadExpenses" class="retry-btn">Load Expenses</button>
          </div>
                  
                  <div v-else-if="!filteredExpenses || filteredExpenses.length === 0" class="no-expenses">
            <p>No expenses recorded for {{ currentMonthYear }}</p>
          </div>
                  
      <div v-else class="expenses-container">
        <div class="expenses-section"> 
          <h3>Your Expenses</h3> 
          <div class="expenses-table"> 
            <table>
              <thead>
                <tr>
                  <th>Expense Type</th>
                  <th>Item Name</th>
                  <th>Item Price</th>
                  <th>Date</th>
                  <th>Added By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="expense in filteredExpenses" :key="expense.id">
                  <td>{{ expense.expense_type || 'N/A' }}</td>
                  <td>{{ expense.item_name || 'N/A' }}</td>
                  <td>{{ formatPHP(expense.item_price) }}</td>
                  <td>{{ formatDate(expense.expense_date) }}</td>
                  <td>{{ expense.username }}</td>
                  <td class="actions">
                    <div class="action-buttons">
                      <button 
                        @click="editExpense(expense)" 
                        class="edit-btn"
                        :disabled="!canEditExpense(expense)"
                      >
                        Edit
                      </button>
                      <button 
                        @click="confirmDeleteExpense(expense)" 
                        class="delete-btn"
                        :disabled="!canEditExpense(expense)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="total-summary">
              <div class="total-amount-card">
                <div class="total-label">Total Expenses</div>
                <div class="amount-display">
                  <span class="currency php">{{ formatPHP(totalAmount) }}</span>
                  <span class="currency usd">≈ {{ formatUsd(convertPhpToUsd(totalAmount)) }}</span>
                </div>
                <div class="exchange-rate-display">
                  <i class="fas fa-sync-alt"></i> 1 PHP = {{ (exchangeRate || 0.018045).toFixed(6) }} USD
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  
  

        <!-- Members Tab -->
        <div v-if="activeTab === 'members'" class="members-tab">
          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="member-info">
                <span class="member-name">{{ member.username }}</span>
                <span class="member-email">{{ member.email }}</span>
              </div>
              <div class="member-role">
                <span :class="['role-badge', member.role]">{{ member.role }}</span>
                <button 
                  v-if="isAdmin && member.role !== 'admin'"
                  @click="confirmRemoveMember(member)"
                  class="remove-button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="isAdmin" class="invite-section">
            <h3>Invite New Member</h3>
            <div class="invite-form">
              <input 
                v-model="inviteEmail" 
                type="email" 
                placeholder="Enter email address"
                class="email-input"
              >
              <button @click="sendInvite" class="invite-button">
                Send Invite
              </button>
            </div>
            <p v-if="inviteError" class="error-message">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="success-message">{{ inviteSuccess }}</p>
          </div>
        </div>

        <!-- Settings Tab (Admin Only) -->
        <div v-if="activeTab === 'settings' && isAdmin" class="settings-tab">
          <div class="settings-section">
            <h3>Group Settings</h3>
            <div class="setting-item">
              <label>Group Name</label>
          <div class="input-group">
            <input 
              v-model="group.group_name" 
              @blur="handleNameUpdate"
              @keyup.enter="handleNameUpdate"
              type="text" 
              class="setting-input"
              :disabled="updatingName"
            >
            <button 
              @click="handleNameUpdate" 
              class="save-button"
              :disabled="!nameChanged || updatingName"
            >
              <span v-if="updatingName">Saving...</span>
              <span v-else>Save</span>
            </button>
          </div>
          <p v-if="nameError" class="error-message">{{ nameError }}</p>
          </div>
        </div>
          
          <div class="danger-zone">
            <h3>Danger Zone</h3>
            <div class="danger-item">
              <p>Delete this group permanently  (including all expenses and members) </p>
              <button 
                @click="confirmDeleteGroup" 
                class="delete-button"
                :disabled="deletingGroup"
              >
                <span v-if="deletingGroup">
                  <i class="fas fa-spinner fa-spin"></i> Deleting...
                </span>
                <span v-else>Delete Group</span>
              </button>
              <p v-if="deleteGroupError" class="error-message">{{ deleteGroupError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


    <!-- Add Expense Modal -->
    <div v-if="showAddExpenseModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Expense</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitExpense">
            <div class="form-group">
              <label>Category</label>
              <select v-model="newExpense.expense_type" required>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
            <label>Item Name</label>
              <input 
                v-model="newExpense.item_name" 
                type="text" 
                required
                minlength="2"
                maxlength="255"
              >
              <small v-if="!newExpense.item_name" class="error">Item name is required</small>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input 
                v-model="newExpense.item_price" 
                type="number" 
                step="0.01" 
                min="0" 
                required
              >
              <small v-if="!newExpense.item_price" class="error">Amount is required</small>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">Add Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Expense Modal -->
    <div v-if="showEditExpenseModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Expense</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleUpdateExpense">
            <div class="form-group">
              <label>Category</label>
              <select v-model="editingExpense.expense_type" required>
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="editingExpense.item_name" type="text" required>
            </div>
            <div class="form-group">
              <label>Amount</label>
              <input v-model="editingExpense.item_price" type="number" step="0.01" min="0" required>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-button">Cancel</button>
              <button type="submit" class="submit-button">Update Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    

    <!-- Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay2">
      <div class="modal-content confirmation-modal">
        <div class="modal-header2">
          <h3>{{ confirmationTitle }}</h3>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-body2">
          <p>{{ confirmationMessage }}</p>
          <div class="confirmation-actions">
            <button @click="closeModal" class="cancel-button">Cancel</button>
            <button @click="confirmAction" class="confirm-button">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import Navigation from "./navigation.vue";
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'Group',
  components: { Navigation },
  props: {
    groupId: {
      type: [String, Number],
      required: false,
      default: null
    }
  },
  data() {
    return {
      localGroupId: this.groupId,
      showGroupList: false,
      userGroups: [],
      activeTab: 'expenses',
      currentMonthYear: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      expensesError: null,
      expensesLoading: false,
      updatingName: false,
      nameError: '',
      originalName: '',
      deletingGroup: false,
      deleteGroupError: '',
      exchangeRate: null,
      lastExchangeRateUpdate: null,
     // budgetAmountValue: 0,
      remainingBudget: 0,
      budgetProgress: 0,
      budgetName: '',
      selectedBudgetId: null,
      isBudgetLoading: false,
      isAddingBudget: false,
      isEditingBudget: false,
      budgetAmountInput: '',
     //hasBudget: false,
      budgetSuccessMessage: '',
      budgetHideMessage: false,
      showBudgetExceededAlert: false,
      budgetExceededMessage: "Warning: You have exceeded the allotted budget!",
      showAddExpenseModal: false,
      showEditExpenseModal: false,
      showConfirmationModal: false,
      
      // Form data
      newExpense: {
        item_name: '',
        item_price: 0,
        expense_type: 'Food',
      },
      
      editingExpense: {},
      confirmationTitle: '',
      confirmationMessage: '',
      confirmAction: () => {},
      
      // Invite member
      inviteEmail: '',
      inviteError: '',
      inviteSuccess: ''
    };
  },
  computed: {
    ...mapState('group', { // Use object syntax for clarity
      currentGroup: state => state.currentGroup,
      members: state => state.members,
      expenses: state => state.expenses,
      loading: state => state.loading,
      error: state => state.error,
      isAdmin: state => state.isAdmin,
      groupBudget: state => state.groupBudget || {}
    }),

    hasBudget() {
    return this.groupBudget !== null && this.groupBudget.budget_amount !== undefined;
  },

  formattedBudgetAmount() {
    return this.formatPHP(this.budgetAmountValue);
  },

  budgetAmountValue() {
    return this.groupBudget ? parseFloat(this.groupBudget.budget_amount) : 0;
  },

  
    totalExpenses() {
    return this.totalAmount; // Use totalAmount to dynamically reflect the total of all expenses
  },

    ...mapGetters('group', ['creatorName']),

    nameChanged() {
    return this.group.group_name !== this.originalName;
  },

    group() {
      return this.currentGroup || {};
    },

    filteredExpenses() {
    if (!this.expenses || !Array.isArray(this.expenses)) return [];
    return this.expenses.filter(expense => {
      if (!expense.expense_date) return false;
      
      const expenseDate = new Date(expense.expense_date);
      const currentDate = new Date(this.currentMonthYear);
      
      return (
        expenseDate.getFullYear() === currentDate.getFullYear() &&
        expenseDate.getMonth() === currentDate.getMonth()
      );
    });
  },

  totalAmount() {
  return this.filteredExpenses.reduce((total, expense) => {
    return total + (parseFloat(expense.item_price) || 0); 
  }, 0);
},

  convertPhpToUsd() {
  return (phpAmount) => {
    const rate = this.exchangeRate || 0.018045;
    const usd = parseFloat(phpAmount) * rate;
    return parseFloat((phpAmount * rate).toFixed(6));
  };
},

  // Format USD currency
  formatUsd() {
    return (amount) => {
      return `$${parseFloat(amount || 0).toFixed(2)}`;
    };
  },

    hasGroupAccess() {
      const user = JSON.parse(localStorage.getItem('user'));
      return this.group?.id && this.members?.some(m => m.id === user?.id);
    }
  },

  watch: {
    'groupId': {
      immediate: true,
      async handler(newGroupId) {
        if (newGroupId && newGroupId !== this.localGroupId) {
          this.localGroupId = newGroupId;
          await this.initializeGroupData();
          this.originalName = this.group.group_name || '';
        }
      }
    },

    budgetSuccessMessage(newVal) {
    if (newVal) {
      this.budgetHideMessage = false; // Reset if showing again
      setTimeout(() => {
        this.budgetHideMessage = true; // Trigger fade-out

        // After fade-out completes, remove message from DOM
        setTimeout(() => {
          this.budgetSuccessMessage = null;
        }, 500); // matches .hide opacity transition
      }, 3000); // message stays visible for 3 seconds
    }
  }
  },

  async created() {
  console.log('Group component created');
  
    if (this.groupId) {
      this.isBudgetLoading = true;
      try {
        const res = await this.$axios.get(`/api/grp_expenses/groups/${this.groupId}/budget`);
        if (res.data && res.data.amount != null) {
          this.calculateRemaining();
        }
      } catch (error) {
        console.error('Failed to fetch budget:', error);
      } finally {
        this.isBudgetLoading = false;
      }
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('jsontoken');

    if (!user || !token) {
    console.error('Missing authentication data');
    this.$router.push('/login');
    return;
  }

  console.log('User authenticated, checking groupId');
  if (!this.localGroupId) {
      console.error('Missing groupId parameter');
      this.$router.push('/GC');
      return;
    }

  try {
    console.log('Initializing group data...');
    await this.initializeGroupData();
    console.log('Fetching budget data...');
    await this.fetchBudgetData();
    console.log('Fetching group data...');
    await this.fetchGroupData();
    console.log('Loading expenses...');
    await this.loadExpenses();
    console.log('Fetching exchange rates...');
    await this.fetchExchangeRate();
    console.log('All data loaded successfully');
    
    this.originalName = this.group.group_name || '';

    await this.fetchUserGroups();
   // await this.fetchAvailableBudgets();
  } catch (err) {
    console.error('Failed to load group data:', err);
    this.$notify({
      title: 'Error',
      message: 'Failed to load group data',
      type: 'error'
    });

    if (err.message.includes('initialization')) {
      this.$router.push('/GC');
    }
  }
},

  methods: {
    ...mapActions('group', [
      'fetchGroup',
      'fetchExpenses',
      'addExpense',
      'updateExpense',
      'deleteExpense',
      'sendInvite',
      'removeMember',
      'deleteGroup',
      'fetchGroupBudget',
      'addGroupBudget',   
      'updateGroupBudget'
    //  'fetchAvailableBudgets'
    ]),

    showError(message) {
    console.error(message);
    },
  showSuccess(message) {
    if (this._isMounted) { // Check if component is still mounted
      this.budgetSuccessMessage = message;
      setTimeout(() => {
        if (this._isMounted) {
          this.budgetSuccessMessage = null;
        }
      }, 3000);
    }
  },

    editExpense(expense) {
    this.editingExpense = { ...expense };  // Create a copy of the expense to edit
    this.showEditExpenseModal = true;     // Set the modal visibility to true
  },

  formatPHP(amount) {
    return `₱${parseFloat(amount || 0).toFixed(2)}`;
  },
  
  showAddBudgetForm() {
    this.isAddingBudget = true;
    this.budgetAmountInput = String(this.budgetAmountValue);
    this.budgetAmountInput = '';
  },
  showEditBudgetForm() {
    this.isEditingBudget = true;
    this.budgetAmountInput = String(this.budgetAmountValue);
    this.budgetAmountInput = this.budgetAmountValue;
  },
  cancelBudgetForm() {
    this.isAddingBudget = false;
    this.isEditingBudget = false;
  },

  async submitAddBudget() {
  const amount = parseFloat(this.budgetAmountInput.replace(/[^0-9.]/g, ''));

  if (isNaN(amount) || amount <= 0) {
    this.showError('Please enter a valid budget amount');
    return;
  }

  try {
    this.isBudgetLoading = true;

    await this.$store.dispatch('group/addGroupBudget', {
      groupId: this.localGroupId,
      budgetAmount: amount,
      budgetName: this.budgetName || 'Group Budget'
    });

    // Reset form and update UI
    this.isAddingBudget = false;
    this.budgetAmountInput = '';
    this.budgetName = '';
    
    // Show success message
    this.$nextTick(() => {
      this.showSuccess('Budget added successfully!');
    });
    
    // Recalculate remaining budget
    this.calculateRemaining();
    
  } catch (err) {
    console.error('Failed to add budget:', {
      error: err,
      response: err.response?.data
    });
    this.showError(err.response?.data?.message || 'Failed to add budget. Please try again.');
  } finally {
    this.isBudgetLoading = false;
  }
},

  async fetchGroupBudget() {
    try {
      this.isBudgetLoading = true;
      const res = await this.$axios.get(
        `/api/grp_expenses/groups/${this.groupId}/budget`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (res.data?.success) {
        this.budgetAmountValue = parseFloat(res.data.data.budget_amount);
        this.budgetName = res.data.data.budget_name || '';
        this.hasBudget = true;
        this.calculateRemaining();
      } else {
        this.hasBudget = false;
      }
    } catch (err) {
      console.error("Failed to fetch budget:", err);
      this.hasBudget = false;
    } finally {
      this.isBudgetLoading = false;
    }
  },

  async fetchBudgetData() {
  this.isBudgetLoading = true;
  try {
    const response = await this.$axios.get(`/api/grp_expenses/groups/${this.groupId}/budget`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
      }
    });
    
    if (response.data.success) {
      const budgetData = response.data.data;
      if (budgetData && budgetData.budget_amount != null) {
        this.budgetAmountValue = parseFloat(budgetData.budget_amount);
        this.budgetName = budgetData.budget_name || '';
        this.hasBudget = true;
        this.calculateRemaining();
      } else {
        this.hasBudget = false;
        this.budgetAmountValue = 0;
      }
    }
  } catch (error) {
    console.error('Failed to fetch budget:', error);
    this.hasBudget = false;
    this.budgetAmountValue = 0;
  } finally {
    this.isBudgetLoading = false;
  }
},

async updateBudget() {
    const user = JSON.parse(localStorage.getItem('user'));
    const amount = parseFloat(this.budgetAmountInput.replace(/[^0-9.]/g, ''));

    if (isNaN(amount) || amount <= 0) {
      this.showError('Please enter a valid budget amount');
      return;
    }

    try {
      this.isBudgetLoading = true;
      
      const res = await this.$axios.put(
        `/api/grp_expenses/groups/${this.localGroupId}/budget`,
        {
          budget_amount: amount,
          budget_name: this.budgetName || 'Group Budget',
          user_id: user.id
        },
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}` 
          }
        }
      );
      
      this.$store.commit('group/SET_GROUP_BUDGET', res.data.data);
      this.calculateRemaining();
      this.isEditingBudget = false;
      this.showSuccess('Budget updated successfully!');
    } catch (err) {
      console.error('Failed to update budget:', err);
      this.showError(err.response?.data?.message || 'Failed to update budget');
    } finally {
      this.isBudgetLoading = false;
    }
  },

  calculateRemaining() {
    if (!this.hasBudget || isNaN(this.budgetAmountValue)) {
      this.remainingBudget = 0;
      this.budgetProgress = 0;
      return;
    }
    
    this.remainingBudget = this.budgetAmountValue - this.totalAmount;
    const progress = (this.totalAmount / this.budgetAmountValue) * 100;
    this.budgetProgress = Math.min(progress, 100);
    
    if (this.remainingBudget < 0) {
      this.showBudgetExceededAlert = true;
      this.budgetExceededMessage = `Warning: Budget exceeded by ${this.formatPHP(Math.abs(this.remainingBudget))}`;
    }
  },

  updateTotalAmount() {
  this.totalAmount = this.expenses.reduce((total, expense) => total + expense.amount, 0);
  this.calculateRemaining();
},

  showSuccess(message) {
    this.budgetSuccessMessage = message;
    this.budgetHideMessage = false;
    setTimeout(() => this.budgetHideMessage = true, 3000);
  },

  formatCurrencyInput() {
  // Convert to string if it's not already
  const inputStr = String(this.budgetAmountInput || '');
  this.budgetAmountInput = inputStr.replace(/[^\d.]/g, '');
},

    toggleGroupList() {
      this.showGroupList = !this.showGroupList;
      if (this.showGroupList && this.userGroups.length === 0) {
        this.fetchUserGroups();
      }
    },
    
    async fetchExchangeRate() {
      if (this.lastExchangeRateUpdate && 
      new Date() - this.lastExchangeRateUpdate < 86400000) {
    return;
  }
  
    try {
      const response = await this.$axios.get('https://api.exchangerate.host/latest?base=PHP&symbols=USD');
      this.exchangeRate = response.data.rates.USD;
      console.log('Current exchange rate:', this.exchangeRate);
    } catch (err) {
      console.error('Failed to fetch exchange rate, using default', err);
      this.exchangeRate = 0.018045;
    }
  },

    async fetchUserGroups() {
      try {
        const response = await this.$axios.get('/api/grp_expenses/my-groups', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        });
        
        if (response.data.success) {
          this.userGroups = response.data.data;
          localStorage.setItem('userGroups', JSON.stringify(response.data.data));
          const updatedGroup = response.data.data.find(g => g.id === this.localGroupId);
      if (updatedGroup && this.group.id === this.localGroupId) {
        this.$store.commit('group/SET_GROUP', updatedGroup);
      }
    }
  } catch (err) {
    console.error('Failed to fetch user groups:', err);
  }
},
    
    navigateToGroup(groupId) {
      this.showGroupList = false;

      if (groupId !== this.$route.params.groupId) {
        this.$router.push({
          name: 'Group',
          params: { groupId }
        }).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            console.error('Navigation error:', err);
            this.$notify({
              title: 'Error',
              message: 'Failed to navigate to group',
              type: 'error'
            });
          }
        });
      }
    },

    goToGroupManagement() {
      this.$router.push({ 
        name: 'GC',
        query: { fromGroup: 'true' } 
      });
    },

    async initializeGroupData() {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('jsontoken');

  if (!user || !token) {
    this.$router.push('/login');
    return;
  }

  if (!this.localGroupId) {
    this.$router.push('/GC');
    return;
  }

  try {
    await Promise.all([
      this.fetchGroupData(),
      this.loadExpenses(),
      this.$store.dispatch('group/fetchGroupBudget', this.localGroupId)
    ]);
    
    // Call calculateRemaining after all data is loaded
    this.calculateRemaining();
    
    // Verify access after loading
    if (!this.hasGroupAccess) {
      this.$router.replace('/GC');
    }
  } catch (err) {
    console.error('Failed to load group data:', err);
    this.$router.replace('/GC');
  }
},
    
    async fetchGroupData() {
 const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('No user found in localStorage. Redirecting to login...');
    this.$router.push('/login'); // Redirect to login if no user
    return;
  }

  if (!this.localGroupId) {
    this.$router.push('/GC');
    return;
  }

  try {
    console.log('Fetching group data for groupId:', this.localGroupId);
    await this.fetchGroup(this.localGroupId);
    console.log('Group data fetched successfully');
    
    if (!this.currentGroup?.id) {
      this.$router.replace('/GC');
      return;
    }

  } catch (err) {
    console.error('Error fetching group:', err, {
      error: err,
      response: err.response?.data
    });
    
    this.$notify({
      title: 'Error',
      message: err.message || 'Failed to load group data',
      type: 'error'
    });

    if (err.response?.status === 401 || err.message.includes('not logged in')) {
      this.$router.push('/login');
    } else {
      this.$router.replace('/GC');
    }
  }
},
    
    async loadExpenses() {
      this.expensesLoading = true;
      this.expensesError = null;
      try {
    const monthYear = this.formatMonthYear(this.currentMonthYear);
    console.log('Loading expenses for:', this.localGroupId, monthYear);

    const response = await this.fetchExpenses({ 
      groupId: this.localGroupId, 
      monthYear 
    });
    console.log('Expenses loaded:', response);
  } catch (err) {
    console.error('Error loading expenses:', {
      error: err,
      response: err.response?.data
    });
    this.expensesError = err.response?.data?.message || 'Failed to load expenses';
  } finally {
    this.expensesLoading = false;
  }
},
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    formatMonthYear(monthYearString) {
      const date = new Date(monthYearString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    },
    
    prevMonth() {
      const date = new Date(this.currentMonthYear);
      date.setMonth(date.getMonth() - 1);
      this.currentMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      this.loadExpenses();  
    },
    
    nextMonth() {
      const date = new Date(this.currentMonthYear);
      date.setMonth(date.getMonth() + 1);
      this.currentMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      this.loadExpenses(); 
    },
    
    copyGroupCode() {
      navigator.clipboard.writeText(this.currentGroup.group_code);
      this.$notify({
        title: 'Copied!',
        message: 'Group code copied to clipboard',
        type: 'success'
      });
    },
    
    async submitExpense() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));

        const expenseData = {
          item_name: this.newExpense.item_name,
          item_price: parseFloat(this.newExpense.item_price),
          expense_type: this.newExpense.expense_type,
          group_id: this.localGroupId,
          user_id: user.id   
        };

        console.log('Submitting expense:', expenseData);

        // Add the expense
        await this.addExpense(expenseData);

        // Show success notification
        this.$notify({
          title: 'Success',
          message: 'Expense added successfully',
          type: 'success'
        });

        // Close the modal and reset form
        this.closeModal();
        this.resetNewExpense();

        // Reload the expenses
        await this.loadExpenses();

        // Recalculate the remaining budget
        this.calculateRemaining();

        // If the remaining budget is less than zero, show the alert
        if (this.remainingBudget < 0) {
          this.showBudgetExceededAlert = true; // Show alert without auto hiding
        }
      } catch (err) {
        console.error('Error adding expense:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to add expense',
          type: 'error'
        });
      }
    },

    closeAlert() {
    this.showBudgetExceededAlert = false;
  },
    
    async submitEditExpense() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));

        const expenseData = {
          id: this.editingExpense.id,  // Assuming you're editing an existing expense, send its ID
          item_name: this.editingExpense.item_name,
          item_price: parseFloat(this.editingExpense.item_price),
          expense_type: this.editingExpense.expense_type,
          group_id: this.localGroupId,
          user_id: user.id   
        };

        console.log('Editing expense:', expenseData);

        // Call your API to update the expense (replace with your method)
        await this.updateExpense(expenseData);

        // Show success notification
        this.$notify({
          title: 'Success',
          message: 'Expense updated successfully',
          type: 'success'
        });

        // Close the modal and reset form
        this.closeEditModal();
        this.resetEditingExpense();

        // Reload the expenses
        await this.loadExpenses();

        this.updateTotalAmount()
        // Recalculate the remaining budget
        this.calculateRemaining();

        // If the remaining budget is less than zero, show the alert
        if (this.remainingBudget < 0) {
          this.showBudgetExceededAlert = true; // Show alert without auto hiding
        }
      } catch (err) {
        console.error('Error editing expense:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to update expense',
          type: 'error'
        });
      }
    },

    deleteExpenseHandler(expenseId) {
    const expense = this.expenses.find(e => e.id === expenseId);
    if (expense) {
      this.confirmDeleteExpense(expense);
    }
  },
    
async handleUpdateExpense() {
  try {
    await this.updateExpense(this.editingExpense);
    this.$notify({
      title: 'Success',
      message: 'Expense updated successfully',
      type: 'success'
    });
    this.closeModal();
    await this.loadExpenses();
    this.updateTotalAmount(); // <-- Add this
  } catch (err) {
    console.error('Error updating expense:', err);
    this.$notify({
      title: 'Error',
      message: err.response?.data?.message || 'Failed to update expense',
      type: 'error'
    });
  }
}
,
    
    confirmDeleteExpense(expense) {
      this.confirmationTitle = 'Delete Expense';
      this.confirmationMessage = `Are you sure you want to delete "${expense.item_name}" (${this.formatPHP(expense.item_price)})?`;
      this.confirmAction = async () => {
      try {
        await this.deleteExpense({
          expenseId: expense.id,
          groupId: this.localGroupId
        });
        this.$notify({
          title: 'Success',
          message: 'Expense deleted successfully',
          type: 'success'
        });
        await this.loadExpenses();
        this.updateTotalAmount(); // <-- Add this
        this.closeModal();
      } catch (err) {
        console.error('Error deleting expense:', err);
        this.$notify({
          title: 'Error',
          message: err.response?.data?.message || 'Failed to delete expense',
          type: 'error'
        });
      }
    };
      this.showConfirmationModal = true;
    },
    
    async sendInvite() {
      this.inviteError = '';
      this.inviteSuccess = '';
      
      if (!this.inviteEmail) {
        this.inviteError = 'Please enter an email address';
        return;
      }
      
      try {
        await this.sendInvite({ 
      groupId: this.localGroupId,  
      email: this.inviteEmail 
    })
        this.inviteSuccess = 'Invitation sent successfully!';
        this.inviteEmail = '';
        setTimeout(() => this.inviteSuccess = '', 3000);
      } catch (err) {
        console.error('Error sending invite:', err);
        this.inviteError = err.response?.data?.message || 'Failed to send invitation';
      }
    },
    
    confirmRemoveMember(member) {
      this.confirmationTitle = 'Remove Member';
      this.confirmationMessage = `Are you sure you want to remove ${member.username} from the group?`;
      this.confirmAction = async () => {
        try {
          console.log('Removing member with:', {
        groupId: this.localGroupId,  // Verify this exists
        memberId: member.id          // Verify this exists
      });

          await this.removeMember({ 
        groupId: this.localGroupId, 
        memberId: member.id 
      });

          this.$notify({
            title: 'Success',
            message: 'Member removed successfully',
            type: 'success'
          });

          this.closeModal();
        } catch (err) {
          console.error('Error removing member:', err);
          this.$notify({
            title: 'Error',
            message: err.response?.data?.message || 'Failed to remove member',
            type: 'error'
          });
        }
      };
      this.showConfirmationModal = true;
    },

    async handleNameUpdate() {
  if (!this.nameChanged) return;
  
  this.updatingName = true;
  this.nameError = '';
  
  try {
    await this.updateGroupNameLocal();
    this.originalName = this.group.group_name; 
  } catch (error) {
    this.nameError = error.message || 'Failed to update name';
    this.group.group_name = this.originalName;
  } finally {
    this.updatingName = false;
  }
},
    
    async updateGroupNameLocal() {
  if (!this.group.group_name.trim()) return;

  try {
    await this.$store.dispatch('group/updateGroupName', {
      groupId: this.localGroupId,
      name: this.group.group_name.trim()
    });

    await this.fetchUserGroups();

    this.$notify({ 
      title: 'Success', 
      message: 'Name updated!', 
      type: 'success' 
    });
  } catch (err) {
    this.$notify({ 
      title: 'Error', 
      message: 'Update failed', 
      type: 'error' 
    });
    throw err;
  }
},
    
    confirmDeleteGroup() {
      this.confirmationTitle = 'Delete Group';
      this.confirmationMessage = 'Are you sure you want to delete this group permanently? This action cannot be undone.';
      this.confirmAction = async () => {
        try {
          await this.deleteGroup(this.localGroupId);
          this.$notify({
            title: 'Success',
            message: 'Group deleted successfully',
            type: 'success'
          });
          this.closeModal();
          this.$router.push('/GC');
        } catch (err) {
          console.error('Error deleting group:', err);
          this.$notify({
            title: 'Error',
            message: err.response?.data?.message || 'Failed to delete group',
            type: 'error'
          });
        }
      };
      this.showConfirmationModal = true;
    },
    
    canEditExpense(expense) {
      const userId = JSON.parse(localStorage.getItem('user')).id;
      return this.isAdmin || expense.user_id === userId;
    },
    
    closeModal() {
      this.showAddExpenseModal = false;
      this.showEditExpenseModal = false;
      this.showConfirmationModal = false;
    },
    
    resetNewExpense() {
  this.newExpense = {
    item_name: '',
    item_price: 0,
    expense_type: 'Food',
    group_id: this.localGroupId
  };
},

 beforeRouteEnter(to, from, next) {
    if (!to.params.groupId) {
      next('/GC');
    } else {
      next(vm => {
        if (!vm.hasGroupAccess) {
          vm.$router.replace('/GC');
        }
      });
    }
  },

  beforeRouteUpdate(to, from, next) {
    if (!to.params.groupId) {
      this.$router.replace('/GC');
      return;
    }
    
    this.localGroupId = to.params.groupId; 
    this.initializeGroupData()
      .finally(() => next());
  }
}
};
</script>

<style scoped>
.group-header-decoration {
  height: 4px;
  background: linear-gradient(90deg, #2a4935 0%, #4a8c61 100%);
  margin-bottom: 25px;
  border-radius: 2px;
}

.floating-alert {
  position: fixed;
  top: 50%; 
  left: 50%; 
  transform: translate(-50%, -50%); 
  display: flex;
  flex-wrap: wrap;
  justify-content: center; 
  align-items: center; 
  background-color: #ffebee;
  border: 1px solid #ef9a9a;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 350px;
  min-height: 50px;
  font-size: 20px;
}

.alert-content i {
  color: #cc0000;
  font-size: 28px;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
}

.alert-content i {
  color: #cc0000;
}

.close-alert-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  
}

.close-alert-btn:hover {
  color: #cc0000;
}

.group-con {
  display: flex;
  flex-wrap: nowrap; /* prevent wrapping by default */
  gap: 12px;
  width: 100%;
  flex-direction: row;
}

.budget-total-container {
  min-width: 28%;
  box-sizing: border-box;
}

.budget-container {
  background-color: #daf9da;
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #2e4e38;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  color: white;
  min-height: 250px;
  max-height: 500px;
  margin-bottom: 10px;
}

.budget-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  gap: 10px;
}

.budget-header h3 {
  font-size: 1.5rem;
  color: #2a4935;
  margin: 0;
}

.btn-add, .btn-edit {
  background: #2a4935;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-add:hover, .btn-edit:hover {
  background: #dcdcdc;
  color: #333;
  transform: translateY(-2px);
}

.budget-display {
  transition: margin-top 0.3s ease;
  margin-top: 0;
  flex-wrap: wrap;
  background: rgba(32, 28, 28, 0.05);
  padding: 20px;
  border-radius: 10px;
}

.budget-details {
  color: #1d4d2b;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-name {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
}

.budget-amount .budget {
  color: gold;
}

.budget-amount,
.expenses-amount,
.remaining-budget {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}

.remaining-budget .text-danger {
  color: #f44336;
}

.budget-progress {
  margin-top: 15px;
}

.progress-bar {
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s;
}

.progress-fill.exceeded {
  background-color: #f44336;
}

.progress-text {
  color: #2a4935;
  text-align: right;
  font-size: 0.9rem;
}

.budget-form-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

h2 {
  margin-bottom: 40px;
  text-align: center;
}

.budget-form {
  background-color: #e4f7e4;
  border: 1px solid #2a4935;
  color: #333;
  padding: 25px;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
}

.budget-form .form-group {
  margin-bottom: 15px;
  margin-top: 20px;
}

.budget-form label {
  display: block;
  margin-bottom: 5px;
}

.budget-form input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-save {
  background-color: #2a4935;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-save:hover {
  background: #dcdcdc;
  color: #333;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel:hover {
  background-color: #4b5256;
}

.budget-success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
  transition: opacity 0.5s ease;
  opacity: 1;
}

.budget-success-message.hide {
  opacity: 0;
  pointer-events: none;
}

.group-wrapper {
  min-width: 68%;
  width: 100%;
  box-sizing: border-box;
}

.group-body {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #6A9C89;
  padding: 30px;
}

.total-summary {
  text-align: center;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
}

/* Total amount card responsiveness */
.total-amount-card {
  background: #d0ebdd;
  border-radius: 10px;
  height: 100px;
  padding: 20px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  text-align: center;
}

.total-label {
  font-size: 0.9rem;
  color: #5a6a7a;
  margin-bottom: 8px;
  margin-top: -7px;
  font-weight: 500;
}

.amount-display {
  display: flex;
  flex-direction: row;
  gap: 5px;
  justify-content: center; /* centers items horizontally */
  align-items: center;     /* centers items vertically (optional) */
  text-align: center; 
}

.currency {
  font-size: 1.4rem;
  font-weight: 600;
}

.currency.php {
  color: #2a4935;
}

.currency.usd {
  color: #4a6fa5;
  font-size: 1.2rem;
}

.exchange-rate-display {
  margin-top: 12px;
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  gap: 5px;
  justify-content: center; /* centers items horizontally */
  align-items: center;     /* centers items vertically (optional) */
  text-align: center; 
}

.retry-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background-color: #1565c0;
}

.expenses-section {
  overflow-x: auto;
}

.expenses-table table {
  width: 100%;
  border-collapse: separate; 
  border-spacing: 0 10px; 
  margin-bottom: 30px;
}

th, td {
  padding: 6px 20px; 
  text-align: center;
  border-bottom: 2px solid #e0e0e0;
  color: #444;
  font-size: 0.95rem;
}

.expenses-table th {
  background-color: #2a4935;
  color: white;
  position: sticky;
  top: 0;
  font-weight: 600;
  padding: 12px 20px; 
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

.actions {
  vertical-align: middle; /* Keep table alignment intact */
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn {
  background-color: #4CAF50;
  color: white;
}

.edit-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.edit-btn:disabled, 
.delete-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.total {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 16px;
  text-align: right;
}

.no-expenses {
  text-align: center;
  padding: 30px;
  color: #666;
}
.input-group {
  display: flex;
  gap: 8px;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.group-content {
  width: 100%;
  background: #ecfdf0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #2e4e38;
  padding: 25px;
  margin-bottom: 10px;
}

.group-header {
  margin-bottom: 25px;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
}

.group-title-section {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.group-name {
  font-size: 1.8rem;
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.group-code-badge {
  display: flex;
  align-items: center;
  background: #f0f4f8;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  gap: 8px;
  background-color: #e8f0ee;
  color: #2a4935;
}

.copy-button {
  background: none;
  border: none;
  color: #2a4935;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  transition: transform 0.2s;
}

.copy-button:hover {
  transform: scale(1.1);
}

.group-action-buttons {
  display: flex;
  gap: 12px;
}

.my-groups-btn {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.my-groups-btn:hover {
  background-color: #1e3a27;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.manage-groups-btn {
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.manage-groups-btn:hover {
  background: #3e8e41;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.group-meta-info {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  color: #5a6a7a;
  font-size: 0.9rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-item i {
  color: #6c757d;
}

/* Enhanced Group List Container */
.group-list-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: white;
  z-index: 1000;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.group-list-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #4a6fa5;
  color: white;
}

.group-list-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-group-list {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-group-list:hover {
  opacity: 1;
}

.group-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e9ecef;
}

.group-item:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
  transform: translateX(3px);
}

.group-item.active {
  background: #e6f0ff;
  border-left: 4px solid #4a6fa5;
}

.group-info h4 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

.group-info p {
  margin: 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.group-actions {
  color: #adb5bd;
  font-size: 0.9rem;
}

.group-list-toggle {
  position: fixed;
  top: 80px;
  left: 20px;
  background: #4a6fa5;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.group-list-toggle:hover {
  background: #3a5a8f;
}

.group-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  margin: 0 auto;
  padding: 120px 20px 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 20px;
  background-color: #ffebee;
  border-radius: 5px;
  margin-top: 100px;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 15px;
  margin-top: 4px;
}

.retry-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.group-code {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.group-meta {
  display: flex;
  gap: 15px;
  color: #666;
  font-size: 0.9rem;
}

.group-tabs {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.group-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
}

.group-tabs button.active {
  color: #2a4935;
  font-weight: bold;
}

.group-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1976d2;
}

.expense-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.month-selector button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.month-selector button:hover {
  background-color: #f0f0f0;
}

.add-expense-button {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.add-expense-button:hover {
  background-color: #1e3a27;
  transform: translateY(-2px);
}

.expenses-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.expense-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.expense-name {
  font-weight: bold;
}

.expense-user {
  font-size: 0.8rem;
  color: #666;
}

.expense-type {
  font-size: 0.8rem;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.expense-amount {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.expense-actions {
  display: flex;
  gap: 5px;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.action-button.edit:hover {
  color: #1976d2;
}

.action-button.delete:hover {
  color: #d32f2f;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #ecfdf0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: bold;
}

.member-email {
  font-size: 0.8rem;
  color: #666;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
}

.role-badge.admin {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.role-badge.member {
  background-color: #e3f2fd;
  color: #1976d2;
}

.remove-button {
  background-color: #ffebee;
  color: #d32f2f;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.invite-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.invite-form {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.email-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.invite-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.total-summary {
  font-size: 1.2rem;
  font-weight: bold;
  height: 100px;
}

.member-summary, .category-summary {
  margin-bottom: 15px;
}

.progress-bar {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  margin-top: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1976d2;
  border-radius: 4px;
}

.settings-section {
  margin-bottom: 30px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}

.setting-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.save-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.danger-zone {
  padding: 20px;
  background-color: #ffebee;
  border-radius: 8px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.delete-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 18px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #2a4935;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #2e4e38;
  background-color: #7dc887; 
  
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: black;
}

.modal-body {
  padding: 20px;
  background-color: #e4f9e4; 
}

.modal-overlay2 {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-header2 {
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  justify-content: space-between;
  align-items: center;
  background-color: #f56161;
  border-bottom: 1px solid #a40505;
  color: black;
}


.modal-body2 {
  padding: 20px;
  background-color: #ffebee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 96%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

small {
    font-size: 11px;
    color: red;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button.cancel-button{
  border: 1px solid #2e4e38;
}

.submit-button {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirmation-modal {
  text-align: center;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.confirm-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.no-expenses {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-expenses {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.success-message {
  color: #2e7d32;
  margin-top: 10px;
}

@media (max-width: 760px) {
  .group-con {
    flex-wrap: wrap;
    flex-direction: column;
  }
  .budget-total-container{
    max-width: 100%;
  }
  .group-wrapper{
    width: 100%;
  }
}
</style>
