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
                <button v-if="!hasBudget && isAdmin"  @click="showAddBudgetForm" class="btn-add">Add</button>
                <button v-else-if="hasBudget && isAdmin" @click="showEditBudgetForm" class="btn-edit">Edit</button>
              </div>


              <div v-if="!isBudgetLoading">
                <div v-if="hasBudget" class="budget-details">
                  <div class="budget">
                  <div class="budget-name">
                    <span>Budget Name:</span>
                    <strong>{{ groupBudget?.budget_name || 'General Budget' }}</strong>
                  </div>
                  
    
                  <div class="budget-amount">
                    <span>Budget Amount:</span>
                    <strong>{{ formatPHP(groupBudget?.budget_amount || 0) }}</strong>
                  </div>
                </div>
                  
                <div class="expenses-summary1">
                <div class="total-expenses">
        <span>Total Expenses:</span>
        <strong>{{ formatPHP(totalAmount) }}</strong>
      </div>

                  <div class="remaining-budget">
                    <span>Remaining Budget:</span>
                    <strong :class="{ 'text-danger': remainingBudget < 0 }">
                      {{ formatPHP(remainingBudget) }}
                    </strong>
                  </div>
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
            <button @click="showAddExpenseModal = true" class="add-expense-button">
              <i class="fas fa-plus"></i> Add <br> Expense
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
          <h3><i class="fas fa-coins"></i> <span>YOUR <br> EXPENSES</span></h3> 
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
                <div class="total-label">TOTAL EXPENSES</div>
                <div class="amount-display">
                  <span class="currency php">{{ formatPHP(totalAmount) }}</span>
                  <span class="currency usd">≈ {{ formatUsd(convertPhpToUsd(totalAmount)) }}</span>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  
  

        <!-- Members Tab -->
        <div v-if="activeTab === 'members'" class="members-tab">
  <div v-if="promoteSuccess" class="promote-success-message">
    <i class="fas fa-check-circle"></i>
    {{ promoteSuccess }}
    <button @click="promoteSuccess = ''" class="close-message">
      <i class="fas fa-times"></i>
    </button>
  </div>

  <div class="members-list">
    <div v-for="member in members" :key="member.id" class="member-item">
      <div class="member-info">
        <span class="member-name">{{ member.username }}</span>
        <span class="member-email">{{ member.email }}</span>
      </div>
      <div class="member-role">
        <span :class="['role-badge', member.role]">
          {{ member.role }}
          <i v-if="member.role === 'admin'" class="fas fa-crown"></i>
        </span>
        <div class="member-actions" v-if="isAdmin && member.role !== 'admin'">
          <button @click="promoteToAdmin(member)" class="promote-button">
            Promote to Admin
          </button>
          <button @click="confirmRemoveMember(member)" class="remove-button">
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="!isAdmin" class="leave-group-section">
    <h4><i class="fas fa-sign-out-alt"></i> Leave Group</h4>
    <button @click="leaveGroup" class="leave-group-button">
      Leave This Group
    </button>
    <p class="leave-group-warning">
      Warning: This action cannot be undone. You'll need to be invited again to rejoin.
    </p>
  </div>
  
  <div v-else class="admin-leave-notice">
    <h4><i class="fas fa-info-circle"></i> Admin Notice</h4>
    <p>
      As an admin, you cannot leave this group. Please transfer admin rights to another member first.
    </p>
  </div>
</div>

        <!-- Settings Tab (Admin Only) -->
        <div v-if="activeTab === 'settings' && isAdmin" class="settings-tab">
          <div class="settings-section">
            <h3 class="section-title"><i class="fas fa-cog"></i> Group Settings</h3>
           
            <div class="setting-item">
              <label class="setting-label">Group Name</label>
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
            <h3 class="danger-title"><i class="fas fa-exclamation-triangle"></i> Danger Zone</h3>
            <div class="danger-item">
              <p class="danger-text">Delete this group permanently  (including all expenses and members) </p>
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
                <option value="">Select a category</option> 
                <option value="Food">Food</option>
                <option value="Bill">Bill</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Accomodation">Accomodation</option>
                <option value="Shopping">Shopping</option>
                <option value="Other">Others</option>
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
                <option value="Entertainment">Accomodation</option>
                <option value="Transportation">Transportation</option>
                <option value="Entertainment">Bills</option>
                <option value="Entertainment">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities">Essentials</option>
                <option value="Other">Others</option>
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
      remainingBudget: 0,
      budgetProgress: 0,
      budgetName: '',
      selectedBudgetId: null,
      isBudgetLoading: false,
      isAddingBudget: false,
      isEditingBudget: false,
      budgetAmountInput: '',
      budgetSuccessMessage: '',
      budgetHideMessage: false,
      showBudgetExceededAlert: false,
      budgetExceededMessage: "Warning: You have exceeded the allotted budget!",
      showAddExpenseModal: false,
      showEditExpenseModal: false,
      showConfirmationModal: false,
      promoteSuccess: '',
      
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
  return this.groupBudget && this.groupBudget.budget_amount !== undefined && this.groupBudget.budget_amount !== null;
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
  'groupBudget': {
    deep: true,
    handler() {
      this.calculateRemaining();
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

    leaveGroup() {
  this.confirmationTitle = 'Leave Group';
  this.confirmationMessage = 'Are you sure you want to leave this group? You will need to be invited again to rejoin.';
  this.confirmAction = async () => {
    try {
      await this.$store.dispatch('group/leaveGroup', this.localGroupId);
      
      // Show success message
      this.showSuccess('You have left the group successfully');
      
      // Redirect to group list after leaving
      setTimeout(() => {
        this.$router.push('/GC');
      }, 1500);
    } catch (err) {
      console.error('Failed to leave group:', err);
      this.showError(err.response?.data?.message || 'Failed to leave group');
    } finally {
      this.showConfirmationModal = false;
    }
  };
  this.showConfirmationModal = true;
},

    promoteToAdmin(member) {
  this.confirmationTitle = 'Promote to Admin';
  this.confirmationMessage = `Are you sure you want to promote ${member.username} to admin? They will have full control over this group.`;
  this.confirmAction = async () => {
    try {
      await this.$store.dispatch('group/promoteToAdmin', {
        groupId: this.localGroupId,
        memberId: member.id
      });

      this.promoteSuccess = `${member.username} is now an admin!`;

      setTimeout(() => {
        this.promoteSuccess = '';
      }, 5000);
      
      await this.fetchGroupData();
      
    } catch (err) {
      console.error('Failed to promote member:', err);
      this.showError(err.response?.data?.message || 'Failed to promote member');
    } finally {
      this.showConfirmationModal = false;
    }
  };
  this.showConfirmationModal = true;
},

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

 showEditBudgetForm() {
  if (!this.isAdmin) {
    this.showError('Only group admins can edit budgets');
    return;
  }
  this.isEditingBudget = true;
  this.budgetAmountInput = this.groupBudget.budget_amount.toString();
  this.budgetName = this.groupBudget.budget_name || '';
},

  cancelBudgetForm() {
    this.isAddingBudget = false;
    this.isEditingBudget = false;
  },
  
  async showAddBudgetForm() {
    try {
    await this.fetchGroupData();
    console.log('Current admin status:', this.isAdmin); 
  if (!this.isAdmin) {
    this.showError('Only group admins can add budgets');
    return;
  }
  this.isAddingBudget = true;
  this.budgetAmountInput = '';
} catch (err) {
    console.error('Failed to verify admin status:', err);
    this.showError('Failed to verify permissions');
  }
},

async submitAddBudget() {
  try {
    this.isBudgetLoading = true;

    const amount = parseFloat(this.budgetAmountInput.replace(/[^0-9.]/g, ''));

    if (isNaN(amount) || amount <= 0) {
    this.showError('Please enter a valid budget amount');
    return;
  }

    
    await this.$store.dispatch('group/addGroupBudget', {
      groupId: this.localGroupId,
      budgetAmount: amount,
      budgetName: this.budgetName || 'Group Budget',
    });

    await this.fetchBudgetData();

    this.isAddingBudget = false;
    this.budgetAmountInput = '';
    this.budgetName = '';
    this.showSuccess('Budget added successfully!');
    //this.calculateRemaining();
    
  } catch (err) {
    console.error('Failed to add budget:', err);
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
      if (res.data.data) {
        // Budget exists
        this.budgetName = res.data.data.budget_name || '';
        this.calculateRemaining();
      } else {
        // No budget exists yet
        this.hasBudget = false;
      }
    }
  } catch (err) {
    if (err.response?.status === 404) {
      // No budget exists
      this.hasBudget = false;
    } else {
      console.error("Failed to fetch budget:", err);
      this.showError("Failed to load budget information");
    }
  } finally {
    this.isBudgetLoading = false;
  }
},

async fetchBudgetData() {
  this.isBudgetLoading = true;
  try {
    const response = await this.$axios.get(
      `/api/grp_expenses/groups/${this.localGroupId}/budget`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );

    if (response.data?.success) {
      this.$store.commit('group/SET_GROUP_BUDGET', response.data.data);
      this.calculateRemaining();
    } else {
      this.$store.commit('group/SET_GROUP_BUDGET', null);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      this.$store.commit('group/SET_GROUP_BUDGET', null);
    } else {
      console.error('Failed to fetch budget:', error);
      this.showError("Failed to load budget information");
    }
  } finally {
    this.isBudgetLoading = false;
  }
},

async updateBudget() {
    const amount = parseFloat(this.budgetAmountInput.replace(/[^0-9.]/g, ''));

    if (isNaN(amount) || amount <= 0) {
      this.showError('Please enter a valid budget amount');
      return;
    }

    try {
      this.isBudgetLoading = true;
      
      await this.$store.dispatch('group/updateGroupBudget', {
      groupId: this.localGroupId,
      budgetAmount: amount,
      budgetName: this.budgetName || 'Group Budget'
    });

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
    this.updateTotalAmount(); 
  } catch (err) {
    console.error('Error updating expense:', err);
    this.$notify({
      title: 'Error',
      message: err.response?.data?.message || 'Failed to update expense',
      type: 'error'
    });
  }
},
    
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
.leave-group-section,
.admin-leave-notice {
  margin: 20px auto 0px auto;
  padding: 0px 100px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  max-width: 400px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.leave-group-section h4,
.admin-leave-notice h4 {
  color: #343a40;
  margin-bottom: 12px;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
}

.leave-group-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  margin: 0 auto;
}

.leave-group-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.leave-group-warning {
  margin-top: 8px;
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: center;
  max-width: 320px;
}

.admin-leave-notice p {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 10;
  text-align: center;
  max-width: 350px;
}

.fa-sign-out-alt,
.fa-info-circle {
  margin-right: 8px;
  font-size: 1.1rem;
}

.fa-sign-out-alt {
  color: #dc3545;
}

.fa-info-circle {
  color: #17a2b8;
}

.promote-success-message {
  background-color: #4CAF50;
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: fadeIn 0.3s ease-in-out;
}

.promote-success-message i.fa-check-circle {
  margin-right: 10px;
}

.close-message {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  margin-left: 15px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.role-badge.admin {
  background-color: #ffeb3b;
  color: #000;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fa-crown {
  color: #ff9800;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.promote-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.promote-button:hover {
  background-color: #45a049;
}

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

.budget {
  background-color: #ffffff;           
  border: 2px solid #6A9C89;           
  padding: 12px 16px;
  border-radius: 10px;
  color: #388e3c;                      
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  font-weight: 650;
  font-size: 18px;
}

.budget-details {
  color: #1d4d2b;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.budget-name,
.budget-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}

.budget-name span,
.budget-amount span {
  color: #388e3c;   
}

.budget-name strong,
.budget-amount strong {
  color:  #388e3c;
  font-weight: bold;
}

.expenses-summary1 {
  background-color: #f5f5f5;
  border: 2px solid #697565;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  width: 88%;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.total-expenses,
.remaining-budget {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  color: #444;
}

.total-expenses span,
.remaining-budget span {
  color: #444;
}

.total-expenses strong,
.remaining-budget strong {
  font-weight: bold;
  color: #444;
}

.remaining-budget strong.text-danger {
  color: #d32f2f;
}
.progress-bar {
  height: 10px !important;
  background-color: #f0f0f0;
  border-radius: 70px !important;
  overflow: hidden;
}

.progress-fill {
  height: 100%; /* Matches progress-bar height */
  background: linear-gradient(to right, #81c784, #66bb6a); 
  transition: width 0.3s;
  border-radius: 15px 0 0 15px; /* Optional: makes left edge rounded */
}

.progress-fill.exceeded {
  background-color: #f44336;
}

.progress-text {
  color: #2a4935;
  text-align: right;
  font-size: 1rem; /* Slightly bigger */
  margin-top: 6px;  /* Adds spacing below the bar */
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
  margin: 0 auto;
  max-width: 1200px;
}

.group-body {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 2px solid #6A9C89;
  padding: 30px;
  margin-bottom: 20px;
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
  height: 70px;
  padding: 14px 16px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  text-align: center;
}

.total-label {
  font-size: 1.2rem;
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
  text-align: center;
  margin-bottom: 30px;
}

.expenses-section h3 {
  display: inline-block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2a4935;
  background: linear-gradient(90deg, #d0ebdd, #f0f7f3);
  padding: 25px 0px 25px 0px;
  border-radius: 12px;
  animation: fadeSlideIn 0.6s ease-out;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0px;
  width: 100%;
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
  border-bottom: 2px solid #e0e0e0;
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
  transition: all 0.2s ease;
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
  margin-bottom: 10px;
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
  background: #e8f0ee;
  padding: 10px 16px; 
  border-radius: 20px; 
  font-size: 1.0rem; 
  gap: 10px; 
  background-color: #d1f0e6; 
  color: #2a4935; 
  font-weight: 500; 
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); 
  transition: all 0.3s ease;
}

.group-code-badge:hover {
  background-color: #b9e8d8; 
  transform: translateY(-2px); 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); 
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

.meta-item span {
  font-size: 1.1rem; 
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
  border-bottom: 2px solid  #f0f0f0;
  margin-bottom: 30px;
  gap: 30px;
}

.group-tabs button {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  position: relative;
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px 6px 0 0;
}

.group-tabs button:hover {
  background-color: #f5f5f5;
  color: #2a4935;
}

.group-tabs button.active {
  color: #2a4935;
  font-weight: 600;
  background-color: #f0f7f3;
}

.group-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #2a4935;
  border-radius: 3px;
}

.expense-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.add-expense-button {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 20px 20px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin: 0 auto; /* This centers the button */
  width: 100%;
}

.add-expense-button:hover {
  background-color: #1e3a27;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(42, 73, 53, 0.3);
}

.add-expense-button i {
  font-size: 1.1rem;
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
  background: linear-gradient(135deg, #ecfdf0, #e6f4ea);
  border-radius: 10px;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.member-item:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}


.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 600;
  font-size: 1rem;
  color: #2a4935;
}

.member-email {
  font-size: 0.8rem;
  color: #7d8c96;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background-color: #e0f2e9;
  color: #1b5e20;
}

.role-badge.member {
  background-color: #e3f2fd;
  color: #0d47a1;
}

.remove-button {
  background-color: #ffebee;
  color: #d32f2f;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.3s ease;
}

.remove-button:hover {
  background-color: #ffcdd2;
}

.invite-section {
  margin-top: 30px;
  padding: 25px 20px;
  background: linear-gradient(135deg, #f0fdf4, #e8f5e9);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #2a4935;
  transition: all 0.3s ease;
}

.invite-section:hover {
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.invite-section h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2a4935;
}

.invite-form {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.email-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #cfd8dc;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border 0.3s ease;
}

.email-input:focus {
  border-color: #2a4935;
  box-shadow: 0 0 0 2px rgba(42, 73, 53, 0.1);
}

.invite-button {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.invite-button:hover {
  background-color: #1f3627;
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

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2a4935;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.setting-label {
  font-weight: 600;
  color: #2a4935;
  font-size: 1.1rem;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.setting-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.setting-input:focus {
  border-color: #1976d2;
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.save-button {
  background-color: #2a4935;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-button:hover:enabled {
  background-color: #1f3627;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 5px;
  color: #d32f2f;
  font-size: 0.85rem;
}

.danger-zone {
  padding: 20px;
  background-color: #fff5f5;
  border-left: 4px solid #d32f2f;
  border-radius: 10px;
  margin-top: 40px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.danger-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #d32f2f;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.danger-text {
  color: #444;
  font-size: 0.95rem;
  max-width: 70%;
}

.delete-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-button:hover:enabled {
  background-color: #b71c1c;
}

.delete-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  border-bottom: 1px solid #2e4e38;
  background-color: #7dc887;  
}

.modal-header h3 {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
}
.modal-header .close-button {
  position: absolute;
  right: 10px;
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
  position: relative;
  display: flex;
  padding: 15px 20px;
  justify-content: center;
  align-items: center;
  background-color: #f56161;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: 1px solid #a40505;
  color: black;
}

.modal-header2 h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
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

@media (max-width: 1050px) {
  .expenses-section h3{
  padding: 25px 0px 25px 0px;
  width: 650px;
  }
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
  .member-item {
  display: flex;
  flex-wrap: wrap;
  }
}
</style>
