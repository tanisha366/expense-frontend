import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [budget, setBudget] = useState(50000);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [notifications, setNotifications] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    description: ''
  });

  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Currency symbols
  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const response = await API.get('/expenses');
      setExpenses(response.data);
      showNotification('Expenses loaded successfully!', 'success');
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showNotification('Failed to load expenses!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add expense
  const addExpense = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      showNotification('Please fill title and amount!', 'error');
      return;
    }

    try {
      await API.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date()
      });
      setFormData({ title: '', amount: '', category: 'Food', description: '' });
      fetchExpenses();
      showNotification('Expense added successfully! 💰', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Error adding expense!', 'error');
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await API.delete(`/expenses/${id}`);
        fetchExpenses();
        showNotification('Expense deleted! 🗑️', 'success');
      } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Error deleting expense!', 'error');
      }
    }
  };

  // Export data
  const exportData = () => {
    const data = {
      expenses: expenses,
      summary: {
        totalExpenses: totalExpenses,
        totalTransactions: expenses.length,
        exportDate: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
  };

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      if (window.confirm('Really sure? All your expenses will be deleted permanently!')) {
        showNotification('Data cleared! (Demo feature)', 'success');
      }
    }
  };

  // Custom notifications
  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type} ${darkMode ? 'dark' : ''}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Calculations
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const budgetUsage = (totalExpenses / budget) * 100;
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Filtered expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Category styles
  const getCategoryStyle = (category) => {
    const styles = {
      Food: { color: '#FF6B6B', icon: '🍕', bg: '#FFF5F5', darkBg: '#2A1A1A' },
      Transport: { color: '#4ECDC4', icon: '🚗', bg: '#F0FFFD', darkBg: '#1A2A28' },
      Shopping: { color: '#45B7D1', icon: '🛍️', bg: '#F0F8FF', darkBg: '#1A242A' },
      Bills: { color: '#96CEB4', icon: '📄', bg: '#F8FFF9', darkBg: '#1A2A21' },
      Entertainment: { color: '#FECA57', icon: '🎬', bg: '#FFFBF0', darkBg: '#2A241A' },
      Healthcare: { color: '#CF9FFF', icon: '🏥', bg: '#F9F3FF', darkBg: '#2A1A2A' },
      Education: { color: '#FF9FF3', icon: '📚', bg: '#FFF0FC', darkBg: '#2A1A27' },
      Other: { color: '#778BEB', icon: '📦', bg: '#F8F9FF', darkBg: '#1A1F2A' }
    };
    return styles[category] || { color: '#999', icon: '📌', bg: '#F8F9FA', darkBg: '#2A2A2A' };
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // Render different tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'expenses':
        return renderExpenses();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <motion.div
      key="dashboard"
      className="content-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* Add Expense Card */}
      <motion.div variants={itemVariants} className="card glass">
        <div className="card-header">
          <h3 className="card-title">💎 Add New Expense</h3>
          <div className="card-badge">Quick Add</div>
        </div>
        <form onSubmit={addExpense} className="form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Dinner with friends, Uber ride..."
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input modern-input"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="input modern-input"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="select modern-select"
              >
                <option value="Food">🍕 Food & Dining</option>
                <option value="Transport">🚗 Transport</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Bills">📄 Bills & Utilities</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Healthcare">🏥 Healthcare</option>
                <option value="Education">📚 Education</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <textarea
              placeholder="Add a note (optional)..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="textarea modern-textarea"
              rows="2"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="add-button modern-button"
          >
            <span>✨ Add Expense</span>
          </motion.button>
        </form>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="card glass">
        <div className="card-header">
          <h3 className="card-title">📈 Financial Overview</h3>
        </div>
        
        <div className="stats-grid">
          <motion.div 
            className="stat-card primary"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{currencySymbols[currency]}{totalExpenses.toFixed(2)}</div>
              <div className="stat-label">Total Spent</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card secondary"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{currencySymbols[currency]}{(budget - totalExpenses).toFixed(2)}</div>
              <div className="stat-label">Remaining</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="stat-card accent"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">{expenses.length}</div>
              <div className="stat-label">Transactions</div>
            </div>
          </motion.div>
        </div>

        {/* Budget Progress */}
        <div className="budget-section">
          <div className="budget-header">
            <span>Monthly Budget Progress</span>
            <span className="budget-percentage">{budgetUsage.toFixed(1)}%</span>
          </div>
          <div className="progress-container">
            <motion.div 
              className="progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUsage, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                background: budgetUsage > 80 
                  ? 'linear-gradient(135deg, #FF6B6B, #C44D58)'
                  : budgetUsage > 60
                  ? 'linear-gradient(135deg, #FECA57, #E67E22)'
                  : 'linear-gradient(135deg, #4ECDC4, #44A08D)'
              }}
            ></motion.div>
          </div>
        </div>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div variants={itemVariants} className="card glass full-width">
        <div className="card-header">
          <h3 className="card-title">🔥 Recent Expenses</h3>
          <div className="controls">
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input modern-search"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select modern-select"
            >
              <option value="All">All Categories</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {filteredExpenses.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="empty-icon">💸</div>
              <p className="empty-text">No expenses found</p>
              <p className="empty-subtext">
                {searchTerm || filterCategory !== 'All' 
                  ? 'Try changing your search or filter' 
                  : 'Add your first expense to get started!'}
              </p>
            </motion.div>
          ) : (
            <div className="expenses-list">
              <AnimatePresence>
                {filteredExpenses.slice(0, 5).map((expense, index) => {
                  const categoryStyle = getCategoryStyle(expense.category);
                  return (
                    <motion.div
                      key={expense._id}
                      className="expense-item modern-item"
                      variants={itemVariants}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: darkMode 
                          ? '0 8px 25px rgba(0,0,0,0.3)'
                          : '0 8px 25px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="expense-left">
                        <div 
                          className="category-badge"
                          style={{
                            background: darkMode ? categoryStyle.darkBg : categoryStyle.bg,
                            color: categoryStyle.color
                          }}
                        >
                          <span className="category-icon">{categoryStyle.icon}</span>
                        </div>
                        <div className="expense-info">
                          <div className="expense-title">{expense.title}</div>
                          {expense.description && (
                            <div className="expense-desc">{expense.description}</div>
                          )}
                          <div className="expense-meta">
                            <span className="expense-category">{expense.category}</span>
                            <span className="expense-date">
                              {new Date(expense.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="expense-right">
                        <div className="amount">{currencySymbols[currency]}{expense.amount.toFixed(2)}</div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteExpense(expense._id)}
                          className="delete-btn modern-delete"
                          title="Delete expense"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  const renderExpenses = () => (
    <motion.div
      key="expenses"
      className="expenses-tab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="card glass">
        <div className="card-header">
          <h3 className="card-title">💰 All Expenses</h3>
          <div className="expenses-controls">
            <input
              type="text"
              placeholder="Search all expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input modern-search"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select modern-select"
            >
              <option value="All">All Categories</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportData}
              className="export-button modern-button"
            >
              📥 Export Data
            </motion.button>
          </div>
        </div>

        <div className="expenses-table">
          {filteredExpenses.map((expense, index) => {
            const categoryStyle = getCategoryStyle(expense.category);
            return (
              <motion.div
                key={expense._id}
                className="expense-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="row-category">
                  <div 
                    className="category-indicator"
                    style={{ backgroundColor: categoryStyle.color }}
                  ></div>
                  {categoryStyle.icon} {expense.category}
                </div>
                <div className="row-title">{expense.title}</div>
                <div className="row-date">
                  {new Date(expense.date).toLocaleDateString()}
                </div>
                <div className="row-amount">{currencySymbols[currency]}{expense.amount.toFixed(2)}</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteExpense(expense._id)}
                  className="row-delete"
                >
                  🗑️
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  const renderAnalytics = () => (
    <motion.div
      key="analytics"
      className="analytics-tab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="analytics-grid">
        <div className="card glass">
          <h3 className="card-title">📊 Category Distribution</h3>
          <div className="category-breakdown">
            {Object.entries(categoryTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount], index) => {
                const categoryStyle = getCategoryStyle(category);
                const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                
                return (
                  <motion.div
                    key={category}
                    className="category-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="category-header">
                      <div className="category-left">
                        <div 
                          className="category-dot"
                          style={{ backgroundColor: categoryStyle.color }}
                        ></div>
                        <span className="category-name">{category}</span>
                      </div>
                      <span className="category-amount">{currencySymbols[currency]}{amount.toFixed(2)}</span>
                    </div>
                    <div className="progress-container small">
                      <motion.div 
                        className="progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        style={{ backgroundColor: categoryStyle.color }}
                      ></motion.div>
                    </div>
                    <div className="percentage">{percentage}%</div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        <div className="card glass">
          <h3 className="card-title">📈 Monthly Insights</h3>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon">💰</span>
              <div className="insight-content">
                <div className="insight-title">Average Daily Spend</div>
                <div className="insight-value">{currencySymbols[currency]}{(totalExpenses / 30).toFixed(2)}</div>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">🎯</span>
              <div className="insight-content">
                <div className="insight-title">Budget Utilization</div>
                <div className="insight-value">{budgetUsage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">📅</span>
              <div className="insight-content">
                <div className="insight-title">Transactions This Month</div>
                <div className="insight-value">{expenses.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div
      key="settings"
      className="settings-tab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="settings-grid">
        <div className="card glass">
          <h3 className="card-title">⚙️ App Settings</h3>
          <div className="setting-item">
            <label>Theme Mode</label>
            <div className="theme-toggle-group">
              <button
                className={`theme-option ${!darkMode ? 'active' : ''}`}
                onClick={() => setDarkMode(false)}
              >
                ☀️ Light
              </button>
              <button
                className={`theme-option ${darkMode ? 'active' : ''}`}
                onClick={() => setDarkMode(true)}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label>Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="modern-select"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Monthly Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="modern-input"
              min="0"
            />
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              Enable Notifications
            </label>
          </div>
        </div>

        <div className="card glass">
          <h3 className="card-title">📤 Data Management</h3>
          <div className="data-actions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportData}
              className="data-button export"
            >
              📥 Export All Data
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showNotification('Backup created successfully!', 'success')}
              className="data-button backup"
            >
              💾 Create Backup
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAllData}
              className="data-button danger"
            >
              🗑️ Clear All Data
            </motion.button>
          </div>
        </div>

        <div className="card glass">
          <h3 className="card-title">ℹ️ App Information</h3>
          <div className="app-info">
            <div className="info-item">
              <span>Version</span>
              <span>2.0.0</span>
            </div>
            <div className="info-item">
              <span>Total Expenses</span>
              <span>{expenses.length}</span>
            </div>
            <div className="info-item">
              <span>Data Size</span>
              <span>{(JSON.stringify(expenses).length / 1024).toFixed(2)} KB</span>
            </div>
            <div className="info-item">
              <span>Last Updated</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`loading-screen ${darkMode ? 'dark' : ''}`}>
        <motion.div
          className="loader"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          💸
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Loading your financial dashboard...
        </motion.p>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {/* Animated Background */}
      <div className="animated-bg"></div>
      
      {/* Header */}
      <motion.header 
        className="header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <motion.div 
            className="logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="logo-icon">💰</span>
            <h1 className="title">MoneyMagnet</h1>
          </motion.div>
          
          <div className="header-controls">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </motion.button>

            <div className="budget-setter">
              <span>Budget: {currencySymbols[currency]}</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="budget-input"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <motion.nav 
        className="tabs"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {['dashboard', 'expenses', 'analytics', 'settings'].map(tab => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'expenses' && '💰 Expenses'}
            {tab === 'analytics' && '📈 Analytics'}
            {tab === 'settings' && '⚙️ Settings'}
          </motion.button>
        ))}
      </motion.nav>

      <div className="container">
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
