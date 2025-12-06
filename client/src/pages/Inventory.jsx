import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Inventory.css';

// Generate SKU from item name (matches server logic)
function generateSKUFromName(name) {
  if (!name || name.trim() === '') {
    return '';
  }
  
  // Convert to uppercase, remove special characters, keep only alphanumeric and spaces
  let sku = name.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .trim();
  
  // Limit to 20 characters for readability
  if (sku.length > 20) {
    sku = sku.substring(0, 20);
  }
  
  return sku;
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    cost_per_item: '',
    category_id: '',
    stock_main_store: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/categories')
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, formData);
      } else {
        await api.post('/inventory', formData);
      }
      resetForm();
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setSkuManuallyEdited(true); // When editing, SKU is already set
    setFormData({
      name: item.name,
      sku: item.sku || '',
      cost_per_item: item.cost_per_item,
      category_id: item.category_id || '',
      stock_main_store: item.stock_main_store
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', cost_per_item: '', category_id: '', stock_main_store: 0 });
    setEditingItem(null);
    setSkuManuallyEdited(false); // Reset flag when form is closed
    setShowForm(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/inventory/import/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading template');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Please select a file');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post('/inventory/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(response.data.message);
      if (response.data.results.errors.length > 0) {
        console.error('Import errors:', response.data.results.errors);
      }
      setShowImport(false);
      setImportFile(null);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error importing items');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>Inventory</h1>
        <div className="header-actions">
          <button onClick={handleDownloadTemplate} className="btn-secondary">
            📥 Download Template
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            📤 Bulk Import
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Item
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    // Auto-generate SKU from name if SKU is empty, not editing, and user hasn't manually edited SKU
                    if (!editingItem && !skuManuallyEdited && (!formData.sku || formData.sku.trim() === '')) {
                      const generatedSKU = generateSKUFromName(newName);
                      setFormData({ ...formData, name: newName, sku: generatedSKU });
                    } else {
                      setFormData({ ...formData, name: newName });
                    }
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>SKU {!editingItem && <small style={{ color: '#666', fontSize: '0.75rem' }}>(auto-generated, can be edited)</small>}</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({ ...formData, sku: e.target.value });
                    setSkuManuallyEdited(true); // Mark as manually edited
                  }}
                  placeholder={editingItem ? "Leave empty to remove SKU" : "Will be generated from name"}
                />
              </div>
              <div className="form-group">
                <label>Cost Per Item *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_item}
                  onChange={(e) => setFormData({ ...formData, cost_per_item: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Stock (Main Store)</label>
                <input
                  type="number"
                  value={formData.stock_main_store}
                  onChange={(e) => setFormData({ ...formData, stock_main_store: parseInt(e.target.value) || 0 })}
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

      {showImport && (
        <div className="modal-overlay" onClick={() => { setShowImport(false); setImportFile(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk Import Items</h2>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label>Instructions:</label>
                <ol style={{ fontSize: '0.875rem', marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Download the template using the button above</li>
                  <li>Fill in your items following the template format</li>
                  <li>Upload the completed file here</li>
                </ol>
              </div>
              <div className="form-group">
                <label>Excel File (.xlsx) *</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowImport(false); setImportFile(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={importing}>
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="inventory-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Main Store</th>
              <th>Bar</th>
              <th>Counter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.sku || '-'}</td>
                <td>{item.category_name || '-'}</td>
                <td>KES {item.cost_per_item?.toFixed(2)}</td>
                <td>{item.stock_main_store}</td>
                <td>{item.stock_bar}</td>
                <td>{item.stock_counter}</td>
                <td>
                  <button onClick={() => handleEdit(item)} className="btn-sm">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

