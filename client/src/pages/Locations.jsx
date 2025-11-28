import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Locations.css';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'destination',
    description: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, formData);
      } else {
        await api.post('/locations', formData);
      }
      resetForm();
      loadLocations();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error saving location';
      alert(errorMessage);
      console.error('Location save error:', error);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      description: location.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      loadLocations();
    } catch (error) {
      alert(error.response?.data?.error || 'Error deleting location');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'destination', description: '' });
    setEditingLocation(null);
    setShowForm(false);
  };

  if (loading) {
    return <div>Loading locations...</div>;
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'source':
        return '#dbeafe';
      case 'destination':
        return '#d1fae5';
      case 'both':
        return '#fef3c7';
      default:
        return '#f3f4f6';
    }
  };

  const getTypeTextColor = (type) => {
    switch (type) {
      case 'source':
        return '#1e40af';
      case 'destination':
        return '#065f46';
      case 'both':
        return '#92400e';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="locations-page">
      <div className="page-header">
        <h1>Locations</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add Location
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingLocation ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="source">Source (can transfer from)</option>
                  <option value="destination">Destination (can transfer to)</option>
                  <option value="both">Both (source and destination)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

      <div className="locations-grid">
        {locations.map((location) => (
          <div key={location.id} className="location-card">
            <div className="location-header">
              <h3>{location.name}</h3>
              <span 
                className="type-badge"
                style={{
                  backgroundColor: getTypeColor(location.type),
                  color: getTypeTextColor(location.type)
                }}
              >
                {location.type}
              </span>
            </div>
            {location.description && (
              <div className="location-description">
                {location.description}
              </div>
            )}
            <div className="location-actions">
              <button onClick={() => handleEdit(location)} className="btn-sm">
                Edit
              </button>
              <button onClick={() => handleDelete(location.id)} className="btn-sm btn-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

