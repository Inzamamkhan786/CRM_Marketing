import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, Filter,
  Megaphone, BarChart2, LogOut, Building2
} from 'lucide-react';

const CustomAIIcon = ({ size }) => <img src="/ai-icon.png" width={size} height={size} style={{ objectFit: 'contain', filter: 'invert(1)' }} alt="AI" />;

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users,           label: 'Customers' },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders' },
  { to: '/segments',  icon: Filter,          label: 'Segments' },
  { to: '/campaigns', icon: Megaphone,       label: 'Campaigns' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/ai',        icon: CustomAIIcon,    label: 'AI Assistant' },
];

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('novacrm_token');
    localStorage.removeItem('novacrm_company');
    navigate('/login', { replace: true });
  };

  const company = (() => {
    try { return JSON.parse(localStorage.getItem('novacrm_company') || '{}'); }
    catch { return {}; }
  })();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255,255,255,0.15)',
              overflow: 'hidden',
              padding: 4
            }}>
              <img src="/logo.png" alt="CRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                NovaCRM
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
                Marketing Platform
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '2px solid #ffffff' : '2px solid transparent',
                }}>
                  <Icon size={16} />
                  {label}
                  {label === 'AI Assistant' && (
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ffffff',
                      color: '#000000',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                      letterSpacing: '0.05em',
                    }}>AI</span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer — company info + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
          {company.company_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Building2 size={13} color="var(--color-text-secondary)" />
              <div style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {company.company_name}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 7,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.1)'; e.currentTarget.style.color = '#ff5050'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 10 }}>NovaCRM v1.0 · BT23CSH053</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  );
}
