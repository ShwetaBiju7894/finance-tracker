import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Login        from './pages/Auth/Login';
import Register     from './pages/Auth/Register';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Goals        from './pages/Goals';
import Bills        from './pages/Bills';
import Analytics    from './pages/Analytics';
import Insights     from './pages/Insights';
import Settings     from './pages/Settings';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Public route — redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login"    element={<PublicRoute><Login    /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Protected */}
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index                  element={<Dashboard    />} />
      <Route path="transactions"    element={<Transactions />} />
      <Route path="goals"           element={<Goals        />} />
      <Route path="bills"           element={<Bills        />} />
      <Route path="analytics"       element={<Analytics    />} />
      <Route path="insights"        element={<Insights     />} />
      <Route path="settings"        element={<Settings     />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}