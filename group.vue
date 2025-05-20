<template>
  <Navigation />
  <div class="group-header-decoration">

  <div class="group-container">

    <!-- Add this container for the group list -->
    <div v-if="showGroupList" class="group-modal-overlay">
      <div class="group-modal">
        <div class="group-modal-header">
        <h3>Your Groups</h3>
        <button @click="toggleGroupList" class="close-modal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="groups-list">
        <div 
          v-for="group in userGroups" 
          :key="group.id" 
          class="group-item"
          @click="navigateToGroup(group.id)"
          :class="{ active: group.id === $route.params.groupId }"
        >
        <div class="group-info">
      <h4>{{ group.group_name }}</h4>
      <div class="group-meta">
        <span><i class="fas fa-user-friends"></i> {{ group.member_count }} members</span>
        <span><i class="fas fa-calendar-alt"></i> {{ formatDate(group.created_at) }}</span>
      </div>
      </div>
          <div class="group-actions">
            <i class="fas fa-chevron-right"></i>
          </div>
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

                <div v-else class="no-budget">
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

      <div class="contribution-form">
    <h3><i class="fas fa-edit"></i> Add Your Contribution</h3>
    <div class="form-group">
    <label>Amount (₱)</label>
    <input 
      type="number" 
      v-model.number="paidAmountInput" 
      placeholder="Enter amount"
      min="0"
      step="0.01"
      @keyup.enter="saveContribution"
    >
  </div>
  <div class="btn-save-wrapper">
  <button 
    @click="saveContribution" 
    class="btn-save"
    :disabled="paidAmountLoading || !paidAmountInput || paidAmountInput <= 0"
  >
    <span v-if="paidAmountLoading">
      <i class="fas fa-spinner fa-spin"></i> Saving...
    </span>
    <span v-else>Save Contribution</span>
  </button>
  </div>
  <div v-if="contributionHistory.length > 0" class="contribution-history">
    <h4><i class="fas fa-history"></i> Your Contribution History</h4>
    <ul class="contribution-list">
  <li v-for="(contribution, index) in contributionHistory" :key="index">
    <div class="contribution-date">
      {{ formatDate(contribution.date) }}
    </div>
    <div class="contribution-amount">
      {{ formatPHP(contribution.amount) }}
    </div>
    <button @click="editContribution(contribution)" class="edit-btn" title="Edit">
      <i class="fas fa-edit"></i>
    </button>
  </li>
</ul>
  </div>
      <div v-else class="no-contributions">
      <p>No contribution history found for this group</p>
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
        @click="activeTab = 'contribution'" 
        :class="{ active: activeTab === 'contribution' }"
      >
        Contribution
      </button>
      <button 
    @click="activeTab = 'photos'" 
    :class="{ active: activeTab === 'photos' }"
  >
    Photos
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
          <button 
  @click="showAddExpenseModal = true" 
  class="add-expense-button"
  :disabled="!hasBudget"
>
  <i class="fas fa-plus"></i> Add <br> Expense
  <span v-if="!hasBudget" class="tooltip">Please set a budget first</span>
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
          <h3><i class="fas fa-coins"></i> <span>YOUR <br> EXPENSES</span></h3> 
          <div class="expenses-section"> 
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
                          class="button-edit"
                          :disabled="!canEditExpense(expense)"
                        >
                          Edit
                        </button>
                        <button 
                          @click="confirmDeleteExpense(expense)" 
                          class="button-delete"
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
            As an admin, you cannot leave this group. 
          </p>
        </div>
        </div>

      <!-- Contribution Tab -->
      <div v-if="activeTab === 'contribution'" class="contribution-tab">
        <div class="contribution-header">
          <h2><i class="fas fa-hand-holding-usd"></i> Group Contributions</h2>
          <p>Track and manage contributions and balances for this group</p>
        </div>

        <div class="contribution-summary">
          <div class="summary-card">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-amount">{{ formatPHP(totalAmount) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Contributed</div>
            <div class="summary-amount">{{ formatPHP(totalContributions) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Your Share</div>
            <div class="summary-amount">{{ formatPHP(yourShare) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Your Balance</div>
            <div class="summary-amount" :class="{ 'text-danger': yourBalance < 0, 'text-success': yourBalance >= 0 }">
              {{ formatPHP(Math.abs(yourBalance)) }}
              <span v-if="yourBalance < 0">(You owe)</span>
              <span v-else>(You're owed)</span>
            </div>
          </div>
        </div>

        <div class="contribution-section">
          <div class="member-contributions-table">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contributed</th>
                  <th>Share</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in memberContributions" :key="member.id">
  <td>{{ member.username }}</td>
  <td>{{ formatPHP(member.contributed) }}</td>
  <td>{{ formatPHP(member.share) }}</td>
  <td :class="{ 'text-danger': member.balance < 0, 'text-success': member.balance >= 0 }">
    {{ formatPHP(Math.abs(member.balance)) }}
    <span v-if="member.balance < 0">(Owes)</span>
    <span v-else>(Owed)</span>
  </td>
  <td>
    <span :class="['status-badge', member.status]">
      {{ member.status }}
      <span v-if="member.status === 'pending'" class="text-danger"> 
      </span>
    </span>
  </td>
</tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'photos'" class="photos-tab">
  <div class="photos-header">
    <h2><i class="fas fa-images"></i> Group Photos</h2>
    <button @click="showUploadModal = true" class="upload-photo-btn">
      <i class="fas fa-plus"></i> Upload Photo
    </button>
  </div>

  <div v-if="photosLoading" class="loading-container">
    <div class="spinner"></div>
    <p>Loading photos...</p>
  </div>

  <div v-else-if="photosError" class="error-container">
    <p class="error-message">{{ photosError }}</p>
    <button @click="fetchPhotos" class="retry-button">Retry</button>
  </div>

  <div v-else-if="groupPhotos.length === 0" class="no-photos">
    <p>No photos uploaded yet. Be the first to share!</p>
  </div>

  <div v-else class="photos-grid">
    <div v-for="photo in groupPhotos" :key="photo.id" class="photo-card">
      <div class="photo-wrapper">
        <img :src="photo.image_url" :alt="photo.description || 'Group photo'" @click="openPhotoModal(photo)" class="photo-thumbnail" @error="handleImageError">
        <div class="photo-actions" v-if="canDeletePhoto(photo)">
          <button @click.stop="confirmDeletePhoto(photo)" class="delete-photo-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="photo-meta">
        <p class="photo-description">{{ photo.description || 'No description' }}</p>
        <div class="photo-footer">
          <span class="photo-uploader">
            <i class="fas fa-user"></i> {{ photo.username }}
          </span>
          <span class="photo-date">
            <i class="far fa-calendar-alt"></i> {{ formatDate(photo.created_at) }}
          </span>
        </div>
      </div>
    </div>
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
            <p class="danger-text">Delete this group permanently (including all expenses and members)</p>
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

  <!-- Photo Upload Modal -->
<div v-if="showUploadModal" class="modal-overlay">
  <div class="modal-content photo-upload-modal">
    <div class="modal-header">
      <h3>Upload Photo</h3>
      <button @click="closePhotoModal" class="close-button">&times;</button>
    </div>
    <div class="modal-body">
      <form @submit.prevent="uploadPhoto">
        <div class="form-group">
          <label>Photo Description</label>
          <textarea v-model="newPhoto.description" placeholder="Add a description (optional)"></textarea>
        </div>
        
        <div class="form-group">
          <label>Select Photo</label>
          <input 
            type="file" 
            ref="photoInput"
            accept="image/*"
            @change="handleFileSelect"
            required
          >
          <div v-if="photoPreview" class="photo-preview">
            <img :src="photoPreview" alt="Preview">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" @click="closePhotoModal" class="cancel-button">Cancel</button>
          <button type="submit" class="submit-button" :disabled="uploadingPhoto">
            <span v-if="uploadingPhoto">
              <i class="fas fa-spinner fa-spin"></i> Uploading...
            </span>
            <span v-else>Upload Photo</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Photo View Modal -->
<div v-if="viewingPhoto" class="modal-overlay photo-view-modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Photo Details</h3>
      <button @click="viewingPhoto = null" class="close-button">&times;</button>
    </div>
    <div class="modal-body">
      <img :src="viewingPhoto.image_url" :alt="viewingPhoto.description">
      <div class="photo-details">
        <p v-if="viewingPhoto.description" class="photo-description">{{ viewingPhoto.description }}</p>
        <p class="photo-meta">Uploaded by {{ viewingPhoto.username }} on {{ formatDate(viewingPhoto.created_at) }}</p>
      </div>
    </div>
  </div>
</div>

    <!-- Add Expense Modal -->
    <div v-if="showAddExpenseModal" class="modal-overlay">
  <div class="modal-content2">
    <div class="modal-header">
      <h3>Add New Expense</h3>
      <button @click="closeModal" class="close-button">&times;</button>
    </div>
    <div class="modal-body">
      <button 
        @click="showVoiceHelp()" 
        class="voice-help-btn" 
        title="Voice commands help"
      >
        <i class="fas fa-question-circle"></i> Voice Help
      </button>

      <form @submit.prevent="submitExpense">
        <div class="form-group">
          <label>Category</label>
          <div class="input-with-voice">
            <select 
              v-model="newExpense.expense_type" 
              required 
              @change="handleCategoryChange"
            >
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

        <!-- Custom Category Field with Voice Input -->
        <div v-if="newExpense.expense_type === 'Other'" class="form-group">
          <label>Custom Category</label>
          <div class="input-with-voice">
            <input 
              v-model="customExpenseType" 
              type="text" 
              placeholder="Enter custom category name"
              required
            />
            <button 
              @click="startVoiceInput('customType')" 
              class="voice-btn"
              :class="{ active: isListening && voiceInputActiveField === 'customType' }"
              title="Set custom category by voice"
            >
              <i class="fas fa-microphone"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Item Name</label>
          <div class="input-with-voice">
            <input 
              v-model="newExpense.item_name" 
              type="text" 
              required
              minlength="2"
              maxlength="255"
            />
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
          <label>Amount</label>
          <div class="input-with-voice">
            <input 
              v-model="newExpense.item_price" 
              type="number" 
              step="0.01" 
              min="0" 
              required
            />
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
        
        <div class="form-actions">
          <button type="button" @click="closeModal" class="cancel-button">Cancel</button>
          <button type="submit" class="submit-button">Add Expense</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Voice Help Modal -->
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
          <span class="command-description">- {{ command.description }}</span>
        </div>
      </div>
    </div>
    <div class="voice-help-footer">
      <button @click="showVoiceHelpModal = false" class="btn-ok">Got it!</button>
    </div>
  </div>
</div>

      <!-- Edit Contribution Modal -->
      <div v-if="showEditContributionModal" class="modal-overlay">
  <div class="con-contribution">
    <h3>Edit Contribution</h3>
    
    <div class="form-group">
      <label>Amount (₱)</label>
      <input 
        type="number" 
        v-model.number="editingContribution.amount" 
        placeholder="Enter amount"
        min="0"
        step="0.01"
        class="form-control"
        @keyup.enter="updateContribution"
      >
    </div>
    
    <div class="modal-actions">
      <button @click="updateContribution" class="btn-save1" :disabled="!editingContribution.amount || editingContribution.amount <= 0">
        Save Changes
      </button>
      <button @click="cancelEditContribution" class="btn-cancel">
        Cancel
      </button>
    </div>
  </div>
</div>

    <!-- Edit Expense Modal -->
    <div v-if="showEditExpenseModal" class="modal-overlay">
      <div class="modal-content1">
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
            <div v-if="editingExpense.expense_type === 'Other'" class="form-group">
          <label>Custom Category</label>
          <input 
            v-model="customExpenseType" 
            type="text" 
            placeholder="Enter custom category name"
            required
          >
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
      pendingInvites: [],
      showInvitesModal: false,
      memberContributions: [],
      contributions: [],
      paidAmountInput: 0,
      contributionHistory: [],
      paidAmountLoading: false,
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
      showEditContributionModal: false,
      photoPreview: null,
    uploadingPhoto: false,
    groupPhotos: [],
    photosLoading: false,
    photosError: null,
      showUploadModal: false,
    viewingPhoto: null,
    newPhoto: {
      description: '',
      file: null
    },
      editingContribution: {
      id: null,
      amount: 0,
      date: '',
      status: '',
      originalAmount: 0
    },
      
      // Form data
      newExpense: {
        item_name: '',
        item_price: 0,
        expense_type: '',
      },
      customExpenseType: '', 
      editingExpense: {
      expense_type: '',
      item_name: '',
      item_price: null
    },
      
      editingExpense: {},
      confirmationTitle: '',
      confirmationMessage: '',
      confirmAction: () => {},
      
      // Invite member
      inviteEmail: '',
      inviteError: '',
      inviteSuccess: '',
      isListening: false,
      showVoiceHelpModal: false,
      isListening: false,
      voiceInput: '',
      voiceCommands: [],
      recognition: null,
      voiceInputActiveField: null,
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
    ...mapState('group', { // Use object syntax for clarity
      currentGroup: state => state.currentGroup,
      members: state => state.members,
      expenses: state => state.expenses,
      loading: state => state.loading,
      error: state => state.error,
      isAdmin: state => state.isAdmin,
      groupBudget: state => state.groupBudget || {}
    }),

    totalContributions() {
    if (!this.contributions) return 0;
    return this.contributions.reduce((total, contribution) => {
      return total + parseFloat(contribution.amount || 0);
    }, 0);
  },
  
  yourShare() {
    return this.totalAmount / (this.members?.length || 1);
  },
  
  yourBalance() {
    const user = JSON.parse(localStorage.getItem('user'));
    const yourContribution = this.memberContributions?.find(m => m.id === user?.id)?.contributed || 0;
    return yourContribution - this.yourShare;
  },
  
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
        await this.fetchContributionHistory();
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
  'contributions': {
    deep: true,
    handler() {
      this.updateMemberContributions();
    }
  },
  'expenses': {
    deep: true,
    handler() {
      this.updateMemberContributions();
    }
  },
  'filteredExpenses': {
    deep: true,
    handler() {
      this.updateMemberContributions();
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
  
  this.setupVoiceRecognition();

    if (this.groupId) {
      this.isBudgetLoading = true;
      try {
        const res = await this.$axios.get(
        `/api/grp_expenses/groups/${this.groupId}/budget`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
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

  if (this.$route.query.invite_check) {
    await this.checkPendingInvites();
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
    console.log('Fetching photos...');
    await this.fetchPhotos();
    console.log('Fetching contributions...');
    await this.fetchContributions();
    console.log('Fetching contribution history...');
    await this.fetchContributionHistory();
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


    await this.initializeGroupData();
     await this.fetchUserGroups(),
     await this.fetchContributions();
     await this.fetchContributionHistory();

    this.contributions = this.contributions || [];
    this.memberContributions = this.memberContributions || [];
    
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

    handleImageError(event) {
    console.error('Image failed to load:', event.target.src);
  },
  
    closeAlert() {
    this.showBudgetExceededAlert = false;
  },
  
    showVoiceHelp() {
    this.showVoiceHelpModal = true;
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
    this.newExpense.expense_type = category;
    this.$toast.success(`Category set to: ${category}`);
  },

  handleCustomTypeInput(transcript) {
  this.customExpenseType = transcript;
  this.$toast.success(`Custom type set to: ${transcript}`);
},

  handleItemInput(transcript) {
    this.newExpense.item_name = transcript;
    this.$toast.success(`Item set to: ${transcript}`);
  },

  handleAmountInput(transcript) {
    const amount = this.extractNumber(transcript);
    if (amount !== null) {
      this.newExpense.item_price = amount;
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
  const categories = ['Food', 'Bill', 'Transportation', 'Entertainment', 'Accomodation', 'Shopping', 'Other'];
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
  
  if (['hotel', 'dorm', 'rent', 'apartment', 'hostel', 'motel', 'airbnb', 'lodging', 'accommodation', 'lease'].some(term => lowerSpoken.includes(term))) {
  return 'Accommodation';
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
    this.customExpenseType = matchedCategory;
    this.$toast.success(`Category set to: ${matchedCategory}`);
  },

  setItemNameFromVoice(itemName) {
    this.newExpense.item_name = itemName;
    this.$toast.success(`Item name set to: ${itemName}`);
  },

  setAmountFromVoice(amount) {
    const numericAmount = this.extractNumber(amount);
    if (numericAmount) {
      this.newExpense.item_price = numericAmount;
      this.$toast.success(`Amount set to: ${this.formatPHP(numericAmount)}`);
    } else {
      this.$toast.error("Couldn't understand the amount");
    }
  },

    formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  },

    showContributionDetails(userId) {
  const userContributions = this.contributions.filter(c => c.user_id === userId);
  const userName = this.members.find(m => m.id === userId)?.username || 'Member';
  
  this.$notify({
    title: `${userName}'s Contributions`,
    message: `
      <div class="contribution-details">
        ${userContributions.map(c => `
          <div class="contribution-item">
            <span class="amount">${this.formatPHP(c.amount)}</span>
            <span class="date">${new Date(c.created_at).toLocaleDateString()}</span>
          </div>
        `).join('')}
        <div class="contribution-total">
          Total: ${this.formatPHP(userContributions.reduce((sum, c) => sum + parseFloat(c.amount), 0))}
        </div>
      </div>
    `,
    duration: 5000,
    dangerouslyUseHTMLString: true
  });
},

async fetchPhotos() {
    this.photosLoading = true;
    this.photosError = null;
    try {
      const response = await this.$axios.get(
        `/api/grp_expenses/groups/${this.localGroupId}/photos`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success) {
        this.groupPhotos = response.data.photos.map(photo => ({
        ...photo,
        image_url: photo.image_url.startsWith('http') ? photo.image_url : 
                  `${window.location.origin}${photo.image_url}`
      }));
      }
    } catch (err) {
      this.photosError = err.response?.data?.message || 'Failed to load photos';
      console.error('Error fetching photos:', err);
    } finally {
      this.photosLoading = false;
    }
  },
  
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.match('image.*')) {
      this.showError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.showError('Image size should be less than 5MB');
        return;
      }
      
      this.newPhoto.file = file;
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  },
  
  async uploadPhoto() {
  if (!this.newPhoto.file) {
    this.showError('Please select a photo to upload');
    return;
  }
  
  this.uploadingPhoto = true;
  
  try {
    const formData = new FormData();
    formData.append('photo', this.newPhoto.file);
    formData.append('description', this.newPhoto.description);
    
    const response = await this.$axios.post(
      `/api/grp_expenses/groups/${this.localGroupId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );
    
    if (response.data.success) {
      this.showSuccess('Photo uploaded successfully!');
      this.groupPhotos.unshift(response.data.photo);
      this.closePhotoModal();
    } else {
      this.showError(response.data.message || 'Upload failed');
    }
  } catch (err) {
    console.error('Error uploading photo:', err);
    let errorMsg = 'Failed to upload photo';
    if (err.response) {
      errorMsg = err.response.data.message || errorMsg;
      console.error('Server response:', err.response.data);
    }
    this.showError(errorMsg);
  } finally {
    this.uploadingPhoto = false;
  }
},
  
  openPhotoModal(photo) {
    this.viewingPhoto = photo;
  },
  
  closePhotoModal() {
    this.showUploadModal = false;
    this.newPhoto = { description: '', file: null };
    this.photoPreview = null;
    if (this.$refs.photoInput) {
      this.$refs.photoInput.value = '';
    }
  },
  
  confirmDeletePhoto(photo) {
    this.confirmationTitle = 'Delete Photo';
    this.confirmationMessage = 'Are you sure you want to delete this photo?';
    this.confirmAction = async () => {
      try {
        await this.deletePhoto(photo.id);
        this.showSuccess('Photo deleted successfully!');
      } catch (err) {
        this.showError(err.response?.data?.message || 'Failed to delete photo');
      }
    };
    this.showConfirmationModal = true;
  },
  
  async deletePhoto(photoId) {
    try {
      await this.$axios.delete(
        `/api/grp_expenses/groups/${this.localGroupId}/photos/${photoId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      this.groupPhotos = this.groupPhotos.filter(p => p.id !== photoId);
    } catch (err) {
      console.error('Error deleting photo:', err);
      throw err;
    }
  },
  
  canDeletePhoto(photo) {
    const user = JSON.parse(localStorage.getItem('user'));
    return this.isAdmin || photo.user_id === user.id;
  },

async checkPendingInvites() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await this.$axios.get(
        '/api/grp_expenses/pending-invites',
        {
          params: { email: user.email },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success && response.data.data.length > 0) {
        this.showInvitesModal = true;
        this.pendingInvites = response.data.data;
      }
    } catch (err) {
      console.error('Failed to check pending invites:', err);
    }
  },
  
async fetchPendingInvites() {
  try {
    const response = await this.$axios.get(
      '/api/grp_expenses/pending-invites',
      {
        params: { email: this.user.email },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );
    
    if (response.data.success) {
      this.pendingInvites = response.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch pending invites:', err);
  }
},

showInvites() {
  this.fetchPendingInvites();
  this.showInvitesModal = true;
},

async acceptInvite(invite) {
    try {
      const response = await this.$axios.get(
        `/api/grp_expenses/accept-invite?token=${invite.token}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success) {
        this.$notify({
          title: 'Success',
          message: `You've joined ${invite.group_name}`,
          type: 'success'
        });
        
        // Refresh the invites list
        await this.fetchPendingInvites();
        
        // If we're not currently in a group, navigate to the new group
        if (!this.localGroupId) {
          this.$router.push({
            name: 'Group',
            params: { groupId: invite.group_id }
          });
        }
        // If we're already in this group, refresh the data
        else if (this.localGroupId === invite.group_id) {
          await this.fetchGroupData();
        }
        
        this.showInvitesModal = false;
      }
    } catch (err) {
      this.$notify({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to accept invitation',
        type: 'error'
      });
    }
  },

async updateMemberContributions() {
  if (!this.members || !this.contributions) {
    this.memberContributions = [];
    return;
  }
  
  const totalExpenses = this.totalAmount;
  const sharePerMember = totalExpenses / (this.members.length || 1);
  
  this.memberContributions = this.members.map(member => {
    const userContributions = this.contributions.filter(c => c.user_id === member.id);
    const contributed = userContributions.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const balance = contributed - sharePerMember;
    const newStatus = balance >= 0 ? 'completed' : 'pending';

    // Update backend if status changed
    userContributions.forEach(async (contribution) => {
      if (contribution.status !== newStatus) {
        try {
          await this.$axios.put(
            `/api/grp_expenses/groups/${this.localGroupId}/contributions/${contribution.id}/status`,
            { status: newStatus },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
              }
            }
          );
        } catch (error) {
          console.error('Failed to update contribution status:', error);
        }
      }
    });

    return {
      id: member.id,
      username: member.username,
      contributed,
      share: sharePerMember,
      balance,
      status: newStatus
    };
  });
},

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
    this.$notify({
      title: 'Error',
      message: message,
      type: 'error',
      duration: 5000
    });
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
    this.editingExpense = { ...expense };
    
    // Check if this is a custom category (not in our standard list)
    const standardCategories = ['Food', 'Bill', 'Transportation', 'Entertainment', 'Accomodation', 'Shopping'];
    if (!standardCategories.includes(expense.expense_type)) {
      this.editingExpense.expense_type = 'Other';
      this.customExpenseType = expense.expense_type;
    } else {
      this.customExpenseType = '';
    }
    
    this.showEditExpenseModal = true;
  },

  handleEditCategoryChange() {
    if (this.editingExpense.expense_type !== 'Other') {
      this.customExpenseType = '';
    }
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

  async editContribution(contribution) {
    const plainContribution = JSON.parse(JSON.stringify(contribution));
  console.log('Editing contribution:', plainContribution);

  if (!plainContribution.id) {
    this.showError('Contribution ID is missing');
    return;
  }
  
  this.editingContribution = {
    id: plainContribution.id,
    amount: parseFloat(plainContribution.amount),
    date: plainContribution.date,
    status: plainContribution.status,
    originalAmount: parseFloat(plainContribution.amount)
  };
  this.showEditContributionModal = true;
},

async updateContribution() {
  if (!this.editingContribution?.id) {
    this.showError('Invalid contribution ID');
    return;
  }

  try {
    const response = await this.$axios.put(
      `/api/grp_expenses/groups/${this.localGroupId}/contributions/${this.editingContribution.id}`,
      { amount: this.editingContribution.amount },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );
    
    if (response.data.success) {
      this.showSuccess('Contribution updated successfully!');
      await Promise.all([
        this.fetchContributionHistory(),
        this.fetchContributions()
      ]);
      this.showEditContributionModal = false;
    }
  } catch (error) {
    console.error('Failed to update contribution:', error);
    this.showError(error.response?.data?.message || 'Failed to update contribution');
  }
},
  
  cancelEditContribution() {
    if (this.editingContribution.originalAmount) {
      this.editingContribution.amount = this.editingContribution.originalAmount;
    }
    this.showEditContributionModal = false;
  },

  async fetchContributionHistory() {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await this.$axios.get(
        `/api/grp_expenses/groups/${this.localGroupId}/contribution-history`,
        {
          params: { user_id: user.id },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success) {
        this.contributionHistory = response.data.history || [];
      console.log('Fetched contribution history:', this.contributionHistory);
      }
    } catch (error) {
      console.error('Failed to fetch contribution history:', error);
    }
  },

  async fetchContributions() {
    try {
      const response = await this.$axios.get(
        `/api/grp_expenses/groups/${this.localGroupId}/contributions`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success) {
        this.contributions = response.data.contributions || [];
      console.log('Fetched contributions:', this.contributions);
        this.updateMemberContributions();
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
      this.showError('Failed to load contributions');
    }
  },

  async saveContribution() {
    if (this.paidAmountLoading) return;
    
    try {
      this.paidAmountLoading = true;
      const amount = parseFloat(this.paidAmountInput);
      
      if (isNaN(amount) || amount <= 0) {
        this.showError('Please enter a valid amount');
        return;
      }
      
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await this.$axios.post(
        `/api/grp_expenses/groups/${this.localGroupId}/contributions`,
        { 
          amount,
          user_id: user.id,
          group_id: this.localGroupId 
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        }
      );
      
      if (response.data.success) {
        this.showSuccess('Contribution saved successfully!');
        this.paidAmountInput = 0;

        await Promise.all([
          this.fetchContributions(),
          this.fetchContributionHistory(),
          this.fetchGroupData()
        ]);

      this.$forceUpdate();
    }
    } catch (error) {
      console.error('Failed to save contribution:', error);
      this.showError(error.response?.data?.message || 'Failed to save contribution');
    } finally {
      this.paidAmountLoading = false;
    }
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

    await this.fetchContributions();
    
    // Update member contributions
    this.updateMemberContributions();

    if (!this.currentGroup?.id) {
      this.$router.replace('/GC');
      return;
    }

   // this.updateMemberContributions();

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
    
    formatMonthYear(monthYearString) {
      const date = new Date(monthYearString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
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
  // Check if budget exists
  if (!this.hasBudget) {
    this.showError('Please set a group budget before adding expenses');
    return;
  }

  // Validate custom category if "Other" is selected
  if (this.newExpense.expense_type === 'Other' && !this.customExpenseType) {
    this.showError('Please enter a custom category');
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user'));

    // Prepare expense data with custom category handling
    const expenseData = {
      item_name: this.newExpense.item_name,
      item_price: parseFloat(this.newExpense.item_price),
      expense_type: this.newExpense.expense_type === 'Other' 
        ? this.customExpenseType 
        : this.newExpense.expense_type,
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
    this.customExpenseType = ''; // Reset custom category field

    // Reload the expenses
    await this.loadExpenses();

    // Recalculate the remaining budget
    this.calculateRemaining();

    // If the remaining budget is less than zero, show the alert
    if (this.remainingBudget < 0) {
      this.showBudgetExceededAlert = true;
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

// Add this method to your component if you don't have it already
showError(message) {
  this.$notify({
    title: 'Error',
    message: message,
    type: 'error'
  });
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
    // Prepare the expense data with custom category handling
    const expenseData = {
      ...this.editingExpense,
      expense_type: this.editingExpense.expense_type === 'Other' 
        ? this.customExpenseType 
        : this.editingExpense.expense_type
    };

    // Call your existing updateExpense method with the modified data
    await this.updateExpense(expenseData);
    
    // Show success notification
    this.$notify({
      title: 'Success',
      message: 'Expense updated successfully',
      type: 'success'
    });
    
    // Close modal and refresh data
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
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!this.inviteEmail || !emailRegex.test(this.inviteEmail)) {
    this.inviteError = 'Please enter a valid email address';
    return;
  }

  try {
    const response = await this.$axios.post(
      `/api/grp_expenses/groups/${this.localGroupId}/members/invite`,
      { 
        email: this.inviteEmail 
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
        }
      }
    );

     if (response.data.success) {
      this.inviteSuccess = 'Invitation sent successfully!';
      this.inviteEmail = '';
      
      setTimeout(() => {
        this.inviteSuccess = '';
      }, 3000);
    }
  } catch (err) {
    console.error('Error sending invite:', err);
    this.inviteError = err.response?.data?.message || 'Failed to send invitation';
    
    setTimeout(() => {
      this.inviteError = '';
    }, 5000);
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
  return expense.user_id === userId; 
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
  
  // Clear existing data
  this.contributionHistory = [];
  this.contributions = [];
  this.memberContributions = [];
  this.paidAmountInput = 0;
  
  this.localGroupId = to.params.groupId; 
  this.initializeGroupData()
    .finally(() => next());
}
}
};
</script>
