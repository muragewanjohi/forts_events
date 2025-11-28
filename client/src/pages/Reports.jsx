import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Reports.css';

export default function Reports() {
  const [reportType, setReportType] = useState('item-sales');
  const [itemSales, setItemSales] = useState([]);
  const [staffSales, setStaffSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReport();
  }, [reportType, dateRange]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'item-sales') {
        const response = await api.get(
          `/reports/item-sales?start_date=${dateRange.start}&end_date=${dateRange.end}`
        );
        setItemSales(response.data);
      } else {
        const response = await api.get(
          `/reports/staff-sales?start_date=${dateRange.start}&end_date=${dateRange.end}`
        );
        setStaffSales(response.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const url = `/api/reports/${reportType}/export/${format}?start_date=${dateRange.start}&end_date=${dateRange.end}`;
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`, '_blank');
    } catch (error) {
      alert('Error exporting report');
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <div className="report-controls">
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="item-sales">Item Sales</option>
            <option value="staff-sales">Staff Sales</option>
          </select>
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <div className="export-buttons">
            <button onClick={() => handleExport('excel')} className="btn-export">
              Export Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="btn-export">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading report...</div>
      ) : (
        <div className="report-table">
          {reportType === 'item-sales' ? (
            <table>
              <thead>
                <tr>
                  <th>NUMBER</th>
                  <th>ITEM</th>
                  <th>SOLD</th>
                  <th>COST PER ITEM</th>
                  <th>TOTAL COST</th>
                </tr>
              </thead>
              <tbody>
                {itemSales.map((row) => (
                  <tr key={row.number}>
                    <td>{row.number}</td>
                    <td>{row.item}</td>
                    <td>{row.sold}</td>
                    <td>KES {row.cost_per_item.toFixed(2)}</td>
                    <td>KES {row.total_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>NUMBER</th>
                  <th>ACCOUNT</th>
                  <th>CASH</th>
                  <th>MPESA</th>
                  <th>TOTAL SALES</th>
                </tr>
              </thead>
              <tbody>
                {staffSales.map((row) => (
                  <tr key={row.number}>
                    <td>{row.number}</td>
                    <td>{row.account}</td>
                    <td>KES {row.cash.toFixed(2)}</td>
                    <td>KES {row.mpesa.toFixed(2)}</td>
                    <td>KES {row.total_sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

