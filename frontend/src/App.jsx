import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard   from './pages/Dashboard';
import Customers   from './pages/Customers';
import Orders      from './pages/Orders';
import Segments    from './pages/Segments';
import Campaigns   from './pages/Campaigns';
import Analytics   from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="customers"   element={<Customers />} />
          <Route path="orders"      element={<Orders />} />
          <Route path="segments"    element={<Segments />} />
          <Route path="campaigns"   element={<Campaigns />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="ai"          element={<AIAssistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
