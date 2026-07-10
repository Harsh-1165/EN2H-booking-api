const BASE_URL = 'http://localhost:3000/api';

function logHeader(text) {
  console.log(`\n=== ${text} ===`);
}

function logResult(success, message, detail = '') {
  if (success) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    console.error(`\x1b[31m✘ FAIL:\x1b[0m ${message}`);
    if (detail) console.error(`\x1b[33mDetail:\x1b[0m`, detail);
  }
}

async function runTests() {
  console.log('Starting Booking Platform API Integration Test Suite...');
  console.log(`Targeting base URL: ${BASE_URL}`);

  const uniqueEmail = `admin-${Date.now()}@example.com`;
  let accessToken = '';
  let refreshToken = '';
  let serviceId = '';
  let bookingId = '';

  try {
    logHeader('Authentication & User Management');

    // 1. Register User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
        name: 'Test Administrator',
      }),
    });
    const regData = await regRes.json();
    logResult(regRes.status === 201 && regData.accessToken, 'User Registration (POST /auth/register)', regData);

    // 2. Duplicate Registration Conflict
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
        name: 'Test Administrator',
      }),
    });
    logResult(dupRes.status === 409, 'Duplicate Registration Prevention (Expects 409 Conflict)', dupRes.status);

    // 3. Login with Invalid Credentials
    const badLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword',
      }),
    });
    logResult(badLogin.status === 401, 'Invalid Login Rejection (Expects 401 Unauthorized)', badLogin.status);

    // 4. Valid Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password123',
      }),
    });
    const loginData = await loginRes.json();
    accessToken = loginData.accessToken;
    refreshToken = loginData.refreshToken;
    logResult(loginRes.status === 200 && accessToken && refreshToken, 'Valid Login & Token Retrieval (POST /auth/login)', loginData);

    // 5. Token Refresh Rotation
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    accessToken = refreshData.accessToken || accessToken;
    refreshToken = refreshData.refreshToken || refreshToken;
    logResult(refreshRes.status === 200 && refreshData.accessToken, 'JWT Refresh Token Rotation (POST /auth/refresh)', refreshData);

    logHeader('Service Management (CRUD & Auth)');

    // 6. Create Service Without Token
    const unauthorizedService = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Haircut',
        duration: 30,
        price: 25.0,
      }),
    });
    logResult(unauthorizedService.status === 401, 'Protected Route Block (Create service without token)', unauthorizedService.status);

    // 7. Create Service With Token
    const serviceRes = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: 'Premium Massage',
        description: 'Swedish full body massage',
        duration: 60,
        price: 80.0,
        isActive: true,
      }),
    });
    const serviceData = await serviceRes.json();
    serviceId = serviceData.id;
    logResult(serviceRes.status === 201 && serviceId, 'Create Service (POST /services)', serviceData);

    // 8. Get All Services (Public + Paginated)
    const getServicesRes = await fetch(`${BASE_URL}/services?page=1&limit=5`);
    const servicesList = await getServicesRes.json();
    logResult(
      getServicesRes.status === 200 && Array.isArray(servicesList.data) && servicesList.meta.page === 1,
      'Get All Services & Pagination (GET /services)',
      servicesList.meta
    );

    logHeader('Booking Management & Business Rules');

    const bookingYear = new Date().getFullYear() + 2;
    const futureDate = `${bookingYear}-08-25`;
    const bookingTime = '10:00';

    // 9. Create Booking (Public Guest Access)
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        customerPhone: '+1234567890',
        serviceId: serviceId,
        bookingDate: futureDate,
        bookingTime: bookingTime,
        notes: 'Needs soft pillows',
      }),
    });
    const bookingData = await bookingRes.json();
    bookingId = bookingData.id;
    logResult(bookingRes.status === 201 && bookingId, 'Create Booking (POST /bookings - Guest Public)', bookingData);

    // 10. Booking in the Past Validation
    const pastBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        customerPhone: '+1234567890',
        serviceId: serviceId,
        bookingDate: '2020-01-01',
        bookingTime: '10:00',
      }),
    });
    logResult(pastBookingRes.status === 400, 'Past Date Booking Rejection (Expects 400 Bad Request)', pastBookingRes.status);

    // 11. Booking for Non-Existent Service
    const fakeServiceBooking = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Charlie',
        customerEmail: 'charlie@example.com',
        customerPhone: '+1234567890',
        serviceId: '12345678-1234-4234-8234-123456789012', // Valid UUID v4 but doesn't exist
        bookingDate: futureDate,
        bookingTime: '11:00',
      }),
    });
    logResult(fakeServiceBooking.status === 404, 'Non-existent Service Check (Expects 404 Not Found)', fakeServiceBooking.status);

    // 12. Duplicate Booking Collision Check
    const duplicateRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Eve Cooper',
        customerEmail: 'eve@example.com',
        customerPhone: '+1999888777',
        serviceId: serviceId,
        bookingDate: futureDate,
        bookingTime: bookingTime,
      }),
    });
    logResult(duplicateRes.status === 409, 'Duplicate Slot Booking Prevention (Expects 409 Conflict)', duplicateRes.status);

    logHeader('Staff Queries & Business Transitions');

    // 13. Get Booking by ID
    const getBookingRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const singleBooking = await getBookingRes.json();
    logResult(getBookingRes.status === 200 && singleBooking.id === bookingId, 'Get Booking by ID (GET /bookings/:id)', singleBooking);

    // 14. Search Bookings
    const searchRes = await fetch(`${BASE_URL}/bookings?search=Alice`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const searchList = await searchRes.json();
    const hasAlice = searchList.data.some(b => b.customerName.includes('Alice'));
    logResult(searchRes.status === 200 && hasAlice, 'Search Bookings by Customer Name (GET /bookings?search=...)');

    // 15. Filter Bookings by Status
    const filterRes = await fetch(`${BASE_URL}/bookings?status=PENDING`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const filterList = await filterRes.json();
    const allPending = filterList.data.every(b => b.status === 'PENDING');
    logResult(filterRes.status === 200 && allPending, 'Filter Bookings by Status (GET /bookings?status=PENDING)');

    // 16. Cancel Booking
    const cancelRes = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
    const cancelData = await cancelRes.json();
    logResult(cancelRes.status === 200 && cancelData.status === 'CANCELLED', 'Cancel Booking (POST /bookings/:id/cancel - Public)', cancelData);

    // 17. Attempt to Complete Cancelled Booking
    const completeRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    logResult(completeRes.status === 400, 'Invalid Transition: Complete a Cancelled Booking (Expects 400 Bad Request)', completeRes.status);

    // 18. Revoke / Logout Refresh Token
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    logResult(logoutRes.status === 200, 'Revoke Refresh Token & Logout (POST /auth/logout)', logoutRes.status);

    // 19. Reuse Revoked Refresh Token
    const failedRefresh = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    logResult(failedRefresh.status === 403, 'Revoked Refresh Token Block (Expects 403 Forbidden)', failedRefresh.status);

    console.log('\n======================================');
    console.log('\x1b[32m✔ ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!\x1b[0m');
    console.log('======================================');
  } catch (err) {
    console.error('\x1b[31m🚨 CRITICAL TEST FAILURE:\x1b[0m', err);
  }
}

runTests();
