import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout        from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Customers  from './pages/Customers';
import Orders     from './pages/Orders';
import Segments   from './pages/Segments';
import Campaigns  from './pages/Campaigns';
import Analytics  from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all CRM pages */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="customers"  element={<Customers />} />
          <Route path="orders"     element={<Orders />} />
          <Route path="segments"   element={<Segments />} />
          <Route path="campaigns"  element={<Campaigns />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="ai"         element={<AIAssistant />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
