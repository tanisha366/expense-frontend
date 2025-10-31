import React from 'react';

const Dashboard = ({ expenses }) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Dashboard</h3>
      
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>₹{totalExpenses.toFixed(2)}</div>
          <div style={styles.statLabel}>Total Spent</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statValue}>{expenses.length}</div>
          <div style={styles.statLabel}>Total Expenses</div>
        </div>
      </div>

      {Object.keys(categoryTotals).length > 0 && (
        <div style={styles.categorySection}>
          <h4 style={styles.subHeading}>Spending by Category</h4>
          {Object.entries(categoryTotals).map(([category, amount]) => (
            <div key={category} style={styles.categoryItem}>
              <span style={styles.categoryName}>{category}</span>
              <span style={styles.categoryAmount}>₹{amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  heading: {
    marginBottom: '20px',
    color: '#333'
  },
  stats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px'
  },
  statCard: {
    flex: 1,
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff'
  },
  statLabel: {
    color: '#666',
    marginTop: '5px'
  },
  categorySection: {
    marginTop: '20px'
  },
  subHeading: {
    marginBottom: '15px',
    color: '#333'
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #eee'
  },
  categoryName: {
    fontWeight: '500'
  },
  categoryAmount: {
    fontWeight: 'bold',
    color: '#e74c3c'
  }
};

export default Dashboard;
