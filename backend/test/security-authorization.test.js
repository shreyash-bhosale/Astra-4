import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import { db } from '../src/db/store.js';
import approvalRoutes from '../src/routes/approvalRoutes.js';
import policyRoutes from '../src/routes/policyRoutes.js';
import authRoutes from '../src/routes/authRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

async function runSecurityTests() {
  console.log('========================================================');
  console.log('🛡️ Starting ResolveAI Security & Role Authorization Suite');
  console.log('========================================================\n');

  // Setup test Express instance
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/approvals', approvalRoutes);
  app.use('/api/policies', policyRoutes);
  app.use(errorHandler);

  const server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  db.reset();

  try {
    // Generate valid tokens for agent and manager personas
    const agentToken = jwt.sign(
      { id: 'usr-agent-01', email: 'agent@resolveai.io', role: 'agent' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const managerToken = jwt.sign(
      { id: 'usr-manager-01', email: 'manager@resolveai.io', role: 'manager' },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const fakeToken = jwt.sign(
      { id: 'usr-agent-01' },
      'wrong-secret-key-that-will-fail-verification',
      { expiresIn: '1h' }
    );

    // Test 1: Unauthenticated request to protected route
    console.log('Test 1: Unauthenticated request to /api/approvals...');
    const unauthRes = await fetch(`${baseUrl}/api/approvals`);
    console.log(`  Status: ${unauthRes.status} (Expected: 401)`);
    if (unauthRes.status !== 401) throw new Error(`Expected 401 but got ${unauthRes.status}`);
    console.log('  ✓ PASS: Blocked unauthenticated access.\n');

    // Test 2: Invalid/tampered JWT
    console.log('Test 2: Tampered JWT token...');
    const fakeTokenRes = await fetch(`${baseUrl}/api/approvals`, {
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    console.log(`  Status: ${fakeTokenRes.status} (Expected: 401)`);
    if (fakeTokenRes.status !== 401) throw new Error(`Expected 401 but got ${fakeTokenRes.status}`);
    console.log('  ✓ PASS: Rejected tampered JWT.\n');

    // Test 3: Agent attempting to approve supervisor action (MUST BE FORBIDDEN 403)
    console.log('Test 3: Agent role attempting to approve action (POST /api/approvals/appr-001/approve)...');
    const agentApproveRes = await fetch(`${baseUrl}/api/approvals/appr-001/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      }
    });
    const agentApproveBody = await agentApproveRes.json();
    console.log(`  Status: ${agentApproveRes.status} (Expected: 403)`);
    console.log(`  Response:`, agentApproveBody.message || agentApproveBody.error);
    if (agentApproveRes.status !== 403) throw new Error(`Expected 403 but got ${agentApproveRes.status}`);
    console.log('  ✓ PASS: Agent blocked from supervisor approval endpoint.\n');

    // Test 4: Agent attempting to create policy (MUST BE FORBIDDEN 403)
    console.log('Test 4: Agent role attempting to create policy (POST /api/policies)...');
    const agentPolicyRes = await fetch(`${baseUrl}/api/policies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Hacked Policy',
        category: 'security',
        content: 'Free refunds without verification.'
      })
    });
    console.log(`  Status: ${agentPolicyRes.status} (Expected: 403)`);
    if (agentPolicyRes.status !== 403) throw new Error(`Expected 403 but got ${agentPolicyRes.status}`);
    console.log('  ✓ PASS: Agent blocked from policy creation endpoint.\n');

    // Test 5: Manager role attempting to create policy (MUST BE ALLOWED 201)
    console.log('Test 5: Manager role creating policy (POST /api/policies)...');
    const managerPolicyRes = await fetch(`${baseUrl}/api/policies`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'VIP Expedited Exchange Policy',
        category: 'replacement',
        content: 'Enterprise tier customers qualify for immediate courier replacement dispatch.'
      })
    });
    const createdPolicy = await managerPolicyRes.json();
    console.log(`  Status: ${managerPolicyRes.status} (Expected: 201)`);
    console.log(`  Policy ID: ${createdPolicy.id}, Title: ${createdPolicy.title}`);
    if (managerPolicyRes.status !== 201) throw new Error(`Expected 201 but got ${managerPolicyRes.status}`);
    console.log('  ✓ PASS: Manager authorized to create policy.\n');

    // Test 6: Auth rate limiter
    console.log('Test 6: Verifying auth endpoint rate limiter...');
    let hitRateLimit = false;
    for (let i = 0; i < 30; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' })
      });
      if (res.status === 429) {
        hitRateLimit = true;
        console.log(`  Rate limit triggered at attempt ${i + 1} with status 429.`);
        break;
      }
    }
    if (!hitRateLimit) throw new Error('Expected 429 Too Many Requests on auth brute force');
    console.log('  ✓ PASS: Rate limiter correctly mitigates brute-force attacks.\n');

    console.log('========================================================');
    console.log('🎉 ALL SECURITY & ROLE AUTHORIZATION TESTS PASSED!');
    console.log('========================================================\n');
  } finally {
    server.close();
  }
}

runSecurityTests().catch(err => {
  console.error('❌ Security test failed:', err);
  process.exit(1);
});
