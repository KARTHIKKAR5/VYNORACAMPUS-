import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  User
} from 'lucide-react'
import { timetableApi } from './api'
import { usersApi } from '../../services/api'
import type { TimetableEntry, TimetableSnapshot } from './types'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const localDay = () => new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(new Date())
const time = (value?: string) =>
  value ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2000-01-01T${value}`)) : '—'

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
      .map(Number)
    return hours * 60 + minutes
  } catch {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }
}

const minutesAt = (t?: string) => {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function Entry({
  entry,
  onOpen,
  isToday
}: {
  entry: TimetableEntry
  onOpen: (entry: TimetableEntry) => void
  isToday: boolean
}) {
  const nowMin = kolkataMinutes()
  const startMin = minutesAt(entry.startTime)
  const endMin = minutesAt(entry.endTime || entry.startTime)
  const isOngoing = isToday && nowMin >= startMin && nowMin < endMin
  const isNext = isToday && nowMin < startMin && startMin - nowMin <= 60

  return (
    <button className={`timetable-entry ${isOngoing ? 'entry-now' : ''}`} onClick={() => onOpen(entry)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <b>{entry.subject}</b>
        {isOngoing && <span className="now" style={{ margin: 0, padding: '2px 6px', fontSize: '9px' }}>NOW</span>}
        {isNext && (
          <span style={{ background: '#fef3e2', color: '#c27803', font: '500 9px "DM Mono"', padding: '2px 6px', borderRadius: '3px' }}>
            NEXT
          </span>
        )}
      </div>
      <span>
        {entry.courseCode ? `${entry.courseCode} · ` : ''}
        {entry.room || 'Room TBA'}
        {entry.type ? ` · ${entry.type}` : ''}
      </span>
      <small>{entry.faculty || 'SR University Faculty'}</small>
    </button>
  )
}

export default function TimetablePage({
  student,
  onStudentChange
}: {
  student?: any
  onStudentChange?: (s: any) => void
}) {
  const [tree, setTree] = useState<Record<string, Record<string, string[]>>>({})
  const [degreeList, setDegreeList] = useState<string[]>([])

  // Student's currently saved batch from MongoDB
  const studentBatchCode =
    student?.academicProfile?.sruBatchCode ||
    student?.academicProfile?.batchCode ||
    student?.academicProfile?.batch ||
    '24BTCAIAIB10'

  const [selectedDegree, setSelectedDegree] = useState<string>('BTECH-CSE')
  const [selectedYear, setSelectedYear] = useState<string>('Third')
  const [batchCode, setBatchCode] = useState<string>(studentBatchCode)

  const [data, setData] = useState<TimetableSnapshot | null>(null)
  const [selected, setSelected] = useState(localDay() === 'Sunday' ? 'Monday' : localDay())
  const [detail, setDetail] = useState<TimetableEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch live srux.in timetable options tree
  useEffect(() => {
    timetableApi
      .options()
      .then((res) => {
        if (res?.tree && Object.keys(res.tree).length > 0) {
          setTree(res.tree)
          const degrees = Object.keys(res.tree)
          setDegreeList(degrees)

          // Try to locate student's batch in srux tree
          let foundDegree = ''
          let foundYear = ''
          let foundBatch = ''

          for (const [deg, yearsMap] of Object.entries(res.tree)) {
            for (const [yr, batches] of Object.entries(yearsMap)) {
              if (Array.isArray(batches) && batches.includes(studentBatchCode)) {
                foundDegree = deg
                foundYear = yr
                foundBatch = studentBatchCode
                break
              }
            }
            if (foundDegree) break
          }

          if (!foundDegree) {
            const studentDept = (
              student?.academicProfile?.department ||
              student?.academicProfile?.degree ||
              ''
            ).toLowerCase()

            if (studentDept.includes('cse') || studentDept.includes('computer')) {
              foundDegree = degrees.find((d) => d.includes('CSE')) || degrees[0]
            } else if (studentDept.includes('ece') || studentDept.includes('electronic')) {
              foundDegree = degrees.find((d) => d.includes('ECE')) || degrees[0]
            } else if (studentDept.includes('bba')) {
              foundDegree = degrees.find((d) => d.includes('BBA')) || degrees[0]
            } else if (studentDept.includes('bca')) {
              foundDegree = degrees.find((d) => d.includes('BCA')) || degrees[0]
            } else {
              foundDegree = degrees.find((d) => d === student?.academicProfile?.degree) || 'BTECH-CSE'
            }

            const years = Object.keys(res.tree[foundDegree] || {})
            const studentYr = (student?.academicProfile?.year || '').toLowerCase()
            if (studentYr.includes('first') || studentYr.includes('1')) {
              foundYear = years.find((y) => y.toLowerCase().includes('first')) || years[0]
            } else if (studentYr.includes('second') || studentYr.includes('2')) {
              foundYear = years.find((y) => y.toLowerCase().includes('second')) || years[0]
            } else if (studentYr.includes('third') || studentYr.includes('3')) {
              foundYear = years.find((y) => y.toLowerCase().includes('third')) || years[0]
            } else if (studentYr.includes('fourth') || studentYr.includes('4')) {
              foundYear = years.find((y) => y.toLowerCase().includes('fourth')) || years[0]
            } else {
              foundYear = years[0]
            }

            const batches = res.tree[foundDegree]?.[foundYear] || []
            foundBatch = batches.includes(studentBatchCode) ? studentBatchCode : batches[0] || studentBatchCode
          }

          if (foundDegree) setSelectedDegree(foundDegree)
          if (foundYear) setSelectedYear(foundYear)
          if (foundBatch) setBatchCode(foundBatch)
        }
      })
      .catch((err) => console.warn('Failed to load srux options:', err))
  }, [studentBatchCode])

  // Available years for current degree
  const availableYears = useMemo(() => {
    if (!tree[selectedDegree]) return ['First', 'Second', 'Third', 'Fourth']
    return Object.keys(tree[selectedDegree])
  }, [tree, selectedDegree])

  // Available batches for current degree + year
  const availableBatches = useMemo(() => {
    if (!tree[selectedDegree]?.[selectedYear]) return []
    return tree[selectedDegree][selectedYear]
  }, [tree, selectedDegree, selectedYear])

  const handleDegreeChange = (newDegree: string) => {
    setSelectedDegree(newDegree)
    const years = Object.keys(tree[newDegree] || {})
    const newYear = years.includes(selectedYear) ? selectedYear : years[0] || 'Third'
    setSelectedYear(newYear)
    const batches = tree[newDegree]?.[newYear] || []
    if (batches.length > 0) {
      setBatchCode(batches[0])
    }
  }

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear)
    const batches = tree[selectedDegree]?.[newYear] || []
    if (batches.length > 0) {
      setBatchCode(batches[0])
    }
  }

  const handleBatchChange = (newBatch: string) => {
    setBatchCode(newBatch)
  }

  const load = (code = batchCode) => {
    if (!code) return
    setLoading(true)
    timetableApi
      .week(code)
      .then((res) => setData(res))
      .catch(() => setData({ status: 'error', entries: [], error: 'Unable to load timetable right now.' }))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    if (batchCode) {
      load(batchCode)
    }
  }, [batchCode])

  const handleRefresh = () => {
    setRefreshing(true)
    load(batchCode)
  }

  const isMyTimetable = studentBatchCode === batchCode

  const handleSaveToProfile = async () => {
    if (!student) return
    setSaving(true)
    try {
      const res = await usersApi.updateProfile({
        academicProfile: {
          degree: selectedDegree,
          department: selectedDegree,
          year: selectedYear,
          batch: batchCode,
          batchCode: batchCode,
          sruBatchCode: batchCode
        }
      })
      if (res?.student && onStudentChange) {
        onStudentChange(res.student)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error('Failed to set active timetable:', err)
    } finally {
      setSaving(false)
    }
  }

  const entries = useMemo(() => {
    const list = data?.entries.filter((x) => x.day === selected) || []
    if (!searchQuery.trim()) return list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    const q = searchQuery.toLowerCase()
    return list
      .filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          (e.faculty && e.faculty.toLowerCase().includes(q)) ||
          (e.room && e.room.toLowerCase().includes(q)) ||
          (e.courseCode && e.courseCode.toLowerCase().includes(q))
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [data, selected, searchQuery])

  const isToday = selected === localDay()

  return (
    <main className="timetable-screen">
      <header>
        <button
          className="back-button"
          onClick={() => {
            location.hash = ''
          }}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
        <span className="timetable-brand">
          <ShieldCheck
            size={14}
            style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: 'var(--green)' }}
          />
          SR UNIVERSITY · LIVE ACADEMIC TIMETABLE
        </span>
      </header>

      <section className="timetable-page">
        {/* Real Dynamic Cascading Timetable Selector */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                style={{
                  fontSize: 10,
                  font: '600 10px "DM Mono"',
                  color: 'var(--muted)',
                  letterSpacing: 0.5
                }}
              >
                DEPARTMENT / DEGREE:
              </label>
              <select
                value={selectedDegree}
                onChange={(e) => handleDegreeChange(e.target.value)}
                style={{
                  background: '#faf9f4',
                  border: '1px solid var(--line)',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {degreeList.length > 0 ? (
                  degreeList.map((deg) => (
                    <option key={deg} value={deg}>
                      {deg}
                    </option>
                  ))
                ) : (
                  <option value={selectedDegree}>{selectedDegree}</option>
                )}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                style={{
                  fontSize: 10,
                  font: '600 10px "DM Mono"',
                  color: 'var(--muted)',
                  letterSpacing: 0.5
                }}
              >
                ACADEMIC YEAR:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                style={{
                  background: '#faf9f4',
                  border: '1px solid var(--line)',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} Year
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                style={{
                  fontSize: 10,
                  font: '600 10px "DM Mono"',
                  color: 'var(--muted)',
                  letterSpacing: 0.5
                }}
              >
                BATCH NUMBER / CODE:
              </label>
              <select
                value={batchCode}
                onChange={(e) => handleBatchChange(e.target.value)}
                style={{
                  background: '#faf9f4',
                  border: '1px solid var(--line)',
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {availableBatches.length > 0 ? (
                  availableBatches.map((b) => (
                    <option key={b} value={b}>
                      Batch {b}
                    </option>
                  ))
                ) : (
                  <option value={batchCode}>Batch {batchCode}</option>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMyTimetable ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#e4efde',
                  color: 'var(--green)',
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={15} /> Active on My Dashboard
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSaveToProfile}
                disabled={saving}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 15px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <BookmarkCheck size={15} />
                {saving ? 'Saving...' : 'Set as My Timetable'}
              </button>
            )}

            {saveSuccess && (
              <span style={{ fontSize: 12, color: 'var(--green)', font: '500 12px "DM Mono"' }}>
                Saved!
              </span>
            )}
          </div>
        </div>

        <div className="timetable-title">
          <div>
            <h1>Your week, in view.</h1>
            <p>
              Displaying live schedule for{' '}
              <strong>
                SR University · {selectedDegree} · {selectedYear} Year · Batch {batchCode}
              </strong>
              . Synchronized live from{' '}
              <a
                href="https://www.srux.in/timetable"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--green)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                srux.in/timetable <ExternalLink size={12} />
              </a>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="soft" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Updating…' : 'Sync Timetable'}
            </button>
          </div>
        </div>

        <div
          className="timetable-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <span>
              <strong>Verified Live Timetable Active</strong> — Loaded directly for Batch{' '}
              <code>{batchCode}</code> from SR University academic portal.
            </span>
          </div>
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Search classes, rooms…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#fff',
                border: '1px solid #ccd2c9',
                padding: '4px 8px 4px 28px',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--muted)' }} />
          </div>
        </div>

        <div className="day-tabs">
          {days.map((day) => {
            const count = (data?.entries.filter((x) => x.day === day) || []).length
            return (
              <button
                key={day}
                className={selected === day ? 'selected' : ''}
                onClick={() => setSelected(day)}
              >
                <span>{day.slice(0, 3)}</span>
                <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', fontWeight: 400 }}>
                  {count ? `${count} classes` : 'Free'}
                </small>
                {day === localDay() && <i />}
              </button>
            )
          })}
        </div>

        <div className="week-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <b>{selected} Schedule</b>
            {isToday && (
              <span
                style={{
                  background: '#e4efde',
                  color: 'var(--green)',
                  font: '500 10px "DM Mono"',
                  padding: '2px 8px',
                  borderRadius: '3px'
                }}
              >
                TODAY
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Showing {entries.length} scheduled sessions
          </span>
        </div>

        {loading ? (
          <div className="timetable-skeleton">
            <i />
            <i />
            <i />
          </div>
        ) : entries.length ? (
          <div className="day-schedule">
            {entries.map((entry) => (
              <div className="schedule-row" key={entry.id}>
                <time>
                  {time(entry.startTime)}
                  <small>{entry.endTime && `– ${time(entry.endTime)}`}</small>
                </time>
                <Entry entry={entry} onOpen={setDetail} isToday={isToday} />
              </div>
            ))}
          </div>
        ) : (
          <div className="timetable-empty compact">
            <Clock3 size={28} />
            <h2>No classes scheduled for {selected}</h2>
            <p>
              {selected === 'Sunday'
                ? 'Enjoy your weekend!'
                : 'No lectures or labs registered on this day. Use this time for independent projects or study.'}
            </p>
          </div>
        )}
      </section>

      {detail && (
        <div className="class-sheet" onMouseDown={() => setDetail(null)}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button className="close-sheet" onClick={() => setDetail(null)}>
              ×
            </button>
            <span className="eyebrow">{detail.day} · SESSION PROFILE</span>
            <h2>{detail.subject}</h2>
            <p className="class-time">
              <Clock3 size={16} />
              {time(detail.startTime)} – {time(detail.endTime)}
            </p>
            {detail.type && (
              <p
                style={{
                  display: 'inline-block',
                  background: '#eef2eb',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  font: '500 11px "DM Mono"',
                  color: 'var(--green)',
                  margin: '4px 0 14px'
                }}
              >
                {detail.type.toUpperCase()}
              </p>
            )}
            <dl>
              {detail.faculty && (
                <>
                  <dt>Faculty</dt>
                  <dd>
                    <User size={14} style={{ marginRight: 4, color: 'var(--muted)' }} />
                    {detail.faculty}
                  </dd>
                </>
              )}
              {detail.room && (
                <>
                  <dt>Room & Block</dt>
                  <dd>
                    <MapPin size={14} style={{ marginRight: 4, color: 'var(--green)' }} />
                    <strong>{detail.room}</strong>
                  </dd>
                </>
              )}
              {detail.courseCode && (
                <>
                  <dt>Course Code</dt>
                  <dd>{detail.courseCode}</dd>
                </>
              )}
              <dt>Academic Roster</dt>
              <dd>
                SR University · {selectedDegree} · Year {selectedYear} · Batch {batchCode}
              </dd>
            </dl>
          </section>
        </div>
      )}
    </main>
  )
}
