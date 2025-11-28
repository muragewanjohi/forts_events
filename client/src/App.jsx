import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import POS from './pages/POS';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Inventory from './pages/Inventory';
import Transfers from './pages/Transfers';
import Tables from './pages/Tables';
import Categories from './pages/Categories';
import Locations from './pages/Locations';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }

  return children;
}

function WaiterRoute({ children }) {
  const { user } = useAuth();

  // Waiters can only access POS and Orders
  if (user?.role === 'waiter') {
    return children;
  }

  // Other roles (admin, cashier, bartender) can access
  return children;
}

function NonWaiterRoute({ children }) {
  const { user } = useAuth();

  // Waiters cannot access these routes
  if (user?.role === 'waiter') {
    return <Navigate to="/pos" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/pos" replace />} />
        <Route
          path="dashboard"
          element={
            <NonWaiterRoute>
              <Dashboard />
            </NonWaiterRoute>
          }
        />
        <Route path="pos" element={<POS />} />
        <Route path="orders" element={<Orders />} />
        <Route
          path="reports"
          element={
            <NonWaiterRoute>
              <Reports />
            </NonWaiterRoute>
          }
        />
        <Route
          path="users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <AdminRoute>
              <Inventory />
            </AdminRoute>
          }
        />
        <Route
          path="transfers"
          element={
            <AdminRoute>
              <Transfers />
            </AdminRoute>
          }
        />
        <Route
          path="tables"
          element={
            <AdminRoute>
              <Tables />
            </AdminRoute>
          }
        />
        <Route
          path="categories"
          element={
            <AdminRoute>
              <Categories />
            </AdminRoute>
          }
        />
        <Route
          path="locations"
          element={
            <AdminRoute>
              <Locations />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

