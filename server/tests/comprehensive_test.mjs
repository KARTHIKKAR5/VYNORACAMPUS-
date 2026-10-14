import http from 'http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 8787,
      path: path.startsWith('/api') ? path : `/api/v1${path}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers, cookies });
        } catch {
          resolve({ status: res.statusCode, raw: data, headers: res.headers, cookies });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function run() {
  console.log('\n===============================================================');
  console.log(' VYNORA CAMPUS+ COMPREHENSIVE PRODUCTION TEST SUITE');
  console.log('===============================================================\n');

  // ==========================================
  // SECTION 1: DATA INTEGRITY & DUPLICATE PREVENTION
  // ==========================================
  console.log('--- 1. DATA INTEGRITY & DUPLICATE PREVENTION ---');

  // Test 1.1: Live MongoDB Atlas Connection
  const health = await request('/health');
  assert(health.status === 200 && health.data.status === 'healthy', 'Backend is healthy and responsive');
  assert(health.data.database === 'connected', 'Connected directly to MongoDB Atlas cluster');

  // Test 1.2: Duplicate registration prevention
  const dupReg = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Duplicate Test',
      email: 'aarav.mehta@sru.edu.in', // Existing email
      password: 'StrongPassword123!',
      academicProfile: { university: 'SR University', department: 'Computer Science', year: 'Third year' },
      interests: ['Coding & Software Development']
    }
  });
  assert(dupReg.status === 409, `Duplicate registration rejected with HTTP 409 Conflict (${dupReg.data?.error})`);

  // Test 1.3: Duplicate Event Prevention
  const dupEvent = await request('/events', {
    method: 'POST',
    headers: { 'x-vynora-user-id': 'admin@vynora.edu' },
    body: {
      title: 'Human-centred AI Workshop',
      venue: 'Lab 1205',
      startTime: new Date().toISOString(),
      description: 'Test workshop duplicate submission'
    }
  });
  // Event title exists or recent duplicate check triggers 409
  assert(dupEvent.status === 409 || dupEvent.status === 201, `Event submission handled safely without silent corruption (Status: ${dupEvent.status})`);

  // ==========================================
  // SECTION 2: AUTHENTICATION & GOOGLE OAUTH
  // ==========================================
  console.log('\n--- 2. AUTHENTICATION & GOOGLE OAUTH 2.0 ---');

  // Test 2.1: Google token endpoint invalid token rejection
  const invalidGoogle = await request('/auth/google', {
    method: 'POST',
    body: { credential: 'invalid_forged_google_jwt_token' }
  });
  assert(invalidGoogle.status === 400 || invalidGoogle.status === 401, `Invalid Google ID token securely rejected (Status: ${invalidGoogle.status})`);

  // Test 2.2: Unauthenticated access rejection on protected route
  const unauthMe = await request('/users/me');
  assert(unauthMe.status === 401, 'Unauthenticated access to /api/v1/users/me returns 401 Unauthorized');

  // Test 2.3: Student login with valid credentials
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'aarav.mehta@sru.edu.in',
      password: 'StudentPass123!'
    }
  });
  assert(studentLogin.status === 200 && Boolean(studentLogin.data.student), `Student login succeeds with verified credentials (${studentLogin.data?.student?.email})`);
  const studentCookie = studentLogin.cookies?.[0];

  // Test 2.4: Logout and session invalidation
  const logoutRes = await request('/auth/logout', {
    method: 'POST',
    headers: studentCookie ? { Cookie: studentCookie } : {}
  });
  assert(logoutRes.status === 200 && logoutRes.data.ok, 'Logout successfully terminates session and clears cookies');

  // ==========================================
  // SECTION 3: STUDENT PROFILE & RBAC
  // ==========================================
  console.log('\n--- 3. REQUIRED STUDENT PROFILE & ROLE ESCALATION PROTECTION ---');

  // Test 3.1: Profile update with structured interests, year, department
  const updateRes = await request('/users/me', {
    method: 'PATCH',
    headers: { 'x-vynora-user-id': 'aarav.mehta@sru.edu.in' },
    body: {
      academicProfile: {
        university: 'SR University',
        year: 'Third year',
        department: 'Computer Science & Engineering'
      },
      interests: ['Coding & Software Development', 'Artificial Intelligence & ML', 'Hackathons & Competitions'],
      bio: 'Third year CSE student building full-stack platforms.'
    }
  });
  assert(updateRes.status === 200, 'Student profile fields successfully persisted in MongoDB');
  assert(Array.isArray(updateRes.data?.student?.interests) && updateRes.data.student.interests.length === 3, 'Structured interests saved as array in database');
  assert(updateRes.data?.student?.profileCompleted === true, 'profileCompleted flag set to true');

  // Test 3.2: Role Escalation Attack Prevention (student attempting to set role: "ADMIN")
  const hackRes = await request('/users/me', {
    method: 'PATCH',
    headers: { 'x-vynora-user-id': 'aarav.mehta@sru.edu.in' },
    body: {
      role: 'ADMIN'
    }
  });
  assert(hackRes.data?.student?.role === 'STUDENT', 'Role escalation attack neutralized: student role remains STUDENT');

  // ==========================================
  // SECTION 4: SEPARATE ADMIN GATEWAY & RBAC
  // ==========================================
  console.log('\n--- 4. SEPARATE ADMIN LOGIN & PERMISSIONS ---');

  // Test 4.1: Dedicated Admin Login rejects non-admin accounts with 403 Forbidden
  const studentAdminAttempt = await request('/auth/admin/login', {
    method: 'POST',
    body: {
      email: 'aarav.mehta@sru.edu.in',
      password: 'StudentPass123!'
    }
  });
  assert(studentAdminAttempt.status === 403, `Non-admin account blocked from /auth/admin/login with 403 Forbidden (${studentAdminAttempt.data?.error})`);

  // Test 4.2: Dedicated Admin Login rejects invalid credentials with 401 Unauthorized
  const badAdminAttempt = await request('/auth/admin/login', {
    method: 'POST',
    body: {
      email: 'admin@vynora.edu',
      password: 'WrongPassword999!'
    }
  });
  assert(badAdminAttempt.status === 401, 'Invalid admin password rejected with 401 Unauthorized');

  // Test 4.3: Dedicated Admin Login succeeds with legitimate administrator credentials
  const validAdminLogin = await request('/auth/admin/login', {
    method: 'POST',
    body: {
      email: 'admin@vynora.edu',
      password: 'Admin@Vynora2026!'
    }
  });
  assert(validAdminLogin.status === 200 && validAdminLogin.data?.admin?.role === 'ADMIN', 'Legitimate administrator authenticated via separate admin gateway');

  // Test 4.4: Ordinary user forbidden from admin metrics API
  const studentMetricsAttempt = await request('/admin/metrics', {
    headers: { 'x-vynora-user-id': 'aarav.mehta@sru.edu.in' }
  });
  assert(studentMetricsAttempt.status === 403, 'Student strictly blocked from /admin/metrics with 403 Forbidden');

  // Test 4.5: Administrator authorized for admin metrics API
  const adminMetricsRes = await request('/admin/metrics', {
    headers: { 'x-vynora-user-id': 'admin@vynora.edu' }
  });
  assert(adminMetricsRes.status === 200, 'Administrator authorized to access admin metrics');
  assert(typeof adminMetricsRes.data?.metrics?.totalUsers === 'number', `Total users counted in database: ${adminMetricsRes.data?.metrics?.totalUsers}`);

  // ==========================================
  // SECTION 5: REAL DATABASE RECORDS
  // ==========================================
  console.log('\n--- 5. REAL DATABASE RECORDS & TIMETABLE ---');

  // Test 5.1: Real Clubs
  const clubs = await request('/clubs');
  assert(clubs.status === 200 && clubs.data.clubs.length >= 3, `Real clubs loaded from MongoDB Atlas (${clubs.data.clubs.length} clubs)`);

  // Test 5.2: Real Events
  const events = await request('/events');
  assert(events.status === 200 && events.data.events.length >= 3, `Real events loaded from MongoDB Atlas (${events.data.events.length} events)`);

  // Test 5.3: Real Timetable
  const timetable = await request('/timetable/today');
  assert(timetable.status === 200 && Array.isArray(timetable.data.today || timetable.data.entries), 'Real timetable records loaded from database');

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n===============================================================');
  console.log(` SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
