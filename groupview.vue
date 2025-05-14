<template>
  <navigation/>

  <div class="con">
    <div class="nav-con">
      <h1>Group Expenses</h1>
    </div>

    <button @click="showGroupModal = true" class="show-groups-button">
      <i class="fas fa-users"></i> View Your Groups
    </button>

    <!-- Group List Modal -->
    <div v-if="showGroupModal" class="group-modal-overlay">
      <div class="group-modal">
        <div class="group-modal-header">
          <h3>Your Groups</h3>
          <button @click="showGroupModal = false" class="close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="group-modal-content">
          <div v-if="userGroupsLoading" class="loading-groups">
            <div class="spinner small"></div>
            <span>Loading your groups...</span>
          </div>
          
          <div v-else-if="userGroupsError" class="error-message">
            {{ userGroupsError }}
            <button @click="fetchUserGroups" class="retry-btn">Retry</button>
          </div>
          
          <div v-else-if="userGroups.length === 0" class="no-groups">
            <p>You don't have any groups yet.</p>
            <button @click="goToGroupManagement" class="create-group-btn">
              <i class="fas fa-plus"></i> Create Group
            </button>
          </div>
          
          <div v-else class="groups-list">
  <div 
    v-for="group in userGroups" 
    :key="group.id" 
    class="group-item"
    @click="navigateToGroup(group.id)"
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
    </div>

    <div class="con-container">

      <div v-if="currentView === 'view'" class="budget-section">
        <div class="content-wrapper">
          <!-- Filter Buttons -->
          <div class="filter-buttons">
            <button @click="filterExpenses('Food')" :class="{ active: filterCategory === 'Food' }">Food</button>
            <button @click="filterExpenses('Bill')" :class="{ active: filterCategory === 'Bill' }">Bill</button>
            <button @click="filterExpenses('Transportation')" :class="{ active: filterCategory === 'Transportation' }">Transportation</button>
            <button @click="filterExpenses('Entertainment')" :class="{ active: filterCategory === 'Entertainment' }">Entertainment</button>
            <button @click="filterExpenses('Healthcare')" :class="{ active: filterCategory === 'Healthcare' }">Healthcare</button>
            <button @click="filterExpenses('Shopping')" :class="{ active: filterCategory === 'Shopping' }">Shopping</button>
            <button @click="filterExpenses('Other')" :class="{ active: filterCategory === 'Other' }">Other</button>
            <button @click="filterExpenses('All')" :class="{ active: filterCategory === 'All' }">View All</button>
          </div>

          <!-- Expense Table -->
          <div class="expense-table">
            <h3>
              <span class="category-label">({{ filterCategory === 'All' ? 'All Categories' : filterCategory === 'Other' ? 'Other Categories' : filterCategory }})</span>
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredExpenses.length === 0">
                  <td colspan="4" class="no-expenses-message">
                    NO EXPENSES
                  </td>
                </tr>
                <tr 
                  v-for="(expense, index) in filteredExpenses" 
                  v-else
                  :key="expense.id" 
                  :class="{'alternate-row': index % 2 !== 0}"
                >
                  <td>{{ expense.category }}</td>
                  <td>{{ expense.name }}</td>
                  <td>{{ formatCurrency(expense.amount) }}</td>
                  <td>{{ expense.date }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Display Total Amount -->
          <div class="total-amount">
            <p>Total: {{ formatCurrency(totalAmount) }} ({{ formatUsd(totalAmount) }})</p>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-summary">
      <div class="chart">
        <pie-chart :data="chartData" 
                  :options="chartOptions" 
                  style="height: 200px;"/>
        
        <!-- Download button -->
        <div class="download">
          <button class="download-button" @click="generatePDF">Download Report</button>
        </div>
      </div>

      <div class="summary-box">
        <h3>Budget Summary</h3>
        <div class="summary-item">
          <span>Total Expenses:</span>
          <span>{{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from "./navigation.vue"; 
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mapGetters, mapActions } from 'vuex';

ChartJS.register(
  Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, 
  ChartDataLabels 
);

export default {
  components: {
    Navigation,
    PieChart: Pie,
  },
  data() {
    return {
      showGroupList: false,
      userGroups: [],
      userGroupsLoading: false,
      userGroupsError: null,
      showGroupModal: false,
      currentView: 'view', 
      filterCategory: 'All',
      chartOptions: {
        responsive: true,
        plugins: {
          datalabels: {
            formatter: (value, context) => {
              const dataset = context.chart.data.datasets[0].data;
              const total = dataset.reduce((sum, val) => sum + val, 0);
              const percentage = (value / total * 100);
              
              if (percentage > 0) {
                return percentage.toFixed(1) + '%';
              }
              return null;
            },
            color: '#000',
            font: function(context) {
              const dataset = context.chart.data.datasets[0].data;
              const total = dataset.reduce((sum, val) => sum + val, 0);
              const percentage = (dataset[context.dataIndex] / total * 100);
              
              return {
                weight: 'bold',
                size: percentage < 5 ? 10 : 12
              };
            },
            anchor: 'center',
            align: 'center',
            offset: 0,
            padding: 0
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return tooltipItem.label + ': ₱' + tooltipItem.raw.toFixed(2);
              },
            },
          },
        }
      },
    };
  },

  computed: {
    ...mapGetters('group', ['getViewExpenses']),
    
    usdExchangeRate() {
      return this.$store.state.usdExchangeRate || 0.018045;
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
    
    chartData() {
      const categoryCounts = {
        Food: 0,
        Bill: 0,
        Transportation: 0,
        Entertainment: 0,
        Healthcare: 0,
        Shopping: 0,
        Other: 0,
      };

      this.filteredExpenses.forEach(expense => {
        const category = expense.category === 'HealthCare' ? 'Healthcare' : expense.category; 
        if (category in categoryCounts) {
          categoryCounts[category] += expense.amount;
        } else {
          categoryCounts.Other += expense.amount;
        }
      });

      return {
        labels: Object.keys(categoryCounts),
        datasets: [{
          label: 'Expense Categories',
          data: Object.values(categoryCounts),
          backgroundColor: [
            '#c5fdfa', '#febee9', '#c9d1fd', '#f5fda3', 
            '#ecbefe', '#c7fbc5', '#feadad', '#adb5fe'
          ],
          borderColor: [
            '#a0f0eb', '#fba9dc', '#a9b3f0', '#e3f484', 
            '#d3a9f5', '#a9e9a7', '#f98b8b', '#8f9ff0'  
          ],
          borderWidth: 1,
        }]
      };
    },

    filteredExpenses() {
      let expenses = this.expenses;
      
      if (this.filterCategory && this.filterCategory !== 'All') {
        expenses = expenses.filter(expense => {
          if (this.filterCategory.toLowerCase() === 'other') {
            const isStandardCategory = [
              'food', 'bill', 'transportation', 
              'entertainment', 'healthcare', 'shopping'
            ].includes(expense.category?.toLowerCase());
            return !isStandardCategory;
          } else {
            const expenseCategory = expense.category ? expense.category.trim().toLowerCase() : '';
            const filterCategory = this.filterCategory ? this.filterCategory.trim().toLowerCase() : '';
            return expenseCategory === filterCategory;
          }
        });
      }

      return expenses;
    },

    totalAmount() {
      return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }
  },

  created() {
    this.fetchViewExpenses();
    this.fetchExchangeRate();
    this.fetchUserGroups();
  },

  methods: {
    ...mapActions(['fetchViewExpenses', 'fetchExchangeRate']),
    
    formatUsd(value) {
      const rate = this.$store.state.usdExchangeRate || 0.018045;
      const usdAmount = parseFloat(value) * rate;
      return `$${usdAmount.toFixed(2)}`;
    },

    filterExpenses(category) {
      this.filterCategory = category;
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

    formatDate(dateString) {
      if (!dateString) return '';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },

    async fetchUserGroups() {
      this.userGroupsLoading = true;
      this.userGroupsError = null;
      try {
        const response = await this.$axios.get('/api/grp_expenses/my-groups', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jsontoken')}`
          }
        });
        
        if (response.data.success) {
          this.userGroups = response.data.data;
        } else {
          this.userGroupsError = response.data.message || 'Failed to load groups';
        }
      } catch (err) {
        this.userGroupsError = err.response?.data?.message || 'Failed to load groups';
        console.error('Failed to fetch user groups:', err);
      } finally {
        this.userGroupsLoading = false;
      }
    },

    toggleGroupList() {
      this.showGroupList = !this.showGroupList;
      if (this.showGroupList && this.userGroups.length === 0) {
        this.fetchUserGroups();
      }
    },
    
    navigateToGroup(groupId) {
      this.$router.push(`/group/${groupId}`);
    },
    
    goToGroupManagement() {
      this.$router.push('/GC');
    },

    async generatePDF() {
      try {
        const doc = new jsPDF();
        
        // Title 
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Report', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        let filterText = this.filterCategory === 'All' ? 'All Categories' : this.filterCategory;
        doc.text(`Filter: ${filterText}`, 105, 30, { align: 'center' });
        
        // Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Expenses: ${this.formatCurrency(this.totalAmount)}`, 105, 45, { align: 'center' });
        
        // Prepare table data
        const tableData = this.filteredExpenses.map(expense => [
          expense.date,
          expense.category,
          expense.name,
          this.formatCurrency(expense.amount)
        ]);
        
        // Add expense table
        autoTable(doc, {
          head: [['Date', 'Category', 'Description', 'Amount']],
          body: tableData,
          startY: 60, 
          margin: { left: 10, right: 10 },
          styles: {
            cellPadding: 4, 
            fontSize: 9,
            halign: 'left',
            valign: 'middle',
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Date
            1: { cellWidth: 25 }, // Category
            2: { cellWidth: 'auto' },
            3: { cellWidth: 25 } // Amount
          },
          headStyles: {
            fillColor: [76, 175, 80],
            textColor: 255,
            fontStyle: 'bold'
          }
        });
        
        doc.save('expense-report.pdf');
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  }
};
</script>

<style scoped>
.show-groups-button {
  display: block;
  width: 100%;
  margin: 20px 30px;
  padding: 15px 30px; /* Increased padding for a bigger button */
  background: linear-gradient(135deg, #28a745, #34d399); /* Green gradient */
  color: white;
  border: none;
  border-radius: 8px; /* More rounded corners for a smoother look */
  font-size: 1.2rem; /* Larger font size for better readability */
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease; /* Smooth transition for hover */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
}

.show-groups-button:hover {
  background: linear-gradient(135deg, #34d399, #28a745); /* Darker green gradient on hover */
  transform: translateY(-2px); /* Slight movement effect to indicate interaction */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); /* Stronger shadow on hover for depth */
}

.show-groups-button i {
  margin-right: 12px; /* Increased space between icon and text */
  transition: transform 0.3s ease; /* Smooth icon transition */
}

.show-groups-button:hover i {
  transform: rotate(15deg); /* Slight rotation effect on hover for the icon */
}

/* Modal Styles */
.group-modal-overlay {
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

.group-modal {
  background-color: #ffffff;
  border-radius: 12px;
  width: 85%;
  max-width: 480px;
  max-height: 60vh; /* Slightly smaller height */
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #BBD8A3 transparent; /* Firefox */
}

/* Custom Scrollbar for Webkit */
.group-modal::-webkit-scrollbar {
  width: 6px;
}
.group-modal::-webkit-scrollbar-track {
  background: transparent;
}
.group-modal::-webkit-scrollbar-thumb {
  background-color: #537D5D;
  border-radius: 8px;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #d3d3d3;
  background-color: #BBD8A3;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
}

.group-modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: #5c5c5c;
}

.close-modal {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #5c5c5c;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 50%;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.close-modal:hover {
  background-color: #d0f0c0;
  transform: scale(1.1);
}

.group-modal-content {
  padding: 18px;
  background-color: #fafafa;
}

.groups-list {
  padding: 10px;
  background-color: #f9f9f9;
}

.group-item {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
}

.group-item:hover {
  background-color: #e0f7e5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.group-info h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #2f6f45;
}

.group-meta {
  margin-top: 4px;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.group-meta i {
  margin-right: 6px;
  color: #537D5D;
}
.group-actions {
  font-size: 1.2rem;
  color: #537D5D;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}
.group-item:hover .group-actions {
  transform: translateX(4px);
}
.no-expenses-message {
  justify-content: center;
  align-items: center;
  padding: 20px;
  text-align: center;
  font-style: italic;
  font-size: 22px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.no-expenses-message {
  justify-content: center;   
  align-items: center;                 
  padding: 20px;
  text-align: center;
  font-style: italic;
  font-size: 23px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 10px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.no-expenses-message {
  animation: fadeIn 0.5s ease-in-out;
}


.text-danger {
  color: #ffffff;
  font-weight: bold;
  font-size: 25px;
}

.exceeded-warning {
  margin-top: 0px !important;
  background-color: #e53935;
  border-left: 6px solid #b71c1c;
  border-right: 6px solid #b71c1c;
  padding: 14px 20px;
  margin: 20px auto; /* vertically space + center horizontally */
  margin-inline: 30px; 
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #ffffff;
  font-size: 20px;
  text-align: center;
  width: 100%; 
  box-sizing: border-box;
}



.summary-box {
  padding: 2px 16px 6px 16px; 
  background-color: #99da99;
  border: 2px solid #1e3731;
  border-radius: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  font-size: 16px;
  margin: 2px 0 6px 0; 
  text-align: center;
  color: #000000;
  min-width: 280px;
  max-width: 100%;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  font-size: 16px; /* Smaller font */
  font-weight: bold;
}

.summary-item.remaining {
  padding-top: 5px;
  border-top: 1px solid #eee;
  margin-top: 8px;
}

.negative {
  color: #e74c3c;
  font-weight: 500;
}

.con {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap; /* Optional: stack on small screens */
  gap: 10px;
}

.nav-con {
font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
font-size: 20px;
position: relative;
margin-top: 120px;
display: flex;
justify-content: center;
margin-bottom: -10px;
width: 100%;
}


button {
  border-radius: 8px;
  padding: 12px 20px;
  position: relative;
  font-size: 20px;
  border: 2px solid #386233;
  background-color: #fffef5;
  cursor: pointer;
  transition: 0.3s ease;
}

button.active {
  background-color: #2a4935;
  color: white;
}

button:hover {
  background-color: #2a4935;
  color: white;
}

.budget-section {
  text-align: center;
  margin-top: 20px;
  min-height: 654px;
}

.budget-section h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.budget-section p {
  font-size: 24px;
  color: red;
}

.con-container {
  background: rgb(216, 248, 216);
  border: 2px solid #336333;
  border-radius: 20px;
  width: 70%; 
  min-width: 380px;
  max-width: 900px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  align-items: flex-start;
  margin-bottom: 10px;
  overflow-y: auto; /* Enables vertical scrolling when needed */
  max-height: 105vh; /* Limits height to 80% of viewport height */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: #2a4935 #ecfcec; /* For Firefox */
}

/* For Chrome/Edge/Safari */
.con-container::-webkit-scrollbar {
  width: 8px;
}

.con-container::-webkit-scrollbar-track {
  background: #ecfcec;
  border-radius: 0 20px 20px 0;
}

.con-container::-webkit-scrollbar-thumb {
  background-color: #2a4935;
  border-radius: 20px;
}

/* Filter Buttons Styling */
.filter-buttons button {
  position: relative;
  padding: 8px;
  margin: 3px;
  border-radius: 1px;
  background-color: #ffffff;
  border: 2px solid #336333;
  transition: all 0.3s ease;
  font-size: 15px;
  border-radius: 6px;
}

.filter-buttons button.active {
  background-color: #2a4935;
  color: white;
  border-color: #2a4935;
}

.filter-buttons button:hover {
  background-color: #2a4935;
}

/* Expense Table Styling */
.expense-table table {
  position: relative;
  width: 90%;
  justify-self: center;
  margin-top: 20px;
  border-collapse: collapse;
  table-layout: fixed;
}

.expense-table th, .expense-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #000000;
  vertical-align: top;
  word-break: break-word; 
}

.expense-table th {
  background-color: #2a4935;
  color: white;
}

.expense-table tr {
  background-color: white;
}

/* Alternate Row Color */
.expense-table tr.alternate-row {
  background-color: #fffef5;
}

/* Total Amount Styling */
.total-amount {
  margin-top: 20px;
  font-weight: bold;
}

.chart{
  width: 380px;
  padding: 20px;
  box-sizing: border-box;
  background: #ecfcec;
  border-radius: 20px;
  max-height: 600px;
  border: 2px solid #336333;
  margin-bottom: 10px;
}
.download {
  display: flex;
  flex-wrap: wrap;
  justify-content: center; 
  align-items: center; 
  margin-top: 10px;
  gap: 10px;
}

.download select {
  width: 100px; /* Smaller width */
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
}

.download-button {
display: flex;
flex-wrap: wrap;
padding: 10px 20px;
font-size: 16px;
background-color: #2a4935;
color: white;
border: none;
cursor: pointer;
align-self: center;
margin-bottom: 8px;
margin-left: 3px;
}

.download-button:hover {
background-color: #1e3731;
}

</style> 
