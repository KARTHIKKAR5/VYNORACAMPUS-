import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Megaphone,
  X,
  Send,
  Building,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { clubsApi, announcementsApi, eventsApi } from '../../services/api';

export default function ClubsPage({ student }: { student?: any }) {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubDetail, setClubDetail] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Apply form state
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Coding & Technology');
  const [newClubCoordinator, setNewClubCoordinator] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annCategory, setAnnCategory] = useState('GENERAL');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventVenue, setEventVenue] = useState('Student Activity Centre');
  const [eventTime, setEventTime] = useState('');

  const loadClubs = () => {
    setLoading(true);
    clubsApi
      .list({ category, q: searchQuery })
      .then((res) => setClubs(res.clubs || []))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClubs();
  }, [category, searchQuery]);

  const openClubDetail = (club: any) => {
    setSelectedClub(club);
    clubsApi.get(club._id).then((res) => {
      setClubDetail(res);
      setIsMember(res.isMember);
    }).catch(() => {
      setClubDetail({ club, announcements: [], events: [], isMember: false });
    });
  };

  const handleJoinToggle = async () => {
    if (!selectedClub) return;
    try {
      if (isMember) {
        await clubsApi.leave(selectedClub._id);
        setIsMember(false);
      } else {
        await clubsApi.join(selectedClub._id);
        setIsMember(true);
      }
      loadClubs();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleApplyClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim() || !newClubDesc.trim()) return;
    try {
      const res = await clubsApi.createApplication({
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        category: newClubCategory,
        facultyCoordinator: newClubCoordinator
      });
      setApplySuccess(res.message);
      setNewClubName('');
      setNewClubDesc('');
      loadClubs();
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Unable to submit club application');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim() || !selectedClub) return;
    try {
      await announcementsApi.create({
        title: annTitle.trim(),
        body: annBody.trim(),
        clubId: selectedClub._id,
        category: annCategory,
        priority: 'NORMAL'
      });
      setAnnTitle('');
      setAnnBody('');
      setShowAnnounceModal(false);
      openClubDetail(selectedClub);
      alert('Club announcement published successfully!');
    } catch (err: any) {
      alert(err.message || 'Unable to publish announcement');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDesc.trim() || !selectedClub) return;
    try {
      await eventsApi.create({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        venue: eventVenue,
        startTime: eventTime ? new Date(eventTime) : new Date(Date.now() + 2 * 24 * 3600 * 1000),
        clubId: selectedClub._id
      });
      setEventTitle('');
      setEventDesc('');
      setShowEventModal(false);
      openClubDetail(selectedClub);
      alert('Event scheduled successfully!');
    } catch (err: any) {
      alert(err.message || 'Unable to create event');
    }
  };

  const isClubHead =
    selectedClub &&
    student &&
    (selectedClub.clubHeadId?._id === student.id ||
      selectedClub.clubHeadId === student.id ||
      student.role === 'ADMIN' ||
      student.role === 'SUPER_ADMIN');

  return (
    <section className="page">
      <div className="eyebrow">
        <Users size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--green)' }} />
        COLLEGE CLUBS & ORGANIZATIONS
      </div>

      <div className="page-title">
        <div>
          <h1>Campus Clubs & Guilds</h1>
          <p>Official student bodies, technical guilds, and department societies recognized by the university.</p>
        </div>
        {(student?.role === 'ADMIN' || student?.role === 'SUPER_ADMIN') && (
          <button className="primary" onClick={() => setShowApplyModal(true)}>
            <Plus size={17} />
            Create College Club
          </button>
        )}
      </div>

      <div className="discover-toolbar">
        <div className="input-wrap">
          <Search size={18} />
          <input
            placeholder="Search clubs by name, category, or focus…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ height: 43, border: '1px solid var(--line)', background: '#faf9f4', padding: '0 12px', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}
        >
          <option value="All">All Categories</option>
          <option value="Coding & Technology">Coding & Tech</option>
          <option value="Robotics">Robotics & Hardware</option>
          <option value="Design">Design & Product</option>
          <option value="Cultural">Cultural</option>
        </select>
        <span>{clubs.length} verified clubs</span>
      </div>

      {loading ? (
        <div className="timetable-skeleton" style={{ marginTop: 24 }}>
          <i />
          <i />
          <i />
        </div>
      ) : (
        <div className="people-grid" style={{ marginTop: 24 }}>
          {clubs.map((club) => (
            <article className="student-card" key={club._id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: '#e9f0e8',
                    color: 'var(--darkgreen)',
                    display: 'grid',
                    placeItems: 'center',
                    font: '600 18px Fraunces'
                  }}
                >
                  {club.name[0]}
                </span>
                <div>
                  <h3 style={{ margin: 0, font: '600 18px Fraunces' }}>{club.name}</h3>
                  <small style={{ color: 'var(--muted)', font: '500 11px "DM Mono"' }}>{club.category}</small>
                </div>
              </div>

              <p className="interest" style={{ margin: '14px 0', height: 'auto', minHeight: 48, fontSize: 13, color: '#4a5650' }}>
                {club.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--muted)', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                <span>
                  <Users size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--green)' }} />
                  {club.membersCount} members
                </span>
                <span>·</span>
                <span>Head: {club.clubHeadId?.name || 'Assigned Lead'}</span>
              </div>

              <footer style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="text-button" onClick={() => openClubDetail(club)}>
                  Club workspace <ChevronRight size={15} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Club Detail Workspace Drawer */}
      {selectedClub && (
        <div className="scrim" onMouseDown={() => setSelectedClub(null)}>
          <aside className="detail-panel" onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(580px, 100%)' }}>
            <button className="close" onClick={() => setSelectedClub(null)}>
              <X />
            </button>

            <span className="section-kicker">OFFICIAL CLUB PROFILE</span>
            <h1 style={{ marginTop: 8 }}>{selectedClub.name}</h1>
            <p style={{ color: 'var(--muted)', margin: '4px 0 16px' }}>{selectedClub.category} · SR University</p>

            <p className="bio" style={{ margin: '0 0 20px', lineHeight: 1.6 }}>{selectedClub.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className={isMember ? 'soft sent' : 'primary'}
                  onClick={handleJoinToggle}
                >
                  {isMember ? <><CheckCircle2 size={16} /> Joined (Receiving Updates)</> : <><Plus size={16} /> Interested / Join Club</>}
                </button>

                {isClubHead && (
                  <>
                    <button className="soft" onClick={() => setShowAnnounceModal(true)}>
                    <Megaphone size={15} /> Post Announcement
                  </button>
                  <button className="soft" onClick={() => setShowEventModal(true)}>
                    <Calendar size={15} /> Schedule Event
                  </button>
                </>
              )}
              </div>
              <small style={{ color: isMember ? 'var(--green)' : 'var(--muted)', fontSize: 11, font: '500 11px "DM Sans"' }}>
                {isMember
                  ? '✓ You are subscribed to official notifications and updates from this club.'
                  : 'Join this club to receive its announcements, workshop alerts, and event notifications.'}
              </small>
            </div>

            <hr />

            <span className="section-kicker">LEADERSHIP & ADVISORY</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '10px 0 24px' }}>
              <div style={{ background: '#f5f6f0', padding: 12, borderRadius: 4 }}>
                <small style={{ color: 'var(--muted)', font: '500 10px "DM Mono"', display: 'block' }}>STUDENT CLUB HEAD</small>
                <b>{selectedClub.clubHeadId?.name || 'Nisha Raman'}</b>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                  {selectedClub.clubHeadId?.academicProfile?.program || 'Design Guild'}
                </p>
              </div>
              <div style={{ background: '#f5f6f0', padding: 12, borderRadius: 4 }}>
                <small style={{ color: 'var(--muted)', font: '500 10px "DM Mono"', display: 'block' }}>FACULTY ADVISOR</small>
                <b>{selectedClub.facultyCoordinator || 'Dr. Ramesh Babu A'}</b>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>Academic Oversight</p>
              </div>
            </div>

            <span className="section-kicker">LATEST CLUB ANNOUNCEMENTS</span>
            <div style={{ display: 'grid', gap: 10, margin: '10px 0 24px' }}>
              {clubDetail?.announcements?.length ? (
                clubDetail.announcements.map((a: any) => (
                  <div key={a._id} style={{ border: '1px solid var(--line)', padding: 14, background: '#faf9f4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>{a.title}</b>
                      <small style={{ color: 'var(--green)', font: '500 10px "DM Mono"' }}>{a.category}</small>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{a.body}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>No announcements posted yet.</p>
              )}
            </div>

            <span className="section-kicker">UPCOMING CLUB EVENTS</span>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {clubDetail?.events?.length ? (
                clubDetail.events.map((ev: any) => (
                  <div key={ev._id} style={{ border: '1px solid var(--line)', padding: 14, background: '#faf9f4' }}>
                    <b>{ev.title}</b>
                    <p style={{ margin: '3px 0', fontSize: 12, color: 'var(--muted)' }}>{ev.venue} · {new Date(ev.startTime).toLocaleDateString()}</p>
                    <small style={{ color: 'var(--green)', font: '500 10px "DM Mono"' }}>{ev.registeredCount} / {ev.maxCapacity} registered</small>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>No upcoming events currently scheduled.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Start a Club Modal */}
      {showApplyModal && (
        <div className="scrim">
          <section className="modal">
            <button className="close" onClick={() => setShowApplyModal(false)}>
              <X />
            </button>
            <span className="section-kicker">CAMPUS CHARTER</span>
            <h2>Submit Club Application</h2>
            <p>Propose a new student organization. Applications are reviewed by the Dean of Student Affairs.</p>

            {applySuccess ? (
              <div className="success">
                <CheckCircle2 size={36} color="var(--green)" />
                <h3>{applySuccess}</h3>
              </div>
            ) : (
              <form onSubmit={handleApplyClub}>
                <label>
                  Club Name
                  <input
                    placeholder="e.g. Open Source Hardware Club"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={newClubCategory}
                    onChange={(e) => setNewClubCategory(e.target.value)}
                    style={{ height: 40, border: '1px solid var(--line)', background: '#fff', padding: '0 8px' }}
                  >
                    <option value="Coding & Technology">Coding & Technology</option>
                    <option value="Robotics">Robotics & Hardware</option>
                    <option value="Design">Design & Product</option>
                    <option value="Cultural">Cultural & Arts</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                  </select>
                </label>
                <label>
                  Description & Campus Purpose
                  <textarea
                    placeholder="What activities will this club organize? How does it benefit students?"
                    value={newClubDesc}
                    onChange={(e) => setNewClubDesc(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Proposed Faculty Coordinator
                  <input
                    placeholder="e.g. Dr. Ramesh Babu A"
                    value={newClubCoordinator}
                    onChange={(e) => setNewClubCoordinator(e.target.value)}
                  />
                </label>
                <div style={{ marginTop: 20 }}>
                  <button type="button" className="soft" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={!newClubName.trim()}>
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Post Club Announcement Modal */}
      {showAnnounceModal && selectedClub && (
        <div className="scrim">
          <section className="modal">
            <button className="close" onClick={() => setShowAnnounceModal(false)}>
              <X />
            </button>
            <span className="section-kicker">{selectedClub.name.toUpperCase()}</span>
            <h2>Publish Club Announcement</h2>
            <form onSubmit={handleCreateAnnouncement}>
              <label>
                Announcement Title
                <input
                  placeholder="e.g. Solution Challenge Orientation"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value)}
                  style={{ height: 40, border: '1px solid var(--line)', background: '#fff', padding: '0 8px' }}
                >
                  <option value="GENERAL">General</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="RECRUITMENT">Recruitment</option>
                  <option value="IMPORTANT_NOTICE">Important Notice</option>
                </select>
              </label>
              <label>
                Details
                <textarea
                  placeholder="Provide date, venue, and participation details…"
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  required
                />
              </label>
              <div style={{ marginTop: 20 }}>
                <button type="button" className="soft" onClick={() => setShowAnnounceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={!annTitle.trim()}>
                  Publish
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Schedule Club Event Modal */}
      {showEventModal && selectedClub && (
        <div className="scrim">
          <section className="modal">
            <button className="close" onClick={() => setShowEventModal(false)}>
              <X />
            </button>
            <span className="section-kicker">{selectedClub.name.toUpperCase()}</span>
            <h2>Schedule Club Event</h2>
            <form onSubmit={handleCreateEvent}>
              <label>
                Event Title
                <input
                  placeholder="e.g. Flutter Bootcamp"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </label>
              <label>
                Venue / Room
                <input
                  placeholder="e.g. CSE-214, Auditorium 1"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  required
                />
              </label>
              <label>
                Date & Time
                <input
                  type="datetime-local"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  placeholder="What will attendees learn? Any prerequisites?"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  required
                />
              </label>
              <div style={{ marginTop: 20 }}>
                <button type="button" className="soft" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={!eventTitle.trim()}>
                  Publish Event
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
