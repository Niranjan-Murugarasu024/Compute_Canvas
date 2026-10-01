import { POST, GET } from '../app/api/waitlist/route';

async function runWaitlistTests() {
  console.log('Testing Waitlist API Route...\n');

  // Test 1: Invalid email
  const reqInvalid = new Request('http://localhost:3000/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', plan: 'Team Workspaces' }),
  });
  const resInvalid = await POST(reqInvalid);
  const dataInvalid = await resInvalid.json();
  if (resInvalid.status === 400 && dataInvalid.success === false) {
    console.log('✅ PASSED: Invalid email rejected with 400');
  } else {
    throw new Error(`Failed invalid email test: ${JSON.stringify(dataInvalid)}`);
  }

  // Test 2: Valid submission
  const testEmail = `architect_${Date.now()}@example.com`;
  const reqValid = new Request('http://localhost:3000/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      company: 'Acme AI Systems',
      notes: 'Testing multi-region router latency',
      plan: 'Team Workspaces',
    }),
  });
  const resValid = await POST(reqValid);
  const dataValid = await resValid.json();
  if (resValid.status === 200 && dataValid.success === true && dataValid.id) {
    console.log('✅ PASSED: Valid lead stored successfully with ID:', dataValid.id);
  } else {
    throw new Error(`Failed valid submission test: ${JSON.stringify(dataValid)}`);
  }

  // Test 3: Unconfigured ADMIN_SECRET returns 503
  delete process.env.ADMIN_SECRET;
  const reqUnconfigured = new Request('http://localhost:3000/api/waitlist?secret=any');
  const resUnconfigured = await GET(reqUnconfigured);
  if (resUnconfigured.status === 503) {
    console.log('✅ PASSED: Unconfigured ADMIN_SECRET rejected with 503 locked');
  } else {
    throw new Error('Failed unconfigured ADMIN_SECRET test');
  }

  // Setup dynamic test secret
  const dynamicSecret = `test_secret_${Date.now()}`;
  process.env.ADMIN_SECRET = dynamicSecret;

  // Test 4: Unauthorized GET (wrong secret)
  const reqUnauthorized = new Request('http://localhost:3000/api/waitlist?secret=wrong');
  const resUnauthorized = await GET(reqUnauthorized);
  if (resUnauthorized.status === 401) {
    console.log('✅ PASSED: Unauthorized GET rejected with 401');
  } else {
    throw new Error('Failed unauthorized test');
  }

  // Test 5: Authorized GET (JSON)
  const reqAuthorized = new Request(`http://localhost:3000/api/waitlist?secret=${dynamicSecret}`);
  const resAuthorized = await GET(reqAuthorized);
  const dataAuthorized = await resAuthorized.json();
  if (resAuthorized.status === 200 && dataAuthorized.total > 0 && Array.isArray(dataAuthorized.leads)) {
    console.log(`✅ PASSED: Authorized GET retrieved ${dataAuthorized.total} leads cleanly`);
    const found = dataAuthorized.leads.some((l: any) => l.email === testEmail);
    if (found) {
      console.log('✅ PASSED: Newly created lead verified in retrieved dataset');
    } else {
      throw new Error('Lead not found in dataset');
    }
  } else {
    throw new Error('Failed authorized GET test');
  }

  // Test 6: Authorized CSV export
  const reqCsv = new Request(`http://localhost:3000/api/waitlist?secret=${dynamicSecret}&format=csv`);
  const resCsv = await GET(reqCsv);
  const csvText = await resCsv.text();
  if (resCsv.status === 200 && csvText.includes('ID,Email,Plan,Company,Notes,CreatedAt') && csvText.includes(testEmail)) {
    console.log('✅ PASSED: CSV export generated with headers and lead record');
  } else {
    throw new Error('Failed CSV export test');
  }

  console.log('\n🎉 ALL WAITLIST TESTS PASSED!\n');
}

runWaitlistTests().catch(err => {
  console.error('Waitlist test error:', err);
  process.exit(1);
});
