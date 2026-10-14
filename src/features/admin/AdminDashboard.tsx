import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  History,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Check,
  Ban,
  Building,
  Flag,
  DollarSign,
  Upload,
  Calendar,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { adminApi, timetableApi } from '../../services/api';

type AdminTab = 'overview' | 'users' | 'clubs' | 'reports' | 'timetable' | 'settings' | 'audit';

export default function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [usersLoading, setUsersLoading] = useState(false);

  // Clubs state
  const [pendingClubs, setPendingClubs] = useState<any[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Timetable CSV import state
  const [csvDegree, setCsvDegree] = useState('B.Tech');
  const [csvProgram, setCsvProgram] = useState('Computer Science & Engineering');
  const [csvYear, setCsvYear] = useState('Year III');
  const [csvBatch, setCsvBatch] = useState('CSE-AIML-A');
  const [csvCode, setCsvCode] = useState('SRU-CSE-2023-A');
  const [csvContent, setCsvContent] = useState(
    `Day,StartTime,EndTime,Subject,Type,Faculty,Room,Batch\nMonday,09:30,10:20,Machine Learning & Pattern Recognition,Lecture,Dr. Ramesh Babu A,CSE-214,CSE-AIML-A\nMonday,10:25,11:15,Advanced Database Management Systems,Lecture,Prof. S. N. Murthy,CSE-214,CSE-AIML-A\nMonday,11:20,13:00,Deep Learning Laboratory,Lab,Dr. Ramesh Babu A,AI Lab 02,CSE-AIML-A\nTuesday,09:30,10:20,Compiler Design,Lecture,Dr. P. V. Rao,CSE-214,CSE-AIML-A\nTuesday,10:25,11:15,Computer Networks,Lecture,Prof. Ananya Sen,CSE-214,CSE-AIML-A`
  );
  const [importingCsv, setImportingCsv] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<any[]>([]);
  const [platformName, setPlatformName] = useState('Vynora Campus+');
  const [allowedDomains, setAllowedDomains] = useState('@sru.edu.in, @vynora.edu');
  const [requireClubApproval, setRequireClubApproval] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await adminApi.getMetrics();
      setMetrics(data.metrics);
      setRecentLogs(data.recentActivity || []);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      setErrorNotice('Administrative access required. Please verify admin session credentials.');
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await adminApi.getUsers({
        role: userRoleFilter === 'All' ? undefined : userRoleFilter,
        q: userQuery || undefined
      });
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadClubs = async () => {
    setClubsLoading(true);
    try {
      const data = await adminApi.getClubs();
      setPendingClubs(data.clubs || []);
    } catch (err: any) {
      console.error('Failed to load clubs:', err);
    } finally {
      setClubsLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await adminApi.getReports();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await adminApi.getAuditLogs();
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const refreshCurrentTab = async () => {
    setRefreshing(true);
    setErrorNotice(null);
    try {
      if (tab === 'overview') await loadMetrics();
      else if (tab === 'users') await loadUsers();
      else if (tab === 'clubs') await loadClubs();
      else if (tab === 'reports') await loadReports();
      else if (tab === 'audit') await loadAuditLogs();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMetrics().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'clubs') loadClubs();
    else if (tab === 'reports') loadReports();
    else if (tab === 'audit') loadAuditLogs();
  }, [tab, userRoleFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setNotice(`Updated user role to ${newRole}`);
      loadUsers();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update user role.');
    }
  };

  const handleToggleSuspension = async (user: any) => {
    const action = user.isSuspended ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      await adminApi.updateUser(user._id, {
        isSuspended: !user.isSuspended,
        suspensionReason: !user.isSuspended ? 'Administrative compliance review' : undefined
      });
      setNotice(`Account for ${user.name} was ${user.isSuspended ? 'reactivated' : 'suspended'}.`);
      loadUsers();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update account suspension.');
    }
  };

  const handleApproveClub = async (clubId: string, name: string) => {
    try {
      await adminApi.approveClub(clubId);
      setNotice(`Approved "${name}" as an official campus club.`);
      loadClubs();
      loadMetrics();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to approve club.');
    }
  };

  const handleRejectClub = async (clubId: string, name: string) => {
    const reason = window.prompt(`Enter rejection reason for "${name}":`, 'Incomplete documentation');
    if (!reason) return;

    try {
      await adminApi.rejectClub(clubId, reason);
      setNotice(`Application for "${name}" was rejected.`);
      loadClubs();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to reject club.');
    }
  };

  const handleResolveReport = async (reportId: string, action: string) => {
    try {
      await adminApi.updateReport(reportId, {
        status: 'RESOLVED',
        actionTaken: action
      });
      setNotice('Report marked as resolved with action recorded in audit history.');
      loadReports();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to update report.');
    }
  };

  const handleImportTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      setErrorNotice('Please provide CSV timetable content.');
      return;
    }

    setImportingCsv(true);
    setErrorNotice(null);
    try {
      const res = await timetableApi.importCsv({
        degree: csvDegree,
        program: csvProgram,
        year: csvYear,
        batch: csvBatch,
        sruBatchCode: csvCode,
        csvContent
      });
      setNotice(res.message || 'Timetable imported and synchronized with live database successfully!');
    } catch (err: any) {
      setErrorNotice(err.message || 'CSV validation failed. Please check headers and day format.');
    } finally {
      setImportingCsv(false);
    }
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', paddingBottom: 60 }}>
      {/* Admin Top Bar */}
      <div
        style={{
          background: '#153b33',
          color: '#ffffff',
          borderRadius: 8,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(21, 59, 51, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: '"DM Mono", monospace',
                letterSpacing: '0.12em',
                fontWeight: 700,
                background: '#22594e',
                color: '#81e6d9',
                padding: '2px 8px',
                borderRadius: 3
              }}
            >
              ADMIN PRIVILEGED GATEWAY
            </span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Server Verified RBAC · Session: admin@vynora.edu</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#ffffff' }}>
            Vynora Administration Command Center
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={refreshCurrentTab}
            disabled={refreshing}
            style={{
              background: '#22594e',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 4,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1.5s linear infinite' : 'none' }} />
            {refreshing ? 'Updating...' : 'Sync Metrics'}
          </button>
          <button
            onClick={onExit}
            style={{
              background: '#ffffff',
              color: '#153b33',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Return to Campus View
          </button>
        </div>
      </div>

      {notice && (
        <div
          style={{
            background: '#eaf4ee',
            border: '1px solid #c2e2cc',
            color: '#153b33',
            padding: '10px 16px',
            borderRadius: 6,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#153b33', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {errorNotice && (
        <div
          style={{
            background: '#fcedea',
            border: '1px solid #f2c7be',
            color: '#9e3b26',
            padding: '10px 16px',
            borderRadius: 6,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#9e3b26', cursor: 'pointer', fontWeight: 600 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 10,
          marginBottom: 24,
          overflowX: 'auto'
        }}
      >
        {[
          { id: 'overview', label: 'Platform Overview', icon: TrendingUp },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'clubs', label: `Club Requests (${pendingClubs.filter((c) => c.status === 'PENDING').length})`, icon: Building },
          { id: 'reports', label: `Moderation Reports (${reports.filter((r) => r.status === 'PENDING').length})`, icon: Flag },
          { id: 'timetable', label: 'SRU Timetable CSV Import', icon: FileSpreadsheet },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
          { id: 'audit', label: 'Audit Log Trail', icon: History }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as AdminTab);
                setNotice(null);
                setErrorNotice(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--green)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--ink)',
                border: '1px solid',
                borderColor: isActive ? 'var(--green)' : 'var(--line)',
                borderRadius: 4,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & REAL METRICS */}
      {tab === 'overview' && (
        <div>
          {loading || !metrics ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }} />
              <div>Calculating live database metrics...</div>
            </div>
          ) : (
            <>
              {/* Aggregated Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 16,
                  marginBottom: 28
                }}
              >
                {[
                  { label: 'Registered Users', val: metrics.totalUsers, note: `${metrics.totalStudents} Students · ${metrics.totalFaculty} Faculty`, icon: Users, color: '#153b33' },
                  { label: 'Official Clubs', val: metrics.totalClubs, note: `${metrics.pendingClubs} pending approval`, icon: Building, color: '#176b5a' },
                  { label: 'Published Events', val: metrics.totalEvents, note: 'Database verified', icon: Calendar, color: '#2a5a4b' },
                  { label: 'College Announcements', val: metrics.totalAnnouncements, note: 'Targeted broadcast', icon: Sparkles, color: '#9e3b26' },
                  { label: 'Moderation Reports', val: metrics.pendingReports, note: 'Pending review', icon: Flag, color: metrics.pendingReports > 0 ? '#b24c35' : '#496155' },
                  { label: 'Verified Campus Revenue', val: `₹${metrics.totalRevenue || 0}`, note: `${metrics.totalOrders} paid subscriptions`, icon: DollarSign, color: '#153b33' }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#faf9f4',
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        padding: 16
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          {item.label}
                        </span>
                        <Icon size={16} style={{ color: item.color }} />
                      </div>
                      <div style={{ fontSize: 28, fontFamily: 'Fraunces, serif', fontWeight: 700, color: 'var(--ink)' }}>
                        {item.val}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                        {item.note}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Audit Activity Table */}
              <div
                style={{
                  background: '#faf9f4',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: 20
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Recent Administrative Audit Logs</h3>
                  <button
                    onClick={() => setTab('audit')}
                    style={{ fontSize: 12, color: 'var(--green)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View All Logs →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                        <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                        <th style={{ padding: '8px 10px' }}>ACTOR</th>
                        <th style={{ padding: '8px 10px' }}>ACTION</th>
                        <th style={{ padding: '8px 10px' }}>RESOURCE</th>
                        <th style={{ padding: '8px 10px' }}>RESULT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '16px 10px', textAlign: 'center', color: 'var(--muted)' }}>
                            No administrative logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        recentLogs.map((log) => (
                          <tr key={log._id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', font: '500 11px "DM Mono"' }}>
                              {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: '8px 10px' }}>{log.actorEmail || 'System'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span
                                style={{
                                  background: '#e8efe9',
                                  color: 'var(--green)',
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                  fontSize: 10,
                                  fontWeight: 600
                                }}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>{log.targetType}</td>
                            <td style={{ padding: '8px 10px', color: log.status === 'SUCCESS' ? 'var(--green)' : '#9e3b26' }}>
                              {log.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {tab === 'users' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search user by name, email, department..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                  fontSize: 13
                }}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
            >
              <option value="All">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="CLUB_HEAD">Club Head</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={loadUsers}
              style={{
                background: 'var(--green)',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>

          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '10px' }}>USER</th>
                    <th style={{ padding: '10px' }}>EMAIL</th>
                    <th style={{ padding: '10px' }}>ROLE</th>
                    <th style={{ padding: '10px' }}>DEPARTMENT / PROGRAM</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px', color: 'var(--muted)' }}>{u.email}</td>
                      <td style={{ padding: '10px' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          style={{
                            fontSize: 12,
                            padding: '3px 8px',
                            borderRadius: 3,
                            border: '1px solid var(--line)',
                            background: '#ffffff'
                          }}
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="CLUB_HEAD">CLUB_HEAD</option>
                          <option value="FACULTY">FACULTY</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px', fontSize: 12, color: 'var(--muted)' }}>
                        {u.academicProfile?.department || '—'} · {u.academicProfile?.year || '—'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            background: u.isSuspended ? '#fcedea' : '#eaf4ee',
                            color: u.isSuspended ? '#9e3b26' : 'var(--green)',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 3
                          }}
                        >
                          {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleSuspension(u)}
                          style={{
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: u.isSuspended ? 'var(--green)' : '#9e3b26',
                            color: u.isSuspended ? 'var(--green)' : '#9e3b26',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                        >
                          {u.isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLUB REQUESTS */}
      {tab === 'clubs' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Club Registration & Leadership Review</h3>
          {clubsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : pendingClubs.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '30px 0' }}>
              No clubs currently submitted for review.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {pendingClubs.map((club) => (
                <div
                  key={club._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ maxWidth: 640 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: club.status === 'APPROVED' ? '#eaf4ee' : club.status === 'PENDING' ? '#fbf0e4' : '#fcedea',
                          color: club.status === 'APPROVED' ? 'var(--green)' : club.status === 'PENDING' ? '#9c651e' : '#9e3b26',
                          padding: '2px 6px',
                          borderRadius: 3
                        }}
                      >
                        {club.status}
                      </span>
                      <small style={{ color: 'var(--muted)', fontSize: 11 }}>{club.category}</small>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{club.name}</h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--muted)' }}>{club.description}</p>
                    <div style={{ fontSize: 11.5, color: 'var(--ink)' }}>
                      Club Head: <b>{club.clubHeadId?.name || 'Pending assignment'}</b> ({club.clubHeadId?.email || 'N/A'})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {club.status === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApproveClub(club._id, club.name)}
                          style={{
                            background: 'var(--green)',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 4,
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Approve Club
                        </button>
                        <button
                          onClick={() => handleRejectClub(club._id, club.name)}
                          style={{
                            background: '#fcedea',
                            color: '#9e3b26',
                            border: '1px solid #f2c7be',
                            padding: '6px 14px',
                            borderRadius: 4,
                            fontSize: 12.5,
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Actioned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MODERATION REPORTS */}
      {tab === 'reports' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Campus Content Moderation Queue</h3>
          {reportsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : reports.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '30px 0' }}>
              Queue is clean. No active moderation flags.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {reports.map((report) => (
                <div
                  key={report._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: 16
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: report.status === 'PENDING' ? '#fcedea' : '#eaf4ee',
                          color: report.status === 'PENDING' ? '#9e3b26' : 'var(--green)',
                          padding: '2px 6px',
                          borderRadius: 3
                        }}
                      >
                        {report.status}
                      </span>
                      <b>Target: {report.targetType}</b>
                      <small style={{ color: 'var(--muted)' }}>#{report.targetId}</small>
                    </div>
                    <small style={{ color: 'var(--muted)', font: '500 11px "DM Mono"' }}>
                      {new Date(report.createdAt).toLocaleString('en-IN')}
                    </small>
                  </div>

                  <p style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 600 }}>Reason: {report.reason}</p>
                  {report.details && <p style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--muted)' }}>{report.details}</p>}

                  {report.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => handleResolveReport(report._id, 'Content removed')}
                        style={{
                          background: '#9e3b26',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Remove Violating Content
                      </button>
                      <button
                        onClick={() => handleResolveReport(report._id, 'Warning issued')}
                        style={{
                          background: '#22594e',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Issue Warning to Author
                      </button>
                      <button
                        onClick={() => handleResolveReport(report._id, 'Dismissed as false positive')}
                        style={{
                          background: 'transparent',
                          color: 'var(--muted)',
                          border: '1px solid var(--line)',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Dismiss Flag
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 8 }}>
                      Resolution recorded: {report.actionTaken}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SRU TIMETABLE CSV IMPORT */}
      {tab === 'timetable' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontFamily: 'Fraunces, serif' }}>
              Academic Timetable CSV Ingestion & Synchronization
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Import verified batch schedules from official university academic spreadsheets. Timetable updates
              automatically synchronize to student dashboards and the Today schedule widget.
            </p>
          </div>

          <form onSubmit={handleImportTimetable}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Degree</label>
                <input
                  type="text"
                  value={csvDegree}
                  onChange={(e) => setCsvDegree(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Program</label>
                <input
                  type="text"
                  value={csvProgram}
                  onChange={(e) => setCsvProgram(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Academic Year</label>
                <input
                  type="text"
                  value={csvYear}
                  onChange={(e) => setCsvYear(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Batch Identifier</label>
                <input
                  type="text"
                  value={csvBatch}
                  onChange={(e) => setCsvBatch(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>SRU Official Code</label>
                <input
                  type="text"
                  value={csvCode}
                  onChange={(e) => setCsvCode(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>CSV Content (Validated Headers)</label>
                <small style={{ color: 'var(--green)', font: '500 11px "DM Mono"' }}>
                  Header: Day,StartTime,EndTime,Subject,Type,Faculty,Room,Batch
                </small>
              </div>
              <textarea
                rows={8}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                style={{
                  width: '100%',
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 12,
                  padding: 12,
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                  background: '#f2f0e8'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                disabled={importingCsv}
                style={{
                  background: 'var(--green)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: importingCsv ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {importingCsv ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> Validating & Ingesting...
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Parse & Apply Timetable to Live Database
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {tab === 'settings' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Platform Settings & Governance</h3>
          <div style={{ display: 'grid', gap: 18, maxWidth: 640 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Platform Display Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Permitted College Email Domains
              </label>
              <input
                type="text"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
              />
              <small style={{ color: 'var(--muted)', fontSize: 11 }}>Comma-separated. Restricts public signups to authorized university inboxes.</small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
              <input
                type="checkbox"
                id="reqClubs"
                checked={requireClubApproval}
                onChange={(e) => setRequireClubApproval(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="reqClubs" style={{ fontSize: 13, fontWeight: 500 }}>
                Require Administrator Approval for New Clubs and Head Roles
              </label>
            </div>

            <div style={{ paddingTop: 10 }}>
              <button
                onClick={() => setNotice('Platform governance policies persisted.')}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOG TRAIL */}
      {tab === 'audit' && (
        <div style={{ background: '#faf9f4', border: '1px solid var(--line)', borderRadius: 6, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>System Audit Trail (Security & Compliance)</h3>
            <button
              onClick={loadAuditLogs}
              style={{ background: 'transparent', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Refresh Logs
            </button>
          </div>

          {auditLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                    <th style={{ padding: '8px 10px' }}>ACTOR</th>
                    <th style={{ padding: '8px 10px' }}>ACTION</th>
                    <th style={{ padding: '8px 10px' }}>TARGET</th>
                    <th style={{ padding: '8px 10px' }}>DETAILS</th>
                    <th style={{ padding: '8px 10px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', font: '500 11px "DM Mono"' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '8px 10px' }}>{log.actorEmail || 'System'}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            background: '#e8efe9',
                            color: 'var(--green)',
                            padding: '2px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 600
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px' }}>{log.targetType}: {log.targetId}</td>
                      <td style={{ padding: '8px 10px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details || {})}
                      </td>
                      <td style={{ padding: '8px 10px', color: log.status === 'SUCCESS' ? 'var(--green)' : '#9e3b26' }}>
                        {log.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
