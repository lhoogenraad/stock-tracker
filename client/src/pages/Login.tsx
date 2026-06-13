import { useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = isRegister
        ? await api.register(email, password)
        : await api.login(email, password);
      setAuth(result.token, result.user.id);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>●</span>
          <span style={styles.brandName}>STOCKWATCH</span>
        </div>

        <h1 style={styles.heading}>{isRegister ? 'Create account' : 'Sign in'}</h1>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoFocus
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submit}>
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} style={styles.toggle}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
  },
  card: {
    width: 360,
    padding: '2.5rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: '2rem',
  },
  brandMark: {
    color: 'var(--gain)',
    fontSize: 10,
  },
  brandName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: 'var(--text-secondary)',
  },
  heading: {
    fontSize: 22,
    fontWeight: 600,
    margin: '0 0 1.5rem 0',
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  },
  error: {
    marginTop: 16,
    padding: '10px 12px',
    background: 'rgba(255, 92, 92, 0.1)',
    border: '1px solid rgba(255, 92, 92, 0.3)',
    borderRadius: 6,
    color: 'var(--loss)',
    fontSize: 13,
  },
  submit: {
    width: '100%',
    marginTop: 24,
    padding: '11px',
    background: 'var(--gain)',
    border: 'none',
    borderRadius: 6,
    color: '#0B0E14',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  toggle: {
    width: '100%',
    marginTop: 16,
    padding: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
  },
};
