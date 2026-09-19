import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { WalletCards, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';

type Mode = 'login' | 'signup';

type AuthPageProps = {
  initialMode?: Mode;
  onBack?: () => void;
};

export default function AuthPage({ initialMode = 'login', onBack }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function toggle() {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Save the display name so the dashboard can greet them by name
        await updateProfile(cred.user, {
          displayName: name.trim(),
        });
        // Auth state listener in App.tsx will set page → 'app'
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // Auth state listener in App.tsx will set page → 'app'
      }
      // onAuthStateChanged in App.tsx takes over from here
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      const messages: Record<string, string> = {
        'auth/email-already-in-use':  'An account with this email already exists.',
        'auth/invalid-email':          'Please enter a valid email address.',
        'auth/user-not-found':         'No account found with this email.',
        'auth/wrong-password':         'Incorrect password. Please try again.',
        'auth/invalid-credential':     'Incorrect email or password.',
        'auth/too-many-requests':      'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };
      setError(messages[code] ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* Left panel — branding */}
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <div className="auth-logo">
            <div className="brand-mark"><WalletCards size={22} /></div>
            <span>Expense<span>Flow</span></span>
          </div>
          {onBack && (
            <button className="auth-back-btn" onClick={onBack} aria-label="Back to home">
              <ArrowLeft size={15} /> Back to home
            </button>
          )}
          <h2 className="auth-tagline">
            Take control of<br />your finances.
          </h2>
          <p className="auth-sub">
            Track every naira, set budgets, hit your goals.<br />
            Your money, your rules.
          </p>
          <div className="auth-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p>
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button className="auth-toggle-link" onClick={toggle}>
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <p className="form-error">{error}</p>}

            {mode === 'signup' && (
              <label className="auth-field">
                <span>Full Name</span>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-field-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Ada Okonkwo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}

            <label className="auth-field">
              <span>Email Address</span>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-field-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete={mode === 'login' ? 'email' : 'new-email'}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-field-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
