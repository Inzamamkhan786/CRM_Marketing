import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginCompany, registerCompany } from '../services/api';
import { Building2, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ company_name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? loginCompany : registerCompany;
      const { data } = await fn(form);
      localStorage.setItem('novacrm_token', data.token);
      localStorage.setItem('novacrm_company', JSON.stringify(data.company));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px 11px 40px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.2s',
    boxSizing: 'border-box',
  };

  const iconStyle = {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.35)',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #0d0d14 60%, #080812 100%)',
      padding: 20,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Glow blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
      </div>

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '40px 36px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            marginBottom: 16,
          }}>
            <Zap size={26} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
            NovaCRM
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            AI-Native Multi-Company Marketing Platform
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 28, padding: 4,
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px 0',
                borderRadius: 7, border: 'none',
                background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                fontWeight: mode === m ? 600 : 400,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register Company'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <span style={iconStyle}><Building2 size={15} /></span>
              <input
                id="company_name"
                type="text"
                placeholder="Company name"
                value={form.company_name}
                onChange={set('company_name')}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <span style={iconStyle}><Mail size={15} /></span>
            <input
              id="email"
              type="email"
              placeholder="Work email"
              value={form.email}
              onChange={set('email')}
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <span style={iconStyle}><Lock size={15} /></span>
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              style={{ ...inputStyle, paddingRight: 42 }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer', padding: 0,
              }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.25)',
              color: '#ff8080', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            id="submit-btn"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          Each company gets its own secure workspace · Powered by JWT
        </p>
      </div>
    </div>
  );
}
