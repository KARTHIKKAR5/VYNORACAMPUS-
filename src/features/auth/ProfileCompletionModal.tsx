import { useState, FormEvent } from 'react';
import { Sparkles, GraduationCap, ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import { usersApi } from '../../services/api';

const AVAILABLE_YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Other'];

const AVAILABLE_DEPARTMENTS = [
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

const AVAILABLE_INTERESTS = [
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

export default function ProfileCompletionModal({
  student,
  onComplete
}: {
  student: any;
  onComplete: (updatedStudent: any) => void;
}) {
  const [university, setUniversity] = useState(student.academicProfile?.university || 'SR University');
  const [year, setYear] = useState(student.academicProfile?.year || 'First year');
  const [department, setDepartment] = useState(student.academicProfile?.department || AVAILABLE_DEPARTMENTS[0]);
  const [customDept, setCustomDept] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    Array.isArray(student.interests) && student.interests.length
      ? student.interests
      : ['Coding & Software Development']
  );
  const [bio, setBio] = useState(student.bio || '');
  const [skillsStr, setSkillsStr] = useState((student.skills || []).join(', '));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest to help peers discover collaboration opportunities.');
      return;
    }

    const finalDept = department === 'Other' && customDept.trim() ? customDept.trim() : department;

    setLoading(true);
    setError(null);

    try {
      const skills = skillsStr
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const res = await usersApi.updateProfile({
        academicProfile: {
          university: university.trim(),
          year,
          department: finalDept
        },
        interests: selectedInterests,
        bio: bio.trim(),
        skills
      });

      onComplete(res.student);
    } catch (err: any) {
      setError(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(21, 59, 51, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        style={{
          background: '#faf9f4',
          maxWidth: 540,
          width: '100%',
          borderRadius: 8,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            background: 'var(--green)',
            color: '#ffffff',
            padding: '20px 24px',
            borderBottom: '1px solid #1f5043'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 10,
                fontFamily: '"DM Mono", monospace',
                letterSpacing: '0.12em',
                fontWeight: 700,
                background: '#23594c',
                color: '#8be4d5',
                padding: '2px 8px',
                borderRadius: 3
              }}
            >
              REQUIRED STUDENT PROFILE
            </span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', fontSize: 22, fontFamily: 'Fraunces, serif', color: '#ffffff' }}>
            Complete Your Campus Profile
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#c4e0d7' }}>
            Welcome, <b>{student.name}</b>. Set your academic cohort and interests so peers can discover you.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                background: '#fcedea',
                color: '#9e3b26',
                padding: '10px 14px',
                borderRadius: 4,
                fontSize: 12.5,
                marginBottom: 16
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
              COLLEGE / UNIVERSITY NAME
            </label>
            <input
              type="text"
              required
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                ACADEMIC YEAR
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ width: '100%', height: 38, padding: '0 8px', borderRadius: 4, border: '1px solid var(--line)', background: '#fff', fontSize: 13 }}
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                DEPARTMENT
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', height: 38, padding: '0 8px', borderRadius: 4, border: '1px solid var(--line)', background: '#fff', fontSize: 13 }}
              >
                {AVAILABLE_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {department === 'Other' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                SPECIFY YOUR DEPARTMENT
              </label>
              <input
                type="text"
                placeholder="e.g. Physics, Applied Mathematics"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                required
                style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
              INTERESTS & TOPICS (SELECT ALL THAT APPLY)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AVAILABLE_INTERESTS.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 16,
                      fontSize: 11.5,
                      fontWeight: active ? 600 : 400,
                      background: active ? 'var(--green)' : '#f0efe9',
                      color: active ? '#ffffff' : 'var(--ink)',
                      border: '1px solid',
                      borderColor: active ? 'var(--green)' : 'var(--line)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {active && <Check size={12} />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
              TECHNICAL SKILLS <small style={{ fontWeight: 400 }}>(Comma separated)</small>
            </label>
            <input
              type="text"
              placeholder="React, Python, Figma, Circuit Design"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
              SHORT BIO / COLLABORATION GOALS <small style={{ fontWeight: 400 }}>(Optional)</small>
            </label>
            <textarea
              rows={3}
              placeholder="What are you building or interested in collaborating on this semester?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13, resize: 'vertical' }}
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
              gap: 8
            }}
          >
            {loading ? 'Saving Profile...' : <>Save Profile & Enter Campus <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
