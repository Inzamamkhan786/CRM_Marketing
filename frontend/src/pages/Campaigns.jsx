import { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, sendCampaign, getSegments } from '../services/api';
import { Plus, Send, Megaphone, X, Check, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CHANNELS = ['Email', 'WhatsApp', 'SMS', 'RCS'];

function StatusBadge({ status }) {
  const map = {
    DRAFT:   { cls: 'badge-gray',    icon: <Clock size={10} /> },
    SENDING: { cls: 'badge-warning', icon: <Clock size={10} /> },
    SENT:    { cls: 'badge-success', icon: <CheckCircle size={10} /> },
    FAILED:  { cls: 'badge-danger',  icon: <AlertCircle size={10} /> },
  };
  const { cls, icon } = map[status] || map.DRAFT;
  return <span className={`badge ${cls}`}>{icon}{status}</span>;
}

function CreateCampaignModal({ onClose, onSave }) {
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState({ name: '', segment_id: '', channel: 'Email', message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSegments().then(r => setSegments(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCampaign(form);
      onSave();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const selectedSeg = segments.find(s => s.id === parseInt(form.segment_id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Create Campaign</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Campaign Name *</label>
            <input className="form-input" placeholder="Win-Back June 2025" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Target Segment</label>
            <select className="form-input" value={form.segment_id} onChange={e => setForm(p => ({ ...p, segment_id: e.target.value }))}>
              <option value="">All Customers (no segment)</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name} ({s.audience_size?.toLocaleString()} customers)</option>)}
            </select>
            {selectedSeg && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-accent)' }}>
                → {selectedSeg.audience_size?.toLocaleString()} customers will be targeted
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Channel *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CHANNELS.map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, channel: ch }))}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid',
                    borderColor: form.channel === ch ? 'var(--color-accent)' : 'var(--color-border)',
                    background: form.channel === ch ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: form.channel === ch ? '#ffffff' : 'var(--color-text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Message *</label>
            <textarea
              className="form-input"
              placeholder="Hi {name}! We miss you. Enjoy 20% OFF your next order with code COMEBACK20 🎉"
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              rows={4}
              required
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, textAlign: 'right' }}>
              {form.message.length} characters
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : <><Check size={13} style={{ marginRight: 6 }} />Create Campaign</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(null);

  const load = () => {
    setLoading(true);
    getCampaigns().then(r => setCampaigns(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (campaign) => {
    if (!confirm(`Send "${campaign.name}" to ${campaign.audience_size || 'all'} customers?`)) return;
    setSending(campaign.id);
    try {
      const r = await sendCampaign(campaign.id);
      alert(`✅ ${r.data.message}`);
      load();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(null);
    }
  };

  const channelColor = { Email: '#ffffff', WhatsApp: '#e4e4e7', SMS: '#d4d4d8', RCS: '#a1a1aa' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Campaigns</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
            Create and send targeted marketing campaigns
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={14} style={{ marginRight: 6 }} />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
          <Megaphone size={40} color="var(--color-text-secondary)" style={{ marginBottom: 12 }} />
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No campaigns yet. Create your first campaign.</div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Campaign</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {campaigns.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <StatusBadge status={c.status} />
                    <span className="badge badge-info" style={{ background: `${channelColor[c.channel]}20`, color: channelColor[c.channel] }}>
                      {c.channel}
                    </span>
                  </div>

                  {c.segment_name && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      Audience: <span style={{ color: 'var(--color-text-primary)' }}>{c.segment_name}</span>
                      {c.audience_size && <span style={{ color: 'var(--color-accent)' }}> ({c.audience_size?.toLocaleString()} customers)</span>}
                    </div>
                  )}

                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, color: 'var(--color-text-secondary)', borderLeft: '3px solid var(--color-border)',
                    lineHeight: 1.5,
                  }}>
                    {c.message}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 11, color: '#4b5563' }}>
                    Created {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {c.status === 'DRAFT' && (
                  <button
                    className="btn-primary"
                    onClick={() => handleSend(c)}
                    disabled={sending === c.id}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Send size={13} style={{ marginRight: 6 }} />
                    {sending === c.id ? 'Sending...' : 'Send Campaign'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateCampaignModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
