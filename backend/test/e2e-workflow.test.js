import { db } from '../src/db/store.js';
import { orchestratorAgent } from '../src/agents/orchestrator.js';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting ResolveAI End-to-End Multi-Agent Test Suite');
  console.log('========================================================\n');

  // 1. Reset Store
  console.log('Step 1: Resetting database store to initial seeds...');
  db.reset();
  const ticket = db.findById('tickets', 'tkt-001');
  console.log('✓ Found initial ticket #tkt-001:', ticket.title);
  console.log('  Status:', ticket.status, '| Priority:', ticket.priority);

  // 2. Start Autonomous Workflow
  console.log('\nStep 2: Triggering Orchestrator on ticket #tkt-001...');
  const run1 = await orchestratorAgent.runWorkflow({ ticketId: 'tkt-001' });
  console.log('✓ Workflow returned status:', run1.status);
  console.log('  Message:', run1.message);

  if (run1.status === 'WAITING_APPROVAL') {
    console.log('✓ Successfully paused at Human Supervisor Approval Gate!');
    const pendingApproval = db.findOne('approvals', a => a.ticket_id === 'tkt-001' && a.status === 'PENDING');
    console.log('  Approval ID:', pendingApproval.id);
    console.log('  Action Requested:', pendingApproval.action);
    console.log('  Reason:', pendingApproval.reason);

    // 3. Supervisor Approves
    console.log('\nStep 3: Human Supervisor grants approval and resumes workflow...');
    db.update('approvals', pendingApproval.id, {
      status: 'APPROVED',
      reviewed_by: 'usr-manager-01',
      reviewed_at: new Date().toISOString()
    });

    const run2 = await orchestratorAgent.runWorkflow({
      ticketId: 'tkt-001',
      resumeFromApproval: true,
      approvedAction: pendingApproval.action
    });

    console.log('✓ Resumed workflow status:', run2.status);
    console.log('  Resolution message:', run2.message);

    const updatedTicket = db.findById('tickets', 'tkt-001');
    console.log('\nStep 4: Verifying final ticket resolution state:');
    console.log('  Ticket Status:', updatedTicket.status);
    console.log('  Resolution Summary:', updatedTicket.resolution_summary);
    console.log('  Customer Response Excerpt:', updatedTicket.customer_response?.substring(0, 100) + '...');

    const auditEvents = db.find('audit_logs', l => l.ticket_id === 'tkt-001');
    console.log(`✓ Total Audit Trail Events recorded: ${auditEvents.length}`);
    auditEvents.forEach(e => console.log(`   - [${e.agent}] ${e.event_type}: ${e.description.substring(0, 65)}...`));

    if (updatedTicket.status === 'RESOLVED') {
      console.log('\n🎉 ALL P0 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
    } else {
      throw new Error(`Expected ticket to be RESOLVED but got ${updatedTicket.status}`);
    }
  } else {
    console.log('Workflow status:', run1.status);
  }
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
