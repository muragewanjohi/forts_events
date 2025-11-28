import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      console.log('Users loaded:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.warn('Invalid users data format:', response.data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', error.response?.data || error.message);
      // If endpoint fails, continue without dropdown (fallback to text input)
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Events POS</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            {loadingUsers ? (
              <select id="username" disabled className="username-select">
                <option>Loading users...</option>
              </select>
            ) : users.length > 0 ? (
              <select
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="username-select"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.full_name} ({user.username}) - {user.role}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  placeholder="Enter your username"
                />
                <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  (Dropdown unavailable - enter username manually)
                </small>
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Default: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

