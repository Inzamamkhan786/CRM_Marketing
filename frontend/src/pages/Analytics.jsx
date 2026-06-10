import { useState, useEffect } from 'react';
import { getCampaigns, getCampaignAnalytics } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell,
} from 'recharts';
import { BarChart2, TrendingUp, RefreshCw } from 'lucide-react';

const FUNNEL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#4ade80', '#ef4444'];

function MetricPill({ label, value, total, color }) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value?.toLocaleString()}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color, marginTop: 2 }}>{pct}%</div>
    </div>
  );
}

export default function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getCampaigns().then(r => {
      const sent = r.data.filter(c => c.status === 'SENT');
      setCampaigns(sent);
      if (sent.length > 0) setSelected(String(sent[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getCampaignAnalytics(selected)
      .then(r => setAnalytics(r.data))
      .finally(() => setLoading(false));
  }, [selected]);

  const handleRefresh = async () => {
    if (!selected) return;
    setRefreshing(true);
    getCampaignAnalytics(selected).then(r => setAnalytics(r.data)).finally(() => setRefreshing(false));
  };

  const stats = analytics?.stats || {};

  const funnelData = [
    { name: 'Sent',      value: stats.sent      || 0 },
    { name: 'Delivered', value: stats.delivered  || 0 },
    { name: 'Opened',    value: stats.opened     || 0 },
    { name: 'Clicked',   value: stats.clicked    || 0 },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Delivery Rate', value: parseFloat(stats.delivery_rate) || 0 },
    { name: 'Open Rate',     value: parseFloat(stats.open_rate)     || 0 },
    { name: 'Click Rate',    value: parseFloat(stats.click_rate)    || 0 },
    { name: 'Failure Rate',  value: parseFloat(stats.failure_rate)  || 0 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Analytics</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '6px 0 0' }}>
            Campaign performance and delivery insights
          </p>
        </div>
        <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={13} style={{ marginRight: 6 }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Campaign selector */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginRight: 12 }}>Select Campaign:</label>
        {campaigns.length === 0 ? (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            No sent campaigns yet. Send a campaign first to see analytics.
          </span>
        ) : (
          <select
            className="form-input"
            style={{ width: 'auto', display: 'inline-block' }}
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name} — {c.channel}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>Loading analytics...</div>
      ) : !analytics ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>
          <BarChart2 size={40} style={{ marginBottom: 12 }} />
          <div>Select a campaign to view analytics</div>
        </div>
      ) : (
        <>
          {/* Campaign info */}
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 13 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>{analytics.campaign?.name}</strong>
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: 12 }}>
              via {analytics.campaign?.channel} · {new Date(analytics.campaign?.created_at).toLocaleDateString('en-IN')}
            </span>
          </div>

          {/* Metric pills */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              DELIVERY FUNNEL
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, textAlign: 'center' }}>
              <MetricPill label="Sent"      value={stats.sent}      total={stats.sent} color="#10b981" />
              <MetricPill label="Delivered" value={stats.delivered} total={stats.sent} color="#3b82f6" />
              <MetricPill label="Opened"    value={stats.opened}    total={stats.sent} color="#f59e0b" />
              <MetricPill label="Clicked"   value={stats.clicked}   total={stats.sent} color="#4ade80" />
              <MetricPill label="Failed"    value={stats.failed}    total={stats.sent} color="#ef4444" />
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Bar chart: rates */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                PERFORMANCE RATES (%)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                    formatter={(v) => [`${v}%`]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Funnel: absolute counts */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                MESSAGE FUNNEL
              </h3>
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{ background: '#1e2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="right" fill="#94a3b8" fontSize={12} formatter={(v) => `${v}`} />
                      {funnelData.map((_, i) => (
                        <Cell key={i} fill={FUNNEL_COLORS[i]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 0', fontSize: 13 }}>
                  Delivery events are still processing...
                  <br />
                  <button className="btn-secondary" style={{ marginTop: 12, fontSize: 12 }} onClick={handleRefresh}>
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
