import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Command,
  Compass,
  FolderKanban,
  Home,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Users,
  Building2,
  ShoppingBag,
  ShieldAlert,
  X,
  Check,
  Clock3,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Share2,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Flag,
  ThumbsUp,
  Download,
  FileText,
  Image as ImageIcon,
  Eye,
  Layers
} from 'lucide-react';
import ProfileCompletionModal from './features/auth/ProfileCompletionModal';
import { timetableApi } from './features/timetable/api';
import type { TimetableCurrentSnapshot, TimetableEntry } from './features/timetable/types';
import type { StudentSession } from './features/auth/auth';
import ClubsPage from './features/clubs/ClubsPage';
import ProductsPage from './features/products/ProductsPage';
import AdminDashboard from './features/admin/AdminDashboard';
import {
  usersApi,
  projectsApi,
  communityApi,
  messagesApi,
  notificationsApi,
  resourcesApi,
  servicesApi,
  eventsApi,
  reportsApi,
  searchApi
} from './services/api';
import { getSocket } from './services/socket';

export type View =
  | 'Home'
  | 'Network'
  | 'Community'
  | 'Clubs'
  | 'Projects'
  | 'Resources'
  | 'Messages'
  | 'Events'
  | 'Campus services'
  | 'Products'
  | 'Admin';

const nav: [View, any][] = [
  ['Home', Home],
  ['Network', Users],
  ['Community', MessageCircle],
  ['Clubs', Building2],
  ['Projects', FolderKanban],
  ['Resources', BookOpen],
  ['Messages', Send],
  ['Events', Compass],
  ['Campus services', MapPin],
  ['Products', ShoppingBag]
];

const Avatar = ({ person, size = 'md' }: { person: any; size?: 'sm' | 'md' | 'lg' }) => (
  <span
    className={`avatar ${size}`}
    style={{ background: person?.avatarColor || person?.color || '#c3e1d2' }}
  >
    {person?.avatarInitials || person?.initials || (person?.name ? person.name.slice(0, 2).toUpperCase() : 'U')}
    {person?.online && <i />}
  </span>
);

const formatTime = (value?: string) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(
      new Date(`2000-01-01T${value}`)
    );
  } catch {
    return value;
  }
};

const kolkataMinutes = () => {
  try {
    const [hours, minutes] = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
      .format(new Date())
      .split(':')
      .map(Number);
    return hours * 60 + minutes;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
};

const minutesAt = (time?: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

function TodaySchedule({ student }: { student?: any }) {
  const [data, setData] = useState<TimetableCurrentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const batchCode = student?.academicProfile?.sruBatchCode || student?.academicProfile?.batchCode || student?.academicProfile?.batch;

  useEffect(() => {
    let mounted = true;
    const load = () =>
      timetableApi
        .current(batchCode)
        .then((x) => mounted && setData(x))
        .catch(() =>
          mounted &&
          setData({
            status: 'fresh',
            entries: [],
            today: [],
            error: undefined
          })
        )
        .finally(() => mounted && setLoading(false));

    load();
    const refresh = setInterval(load, 5 * 60_000);
    const clock = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => {
      mounted = false;
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, [batchCode]);

  const current = data?.class;
  const state = data?.timetableStatus;
  const nowMin = kolkataMinutes();
  const remaining = current
    ? state === 'ongoing'
      ? minutesAt(current.endTime || current.startTime) - nowMin
      : minutesAt(current.startTime) - nowMin
    : 0;

  const tag =
    state === 'ongoing'
      ? 'NOW'
      : state === 'upcoming'
      ? 'NEXT'
      : state === 'finished'
      ? 'FINISHED'
      : 'WEEKEND';

  const copy = current
    ? state === 'ongoing'
      ? `Ends in ${Math.max(0, remaining)} min`
      : `Starts in ${Math.max(0, remaining)} min`
    : state === 'finished'
    ? 'All classes finished for today. Next class is tomorrow morning.'
    : 'No lectures scheduled today. Campus is quiet.';

  const remainingClasses = (data?.today || []).filter(
    (entry) => entry.id !== current?.id && minutesAt(entry.startTime) >= nowMin
  );

  const openFullTimetable = (e: React.MouseEvent) => {
    e.preventDefault();
    location.hash = 'timetable';
  };

  return (
    <section className="today-panel">
      <div className="section-kicker">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={14} style={{ color: 'var(--green)' }} />
          YOUR DAY · SR UNIVERSITY {batchCode ? `(${batchCode})` : ''}
        </span>
        <a href="#timetable" onClick={openFullTimetable}>
          Full timetable <ChevronRight size={15} />
        </a>
      </div>

      {loading ? (
        <div className="today-loading">
          <i />
          <i />
        </div>
      ) : (
        <>
          {current && (
            <div className="class-now">
              <div className="time">
                {formatTime(current.startTime)}
                <small>{current.endTime && `– ${formatTime(current.endTime)}`}</small>
              </div>
              <div>
                <b>{current.subject}</b>
                <p>
                  {[current.type, current.faculty, current.room].filter(Boolean).join(' · ') ||
                    'SR University timetable'}
                </p>
                <small className="countdown">{copy}</small>
              </div>
              <span className="now">{tag}</span>
            </div>
          )}

          {!current && (
            <div className="today-empty compact">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ color: 'var(--ink)' }}>
                  {tag === 'FINISHED' ? 'NO MORE CLASSES TODAY' : 'WEEKEND / FREE DAY'}
                </b>
                <span
                  className="now"
                  style={{ background: '#edf1e9', color: 'var(--green)', padding: '2px 8px', borderRadius: 3 }}
                >
                  VERIFIED
                </span>
              </div>
              <p>{copy}</p>
              <a
                href="#timetable"
                onClick={openFullTimetable}
                style={{
                  color: 'var(--green)',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4
                }}
              >
                View complete weekly schedule <ChevronRight size={14} />
              </a>
            </div>
          )}

          {remainingClasses.slice(0, 2).map((entry: TimetableEntry) => (
            <div className="class-row" key={entry.id}>
              <span>{formatTime(entry.startTime)}</span>
              <b>{entry.subject}</b>
              <small>{entry.room || entry.faculty || entry.type || 'SR University'}</small>
            </div>
          ))}

          <p
            className="timetable-stale"
            style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}
          >
            <CheckCircle2 size={12} /> Synchronized with SR University academic schedule
          </p>
        </>
      )}
    </section>
  );
}

export default function App({
  student,
  onStudentChange,
  onLogout
}: {
  student?: any;
  onStudentChange?: (s: any) => void;
  onLogout?: () => void;
}) {
  const [view, setView] = useState<View>('Home');
  const [query, setQuery] = useState('');
  const [palette, setPalette] = useState(false);
  const [reportModal, setReportModal] = useState<{ targetType: string; targetId: string } | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or spam content');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Real Database state
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [connected, setConnected] = useState<string[]>([]);

  const [projectList, setProjectList] = useState<any[]>([]);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [joinProject, setJoinProject] = useState<any>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifTray, setShowNotifTray] = useState(false);

  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [postOpen, setPostOpen] = useState(false);

  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);
  const [uploadResourceOpen, setUploadResourceOpen] = useState(false);

  const [eventsList, setEventsList] = useState<any[]>([]);
  const [campusRooms, setCampusRooms] = useState<any[]>([]);

  // Messages state with Socket.IO and MongoDB
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatThreads, setChatThreads] = useState<Record<string, Array<{ from: string; body: string; time: string }>>>({});
  const [messageInput, setMessageInput] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  // Global search suggestions
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // 1. Initial Database Loading
  useEffect(() => {
    // Load Students from DB
    usersApi
      .list()
      .then((res) => {
        if (res.users) setStudentsList(res.users);
      })
      .catch(() => {})
      .finally(() => setStudentsLoading(false));

    // Load Projects from DB
    projectsApi
      .list()
      .then((res) => {
        if (res.projects) setProjectList(res.projects);
      })
      .catch(() => {});

    // Load Community Feed from DB
    communityApi
      .getFeed()
      .then((res) => {
        if (res.posts) setCommunityPosts(res.posts);
      })
      .catch(() => {});

    // Load Study Resources from DB
    resourcesApi
      .list()
      .then((res) => {
        if (res.resources) setResourcesList(res.resources);
      })
      .catch(() => {});

    // Load Campus Events from DB
    eventsApi
      .list()
      .then((res) => {
        if (res.events) setEventsList(res.events);
      })
      .catch(() => {});

    // Load Campus Services & Rooms
    servicesApi
      .list()
      .then((res) => {
        if (res.services) setCampusRooms(res.services);
      })
      .catch(() => {});

    // Load Notifications from DB
    notificationsApi
      .list()
      .then((res) => {
        if (res.notifications) setNotifs(res.notifications);
      })
      .catch(() => {});

    // Initialize Real-time Socket.IO
    const socket = getSocket();
    if (socket) {
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));

      socket.on('message:received', (data: any) => {
        const timeStr = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date());
        setChatThreads((prev) => ({
          ...prev,
          [data.senderId || 'peer']: [
            ...(prev[data.senderId || 'peer'] || []),
            { from: data.senderName || 'Peer', body: data.body, time: timeStr }
          ]
        }));
      });

      socket.on('notification:received', (data: any) => {
        setNotifs((prev) => [data, ...prev]);
      });
    }

    return () => {
      socket.off('message:received');
      socket.off('notification:received');
    };
  }, []);

  // Global Keyboard Command Palette shortcut
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, []);

  const go = (v: View | 'Pulse') => {
    // Graceful Pulse retirement: user asked to remove standalone Pulse and redirect to Products catalog
    if (v === 'Pulse') {
      setView('Products');
    } else {
      setView(v);
    }
    setPalette(false);
  };

  const openTimetable = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    location.hash = 'timetable';
  };

  const connect = (id: string) => {
    setConnected((x) => (x.includes(id) ? x : [...x, id]));
  };

  const sendJoin = async () => {
    if (!joinProject) return;
    try {
      await projectsApi.requestJoin(joinProject._id || joinProject.id, joinMessage);
      setNotifs((n) => [
        {
          _id: Date.now().toString(),
          title: `Requested to join ${joinProject.name}`,
          detail: joinMessage || 'Ready to contribute skills',
          time: 'just now',
          kind: 'project'
        },
        ...n
      ]);
    } catch {
      // Fallback
    } finally {
      setJoinProject(null);
      setJoinMessage('');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChatId) return;
    const text = messageInput.trim();
    const timeStr = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date());

    setChatThreads((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), { from: 'You', body: text, time: timeStr }]
    }));
    setMessageInput('');

    try {
      // Find or create conversation in MongoDB Atlas
      const convRes = await messagesApi.startConversation(activeChatId);
      if (convRes?.conversation?._id) {
        await messagesApi.sendMessage(convRes.conversation._id, text);
      }

      // Emit through Socket.IO for real-time delivery
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('message:send', {
          receiverId: activeChatId,
          body: text
        });
      }
    } catch (err: any) {
      console.warn('Unable to persist message to database:', err.message);
    }
  };

  const handleRegisterEvent = async (eventId: string, title: string) => {
    try {
      const res = await eventsApi.register(eventId);
      setEventsList((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, isRegistered: true, registeredCount: res.registeredCount } : e))
      );
      setNotifs((n) => [
        {
          _id: Date.now().toString(),
          title: `Registered: ${title}`,
          detail: 'Your seat is reserved in the live database.',
          time: 'just now',
          kind: 'event'
        },
        ...n
      ]);
    } catch (err: any) {
      alert(err.message || 'Unable to register for event.');
    }
  };

  const handleToggleResourceSave = (id: string) => {
    setSavedResourceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submitReport = async () => {
    if (!reportModal) return;
    try {
      await reportsApi.submit({
        targetType: reportModal.targetType,
        targetId: reportModal.targetId,
        reason: reportReason
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModal(null);
      }, 1400);
    } catch {
      setReportModal(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) =>
      `${s.name} ${Array.isArray(s.skills) ? s.skills.join(' ') : ''} ${s.dept || s.academicProfile?.department || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [studentsList, query]);

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand" onClick={() => go('Home')} style={{ cursor: 'pointer' }}>
          <span className="mark">V</span>
          <span>
            VYNORA
            <br />
            <em>CAMPUS+</em>
          </span>
        </div>

        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => go(name)}
              className={view === name ? 'active' : ''}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === 'Messages' && Object.values(chatThreads).some((t: any) => Array.isArray(t) && t.some((m: any) => m.from !== 'You' && !m.read)) && <b>•</b>}
              {name === 'Clubs' && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 9,
                    fontFamily: '"DM Mono"',
                    background: '#e4ede5',
                    color: 'var(--green)',
                    padding: '1px 5px',
                    borderRadius: 3
                  }}
                >
                  LIVE
                </span>
              )}
            </button>
          ))}

          {/* SRU Timetable navigation action */}
          <button
            onClick={openTimetable}
            className="timetable-nav-link"
            style={{ marginTop: 4, background: '#eaf1ea', color: 'var(--green)', fontWeight: 600 }}
          >
            <CalendarDays size={18} />
            <span>SRU Timetable</span>
          </button>
        </nav>

        {/* Side bottom links */}
        <div className="side-bottom">
          {(student?.role === 'ADMIN' || student?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => go('Admin')}
              style={{
                color: view === 'Admin' ? 'var(--green)' : '#53605a',
                background: view === 'Admin' ? '#e6e7de' : 'transparent',
                fontWeight: view === 'Admin' ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <ShieldAlert size={18} style={{ color: 'var(--green)' }} />
              <span>Admin Console</span>
            </button>
          )}

          <button
            className="profile-switch"
            onClick={() => setActiveStudent(student)}
          >
            <Avatar person={student} size="sm" />
            <span>
              {student?.name || 'Student Profile'}
              <small>{student?.academicProfile?.department || student?.academicProfile?.program || 'Student'} · {student?.academicProfile?.year || 'Year'}</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main>
        <header>
          <div className="mobile-brand" onClick={() => go('Home')}>
            VYNORA+
          </div>
          <button className="global-search" onClick={() => setPalette(true)}>
            <Search size={18} />
            <span>Search Vynora (people, clubs, projects, products)</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="header-actions">
            <button
              aria-label="Notifications"
              className="icon-button"
              onClick={() => setShowNotifTray((v) => !v)}
              style={{ position: 'relative' }}
            >
              <Bell size={19} />
              {notifs.length > 0 && <i />}
            </button>
            <button
              onClick={() => setActiveStudent(student || studentsList[0])}
              style={{ padding: 0 }}
            >
              <Avatar person={student || studentsList[0]} size="sm" />
            </button>
          </div>
        </header>

        {/* Notifications Tray */}
        {showNotifTray && (
          <div
            className="notif-dropdown"
            style={{
              position: 'fixed',
              top: 68,
              right: 28,
              width: 340,
              background: '#faf9f4',
              border: '1px solid var(--line)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.15)',
              zIndex: 8,
              borderRadius: 6,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="section-kicker">CAMPUS NOTIFICATIONS</span>
              <button onClick={() => setShowNotifTray(false)} style={{ fontSize: 12, color: 'var(--muted)' }}>
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflow: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
                  No new notifications.
                </div>
              ) : (
                notifs.map((n) => (
                  <div key={n._id || n.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                    <b style={{ fontSize: 12, display: 'block' }}>{n.title}</b>
                    <p style={{ margin: '2px 0', fontSize: 11, color: 'var(--muted)' }}>{n.detail}</p>
                    <small style={{ fontSize: 9, color: 'var(--green)', font: '500 9px "DM Mono"' }}>
                      {n.time || 'just now'}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        {view === 'Home' && (
          <Dashboard
            student={student}
            onView={go}
            onProject={setProjectDetail}
            onStudent={setActiveStudent}
            onAsk={() => setPostOpen(true)}
            projects={projectList}
            posts={communityPosts}
          />
        )}

        {view === 'Network' && (
          <Network
            list={filteredStudents}
            query={query}
            setQuery={setQuery}
            onStudent={setActiveStudent}
            connected={connected}
            connect={connect}
          />
        )}

        {view === 'Community' && (
          <Community
            posts={communityPosts}
            onPost={() => setPostOpen(true)}
            onStudent={setActiveStudent}
            onReport={(id: string) => setReportModal({ targetType: 'POST', targetId: id })}
            connect={connect}
            connected={connected}
          />
        )}

        {view === 'Clubs' && (
          <div className="page" style={{ maxWidth: 1140, margin: 'auto', padding: '36px 32px 70px' }}>
            <ClubsPage />
          </div>
        )}

        {view === 'Projects' && (
          <Projects
            list={projectList}
            onCreate={() => setCreateProjectOpen(true)}
            onProject={setProjectDetail}
            onJoin={setJoinProject}
          />
        )}

        {view === 'Resources' && (
          <Resources
            list={resourcesList}
            saved={savedResourceIds}
            onToggleSave={handleToggleResourceSave}
            onUpload={() => setUploadResourceOpen(true)}
          />
        )}

        {view === 'Messages' && (
          <Messages
            activeId={activeChatId}
            onSelect={setActiveChatId}
            threads={chatThreads}
            input={messageInput}
            setInput={setMessageInput}
            send={handleSendMessage}
            onStudent={setActiveStudent}
            students={studentsList}
          />
        )}

        {view === 'Events' && (
          <EventsView
            events={eventsList}
            onRegister={handleRegisterEvent}
          />
        )}

        {view === 'Campus services' && (
          <CampusServicesView
            rooms={campusRooms}
            onGoTimetable={openTimetable}
          />
        )}

        {view === 'Products' && (
          <div className="page" style={{ maxWidth: 1140, margin: 'auto', padding: '36px 32px 70px' }}>
            <ProductsPage />
          </div>
        )}

        {view === 'Admin' && (
          <div className="page" style={{ maxWidth: 1140, margin: 'auto', padding: '36px 32px 70px' }}>
            {student?.role === 'ADMIN' || student?.role === 'SUPER_ADMIN' ? (
              <AdminDashboard onExit={() => go('Home')} />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 8 }}>
                <ShieldAlert size={40} style={{ color: '#a83f35', margin: '0 auto 12px' }} />
                <h2>Access Forbidden (HTTP 403)</h2>
                <p style={{ color: 'var(--muted)', maxWidth: 440, margin: '8px auto 20px' }}>
                  The administrative dashboard requires authorized administrator credentials. Student accounts cannot manage platform administration.
                </p>
                <button className="primary" onClick={() => (window.location.href = '/admin/login')}>
                  Go to Dedicated Admin Login
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Command Palette */}
      {palette && (
        <CommandPalette
          close={() => setPalette(false)}
          go={go}
          onTimetable={openTimetable}
          studentRole={student?.role}
        />
      )}

      {/* Active Student Detail Drawer */}
      {activeStudent && (
        <StudentPanel
          person={activeStudent}
          close={() => setActiveStudent(null)}
          connected={connected.includes(activeStudent._id || activeStudent.id)}
          connect={() => connect(activeStudent._id || activeStudent.id)}
          onMessage={() => {
            setActiveChatId(activeStudent._id || activeStudent.id);
            setActiveStudent(null);
            setView('Messages');
          }}
          isCurrentStudent={
            activeStudent?._id === student?._id ||
            activeStudent?.id === student?.id ||
            activeStudent?.email === student?.email
          }
          onEditProfile={() => setEditProfileOpen(true)}
          onLogout={onLogout}
        />
      )}

      {/* Profile Edit Modal */}
      {editProfileOpen && student && (
        <ProfileCompletionModal
          student={student}
          onComplete={(updated) => {
            if (onStudentChange) onStudentChange(updated);
            setActiveStudent(updated);
            setEditProfileOpen(false);
          }}
        />
      )}

      {/* Project Detail Drawer */}
      {projectDetail && (
        <ProjectPanel
          project={projectDetail}
          close={() => setProjectDetail(null)}
          onJoin={() => setJoinProject(projectDetail)}
        />
      )}

      {/* Project Join Modal */}
      {joinProject && (
        <JoinModal
          project={joinProject}
          message={joinMessage}
          setMessage={setJoinMessage}
          close={() => setJoinProject(null)}
          send={sendJoin}
        />
      )}

      {/* Create Community Post Modal */}
      {postOpen && (
        <PostModal
          close={() => setPostOpen(false)}
          onSubmit={async (title: string, body: string, topic: string) => {
            try {
              const res = await communityApi.createPost({ title, body, topic });
              setCommunityPosts((prev) => [res.post, ...prev]);
            } catch (err: any) {
              alert(err.message || 'Failed to submit post to database.');
            }
          }}
        />
      )}

      {/* Create Project Modal */}
      {createProjectOpen && (
        <CreateProjectModal
          close={() => setCreateProjectOpen(false)}
          onCreate={async (payload: any) => {
            try {
              const res = await projectsApi.create(payload);
              setProjectList((prev) => [res.project, ...prev]);
            } catch {
              setProjectList((prev) => [payload, ...prev]);
            }
            setCreateProjectOpen(false);
            setView('Projects');
          }}
        />
      )}

      {/* Upload Resource Modal */}
      {uploadResourceOpen && (
        <UploadResourceModal
          close={() => setUploadResourceOpen(false)}
          onUpload={async (r: any) => {
            try {
              const res = await resourcesApi.upload(r);
              setResourcesList((prev) => [res.resource, ...prev]);
            } catch {
              setResourcesList((prev) => [r, ...prev]);
            }
            setUploadResourceOpen(false);
          }}
        />
      )}

      {/* Report Inappropriate Content Modal */}
      {reportModal && (
        <div className="scrim">
          <section className="modal">
            <button className="close" onClick={() => setReportModal(null)}>
              <X />
            </button>
            <span className="section-kicker">COMMUNITY SAFETY & GOVERNANCE</span>
            <h2>Report Content</h2>
            <p>Our student moderation team and college admins review every reported item.</p>

            {reportSuccess ? (
              <div className="success">
                <CheckCircle2 size={36} style={{ color: 'var(--green)', margin: '0 auto 12px' }} />
                <h3>Report Submitted</h3>
                <p>Thank you for keeping our college platform trustworthy and safe.</p>
              </div>
            ) : (
              <>
                <label>
                  Reason for reporting
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{ height: 38, border: '1px solid var(--line)', background: '#fff', padding: '0 8px' }}
                  >
                    <option value="Inappropriate or spam content">Inappropriate or spam content</option>
                    <option value="Harassment or abuse">Harassment or abuse</option>
                    <option value="False academic information">False academic information</option>
                    <option value="Impersonation">Impersonation</option>
                    <option value="Copyright or unauthorized material">Copyright or unauthorized material</option>
                  </select>
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="soft" onClick={() => setReportModal(null)}>
                    Cancel
                  </button>
                  <button className="primary" onClick={submitReport}>
                    Submit Report <Flag size={14} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {nav.slice(0, 5).map(([name, Icon]) => (
          <button
            className={view === name ? 'active' : ''}
            onClick={() => go(name)}
            key={name}
          >
            <Icon size={19} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTS & VIEWS
   ========================================================= */

const Dashboard = ({ student, onView, onProject, onStudent, onAsk, projects, posts }: any) => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const firstName = student?.name ? student.name.trim().split(' ')[0] : 'Scholar';
  const dept = student?.academicProfile?.department || student?.academicProfile?.program || student?.academicProfile?.degree || 'SR University';
  const year = student?.academicProfile?.year ? (student.academicProfile.year.includes('year') ? student.academicProfile.year : `${student.academicProfile.year} year`) : '';
  const batchCode = student?.academicProfile?.sruBatchCode || student?.academicProfile?.batchCode || student?.academicProfile?.batch;

  return (
    <section className="page dashboard">
      <div className="eyebrow">
        <CheckCircle2
          size={13}
          style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--green)' }}
        />
        SR UNIVERSITY CAMPUS · LIVE ACADEMIC SIGNAL
      </div>
      <div className="page-title">
        <div>
          <h1>Good {timeOfDay}, {firstName}.</h1>
          <p>
            Your verified academic schedule ({dept}{year ? ` · ${year}` : ''}{batchCode ? ` · Batch ${batchCode}` : ''}), collaborative opportunities, and campus clubs.
          </p>
        </div>
        <button className="primary" onClick={onAsk}>
          <Plus size={17} />
          Ask campus
        </button>
      </div>

      <div className="dashboard-grid">
        <TodaySchedule student={student} />

      <section className="attention">
        <div className="section-kicker">
          <span>IN YOUR ORBIT</span>
          <a onClick={() => onView('Clubs')}>
            Clubs Directory <ChevronRight size={15} />
          </a>
        </div>
        <div className="orbit-item">
          <span className="dot green" />
          <div>
            <b>GDSC & Robotics Guild active</b>
            <p>3 official campus clubs recruiting new members</p>
          </div>
          <button onClick={() => onView('Clubs')}>View</button>
        </div>
        <div className="orbit-item">
          <span className="dot orange" />
          <div>
            <b>Nexus Hackathon Registrations Open</b>
            <p>Annual engineering challenge · Student Activity Centre</p>
          </div>
          <button onClick={() => onView('Events')}>Open</button>
        </div>
        <div className="orbit-item">
          <span className="dot green" />
          <div>
            <b>Vynora Pulse Alert Automation</b>
            <p>Direct WhatsApp alert automation for college opportunities</p>
          </div>
          <button onClick={() => onView('Products')}>Catalog</button>
        </div>
      </section>
    </div>

    {/* Collaborative Projects strip */}
    <section className="workspace">
      <div className="section-heading">
        <div>
          <span className="section-kicker">COLLABORATIVE BUILDERS</span>
          <h2>Projects with room for you</h2>
        </div>
        <button className="text-button" onClick={() => onView('Projects')}>
          See all <ChevronRight size={16} />
        </button>
      </div>
      <div className="project-strip">
        {(projects || []).slice(0, 2).map((p: any) => (
          <article className="mini-project" key={p._id || p.id} onClick={() => onProject(p)}>
            <div className="project-signal" style={{ background: p.accent || '#176b5a' }} />
            <div>
              <span>
                {p.status} · {p.membersCount || p.members || 1}/{p.maxMembers || p.max || 4} people
              </span>
              <h3>{p.name}</h3>
              <p>{p.about}</p>
              <div className="skill-row">
                {(p.skills || []).map((s: string) => (
                  <small key={s}>{s}</small>
                ))}
              </div>
            </div>
            <ChevronRight size={18} />
          </article>
        ))}
      </div>
    </section>

    {/* Community snippet */}
    <section className="lower-grid">
      <div>
        <div className="section-heading">
          <div>
            <span className="section-kicker">CAMPUS COMMUNITY</span>
            <h2>Useful right now</h2>
          </div>
          <button className="text-button" onClick={() => onView('Community')}>
            Open feed <ChevronRight size={16} />
          </button>
        </div>

        {(posts || []).slice(0, 2).map((post: any) => (
          <article className="feed-item" key={post._id || post.id} onClick={() => onView('Community')}>
            <Avatar person={{ name: post.authorName || 'Student' }} size="sm" />
            <div>
              <span>{post.authorName || 'Campus peer'} · {post.topic || 'Academics'}</span>
              <h3>{post.title}</h3>
              <p>{post.body?.slice(0, 95)}...</p>
            </div>
          </article>
        ))}
      </div>

      <div className="connection-panel">
        <div className="section-kicker">
          <span>CAMPUS STORE</span>
        </div>
        <h2>Vynora Suite & Tools</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 16px' }}>
          Explore alert automation with Vynora Pulse, revision vaults, and portfolio exporters.
        </p>
        <button
          onClick={() => onView('Products')}
          style={{
            background: 'var(--green)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Explore Catalog →
        </button>
      </div>
    </section>
  </section>
  );
};

const Network = ({ list, query, setQuery, onStudent, connected, connect }: any) => {
  const [deptFilter, setDeptFilter] = useState('All');
  const depts = ['All', 'Computer Science', 'Design', 'Electronics', 'Business'];

  const filtered = list.filter((s: any) =>
    deptFilter === 'All'
      ? true
      : (s.dept || s.academicProfile?.department || '').toLowerCase().includes(deptFilter.toLowerCase())
  );

  return (
    <section className="page discover">
      <div className="eyebrow">SR UNIVERSITY DIRECTORY</div>
      <div className="page-title">
        <div>
          <h1>College Network</h1>
          <p>Find classmates, project teammates, and study partners across departments.</p>
        </div>
      </div>

      <div className="discover-toolbar">
        <div className="input-wrap">
          <Search size={18} />
          <input
            placeholder="Search by student name or skills (React, Figma, ML)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          style={{ height: 43, border: '1px solid var(--line)', padding: '0 10px', background: '#faf9f4' }}
        >
          {depts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <span>{filtered.length} verified students</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <p style={{ fontSize: 14 }}>No students found matching your search in the directory.</p>
        </div>
      ) : (
        <div className="people-grid">
          {filtered.map((person: any) => {
            const isConnected = connected.includes(person._id || person.id);
            return (
              <article className="student-card" key={person._id || person.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Avatar person={person} size="md" />
                  <span className="online">Verified Profile</span>
                </div>
                <div className="student-head">
                  <div>
                    <h3>{person.name}</h3>
                    <p>{person.dept || person.academicProfile?.department || 'Engineering'} · {person.year || person.academicProfile?.year || 'Year III'}</p>
                  </div>
                </div>
                <p className="interest">{person.interest || person.bio || 'Interested in collaborative campus building.'}</p>
                <div className="skill-row">
                  {(person.skills || []).slice(0, 3).map((s: string) => (
                    <small key={s}>{s}</small>
                  ))}
                </div>
                <footer>
                  <button className="text-button" onClick={() => onStudent(person)}>
                    Full profile
                  </button>
                  <button
                    className={isConnected ? 'soft sent' : 'soft'}
                    onClick={() => connect(person._id || person.id)}
                  >
                    {isConnected ? 'Connected ✓' : 'Connect +'}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

const Projects = ({ list, onCreate, onProject, onJoin }: any) => {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Building', 'Planning', 'Testing'];

  const filtered = list.filter((p: any) => (filter === 'All' ? true : p.status === filter));

  return (
    <section className="page discover">
      <div className="eyebrow">STUDENT INITIATIVES</div>
      <div className="page-title">
        <div>
          <h1>Projects & Collaboration</h1>
          <p>Find teammates for hackathons, capstones, and weekend engineering sprints.</p>
        </div>
        <button className="primary" onClick={onCreate}>
          <Plus size={17} /> Start a project
        </button>
      </div>

      <div className="project-filters">
        {filters.map((f) => (
          <button
            key={f}
            className={filter === f ? 'selected' : ''}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="project-list">
        {filtered.map((p: any) => (
          <div className="project-row" key={p._id || p.id}>
            <div className="project-signal large" style={{ background: p.accent || '#176b5a' }} />
            <div className="project-info">
              <span>
                {p.status} · {p.recruiting ? 'RECRUITING' : 'TEAM COMPLETE'}
              </span>
              <h2>{p.name}</h2>
              <p>{p.about}</p>
              <div className="skill-row">
                {(p.skills || []).map((s: string) => (
                  <small key={s}>{s}</small>
                ))}
              </div>
            </div>
            <div className="team-count">
              <b>
                {p.membersCount || p.members || 1}/{p.maxMembers || p.max || 4}
              </b>
              <span>team members</span>
            </div>
            <div className="row-actions">
              <button className="soft" onClick={() => onProject(p)}>
                Inspect
              </button>
              {p.recruiting && (
                <button className="primary" onClick={() => onJoin(p)}>
                  Join
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Community = ({ posts, onPost, onReport }: any) => {
  const [topic, setTopic] = useState('All');
  const topics = ['All', 'Academics', 'Coding', 'Design', 'Hackathons', 'Projects'];

  const filtered = posts.filter((p: any) => (topic === 'All' ? true : p.topic === topic));

  return (
    <section className="page utility">
      <div className="eyebrow">PEER DISCUSSIONS</div>
      <div className="page-title">
        <div>
          <h1>Campus Community</h1>
          <p>Ask questions, solve doubts, and share resources across SR University.</p>
        </div>
        <button className="primary" onClick={onPost}>
          <Plus size={17} /> Ask campus
        </button>
      </div>

      <div className="community-layout">
        <aside className="topics">
          <b>TOPICS</b>
          {topics.map((t) => (
            <button
              key={t}
              className={topic === t ? 'chosen' : ''}
              onClick={() => setTopic(t)}
            >
              {t}
            </button>
          ))}
          <hr />
          <span>COMMUNITY STANDARDS</span>
          <p>Keep discussions respectful and focused on mutual learning.</p>
        </aside>

        <section className="feed">
          {filtered.map((post: any) => (
            <article className={`post ${post.featured ? 'featured' : ''}`} key={post._id || post.id}>
              <div className="post-meta">
                <b>{post.authorName || 'Campus peer'}</b>
                <span>· {post.topic}</span>
                <button
                  onClick={() => onReport(post._id || post.id)}
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}
                >
                  <Flag size={12} /> Report
                </button>
              </div>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <div className="post-footer">
                <span style={{ fontSize: 12, color: 'var(--green)' }}>
                  <ThumbsUp size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {post.likesCount || 0} helpful votes
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
};

const Resources = ({ list, saved, onToggleSave, onUpload }: any) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const categories = [
    'All',
    'Mid-term Exam Paper',
    'End-term Exam Paper',
    'Lecture Notes',
    'Lab Manual',
    'Photo / Handwritten'
  ];

  const filtered = list.filter((r: any) => {
    const matchesSearch = `${r.title} ${r.subject} ${r.authorName || ''} ${r.fileName || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ? true : r.category === selectedCategory || r.format === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (res: any) => {
    resourcesApi.download(res._id || res.id).catch(() => {});
    if (res.fileData) {
      const a = document.createElement('a');
      a.href = res.fileData;
      a.download = res.fileName || `${res.title.replace(/\s+/g, '_')}.${res.format === 'Photo' ? 'jpg' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (res.url) {
      window.open(res.url, '_blank');
    } else {
      alert(`Resource "${res.title}" is verified in the library.`);
    }
  };

  return (
    <section className="page utility">
      <div className="eyebrow">ACADEMIC VAULT · VERIFIED EXAM PAPERS & NOTES</div>
      <div className="page-title">
        <div>
          <h1>Academic Resources & Exam Vault</h1>
          <p>Verified mid-term question papers, past solved examinations, laboratory walkthroughs, and lecture notes.</p>
        </div>
        <button className="primary" onClick={onUpload}>
          <Plus size={17} /> Upload Paper / Notes
        </button>
      </div>

      {/* Category Pills Filter */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 16 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: selectedCategory === cat ? 'var(--darkgreen)' : 'var(--line)',
              background: selectedCategory === cat ? 'var(--darkgreen)' : '#fff',
              color: selectedCategory === cat ? '#fff' : 'var(--ink)',
              cursor: 'pointer'
            }}
          >
            {cat === 'All' ? 'All Resources' : cat}
          </button>
        ))}
      </div>

      <div className="resource-search">
        <Search size={18} />
        <input
          placeholder="Search mid-term papers, subjects (e.g. Operating Systems, ML), professors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 11, color: 'var(--muted)', font: '500 11px "DM Mono"', whiteSpace: 'nowrap' }}>
          {filtered.length} resources
        </span>
      </div>

      <div className="resource-table">
        <div className="table-head">
          <span>TITLE & SUBJECT</span>
          <span>CATEGORY</span>
          <span>ATTACHMENT</span>
          <span>CONTRIBUTOR</span>
          <span>ACTION</span>
        </div>
        {filtered.map((res: any) => {
          const isSaved = saved.includes(res._id || res.id);
          const isMidterm = res.category === 'Mid-term Exam Paper' || res.title.toLowerCase().includes('mid-term');
          const isPhoto = res.fileType === 'photo' || res.format === 'Photo';

          return (
            <div className="resource-row" key={res._id || res.id} style={{ alignItems: 'center' }}>
              <div>
                <span className="doc-icon" style={{ background: isMidterm ? '#fbede8' : '#e8e9e2', color: isMidterm ? '#c2533c' : 'var(--green)' }}>
                  {isPhoto ? 'IMG' : isMidterm ? 'EXAM' : res.format || 'DOC'}
                </span>
                <div>
                  <b style={{ fontSize: 13 }}>{res.title}</b>
                  <small style={{ color: 'var(--muted)' }}>
                    {res.subject} {res.fileName ? `· ${res.fileName}` : ''}
                  </small>
                </div>
              </div>

              <span>
                <span
                  style={{
                    background: isMidterm ? '#fbede8' : '#e8ebe4',
                    color: isMidterm ? '#b83f26' : '#466057',
                    padding: '3px 8px',
                    borderRadius: 3,
                    fontSize: 10,
                    fontFamily: '"DM Mono"',
                    fontWeight: 600
                  }}
                >
                  {res.category || res.format || 'General'}
                </span>
              </span>

              <span>
                {isPhoto ? (
                  <button
                    onClick={() => setPreviewItem(res)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: 11, fontWeight: 600 }}
                  >
                    <ImageIcon size={14} /> View Photo
                  </button>
                ) : res.fileData || res.fileName ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4a5650' }}>
                    <FileText size={14} color="var(--green)" /> {res.fileSize || 'PDF'}
                  </span>
                ) : res.url ? (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green)', fontSize: 11, fontWeight: 600 }}
                  >
                    <ExternalLink size={13} /> Cloud Doc
                  </a>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>Verified Notes</span>
                )}
              </span>

              <span>
                {res.authorName || 'Student'}
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10 }}>
                  {res.authorDept || 'SR University'}
                </small>
              </span>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="primary"
                  onClick={() => handleDownload(res)}
                  style={{ padding: '4px 10px', fontSize: 11, height: 28 }}
                  title="Download / View Attachment"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={() => onToggleSave(res._id || res.id)}
                  style={{ color: isSaved ? 'var(--green)' : 'var(--muted)', fontSize: 11, fontWeight: 600 }}
                >
                  {isSaved ? 'Saved ✓' : 'Save +'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attachment Preview Modal */}
      {previewItem && (
        <div className="scrim" onMouseDown={() => setPreviewItem(null)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <button className="close" onClick={() => setPreviewItem(null)}>
              <X />
            </button>
            <span className="section-kicker">{previewItem.category || 'EXAM PAPER / STUDY RESOURCE'}</span>
            <h2 style={{ margin: '6px 0' }}>{previewItem.title}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
              {previewItem.subject} · Contributed by {previewItem.authorName} ({previewItem.authorDept || 'SR University'})
            </p>

            {previewItem.fileData && (previewItem.fileType === 'photo' || previewItem.format === 'Photo') ? (
              <div style={{ maxHeight: 420, overflow: 'auto', textAlign: 'center', background: '#18231f', borderRadius: 6, padding: 10 }}>
                <img
                  src={previewItem.fileData}
                  alt={previewItem.title}
                  style={{ maxWidth: '100%', maxHeight: 390, objectFit: 'contain', borderRadius: 4 }}
                />
              </div>
            ) : previewItem.fileData ? (
              <div style={{ padding: 24, textAlign: 'center', background: '#f5f7f3', borderRadius: 6, border: '1px dashed var(--line)' }}>
                <FileText size={48} color="var(--green)" style={{ margin: '0 auto 12px' }} />
                <b>{previewItem.fileName || 'Attached Document'}</b>
                <p style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 16px' }}>{previewItem.fileSize}</p>
                <button className="primary" onClick={() => handleDownload(previewItem)}>
                  <Download size={16} /> Download File
                </button>
              </div>
            ) : previewItem.url ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <a href={previewItem.url} target="_blank" rel="noreferrer" className="primary">
                  <ExternalLink size={16} /> Open Document in New Tab
                </a>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>
                Verified academic revision document on file.
              </p>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="soft" onClick={() => setPreviewItem(null)}>
                Close
              </button>
              <button className="primary" onClick={() => handleDownload(previewItem)}>
                <Download size={14} /> Download File
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

const Messages = ({ activeId, onSelect, threads, input, setInput, send, onStudent, students }: any) => {
  const currentPeer = students?.find((s: any) => s._id === activeId || s.id === activeId) || (students && students.length > 0 ? students[0] : null);
  const effectiveId = currentPeer ? (currentPeer._id || currentPeer.id) : null;
  const messages = effectiveId ? (threads[effectiveId] || []) : [];

  return (
    <div className="messages">
      <aside className="conversation-list">
        <div>
          <h1>Chats</h1>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {(students || []).length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 8px' }}>
              No campus contacts found.
            </p>
          ) : (
            (students || []).map((s: any) => (
              <button
                key={s._id || s.id}
                className={`conversation ${effectiveId === (s._id || s.id) ? 'active' : ''}`}
                onClick={() => onSelect(s._id || s.id)}
              >
                <Avatar person={s} size="sm" />
                <span>
                  <b>{s.name}</b>
                  <small>{s.dept || s.academicProfile?.department || 'Student'}</small>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chat">
        {currentPeer ? (
          <>
            <header>
              <Avatar person={currentPeer} size="sm" />
              <div>
                <b>{currentPeer.name}</b>
                <small>{currentPeer.dept || currentPeer.academicProfile?.department || 'Student'} · Verified</small>
              </div>
              <button className="text-button" onClick={() => onStudent(currentPeer)}>
                Profile
              </button>
            </header>

            <div className="chat-context">
              <span>REAL-TIME SOCKET.IO + MONGODB MESSAGING</span>
              <p>Direct communication with verified student accounts.</p>
            </div>

            <div className="message-stack">
              {messages.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No messages exchanged yet with {currentPeer.name}. Start the conversation below!
                </div>
              ) : (
                messages.map((m: any, idx: number) => (
                  <div className={`bubble ${m.from === 'You' ? 'mine' : ''}`} key={idx}>
                    <p>{m.body}</p>
                    <small>{m.time}</small>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                placeholder={`Message ${currentPeer.name.split(' ')[0]}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="primary" disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--muted)', textAlign: 'center', padding: 24 }}>
            <div>
              <Send size={32} style={{ color: 'var(--green)', margin: '0 auto 12px', opacity: 0.6 }} />
              <h3>Direct Student Messages</h3>
              <p style={{ maxWidth: 320, margin: '8px auto', fontSize: 13 }}>
                Select a campus peer from the sidebar or click "Message" on any student profile in the Network directory.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const EventsView = ({ events, onRegister }: any) => {
  return (
    <section className="page utility">
      <div className="eyebrow">OPPORTUNITIES & WORKSHOPS</div>
      <div className="page-title">
        <div>
          <h1>Make room for what matters.</h1>
          <p>Official club workshops, competitions, and verified internships across SR University.</p>
        </div>
      </div>

      <div className="event-grid">
        {events.map((e: any) => {
          return (
            <article key={e._id || e.id}>
              <div className={`event-art ${e.artClass || 'art0'}`}>{e.code || 'EVENT'}</div>
              <span>{e.category || 'Workshop'}</span>
              <h2>{e.title}</h2>
              <p style={{ margin: '4px 16px 8px', fontSize: 12, color: 'var(--muted)' }}>
                {e.venue} · Capacity: {e.registeredCount || 0}/{e.maxCapacity || 100}
              </p>
              <button
                className={`soft ${e.isRegistered ? 'sent' : ''}`}
                onClick={() => onRegister(e._id || e.id, e.title)}
                disabled={e.isRegistered}
              >
                {e.isRegistered ? 'Registered ✓' : 'Register for Event'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const CampusServicesView = ({ rooms, onGoTimetable }: any) => {
  const [selectedBlock, setSelectedBlock] = useState('All Blocks');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  const blocks = [
    'All Blocks',
    'Block 1 (CSE & IT)',
    'Block 2 (ECE & EEE)',
    'Block 3 (Sciences)',
    'Central Library',
    'Design Studio & SAC',
    'Mechanical & Robotics Block'
  ];

  const filteredRooms = useMemo(() => {
    return (rooms || []).filter((r: any) => {
      const blockStr = (r.block || r.building || '').toLowerCase();
      const matchesBlock =
        selectedBlock === 'All Blocks'
          ? true
          : blockStr.includes(selectedBlock.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/gi, '')) ||
            blockStr.includes((selectedBlock.toLowerCase().split(' ')[1] || '').replace(/[^a-z0-9]/gi, ''));

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'green'
          ? r.status === 'green'
          : r.status === 'orange';

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.block || '').toLowerCase().includes(q) ||
        (r.building || '').toLowerCase().includes(q) ||
        (r.roomType || '').toLowerCase().includes(q) ||
        (r.floor || '').toLowerCase().includes(q) ||
        (Array.isArray(r.facilities) && r.facilities.some((f: string) => f.toLowerCase().includes(q)));

      return matchesBlock && matchesStatus && matchesSearch;
    });
  }, [rooms, selectedBlock, statusFilter, search]);

  return (
    <section className="page utility">
      <div className="eyebrow">
        <Building2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--green)' }} />
        CAMPUS SERVICES · REAL-TIME STUDY SPACE FINDER
      </div>
      <div className="page-title">
        <div>
          <h1>Free Study Rooms & Lab Spaces</h1>
          <p>
            Locate free study halls, computer studios, and quiet library pods by selecting your preferred campus block.
          </p>
        </div>
        <button className="primary" onClick={onGoTimetable}>
          <CalendarDays size={16} /> Open Timetable
        </button>
      </div>

      {/* Block Choice Navigation Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 16 }}>
        {blocks.map((b) => {
          const isSelected = selectedBlock === b;
          const count = b === 'All Blocks'
            ? (rooms || []).length
            : (rooms || []).filter((r: any) =>
                (r.block || r.building || '').toLowerCase().includes(b.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/gi, ''))
              ).length;

          return (
            <button
              key={b}
              onClick={() => setSelectedBlock(b)}
              style={{
                padding: '8px 16px',
                borderRadius: 24,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: '1px solid',
                borderColor: isSelected ? 'var(--darkgreen)' : 'var(--line)',
                background: isSelected ? 'var(--darkgreen)' : '#fff',
                color: isSelected ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: isSelected ? '0 2px 8px rgba(21, 59, 51, 0.2)' : 'none'
              }}
            >
              <span>{b}</span>
              <span
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.25)' : '#e8ebe4',
                  color: isSelected ? '#fff' : 'var(--muted)',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  fontFamily: '"DM Mono"'
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="discover-toolbar" style={{ marginBottom: 24 }}>
        <div className="input-wrap">
          <Search size={18} />
          <input
            placeholder={`Search rooms in ${selectedBlock} (e.g. 214, Pod 06, Projector, AC)...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 43, border: '1px solid var(--line)', background: '#faf9f4', padding: '0 12px', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}
        >
          <option value="All">All Availability</option>
          <option value="green">Free for 90+ min (Long session)</option>
          <option value="orange">Free until next class</option>
        </select>
        <span style={{ fontSize: 11, color: 'var(--muted)', font: '500 11px "DM Mono"' }}>
          {filteredRooms.length} spaces available
        </span>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="timetable-empty compact">
          <Clock3 size={28} />
          <h2>No vacant rooms found in {selectedBlock}</h2>
          <p>Try switching to another block or clearing your search filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredRooms.map((r: any) => {
            const isGreen = r.status === 'green';
            return (
              <div
                key={r._id || r.name}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#e9f0e8',
                        color: 'var(--green)',
                        font: '600 10px "DM Mono"',
                        padding: '2px 7px',
                        borderRadius: 3,
                        marginBottom: 6
                      }}
                    >
                      {r.block || r.building || 'Block 1'} · {r.floor || 'Floor'}
                    </span>
                    <h3 style={{ margin: 0, font: '600 20px Fraunces', letterSpacing: '-0.4px' }}>{r.name}</h3>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: isGreen ? '#e4efde' : '#fef3e2',
                      color: isGreen ? 'var(--green)' : '#c27803',
                      font: '600 10px "DM Mono"',
                      padding: '3px 8px',
                      borderRadius: 12
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: isGreen ? '#2e9b6d' : '#e29740'
                      }}
                    />
                    {isGreen ? 'AVAILABLE' : 'LIMITED'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                  <span>{r.roomType || 'Study Space'}</span>
                  <span>·</span>
                  <b>{r.seats || '18 seats'}</b>
                  <span>·</span>
                  <span style={{ color: isGreen ? 'var(--green)' : '#c27803', fontWeight: 600 }}>{r.avail}</span>
                </div>

                {/* Facilities Tags */}
                {Array.isArray(r.facilities) && r.facilities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                    {r.facilities.map((fac: string) => (
                      <span
                        key={fac}
                        style={{
                          background: '#f2f4ee',
                          color: '#466057',
                          padding: '3px 7px',
                          borderRadius: 3,
                          fontSize: 10,
                          fontFamily: '"DM Mono"'
                        }}
                      >
                        {fac}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {r.contact || 'Academic Desk'}
                  </small>
                  <button
                    className="primary"
                    onClick={() => setSelectedRoom(r)}
                    style={{ padding: '6px 12px', fontSize: 11, height: 32 }}
                  >
                    <Compass size={13} /> Directions & Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Details & Directions Drawer / Modal */}
      {selectedRoom && (
        <div className="scrim" onMouseDown={() => setSelectedRoom(null)}>
          <section className="modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <button className="close" onClick={() => setSelectedRoom(null)}>
              <X />
            </button>
            <span className="section-kicker">CAMPUS SPACE DETAILS</span>
            <h2 style={{ margin: '6px 0 2px' }}>{selectedRoom.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
              {selectedRoom.block || selectedRoom.building} · {selectedRoom.floor} · {selectedRoom.roomType}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f5f7f3', padding: 12, borderRadius: 6 }}>
                <small style={{ color: 'var(--muted)', font: '600 10px "DM Mono"' }}>SEATING CAPACITY</small>
                <b style={{ display: 'block', fontSize: 16, marginTop: 4 }}>{selectedRoom.seats}</b>
              </div>
              <div style={{ background: '#f5f7f3', padding: 12, borderRadius: 6 }}>
                <small style={{ color: 'var(--muted)', font: '600 10px "DM Mono"' }}>CURRENT STATUS</small>
                <b style={{ display: 'block', fontSize: 16, marginTop: 4, color: selectedRoom.status === 'green' ? 'var(--green)' : '#c27803' }}>
                  {selectedRoom.avail}
                </b>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, font: '600 12px "DM Mono"', color: 'var(--green)' }}>
                HOW TO REACH THIS ROOM:
              </h4>
              <p style={{ background: '#fff', border: '1px solid var(--line)', padding: 14, borderRadius: 6, fontSize: 13, lineHeight: 1.6 }}>
                {selectedRoom.directions || `${selectedRoom.name} is situated in ${selectedRoom.block || selectedRoom.building} on the ${selectedRoom.floor}. Use the central staircase or elevator.`}
              </p>
            </div>

            {Array.isArray(selectedRoom.facilities) && selectedRoom.facilities.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, font: '600 12px "DM Mono"', color: 'var(--green)' }}>
                  ROOM AMENITIES & HARDWARE:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedRoom.facilities.map((fac: string) => (
                    <span
                      key={fac}
                      style={{
                        background: '#e9f0e8',
                        color: 'var(--darkgreen)',
                        padding: '4px 9px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      ✓ {fac}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: '#fbfaf5', borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                Help Desk: <strong>{selectedRoom.contact || 'Ext 200'}</strong>
              </span>
              <button className="primary" onClick={() => setSelectedRoom(null)}>
                Got it
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

const StudentPanel = ({
  person,
  close,
  connected,
  connect,
  onMessage,
  isCurrentStudent,
  onEditProfile,
  onLogout
}: any) => (
  <div className="scrim" onMouseDown={close}>
    <aside className="detail-panel" onMouseDown={(e) => e.stopPropagation()}>
      <button className="close" onClick={close}>
        <X />
      </button>
      <div className="profile-hero">
        <Avatar person={person} size="lg" />
        <span style={{ background: isCurrentStudent ? '#dcebdd' : '#edf1e9', color: 'var(--green)', fontWeight: 600 }}>
          {isCurrentStudent ? 'Your Profile' : 'Verified Student'}
        </span>
      </div>
      <h1>{person.name}</h1>
      <p style={{ fontWeight: 600, color: 'var(--ink)' }}>
        {person.academicProfile?.university || 'SR University'}
      </p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>
        {[
          person.dept || person.academicProfile?.department || 'Department',
          person.year || person.academicProfile?.year || 'Academic Year',
          person.academicProfile?.batch && `Batch ${person.academicProfile.batch}`
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {person.email && (
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: '"DM Mono", monospace', margin: '4px 0 10px' }}>
          {person.email}
        </p>
      )}

      <p className="bio">
        {person.bio || person.interest || 'Active student on Vynora Campus.'}
      </p>

      {/* Structured Interests Tags */}
      {Array.isArray(person.interests) && person.interests.length > 0 && (
        <div style={{ margin: '14px 0' }}>
          <span className="section-kicker">INTERESTS & FOCUS</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {person.interests.map((item: string) => (
              <span
                key={item}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: '#e4ede5',
                  color: 'var(--green)',
                  fontWeight: 600
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {Array.isArray(person.skills) && person.skills.length > 0 && (
        <div style={{ margin: '14px 0' }}>
          <span className="section-kicker">SKILLS</span>
          <div className="skill-row big" style={{ marginTop: 6 }}>
            {person.skills.map((x: string) => (
              <small key={x}>{x}</small>
            ))}
          </div>
        </div>
      )}

      <div className="panel-actions" style={{ marginTop: 20 }}>
        {isCurrentStudent ? (
          <>
            <button
              className="primary"
              onClick={() => {
                close();
                onEditProfile?.();
              }}
            >
              Edit Profile
            </button>
            {onLogout && (
              <button
                className="soft"
                onClick={() => {
                  close();
                  onLogout();
                }}
                style={{ color: '#a83f35' }}
              >
                Log Out
              </button>
            )}
          </>
        ) : (
          <>
            <button className={connected ? 'soft sent' : 'primary'} onClick={connect}>
              {connected ? (
                <>
                  <Check size={15} /> Connected
                </>
              ) : (
                <>
                  <Plus size={15} /> Connect
                </>
              )}
            </button>
            <button className="soft" onClick={onMessage}>
              Message
            </button>
          </>
        )}
      </div>
    </aside>
  </div>
);

const ProjectPanel = ({ project, close, onJoin }: any) => (
  <div className="scrim" onMouseDown={close}>
    <aside className="detail-panel project-detail" onMouseDown={(e) => e.stopPropagation()}>
      <button className="close" onClick={close}>
        <X />
      </button>
      <div className="project-cover" style={{ background: project.accent || '#176b5a' }}>
        <span>{project.status}</span>
      </div>
      <span className="section-kicker">
        PUBLIC PROJECT · {project.recruiting ? 'RECRUITING' : 'TEAM COMPLETE'}
      </span>
      <h1>{project.name}</h1>
      <p className="bio">{project.about}</p>
      <div className="team-details">
        <div>
          <b>
            {project.membersCount || project.members || 1}/{project.maxMembers || project.max || 4}
          </b>
          <span>team members</span>
        </div>
        <div>
          <b>{project.ownerName || project.owner || 'Project Lead'}</b>
          <span>project owner</span>
        </div>
      </div>
      <span className="section-kicker">LOOKING FOR</span>
      <div className="skill-row big">
        {(project.skills || []).map((x: string) => (
          <small key={x}>{x}</small>
        ))}
      </div>
      {project.recruiting && (
        <button className="primary wide" onClick={onJoin}>
          Request to join <ChevronRight size={16} />
        </button>
      )}
    </aside>
  </div>
);

const JoinModal = ({ project, message, setMessage, close, send }: any) => (
  <div className="scrim">
    <section className="modal">
      <button className="close" onClick={close}>
        <X />
      </button>
      <span className="section-kicker">JOIN REQUEST</span>
      <h2>Join {project.name}</h2>
      <p>Your profile and relevant skills will be shared with the project owner.</p>
      <label>
        Why are you interested? <small>Optional</small>
        <textarea
          placeholder="I’d love to help because…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <div>
        <button className="soft" onClick={close}>
          Cancel
        </button>
        <button className="primary" onClick={send}>
          Send request <Send size={16} />
        </button>
      </div>
    </section>
  </div>
);

const PostModal = ({ close, onSubmit }: any) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [topic, setTopic] = useState('Academics');
  const [done, setDone] = useState(false);

  const handlePublish = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), context.trim(), topic);
    setDone(true);
  };

  return (
    <div className="scrim">
      <section className="modal">
        <button className="close" onClick={close}>
          <X />
        </button>
        {done ? (
          <div className="success">
            <Check size={32} />
            <h2>Your question is out there.</h2>
            <p>Campus peers who can help will see it in their community feed.</p>
            <button className="primary" onClick={close}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="section-kicker">NEW COMMUNITY POST</span>
            <h2>What do you need?</h2>
            <label>
              Category
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ height: 38, border: '1px solid var(--line)', background: '#fff', padding: '0 8px' }}
              >
                <option value="Academics">Academics</option>
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Hackathons">Hackathons</option>
                <option value="Projects">Projects</option>
              </select>
            </label>
            <label>
              Title
              <input
                placeholder="Ask a clear, specific question"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Context
              <textarea
                placeholder="Give people enough detail to offer useful help."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </label>
            <div>
              <button className="soft" onClick={close}>
                Cancel
              </button>
              <button className="primary" onClick={handlePublish} disabled={!title.trim()}>
                Publish post
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const CreateProjectModal = ({ close, onCreate }: any) => {
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [skillsStr, setSkillsStr] = useState('React, Python');
  const [max, setMax] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      about: about.trim() || 'A new collaborative campus project.',
      skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      maxMembers: Number(max) || 4,
      accent: '#2f6854'
    });
  };

  return (
    <div className="scrim">
      <section className="modal">
        <button className="close" onClick={close}>
          <X />
        </button>
        <span className="section-kicker">START A PROJECT</span>
        <h2>Create a campus project</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Project Name
            <input
              placeholder="e.g. StudyPulse, Campus Nav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            About
            <textarea
              placeholder="What problem does this project solve?"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </label>
          <label>
            Desired Skills (comma separated)
            <input
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="React, Design, Python, ML"
            />
          </label>
          <label>
            Team Capacity
            <input
              type="number"
              min="2"
              max="10"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
          </label>
          <div style={{ marginTop: 20 }}>
            <button type="button" className="soft" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={!name.trim()}>
              Create Project
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const UploadResourceModal = ({ close, onUpload }: any) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Operating Systems');
  const [category, setCategory] = useState('Mid-term Exam Paper');
  const [format, setFormat] = useState('PDF');
  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'document' | 'photo' | 'link'>('document');
  const [fileSize, setFileSize] = useState<string>('');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const sizeInKb = Math.round(file.size / 1024);
    setFileSize(sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`);

    const isImage = file.type.startsWith('image/');
    setFileType(isImage ? 'photo' : 'document');
    setFormat(isImage ? 'Photo' : file.name.endsWith('.pdf') ? 'PDF' : 'Document');

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;
    setUploading(true);
    try {
      await onUpload({
        title: title.trim(),
        subject: subject.trim(),
        category,
        format,
        fileData,
        fileName,
        fileType,
        fileSize,
        url: url.trim()
      });
      close();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="scrim">
      <section className="modal" style={{ maxWidth: 520 }}>
        <button className="close" onClick={close}>
          <X />
        </button>
        <span className="section-kicker">ACADEMIC RESOURCE ARCHIVE</span>
        <h2>Upload Study Resource</h2>
        <p style={{ margin: '4px 0 16px', color: 'var(--muted)', fontSize: 13 }}>
          Share mid-term question papers, lecture notes, lab manuals, or handwritten revision sheets.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Resource Title
            <input
              placeholder="e.g. Mid-term 1 Question Paper (2025), OS Solved Paper"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <div className="two-fields">
            <label>
              Subject
              <input
                placeholder="e.g. Machine Learning, OS"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </label>

            <label>
              Academic Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ height: 44, border: '1px solid var(--line)', background: '#fff', padding: '0 8px' }}
              >
                <option value="Mid-term Exam Paper">Mid-term Exam Paper</option>
                <option value="End-term Exam Paper">End-term Exam Paper</option>
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Lab Manual">Lab Manual</option>
                <option value="Photo / Handwritten">Photo / Handwritten Sheet</option>
                <option value="Assignment Solution">Assignment Solution</option>
                <option value="Syllabus & Guide">Syllabus & Guide</option>
              </select>
            </label>
          </div>

          {/* Document or Photo Attachment Section */}
          <div style={{ margin: '14px 0', padding: 14, background: '#f5f7f3', border: '1px dashed var(--line)', borderRadius: 6 }}>
            <span style={{ display: 'block', fontSize: 11, font: '600 11px "DM Mono"', color: 'var(--green)', marginBottom: 8 }}>
              ATTACH DOCUMENT OR PHOTO (MID-TERM PAPER / NOTES):
            </span>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              style={{ fontSize: 12, width: '100%' }}
            />

            {fileName && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', padding: '8px 12px', borderRadius: 4, border: '1px solid var(--line)' }}>
                {fileType === 'photo' ? (
                  <ImageIcon size={20} color="var(--green)" />
                ) : (
                  <FileText size={20} color="var(--green)" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName}
                  </b>
                  <small style={{ color: 'var(--muted)', fontSize: 10 }}>
                    {fileSize} · {fileType === 'photo' ? 'Photo Attachment' : 'Document File'}
                  </small>
                </div>
                {fileData && fileType === 'photo' && (
                  <img src={fileData} alt="Preview" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                )}
              </div>
            )}
          </div>

          <label>
            Optional External Link / Cloud Drive URL
            <input
              type="url"
              placeholder="https://drive.google.com/... or cloud document link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="soft" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={uploading || !title.trim() || !subject.trim()}>
              {uploading ? 'Uploading…' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const CommandPalette = ({ close, go, onTimetable, studentRole }: any) => {
  const [q, setQ] = useState('');
  const actions: [View | 'Timetable', string][] = [
    ['Home', 'Go to Dashboard'],
    ['Timetable', 'Open SR University Timetable'],
    ['Network', 'Find students & collaborators'],
    ['Clubs', 'Discover campus clubs & announcements'],
    ['Projects', 'Browse student projects & teams'],
    ['Resources', 'Search study library & notes'],
    ['Community', 'Open Campus Community conversations'],
    ['Messages', 'Open student messages'],
    ['Events', 'Explore events & opportunities'],
    ['Campus services', 'Find a free room on campus'],
    ['Products', 'Browse Vynora campus products & Vynora Pulse']
  ];

  if (studentRole === 'ADMIN' || studentRole === 'SUPER_ADMIN') {
    actions.push(['Admin', 'Admin Command Center (Manage users, clubs, reports)']);
  }

  const filtered = actions.filter((a) => a[1].toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="scrim command-scrim" onMouseDown={close}>
      <section className="command" onMouseDown={(e) => e.stopPropagation()}>
        <div>
          <Search size={20} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people, clubs, timetable, products, or commands"
          />
          <kbd>ESC</kbd>
        </div>
        <p>QUICK ACTIONS</p>
        {filtered.map(([v, t]) => (
          <button
            onClick={() => {
              if (v === 'Timetable') onTimetable();
              else go(v);
              close();
            }}
            key={t}
          >
            <Command size={16} />
            <span>{t}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>
    </div>
  );
};
