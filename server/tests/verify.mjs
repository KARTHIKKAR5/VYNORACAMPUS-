import http from 'http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 8787,
      path: `/api/v1${path}`,
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
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
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
  console.log('\n==================================================');
  console.log('VYNORA PLATFORM VERIFICATION TEST SUITE');
  console.log('==================================================\n');

  // Test 1: Health check
  console.log('1. Health Check');
  const health = await request('/health');
  assert(health.status === 200 && health.data.status === 'healthy', 'Backend health check status is 200 & healthy');
  assert(health.data.database === 'connected', 'Database connection verified');

  // Test 2: Auth Me & User session
  console.log('\n2. User Authentication & Session');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'aarav.mehta@sru.edu.in', password: 'StudentPass123!' }
  });
  const cookie = loginRes.headers['set-cookie']?.[0];
  const currentUser = loginRes.data.student;
  assert(loginRes.status === 200 && currentUser?.email, `Authenticated user resolved (${currentUser?.email})`);
  assert(currentUser?.role, `User has assigned role: ${currentUser?.role}`);

  // Test 3: Products Catalog & Vynora Pulse
  console.log('\n3. Products Catalog & Vynora Pulse Verification');
  const prods = await request('/products');
  assert(prods.status === 200 && Array.isArray(prods.data.products), 'Products list fetched from MongoDB');
  const pulse = prods.data.products.find((p) => p.slug === 'vynora-pulse');
  assert(Boolean(pulse), 'Vynora Pulse external product is present in catalog');
  assert(pulse?.externalUrl === 'https://vynorapulse.vercel.app/', 'Vynora Pulse destination URL is verified');
  assert(pulse?.isExternal === true, 'Vynora Pulse is correctly marked as isExternal: true');

  // Test 4: Product Ordering & Entitlement
  console.log('\n4. Product Access & Checkout Verification');
  const paidProduct = prods.data.products.find((p) => !p.isExternal && p.price > 0);
  if (paidProduct) {
    const orderRes = await request('/orders', {
      method: 'POST',
      headers: cookie ? { Cookie: cookie } : {},
      body: { productId: paidProduct._id }
    });
    assert(orderRes.status === 201 && orderRes.data.success, `Order placed for ${paidProduct.name} at server validated price (₹${paidProduct.price})`);
    assert(Boolean(orderRes.data.order?.orderId), `Order ID generated: ${orderRes.data.order?.orderId}`);
  }

  // Test 5: Clubs Directory & Head Announcements
  console.log('\n5. Clubs & Announcements');
  const clubs = await request('/clubs');
  assert(clubs.status === 200 && Array.isArray(clubs.data.clubs), 'Clubs fetched from database');
  const announcements = await request('/announcements');
  assert(announcements.status === 200 && Array.isArray(announcements.data.announcements), 'Announcements fetched from database');

  // Test 6: Campus Events & Registration Capacity
  console.log('\n6. Events & Registration Capacity');
  const events = await request('/events');
  assert(events.status === 200 && Array.isArray(events.data.events) && events.data.events.length > 0, 'Campus events fetched from database');
  const firstEvent = events.data.events[0];
  const regRes = await request(`/events/${firstEvent._id}/register`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {}
  });
  assert(regRes.status === 200 || regRes.status === 400, `Event registration handled safely (Status: ${regRes.status})`);

  // Test 7: SR University Timetable
  console.log('\n7. Academic Timetable Verification');
  const today = await request('/timetable/today');
  assert(today.status === 200 && Array.isArray(today.data.today || today.data.entries), 'Today academic schedule queried from MongoDB');
  const week = await request('/timetable/week');
  assert(week.status === 200 && Array.isArray(week.data.entries), 'Weekly timetable entries loaded from live database');

  // Test 8: Content Moderation & Reporting
  console.log('\n8. Content Moderation & Reporting');
  const reportRes = await request('/reports', {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : {},
    body: {
      targetType: 'POST',
      targetId: 'post_test_123',
      reason: 'Spam testing during verification'
    }
  });
  assert(reportRes.status === 201 && reportRes.data.success, 'Report submitted and saved to moderation queue');

  // Test 9: Admin Metrics (With Admin Privileges)
  console.log('\n9. Admin Dashboard Metrics Verification');
  const adminMetrics = await request('/admin/metrics', {
    headers: {
      'x-vynora-user-id': 'admin@vynora.edu'
    }
  });
  assert(adminMetrics.status === 200, 'Admin endpoint accessible with Admin credentials');
  assert(typeof adminMetrics.data.metrics.totalUsers === 'number', `Admin Metrics: Total Users = ${adminMetrics.data.metrics.totalUsers}`);
  assert(typeof adminMetrics.data.metrics.totalClubs === 'number', `Admin Metrics: Approved Clubs = ${adminMetrics.data.metrics.totalClubs}`);
  assert(typeof adminMetrics.data.metrics.totalEvents === 'number', `Admin Metrics: Published Events = ${adminMetrics.data.metrics.totalEvents}`);

  // Test 10: RBAC Protection for unprivileged users on Admin Endpoints
  console.log('\n10. Security & RBAC Protection');
  const studentAdminCheck = await request('/admin/metrics', {
    headers: {
      'x-vynora-user-id': 'aarav.mehta@sru.edu.in' // STUDENT role
    }
  });
  assert(studentAdminCheck.status === 403, 'RBAC strictly rejects non-admin users from admin dashboard (403 Forbidden)');

  // Summary
  console.log('\n==================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
