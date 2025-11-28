import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Tables.css';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await api.get('/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, formData);
      } else {
        await api.post('/tables', formData);
      }
      resetForm();
      loadTables();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving table');
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location || '',
      notes: table.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      loadTables();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting table');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/tables/${id}/status`, { status });
      loadTables();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating table status');
    }
  };

  const resetForm = () => {
    setFormData({ table_number: '', capacity: 4, location: '', notes: '' });
    setEditingTable(null);
    setShowForm(false);
  };

  if (loading) {
    return <div>Loading tables...</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#d1fae5';
      case 'occupied':
        return '#fee2e2';
      case 'reserved':
        return '#fef3c7';
      case 'out_of_service':
        return '#e5e7eb';
      default:
        return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'available':
        return '#065f46';
      case 'occupied':
        return '#991b1b';
      case 'reserved':
        return '#92400e';
      case 'out_of_service':
        return '#374151';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="tables-page">
      <div className="page-header">
        <h1>Table Management</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add Table
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTable ? 'Edit Table' : 'Add Table'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Table Number *</label>
                <input
                  type="text"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  required
                  disabled={!!editingTable}
                />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Hall, Patio"
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tables-grid">
        {tables.map((table) => (
          <div key={table.id} className="table-card">
            <div className="table-header">
              <div className="table-number">Table {table.table_number}</div>
              <select
                value={table.status}
                onChange={(e) => handleStatusChange(table.id, e.target.value)}
                className="status-select"
                style={{
                  backgroundColor: getStatusColor(table.status),
                  color: getStatusTextColor(table.status)
                }}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
            <div className="table-info">
              <div className="table-detail">
                <span className="label">Capacity:</span>
                <span>{table.capacity} seats</span>
              </div>
              {table.location && (
                <div className="table-detail">
                  <span className="label">Location:</span>
                  <span>{table.location}</span>
                </div>
              )}
              {table.notes && (
                <div className="table-detail">
                  <span className="label">Notes:</span>
                  <span>{table.notes}</span>
                </div>
              )}
            </div>
            <div className="table-actions">
              <button onClick={() => handleEdit(table)} className="btn-sm">
                Edit
              </button>
              <button onClick={() => handleDelete(table.id)} className="btn-sm btn-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

