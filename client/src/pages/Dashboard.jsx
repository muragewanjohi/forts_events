import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    todaySales: 0,
    pendingOrders: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [ordersRes, pendingRes, lowStockRes] = await Promise.all([
        api.get(`/orders?start_date=${today}`),
        api.get('/orders?status=pending'),
        api.get('/inventory/reports/low-stock?threshold=10')
      ]);

      const todayOrders = ordersRes.data.filter(o => o.status === 'completed');
      const todaySales = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({
        todayOrders: todayOrders.length,
        todaySales,
        pendingOrders: pendingRes.data.length,
        lowStock: lowStockRes.data.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.todayOrders}</div>
            <div className="stat-label">Today's Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">KES {stats.todaySales.toLocaleString()}</div>
            <div className="stat-label">Today's Sales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      </div>
    </div>
  );
}

