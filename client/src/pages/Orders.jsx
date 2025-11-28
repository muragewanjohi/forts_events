import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './Orders.css';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_status: 'paid',
    payment_method: 'cash',
    mpesa_reference: ''
  });
  const socket = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
    
    if (socket) {
      socket.on('order:new', handleNewOrder);
      socket.on('order:updated', handleOrderUpdate);
      
      return () => {
        socket.off('order:new', handleNewOrder);
        socket.off('order:updated', handleOrderUpdate);
      };
    }
  }, [socket, user]);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = (order) => {
    // If user is a waiter, only show their own orders
    if (user?.role === 'waiter' && order.waiter_id !== user.id) {
      return;
    }
    setOrders(prev => [order, ...prev]);
  };

  const handleOrderUpdate = (updatedOrder) => {
    // If user is a waiter, only show updates to their own orders
    if (user?.role === 'waiter' && updatedOrder.waiter_id !== user.id) {
      return;
    }
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      loadOrders();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error updating order status';
      alert(errorMessage);
      console.error('Order update error:', error);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, payment_status) => {
    try {
      // If setting to paid, show payment form
      if (payment_status === 'paid') {
        setEditingPayment(orderId);
        setPaymentData({
          payment_status: 'paid',
          payment_method: 'cash',
          mpesa_reference: ''
        });
        return;
      }
      
      // For other statuses, update directly
      await api.patch(`/orders/${orderId}/payment-status`, { payment_status });
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating payment status');
    }
  };

  const handleSubmitPayment = async (orderId) => {
    try {
      const { payment_status, payment_method, mpesa_reference } = paymentData;
      
      if (payment_method === 'mpesa' && !mpesa_reference.trim()) {
        alert('Please enter M-Pesa reference number');
        return;
      }

      await api.patch(`/orders/${orderId}/payment-status`, {
        payment_status,
        payment_method,
        mpesa_reference: payment_method === 'mpesa' ? mpesa_reference : null
      });
      
      setEditingPayment(null);
      setPaymentData({ payment_status: 'paid', payment_method: 'cash', mpesa_reference: '' });
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating payment status');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'completed' });
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Error completing order');
    }
  };

  const handleMarkPaid = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/mark-paid`);
      loadOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Error marking order as paid');
    }
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const paymentMatch = paymentFilter === 'all' || order.payment_status === paymentFilter;
    return statusMatch && paymentMatch;
  });

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        <div className="filters">
          <div className="filter-group">
            <label>Order Status:</label>
            <div className="filter-tabs">
              <button 
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button 
                className={statusFilter === 'pending' ? 'active' : ''}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={statusFilter === 'preparing' ? 'active' : ''}
                onClick={() => setStatusFilter('preparing')}
              >
                Preparing
              </button>
              <button 
                className={statusFilter === 'ready' ? 'active' : ''}
                onClick={() => setStatusFilter('ready')}
              >
                Ready
              </button>
              <button 
                className={statusFilter === 'completed' ? 'active' : ''}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Payment Status:</label>
            <div className="filter-tabs">
              <button 
                className={paymentFilter === 'all' ? 'active' : ''}
                onClick={() => setPaymentFilter('all')}
              >
                All
              </button>
              <button 
                className={paymentFilter === 'pending' ? 'active' : ''}
                onClick={() => setPaymentFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={paymentFilter === 'paid' ? 'active' : ''}
                onClick={() => setPaymentFilter('paid')}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-number">{order.order_number}</div>
                  <div className="order-waiter">Waiter: {order.waiter_name}</div>
                  <div className="order-table">
                    {order.order_type === 'takeaway' ? (
                      <span className="takeaway-badge">Takeaway</span>
                    ) : order.table_number ? (
                      <span className="table-badge">Table {order.table_number}</span>
                    ) : (
                      <span>Dine In</span>
                    )}
                  </div>
                </div>
                <div className="order-status-badges">
                  <span className={`status order-status ${order.status}`}>
                    {order.status}
                  </span>
                  <span className={`status payment-status ${order.payment_status}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
              
              <div className="order-items">
                {order.items?.map(item => (
                  <div key={item.id} className="order-item">
                    <span>{item.item_name} × {item.quantity}</span>
                    <span>KES {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-info">
                  <div className="order-total">
                    Total: KES {order.total_amount?.toFixed(2)}
                  </div>
                  {order.payment_method && (
                    <div className="order-payment">
                      Payment: {order.payment_method.toUpperCase()}
                      {order.mpesa_reference && ` (Ref: ${order.mpesa_reference})`}
                    </div>
                  )}
                </div>
                <div className="order-actions">
                  {/* Order Status Update - Waiters can update to preparing/ready */}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      {user?.role === 'waiter' ? (
                        // Waiters can only update to preparing or ready
                        ['pending', 'preparing'].includes(order.status) && (
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                          </select>
                        )
                      ) : (
                        // Admins/cashiers can update to any status
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}
                    </>
                  )}

                  {/* Payment Status Update */}
                  {editingPayment === order.id ? (
                    <div className="payment-form">
                      <select
                        value={paymentData.payment_method}
                        onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value, mpesa_reference: '' })}
                        className="payment-method-select"
                      >
                        <option value="cash">Cash</option>
                        <option value="mpesa">M-Pesa</option>
                      </select>
                      {paymentData.payment_method === 'mpesa' && (
                        <input
                          type="text"
                          placeholder="M-Pesa Reference"
                          value={paymentData.mpesa_reference}
                          onChange={(e) => setPaymentData({ ...paymentData, mpesa_reference: e.target.value })}
                          className="mpesa-reference-input"
                        />
                      )}
                      <button
                        onClick={() => handleSubmitPayment(order.id)}
                        className="submit-payment-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPayment(null);
                          setPaymentData({ payment_status: 'paid', payment_method: 'cash', mpesa_reference: '' });
                        }}
                        className="cancel-payment-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {order.payment_status === 'pending' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                          className="mark-paid-btn"
                        >
                          Mark Paid
                        </button>
                      )}
                      {order.payment_status === 'paid' && order.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="complete-order-btn"
                        >
                          Complete Order
                        </button>
                      )}
                      {order.payment_status !== 'pending' && user?.role !== 'waiter' && (
                        <select
                          value={order.payment_status}
                          onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                          className="payment-status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

