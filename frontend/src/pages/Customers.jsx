import { useState, useEffect, useRef } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, importCSV } from '../services/api';
import { UserPlus, Search, Upload, Pencil, Trash2, X, Check, MapPin, Mail, Phone } from 'lucide-react';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(
    customer || { name: '', email: '', phone: '', city: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (customer) {
        await updateCustomer(customer.id, form);
      } else {
        await addCustomer(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {customer ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name',  label: 'Full Name *',     placeholder: 'Aarav Sharma' },
            { key: 'email', label: 'Email Address *',  placeholder: 'aarav@example.com', type: 'email' },
            { key: 'phone', label: 'Phone Number',     placeholder: '+91 98765 43210' },
            { key: 'city',  label: 'City',             placeholder: 'Mumbai' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                {label}
              </label>
              <input
                type={type || 'text'}
                className="form-input"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                required={key === 'name' || key === 'email'}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : <><Check size={14} style={{ marginRight: 6 }} />{customer ? 'Update' : 'Add Customer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | customer object
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    getCustomers(search ? { search } : {})
      .then(r => setCustomers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await deleteCustomer(id);
    load();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const r = await importCSV(file);
      alert(r.data.message);
      load();
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Customers</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
            {customers.length} customers in your database
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn-secondary" onClick={() => fileRef.current.click()} disabled={importing}>
            <Upload size={14} style={{ marginRight: 6 }} />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button className="btn-primary" onClick={() => setModal('add')}>
            <UserPlus size={14} style={{ marginRight: 6 }} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading customers...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 40 }}>No customers found</td></tr>
              ) : customers.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{c.id}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} color="var(--color-text-secondary)" />
                      {c.email}
                    </span>
                  </td>
                  <td>
                    {c.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} color="var(--color-text-secondary)" />
                        {c.phone}
                      </span>
                    )}
                  </td>
                  <td>
                    {c.city && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} color="var(--color-text-secondary)" />
                        {c.city}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setModal(c)}
                        style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(c.id, c.name)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <CustomerModal
          customer={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
