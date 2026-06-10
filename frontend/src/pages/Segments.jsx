import { useState, useEffect } from 'react';
import { getSegments, createSegment, deleteSegment, previewRules } from '../services/api';
import { Plus, Trash2, Users, Eye, X, Check, ChevronDown } from 'lucide-react';

const FIELD_OPTIONS = [
  { value: 'total_spend',      label: 'Total Spend (₹)' },
  { value: 'days_inactive',    label: 'Days Inactive' },
  { value: 'order_count',      label: 'Order Count' },
  { value: 'city',             label: 'City' },
  { value: 'days_since_signup', label: 'Days Since Signup' },
];

const OP_OPTIONS = [
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: '≥' },
  { value: '<=', label: '≤' },
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
];

function RuleBuilder({ rules, onChange }) {
  // Adds a new empty condition to our rules list
  const addCondition = () => {
    onChange({
      ...rules,
      conditions: [...(rules.conditions || []), { field: 'total_spend', op: '>', value: '' }],
    });
  };

  // Updates a specific condition when the user types or selects a new value
  const updateCondition = (i, key, val) => {
    const conds = [...rules.conditions];
    conds[i] = { ...conds[i], [key]: val };
    onChange({ ...rules, conditions: conds });
  };

  // Removes a condition by filtering it out of the array based on its index
  const removeCondition = (i) => {
    onChange({ ...rules, conditions: rules.conditions.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      {/* Operator selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Match</span>
        {['AND', 'OR'].map(op => (
          <button
            key={op}
            type="button"
            onClick={() => onChange({ ...rules, operator: op })}
            style={{
              padding: '4px 14px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: rules.operator === op ? 'var(--color-accent)' : 'var(--color-border)',
              background: rules.operator === op ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: rules.operator === op ? 'var(--color-accent-light)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {op}
          </button>
        ))}
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>conditions</span>
      </div>

      {/* Conditions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(rules.conditions || []).map((cond, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="form-input"
              style={{ flex: 2 }}
              value={cond.field}
              onChange={e => updateCondition(i, 'field', e.target.value)}
            >
              {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              className="form-input"
              style={{ flex: 1 }}
              value={cond.op}
              onChange={e => updateCondition(i, 'op', e.target.value)}
            >
              {OP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder={cond.field === 'city' ? 'Mumbai' : '5000'}
              value={cond.value}
              onChange={e => updateCondition(i, 'value', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeCondition(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCondition}
        style={{
          marginTop: 12, background: 'none', border: '1px dashed var(--color-border)',
          borderRadius: 8, padding: '8px 16px', color: 'var(--color-text-secondary)',
          cursor: 'pointer', fontSize: 13, width: '100%',
          transition: 'all 0.15s',
        }}
      >
        + Add Condition
      </button>
    </div>
  );
}

function CreateSegmentModal({ onClose, onSave }) {
  // State variables to hold form data and loading statuses
  const [name, setName] = useState('');
  const [rules, setRules] = useState({ operator: 'AND', conditions: [{ field: 'days_inactive', op: '>', value: '30' }] });
  const [preview, setPreview] = useState(null); // Holds the simulated audience size
  const [previewing, setPreviewing] = useState(false); // True while fetching preview
  const [saving, setSaving] = useState(false); // True while saving to database

  // Fetches a preview of how many customers match these rules before saving
  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const r = await previewRules(rules);
      setPreview(r.data); // Save the response (number of customers matching)
    } catch (err) {
      alert('Preview error: ' + (err.response?.data?.error || err.message));
    } finally {
      setPreviewing(false);
    }
  };

  // Submits the form data to create a new segment
  const handleSave = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit
    if (!name.trim()) return alert('Please enter a segment name');
    
    setSaving(true);
    try {
      await createSegment({ name, rules }); // API call to save segment
      onSave(); // Close modal and refresh list
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create segment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Create Segment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Segment Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Inactive High Spenders"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>Audience Rules</label>
            <RuleBuilder rules={rules} onChange={setRules} />
          </div>

          {/* Preview result */}
          {preview && (
            <div style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            }}>
              <span style={{ fontWeight: 700, color: '#818cf8', fontSize: 20 }}>{preview.audience_size}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginLeft: 8 }}>customers match these rules</span>
              {preview.customers?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Sample: {preview.customers.slice(0, 3).map(c => c.name).join(', ')}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-secondary" onClick={handlePreview} disabled={previewing}>
              <Eye size={13} style={{ marginRight: 6 }} />
              {previewing ? 'Previewing...' : 'Preview Audience'}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Check size={13} style={{ marginRight: 6 }} />Save Segment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    getSegments().then(r => setSegments(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete segment "${name}"?`)) return;
    await deleteSegment(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Segments</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
            Define audience groups using behavioral rules
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} style={{ marginRight: 6 }} />
          New Segment
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : segments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
          <Users size={40} color="var(--color-text-secondary)" style={{ marginBottom: 12 }} />
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No segments yet. Create your first audience segment.</div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Segment</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {segments.map(seg => (
            <div key={seg.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>{seg.name}</div>
                <button className="btn-danger" onClick={() => handleDelete(seg.id, seg.name)} style={{ padding: '3px 8px' }}>
                  <Trash2 size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users size={14} color="var(--color-accent)" />
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent-light)' }}>{seg.audience_size?.toLocaleString()}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>customers</span>
              </div>

              {/* Rules summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(seg.rules?.conditions || []).slice(0, 3).map((c, i) => (
                  <div key={i} style={{
                    background: 'rgba(99,102,241,0.07)',
                    borderRadius: 6, padding: '4px 10px',
                    fontSize: 12, color: 'var(--color-text-secondary)',
                  }}>
                    <span style={{ color: 'var(--color-accent-light)', fontWeight: 500 }}>{c.field}</span>
                    {' '}{c.op}{' '}
                    <span style={{ color: 'var(--color-text-primary)' }}>{c.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: '#4b5563' }}>
                Created {new Date(seg.created_at).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateSegmentModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
