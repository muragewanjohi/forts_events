import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './POS.css';

export default function POS() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const printReceipt = (orderData) => {
    // Get table number from order data or from tables list
    const tableNumber = orderData.table_number || (selectedTable ? tables.find(t => t.id === selectedTable)?.table_number : null);
    const selectedWaiterData = waiters.find(w => w.id === selectedWaiter);
    
    // Use order items if available, otherwise use cart data
    const receiptItems = orderData.items && orderData.items.length > 0
      ? orderData.items.map(item => ({
          name: item.item_name || item.name,
          quantity: item.quantity,
          price: item.price || item.cost_per_item
        }))
      : cart.map(item => ({
          name: item.item.name,
          quantity: item.quantity,
          price: item.item.cost_per_item
        }));
    
    // Create receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${orderData.order_number}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10mm;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10mm;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .receipt-info {
              margin: 10px 0;
            }
            .receipt-info-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .receipt-items {
              margin: 15px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
            }
            .receipt-item-name {
              flex: 1;
            }
            .receipt-item-qty {
              margin: 0 10px;
            }
            .receipt-item-price {
              text-align: right;
              min-width: 60px;
            }
            .receipt-total {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px dashed #000;
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: bold;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <div class="receipt-title">EVENTS POS SYSTEM</div>
            <div>Order Receipt</div>
          </div>
          
          <div class="receipt-info">
            <div class="receipt-info-row">
              <span>Order #:</span>
              <span><strong>${orderData.order_number}</strong></span>
            </div>
            <div class="receipt-info-row">
              <span>Date:</span>
              <span>${new Date(orderData.created_at).toLocaleString()}</span>
            </div>
            <div class="receipt-info-row">
              <span>Type:</span>
              <span><strong>${orderType === 'dine_in' ? `Table ${tableNumber || 'N/A'}` : 'TAKEOUT'}</strong></span>
            </div>
            <div class="receipt-info-row">
              <span>Waiter:</span>
              <span>${selectedWaiterData?.full_name || 'N/A'}</span>
            </div>
          </div>
          
          <div class="receipt-items">
            ${receiptItems.map(item => `
              <div class="receipt-item">
                <div class="receipt-item-name">${item.name}</div>
                <div class="receipt-item-qty">${item.quantity}x</div>
                <div class="receipt-item-price">KES ${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="receipt-total">
            <span>TOTAL:</span>
            <span>KES ${(orderData.total_amount || getTotal()).toFixed(2)}</span>
          </div>
          
          <div class="receipt-footer">
            <div>Thank you for your order!</div>
            <div>${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window. Please allow popups for this site.');
      return;
    }
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    const printAfterLoad = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (optional, with delay)
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 250);
    };
    
    // Handle both onload event and immediate execution
    if (printWindow.document.readyState === 'complete') {
      printAfterLoad();
    } else {
      printWindow.onload = printAfterLoad;
    }
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
      const response = await api.post('/orders', {
        waiter_id: selectedWaiter,
        items: cart.map(c => ({ item_id: c.item_id, quantity: c.quantity })),
        order_type: orderType,
        table_id: orderType === 'dine_in' ? selectedTable : null
      });
      
      const orderData = response.data;
      
      // Print receipt
      printReceipt(orderData);
      
      // Clear cart and reset form
      setCart([]);
      setSelectedTable(null);
      setOrderType('dine_in');
      
      // Reload available tables
      const tablesRes = await api.get('/tables/available');
      setTables(tablesRes.data);
      
      // Navigate to orders page after a short delay to allow print dialog to appear
      setTimeout(() => {
        navigate('/orders');
      }, 500);
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error placing order';
      alert(errorMessage);
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

