import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../services/api';
import { Users, ShoppingCart, Megaphone, TrendingUp, Zap, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>{sub}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSummary()
      .then(r => setSummary(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = summary?.summary || {};
  const recent = summary?.recent_campaigns || [];

  const fmtCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 6, fontSize: 14 }}>
          Welcome to NovaCRM — your AI-native marketing platform
        </p>
      </div>

      {/* Quick action banner */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(255,255,255,0.15)',
        }}>
          <img src="/ai-icon.png" width={20} height={20} style={{ objectFit: 'contain' }} alt="AI" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3 }}>
            AI Assistant is ready
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Ask the AI to find customers, create segments, and launch campaigns in natural language.
          </div>
        </div>
        <Link to="/ai">
          <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Open AI Chat
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard icon={Users}       label="Total Customers" value={stats.total_customers?.toLocaleString() || 0}   color="#ffffff" />
          <StatCard icon={ShoppingCart} label="Total Orders"   value={stats.total_orders?.toLocaleString() || 0}      color="#e4e4e7" />
          <StatCard icon={TrendingUp}  label="Total Revenue"   value={fmtCurrency(stats.total_revenue)}               color="#d4d4d8" />
          <StatCard icon={Megaphone}   label="Campaigns"       value={stats.total_campaigns?.toLocaleString() || 0}   color="#a1a1aa" />
        </div>
      )}

      {/* Recent campaigns */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Activity size={16} color="var(--color-accent)" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Recent Campaigns
          </h2>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '32px 0', fontSize: 14 }}>
            No campaigns yet.{' '}
            <Link to="/campaigns" style={{ color: 'var(--color-accent)' }}>Create your first campaign →</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Delivered</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <span className={`badge ${c.channel === 'WhatsApp' ? 'badge-success' : c.channel === 'SMS' ? 'badge-warning' : 'badge-info'}`}>
                      {c.channel}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'SENT' ? 'badge-success' : c.status === 'SENDING' ? 'badge-warning' : 'badge-gray'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{Number(c.total_sent).toLocaleString()}</td>
                  <td>{Number(c.delivered).toLocaleString()}</td>
                  <td>{Number(c.opened).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
