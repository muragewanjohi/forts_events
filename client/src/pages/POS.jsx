import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './POS.css';

export default function POS() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [tables, setTables] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [orderType, setOrderType] = useState('dine_in');
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, waitersRes, tablesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/users?role=waiter&active_only=true'),
        api.get('/tables/available')
      ]);
      setItems(itemsRes.data.filter(item => (item.stock_bar > 0 || item.stock_counter > 0)));
      setWaiters(waitersRes.data);
      setTables(tablesRes.data);
      if (waitersRes.data.length > 0) {
        setSelectedWaiter(waitersRes.data[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.item_id === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, { item_id: item.id, item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(c => c.item_id !== itemId));
    } else {
      setCart(cart.map(c => 
        c.item_id === itemId ? { ...c, quantity } : c
      ));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.item.cost_per_item * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedWaiter) {
      alert('Please select a waiter');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      alert('Please select a table for dine-in orders');
      return;
    }

    try {
      await api.post('/orders', {
        waiter_id: selectedWaiter,
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity })),
        order_type: orderType,
        table_id: orderType === 'dine_in' ? selectedTable : null
      });
      alert('Order placed successfully!');
      setCart([]);
      setSelectedTable(null);
      setOrderType('dine_in');
      // Reload available tables
      const tablesRes = await api.get('/tables/available');
      setTables(tablesRes.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Error placing order');
    }
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === 'takeaway') {
      setSelectedTable(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pos-page">
      <h1>Point of Sale</h1>

      <div className="pos-container">
        <div className="pos-left">
          <div className="order-config">
            <div className="waiter-selector">
              <label>Waiter:</label>
              <select 
                value={selectedWaiter || ''} 
                onChange={(e) => setSelectedWaiter(parseInt(e.target.value))}
              >
                {waiters.map(w => (
                  <option key={w.id} value={w.id}>{w.full_name}</option>
                ))}
              </select>
            </div>
            
            <div className="order-type-selector">
              <label>Order Type:</label>
              <div className="order-type-buttons">
                <button
                  className={orderType === 'dine_in' ? 'active' : ''}
                  onClick={() => handleOrderTypeChange('dine_in')}
                >
                  Dine In
                </button>
                <button
                  className={orderType === 'takeaway' ? 'active' : ''}
                  onClick={() => handleOrderTypeChange('takeaway')}
                >
                  Takeaway
                </button>
              </div>
            </div>

            {orderType === 'dine_in' && (
              <div className="table-selector">
                <label>Table:</label>
                <select 
                  value={selectedTable || ''} 
                  onChange={(e) => setSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a table</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number} ({t.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="items-grid">
            {items
              .filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map(item => (
              <button
                key={item.id}
                className="item-card"
                onClick={() => addToCart(item)}
              >
                <div className="item-name">{item.name}</div>
                <div className="item-price">KES {item.cost_per_item}</div>
                <div className="item-stock">
                  Bar: {item.stock_bar} | Counter: {item.stock_counter}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pos-right">
          <div className="cart">
            <h2>Cart</h2>
            {cart.length === 0 ? (
              <div className="cart-empty">Cart is empty</div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.item_id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.item.name}</div>
                        <div className="cart-item-price">
                          KES {item.item.cost_per_item} × {item.quantity} = 
                          KES {(item.item.cost_per_item * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <button onClick={() => updateQuantity(item.item_id, item.quantity - 1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.item_id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <div className="total-label">Total:</div>
                  <div className="total-amount">KES {getTotal().toFixed(2)}</div>
                </div>
                <button onClick={handlePlaceOrder} className="place-order-btn">
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

