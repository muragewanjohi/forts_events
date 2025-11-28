import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Transfers.css';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [items, setItems] = useState([]);
  const [sourceLocations, setSourceLocations] = useState([]);
  const [destinationLocations, setDestinationLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transfersRes, itemsRes, sourcesRes, destinationsRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/inventory'),
        api.get('/locations/sources'),
        api.get('/locations/destinations')
      ]);
      setTransfers(transfersRes.data);
      setItems(itemsRes.data.filter(item => item.stock_main_store > 0));
      setSourceLocations(sourcesRes.data);
      setDestinationLocations(destinationsRes.data);
      
      // Set default from_location_id if available
      if (sourcesRes.data.length > 0 && !formData.from_location_id) {
        setFormData(prev => ({ ...prev, from_location_id: sourcesRes.data[0].id }));
      }
      // Set default to_location_id if available
      if (destinationsRes.data.length > 0 && !formData.to_location_id) {
        setFormData(prev => ({ ...prev, to_location_id: destinationsRes.data[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.from_location_id || !formData.to_location_id) {
        alert('Please select both source and destination locations');
        return;
      }
      await api.post('/transfers', {
        from_location_id: parseInt(formData.from_location_id),
        to_location_id: parseInt(formData.to_location_id),
        item_id: parseInt(formData.item_id),
        quantity: parseInt(formData.quantity)
      });
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Error creating transfer');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/transfers/${id}/complete`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error completing transfer');
    }
  };

  const resetForm = () => {
    setFormData({ 
      item_id: '', 
      from_location_id: sourceLocations.length > 0 ? sourceLocations[0].id : '',
      to_location_id: destinationLocations.length > 0 ? destinationLocations[0].id : '',
      quantity: 1 
    });
    setShowForm(false);
  };

  if (loading) {
    return <div>Loading transfers...</div>;
  }

  return (
    <div className="transfers-page">
      <div className="page-header">
        <h1>Transfers</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + New Transfer
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Transfer</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>From Location *</label>
                <select
                  value={formData.from_location_id}
                  onChange={(e) => setFormData({ ...formData, from_location_id: e.target.value })}
                  required
                >
                  <option value="">Select source location</option>
                  {sourceLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Item *</label>
                <select
                  value={formData.item_id}
                  onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                  required
                >
                  <option value="">Select item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock_main_store})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>To Location *</label>
                <select
                  value={formData.to_location_id}
                  onChange={(e) => setFormData({ ...formData, to_location_id: e.target.value })}
                  required
                >
                  <option value="">Select destination location</option>
                  {destinationLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="transfers-list">
        {transfers.length === 0 ? (
          <div className="empty-state">No transfers found</div>
        ) : (
          transfers.map(transfer => (
            <div key={transfer.id} className="transfer-card">
              <div className="transfer-header">
                <div>
                  <div className="transfer-item">{transfer.item_name}</div>
                  <div className="transfer-details">
                    {transfer.from_location_name || 'Main Store'} → {transfer.to_location_name || 'Unknown'}
                  </div>
                </div>
                <span className={`status ${transfer.status}`}>{transfer.status}</span>
              </div>
              <div className="transfer-info">
                <div>Quantity: {transfer.quantity}</div>
                {transfer.status === 'pending' && (
                  <button 
                    onClick={() => handleComplete(transfer.id)}
                    className="complete-btn"
                  >
                    Complete Transfer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

