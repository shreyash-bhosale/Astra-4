import { app } from './src/server.js';
import http from 'http';
import { handleClientMock } from '../frontend/src/services/clientMockStore.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING AUTONOMY CONTROLS AUDIT ---');

  // 1. Start test server
  server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`✓ Test backend server running on ${baseUrl}`);

  // 2. Login as Manager (James Rodriguez)
  const managerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'manager@resolveai.io', password: 'password123' })
  });
  if (managerLogin.status !== 200 || !managerLogin.data.token) {
    throw new Error(`Failed to login as manager: ${JSON.stringify(managerLogin.data)}`);
  }
  const managerToken = managerLogin.data.token;
  console.log('✓ Logged in as Manager (role: manager)');

  // 3. Test GET /api/autonomy/settings
  const getSettings = await request('/api/autonomy/settings', {
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  console.log('✓ GET /api/autonomy/settings returned:', getSettings.status, 'enabled:', getSettings.data.enabled);

  // 4. Test POST /api/autonomy/disable
  const disableRes = await request('/api/autonomy/disable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (disableRes.status !== 200 || disableRes.data.settings?.enabled !== false) {
    throw new Error(`Disable autonomy failed: ${JSON.stringify(disableRes.data)}`);
  }
  console.log('✓ POST /api/autonomy/disable successful: enabled =', disableRes.data.settings.enabled);

  // 5. Test POST /api/autonomy/enable
  const enableRes = await request('/api/autonomy/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (enableRes.status !== 200 || enableRes.data.settings?.enabled !== true) {
    throw new Error(`Enable autonomy failed: ${JSON.stringify(enableRes.data)}`);
  }
  console.log('✓ POST /api/autonomy/enable successful: enabled =', enableRes.data.settings.enabled);

  // 6. Test POST /api/autonomy/pause
  const pauseRes = await request('/api/autonomy/pause', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (pauseRes.status !== 200 || pauseRes.data.settings?.paused !== true) {
    throw new Error(`Pause autonomy failed: ${JSON.stringify(pauseRes.data)}`);
  }
  console.log('✓ POST /api/autonomy/pause successful: paused =', pauseRes.data.settings.paused);

  // 7. Test POST /api/autonomy/resume
  const resumeRes = await request('/api/autonomy/resume', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (resumeRes.status !== 200 || resumeRes.data.settings?.paused !== false) {
    throw new Error(`Resume autonomy failed: ${JSON.stringify(resumeRes.data)}`);
  }
  console.log('✓ POST /api/autonomy/resume successful: paused =', resumeRes.data.settings.paused);

  // 8. Test POST /api/autonomy/emergency-stop
  const stopRes = await request('/api/autonomy/emergency-stop', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });
  if (stopRes.status !== 200 || stopRes.data.settings?.emergency_stopped !== true) {
    throw new Error(`Emergency stop failed: ${JSON.stringify(stopRes.data)}`);
  }
  console.log('✓ POST /api/autonomy/emergency-stop successful: emergency_stopped =', stopRes.data.settings.emergency_stopped);

  // Reset to enabled for normal ops
  await request('/api/autonomy/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${managerToken}` }
  });

  // 9. Test clientMockStore autonomy handlers
  console.log('\n--- TESTING CLIENT MOCK STORE AUTONOMY MUTATIONS ---');
  // Disable
  const mockDisable = handleClientMock('/autonomy/disable', { method: 'POST' });
  if (mockDisable.settings?.enabled !== false) {
    throw new Error('clientMockStore disable failed');
  }
  console.log('✓ clientMockStore /autonomy/disable: enabled =', mockDisable.settings.enabled);

  // Pause
  const mockPause = handleClientMock('/autonomy/pause', { method: 'POST' });
  if (mockPause.settings?.paused !== true) {
    throw new Error('clientMockStore pause failed');
  }
  console.log('✓ clientMockStore /autonomy/pause: paused =', mockPause.settings.paused);

  // Resume
  const mockResume = handleClientMock('/autonomy/resume', { method: 'POST' });
  if (mockResume.settings?.paused !== false) {
    throw new Error('clientMockStore resume failed');
  }
  console.log('✓ clientMockStore /autonomy/resume: paused =', mockResume.settings.paused);

  // Emergency Stop
  const mockStop = handleClientMock('/autonomy/emergency-stop', { method: 'POST' });
  if (mockStop.settings?.emergency_stopped !== true) {
    throw new Error('clientMockStore emergency stop failed');
  }
  console.log('✓ clientMockStore /autonomy/emergency-stop: emergency_stopped =', mockStop.settings.emergency_stopped);

  // Reset enable
  const mockEnable = handleClientMock('/autonomy/enable', { method: 'POST' });
  if (mockEnable.settings?.enabled !== true || mockEnable.settings?.emergency_stopped !== false) {
    throw new Error('clientMockStore enable failed');
  }
  console.log('✓ clientMockStore /autonomy/enable: enabled =', mockEnable.settings.enabled, 'emergency_stopped =', mockEnable.settings.emergency_stopped);

  console.log('\n======================================================');
  console.log('ALL AUTONOMY CONTROLS AUDIT TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
}).finally(() => {
  if (server) server.close();
  process.exit(0);
});
