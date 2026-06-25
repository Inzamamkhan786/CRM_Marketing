import { Navigate } from 'react-router-dom';

/**
 * Wraps any route — if no JWT token is stored, redirects to /login.
 * Used in App.jsx to protect all CRM pages.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('novacrm_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
