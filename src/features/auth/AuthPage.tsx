import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { authApi, usersApi } from '../../services/api';
import type { StudentSession } from './auth';

type Mode = 'register' | 'login';

const ACADEMIC_YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Other'];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Product & Industrial Design',
  'Business Administration & Management',
  'Biotechnology & Life Sciences',
  'Other'
];

const INTEREST_OPTIONS = [
  'Coding & Software Development',
  'Artificial Intelligence & ML',
  'UI/UX & Product Design',
  'Robotics & IoT Hardware',
  'Hackathons & Competitions',
  'Entrepreneurship & Startups',
  'Academic Research & Papers',
  'Creative Arts & Photography',
  'Sports & Athletics',
  'Community & Volunteering'
];

export default function AuthPage({ onAuth }: { onAuth: (student: StudentSession) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [university, setUniversity] = useState('SR University');
  const [academicYear, setAcademicYear] = useState('First year');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([INTEREST_OPTIONS[0]]);

  // Timetable integration options
  const [degree, setDegree] = useState('B.Tech');
  const [program, setProgram] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('Year I');
  const [batch, setBatch] = useState('Batch 1');
  const [options, setOptions] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [googleInfo, setGoogleInfo] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const clear = () => {
    setError('');
    setGoogleInfo(null);
  };

  // Load timetable options if available
  useEffect(() => {
    if (step !== 2 || options.length || optionsLoading) return;
    setOptionsLoading(true);
    authApi
      .academicOptions()
      .then((res) => {
        if (res.options && res.options.length) {
          setOptions(res.options);
          const first = res.options[0];
          setDegree(first.degree);
          setProgram(first.program);
          setYear(first.year);
          setBatch(first.batch);
        }
      })
      .catch(() => {})
      .finally(() => setOptionsLoading(false));
  }, [step, options.length, optionsLoading]);

  // Google Identity Services setup
  useEffect(() => {
    const handleGoogleCredential = async (response: any) => {
      if (!response.credential) {
        setError('Google sign-in was cancelled or encountered an error.');
        return;
      }
      setPending(true);
      clear();
      try {
        const res = await authApi.google(response.credential);
        onAuth(res.student);
      } catch (err: any) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setPending(false);
      }
    };

    // If Google Identity script is loaded on window
    const win = window as any;
    if (win.google?.accounts?.id) {
      try {
        win.google.accounts.id.initialize({
          client_id: 'configured-via-backend',
          callback: handleGoogleCredential
        });
      } catch {
        // Handled via backend token exchange
      }
    }
  }, [onAuth]);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleGoogleClick = async () => {
    clear();
    setPending(true);
    try {
      // Backend test / verification of Google config
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'prompt-check' })
      });
      const data = await res.json();
      if (res.status === 400 && data.error?.includes('GOOGLE_CLIENT_ID')) {
        setGoogleInfo(
          'Google OAuth 2.0 requires GOOGLE_CLIENT_ID to be set in your backend .env file. Please configure your Google Cloud Console credentials as detailed in the deployment guide. Ordinary email & password registration is active and ready!'
        );
      } else {
        setError(data.error || 'Google authentication requires a valid Google ID token.');
      }
    } catch {
      setError('Unable to contact authentication service.');
    } finally {
      setPending(false);
    }
  };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    clear();
    try {
      const res = await authApi.login(email.trim(), password);
      onAuth(res.student);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setPending(false);
    }
  };

  const verifyStep1 = () => {
    clear();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const createAccount = async () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest to complete your profile.');
      return;
    }

    const finalDept = department === 'Other' && customDept.trim() ? customDept.trim() : department;

    setPending(true);
    clear();
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        academicProfile: {
          university: university.trim(),
          year: academicYear,
          department: finalDept,
          degree,
          program,
          batch
        },
        interests: selectedInterests
      };

      const res = await authApi.register(payload);
      setVerified(true);
      window.setTimeout(() => onAuth(res.student), 700);
    } catch (cause: any) {
      const msg = cause?.message || (typeof cause === 'string' ? cause : 'Failed to complete registration.');
      setError(msg);
    } finally {
      setPending(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setStep(1);
    setVerified(false);
    clear();
  };

  const passwordField = (
    value: string,
    change: (value: string) => void,
    label: string,
    confirmation = false
  ) => (
    <label>
      {label}
      <span className="password-control" style={{ display: 'flex', position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => {
            change(event.target.value);
            clear();
          }}
          autoComplete={confirmation ? 'new-password' : mode === 'login' ? 'current-password' : 'new-password'}
          minLength={mode === 'register' ? 12 : undefined}
          style={{ width: '100%', paddingRight: 36 }}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)'
          }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <div className="auth-brand">
          <span>V</span>
          <b>
            VYNORA
            <br />
            <small>CAMPUS+</small>
          </b>
        </div>
        <div className="auth-aside-copy">
          <span className="eyebrow">YOUR CAMPUS, CONNECTED</span>
          <h1>
            Start with
            <br />
            your day.
          </h1>
          <p>Academic life, people, projects and campus context—in one place built around you.</p>
        </div>
        <div className="auth-promises">
          <p>
            <Check />
            MongoDB Atlas verified persistent records
          </p>
          <p>
            <Check />
            Structured academic profile & interests
          </p>
          <p>
            <Check />
            Strictly segregated roles & security
          </p>
        </div>
        <div className="auth-orbit">
          <i />
          <i />
          <i />
          <span>
            Vynora Pulse
            <br />
            <small>Campus, in context</small>
          </span>
        </div>
      </aside>

      <section className="auth-form-shell" aria-labelledby="auth-title">
        <div className="auth-top">
          <span>{mode === 'register' ? 'NEW TO VYNORA' : 'WELCOME BACK'}</span>
          <button type="button" onClick={switchMode}>
            {mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}{' '}
            <ChevronRight size={15} />
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin} noValidate>
            <div>
              <span className="eyebrow">STUDENT SIGN IN</span>
              <h2 id="auth-title">
                Pick up where
                <br />
                you left off.
              </h2>
              <p>Your campus workspace and student network are waiting.</p>
            </div>

            {/* Google Sign In Action */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={pending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: '#ffffff',
                border: '1px solid #d4ded7',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                color: '#2d3e35'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            {googleInfo && (
              <div
                style={{
                  background: '#f2f8f5',
                  border: '1px solid #c2ded0',
                  padding: '10px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#274b3e',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start'
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--green)' }} />
                <span>{googleInfo}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '"DM Mono", monospace' }}>
                OR EMAIL & PASSWORD
              </span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
            </div>

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clear();
                }}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="you@sru.edu.in"
                required
              />
            </label>
            {passwordField(password, setPassword, 'Password')}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary auth-submit" disabled={pending}>
              {pending ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>
        ) : verified ? (
          <div className="auth-form verified" role="status">
            <div className="verified-mark">
              <Check />
            </div>
            <span className="eyebrow">ACCOUNT & PROFILE CREATED</span>
            <h2 id="auth-title">
              Welcome to Vynora,
              <br />
              {name.split(' ')[0]}!
            </h2>
            <p>
              <b>
                {university} · {department}
              </b>
              <br />
              {academicYear}
              <br />
              <small>Taking you to your campus workspace…</small>
            </p>
          </div>
        ) : step === 1 ? (
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              verifyStep1();
            }}
            noValidate
          >
            <div>
              <span className="eyebrow">CREATE STUDENT ACCOUNT · 1 OF 2</span>
              <h2 id="auth-title">
                A campus profile
                <br />
                with a point of view.
              </h2>
              <p>Start with verified credentials. You will set your academic profile next.</p>
            </div>

            {/* Google Registration Action */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={pending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: '#ffffff',
                border: '1px solid #d4ded7',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                color: '#2d3e35'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Register with Google</span>
            </button>

            {googleInfo && (
              <div
                style={{
                  background: '#f2f8f5',
                  border: '1px solid #c2ded0',
                  padding: '10px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#274b3e',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start'
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--green)' }} />
                <span>{googleInfo}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '"DM Mono", monospace' }}>
                OR REGISTER WITH EMAIL
              </span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
            </div>

            <label>
              Full name
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  clear();
                }}
                autoComplete="name"
                placeholder="e.g. Surya Prakash"
                required
              />
            </label>
            <label>
              College / University email
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clear();
                }}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder="you@sru.edu.in"
                required
              />
            </label>
            <div className="two-fields">
              {passwordField(password, setPassword, 'Password')}
              {passwordField(confirm, setConfirm, 'Confirm password', true)}
            </div>
            <p className="password-hint">
              <LockKeyhole size={13} />
              Use at least 12 characters.
            </p>
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary auth-submit">
              Continue to Academic Profile <ArrowRight size={17} />
            </button>
          </form>
        ) : (
          <section className="auth-form" style={{ maxWidth: 500 }}>
            <div className="step-back">
              <button type="button" onClick={() => setStep(1)}>
                <ArrowLeft size={15} />
                Account details
              </button>
              <span className="eyebrow">ACADEMIC PROFILE · 2 OF 2</span>
            </div>

            <div>
              <h2 id="auth-title">
                Complete your
                <br />
                student profile.
              </h2>
              <p>Your department and academic year will connect you to campus peers and resources.</p>
            </div>

            <div className="profile-callout">
              <GraduationCap size={19} />
              <span>
                <b>College Academic Profile</b>
                <small>Configurable choices for your university</small>
              </span>
              <ShieldCheck size={17} />
            </div>

            <label>
              College / University name
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. SR University"
                required
              />
            </label>

            <div className="two-fields">
              <label>
                Academic year
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {department === 'Other' && (
              <label>
                Specify department
                <input
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  placeholder="Enter your department name"
                  required
                />
              </label>
            )}

            <div>
              <label style={{ marginBottom: 6, display: 'block' }}>Interests & Focus Areas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INTEREST_OPTIONS.map((item) => {
                  const active = selectedInterests.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleInterest(item)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        borderRadius: 14,
                        border: '1px solid',
                        borderColor: active ? 'var(--green)' : 'var(--line)',
                        background: active ? '#e4ede5' : '#ffffff',
                        color: active ? 'var(--green)' : '#46554d',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {active ? '✓ ' : '+ '}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className="primary auth-submit"
              onClick={createAccount}
              disabled={pending}
            >
              {pending ? 'Saving profile to database…' : <>Complete Registration & Join Vynora <Sparkles size={16} /></>}
            </button>
            <p className="auth-privacy">
              <LockKeyhole size={13} />
              Your profile is persisted directly in MongoDB Atlas and is visible to campus peers.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
