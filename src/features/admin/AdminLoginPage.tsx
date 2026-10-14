import { useState, FormEvent } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertTriangle, ArrowLeft, KeyRound } from 'lucide-react';
import { authApi } from '../../services/api';

export default function AdminLoginPage({
  onAdminAuth,
  onCancel
}: {
  onAdminAuth: (admin: any) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide administrator email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.adminLogin(email.trim(), password);
      onAdminAuth(res.admin);
    } catch (err: any) {
      setError(err.message || 'Administrator authentication failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#153b33',
        color: '#f7f6f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"DM Sans", sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: '#faf9f4',
          color: 'var(--ink)',
          borderRadius: 8,
          border: '1px solid #235348',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            background: '#1c473e',
            color: '#ffffff',
            padding: '24px 28px',
            borderBottom: '1px solid #2a5f54'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: '"DM Mono", monospace',
                letterSpacing: '0.12em',
                fontWeight: 700,
                background: '#2b655a',
                color: '#81e6d9',
                padding: '2px 8px',
                borderRadius: 3
              }}
            >
              RESTRICTED GATEWAY
            </span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Server-Verified RBAC</span>
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: 24,
              fontFamily: 'Fraunces, serif',
              fontWeight: 700,
              color: '#ffffff'
            }}
          >
            Administrator Console
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: '#b9d2cb', lineHeight: 1.45 }}>
            Restricted to authorized college deans, department chairs, and platform governance officers.
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '28px' }}>
          {error && (
            <div
              style={{
                background: '#fcedea',
                border: '1px solid #f2c7be',
                color: '#9e3b26',
                padding: '12px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                  color: 'var(--muted)'
                }}
              >
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vynora.edu"
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 12px',
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                  background: '#ffffff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                  color: 'var(--muted)'
                }}
              >
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 12px',
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                  background: '#ffffff',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 44,
                background: 'var(--green)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s ease'
              }}
            >
              {loading ? (
                'Authenticating Credentials...'
              ) : (
                <>
                  Enter Administration Console <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--green)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ArrowLeft size={14} /> Back to Student Portal
            </button>
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>SR University Governance</span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 11,
          color: '#89a8a0',
          maxWidth: 400,
          textAlign: 'center',
          lineHeight: 1.5
        }}
      >
        Notice: Administrative access is strictly recorded in immutable security audit logs. Unauthorized access attempts are monitored and prohibited.
      </div>
    </div>
  );
}
