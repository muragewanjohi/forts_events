import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'cashier', 'bartender'] },
    { path: '/pos', label: 'POS', icon: '🛒', roles: ['admin', 'cashier', 'bartender', 'waiter'] },
    { path: '/orders', label: 'Orders', icon: '📋', roles: ['admin', 'cashier', 'bartender', 'waiter'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'cashier', 'bartender'] }
  ];

  const adminItems = [
    { path: '/users', label: 'Users', icon: '👥' },
    { path: '/tables', label: 'Tables', icon: '🪑' },
    { path: '/categories', label: 'Categories', icon: '🏷️' },
    { path: '/locations', label: 'Locations', icon: '📍' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/transfers', label: 'Transfers', icon: '🚚' }
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Events POS</h1>
          <div className="user-info">
            <span className="user-name">{user?.full_name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-section">
            {menuItems
              .filter(item => !item.roles || item.roles.includes(user?.role))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </Link>
              ))}
          </div>

          {user?.role === 'admin' && (
            <div className="menu-section">
              <div className="menu-section-title">Admin</div>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

