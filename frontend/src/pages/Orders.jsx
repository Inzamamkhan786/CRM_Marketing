import { useState, useEffect } from 'react';
import { getOrders, addOrder, getCustomers } from '../services/api';

import { Plus, ShoppingCart, IndianRupee } from 'lucide-react';

function AddOrderModal({ onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ customer_id: '', amount: '', order_date: today });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addOrder(form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add order');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 600 }}>Add Order</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Customer *</label>
            <select
              className="form-input"
              value={form.customer_id}
              onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}
              required
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Amount (₹) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="2500.00"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Order Date</label>
            <input
              type="date"
              className="form-input"
              value={form.order_date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    getOrders().then(r => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);


  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.amount), 0);
  const avgOrder = orders.length ? totalRevenue / orders.length : 0;

  const fmtCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Orders</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
            {orders.length} orders tracked
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} style={{ marginRight: 6 }} />
          Add Order
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Orders', value: orders.length.toLocaleString(), icon: ShoppingCart, color: '#ffffff' },
          { label: 'Total Revenue', value: fmtCurrency(totalRevenue), icon: IndianRupee, color: '#e4e4e7' },
          { label: 'Average Order', value: fmtCurrency(avgOrder), icon: IndianRupee, color: '#d4d4d8' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading orders...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 40 }}>No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>#{o.id}</td>
                  <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{o.customer_email}</td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>{fmtCurrency(o.amount)}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {new Date(o.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddOrderModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
