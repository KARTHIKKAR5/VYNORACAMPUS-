import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import TimetablePage from './features/timetable/TimetablePage';
import AuthPage from './features/auth/AuthPage';
import AdminLoginPage from './features/admin/AdminLoginPage';
import AdminDashboard from './features/admin/AdminDashboard';
import ProfileCompletionModal from './features/auth/ProfileCompletionModal';
import { authApi } from './services/api';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

function getActivePath() {
  const hash = location.hash.replace(/^#/, '');
  const path = location.pathname.toLowerCase();

  if (path === '/admin/login' || hash === 'admin/login' || location.search.includes('admin-login')) {
    return 'admin-login';
  }
  if (path === '/admin' || hash === 'admin') {
    return 'admin';
  }
  if (hash === 'timetable' || path === '/timetable') {
    return 'timetable';
  }
  if (path === '/login' || hash === 'login') {
    return 'login';
  }
  if (path === '/register' || hash === 'register') {
    return 'register';
  }
  return 'home';
}

function Root() {
  const [route, setRoute] = useState<string>(getActivePath());
  const [student, setStudent] = useState<any | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const navigateTo = (newPath: string) => {
    if (newPath.startsWith('#')) {
      location.hash = newPath;
    } else {
      window.history.pushState({}, '', newPath);
    }
    setRoute(getActivePath());
  };

  useEffect(() => {
    // Check real backend session
    authApi
      .me()
      .then((data) => {
        if (data?.authenticated && data?.student) {
          setStudent(data.student);
        } else {
          setStudent(null);
        }
      })
      .catch(() => {
        setStudent(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });

    const handleLocationChange = () => {
      setRoute(getActivePath());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Global click listener for in-app anchor links
    const handleGlobalClick = (event: MouseEvent) => {
      const element = (event.target as Element).closest('a');
      if (!element) return;

      const href = element.getAttribute('href');
      if (href === '#timetable' || element?.textContent?.includes('Full timetable')) {
        event.preventDefault();
        location.hash = 'timetable';
        setRoute('timetable');
      } else if (href === '/admin/login' || href === '#admin/login') {
        event.preventDefault();
        navigateTo('/admin/login');
      } else if (href === '/admin' || href === '#admin') {
        event.preventDefault();
        navigateTo('/admin');
      }
    };

    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setStudent(null);
    navigateTo('/login');
  };

  // 1. Initial authentication loading state
  if (!authChecked) {
    return (
      <div className="boot-screen" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', color: 'var(--green)', fontFamily: '"DM Mono", monospace' }}>
        <div style={{ textAlign: 'center', display: 'grid', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcebdd', color: 'var(--green)', margin: 'auto', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18 }}>
            V
          </div>
          <p>Connecting to Vynora Campus+ (MongoDB Atlas)...</p>
        </div>
      </div>
    );
  }

  // 2. Dedicated Administrator Login Gateway (/admin/login)
  if (route === 'admin-login') {
    return (
      <AdminLoginPage
        onAdminAuth={(admin) => {
          setStudent(admin);
          navigateTo('/admin');
        }}
        onCancel={() => navigateTo('/')}
      />
    );
  }

  // 3. Protected Administrator Console (/admin)
  if (route === 'admin') {
    const isAdmin = student?.role === 'ADMIN' || student?.role === 'SUPER_ADMIN';

    if (!isAdmin) {
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
            padding: 24,
            fontFamily: '"DM Sans", sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#faf9f4',
              color: 'var(--ink)',
              borderRadius: 8,
              border: '1px solid #235348',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              padding: '32px 28px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#f8e6e3',
                color: '#a83f35',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px'
              }}
            >
              <ShieldAlert size={28} />
            </div>

            <span
              style={{
                fontSize: 10,
                fontFamily: '"DM Mono", monospace',
                letterSpacing: '0.12em',
                fontWeight: 700,
                background: '#f8e6e3',
                color: '#a83f35',
                padding: '3px 8px',
                borderRadius: 3
              }}
            >
              HTTP 403 · ACCESS FORBIDDEN
            </span>

            <h1
              style={{
                margin: '12px 0 8px',
                fontSize: 22,
                fontFamily: 'Fraunces, serif',
                fontWeight: 700
              }}
            >
              Administrator Credentials Required
            </h1>

            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
              The Vynora Admin Command Center is strictly segregated from student accounts.
              {student ? (
                <> You are signed in as <b>{student.name}</b> ({student.role || 'STUDENT'}), which does not hold administrator privileges.</>
              ) : (
                <> You must authenticate with authorized administrator credentials.</>
              )}
            </p>

            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                className="primary"
                onClick={() => navigateTo('/admin/login')}
                style={{
                  width: '100%',
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 600
                }}
              >
                <Lock size={16} />
                <span>Go to Administrator Login</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('/')}
                style={{
                  width: '100%',
                  height: 44,
                  background: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--ink)'
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to Campus Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <AdminDashboard onExit={() => navigateTo('/')} />;
  }

  // 4. Timetable Screen
  if (route === 'timetable') {
    return <TimetablePage student={student} onStudentChange={setStudent} />;
  }

  // 5. Explicit Login or Register routes
  if (route === 'login' || route === 'register') {
    return (
      <AuthPage
        onAuth={(authenticatedStudent) => {
          setStudent(authenticatedStudent);
          navigateTo('/');
        }}
      />
    );
  }

  // 6. Default Route (Campus Portal)
  // If not authenticated, require authentication via AuthPage
  if (!student) {
    return (
      <AuthPage
        onAuth={(authenticatedStudent) => {
          setStudent(authenticatedStudent);
          navigateTo('/');
        }}
      />
    );
  }

  // Authenticated Student Workspace
  return (
    <>
      <App
        student={student}
        onStudentChange={setStudent}
        onLogout={handleLogout}
      />

      {/* Required Profile Completion Modal if student profile fields are incomplete */}
      {student.profileCompleted === false && (
        <ProfileCompletionModal
          student={student}
          onComplete={(updated) => setStudent(updated)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
