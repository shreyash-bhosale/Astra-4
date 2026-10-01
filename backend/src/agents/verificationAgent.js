import { VerificationOutputSchema } from '../validators/index.js';

export class VerificationAgent {
  constructor() {
    this.name = 'Verification Agent';
    this.badge = '✓';
  }

  async run({ ticket, plan, investigationResult, policyResult, actionResult, communicationResult }) {
    // Verify all prior steps (1 to 5) completed
    const priorSteps = plan.filter(s => s.agent !== 'verification_agent' && s.step !== 6);
    const allStepsExecuted = priorSteps.every(s => s.status === 'COMPLETED');
    const evidenceSufficient = Boolean(investigationResult && (investigationResult.customerFound || investigationResult.orderFound));
    const policyCompliant = Boolean(policyResult && policyResult.policyCited && policyResult.permitted !== undefined);
    
    // If approval was required, verify that it was granted
    let approvalObtained = true;
    if (policyResult && policyResult.requiresHumanApproval) {
      approvalObtained = actionResult && actionResult.status === 'COMPLETED' && !actionResult.requiresApproval;
    }

    const customerInformed = Boolean(communicationResult && communicationResult.customerMessage);

    const isFullyVerified = allStepsExecuted && evidenceSufficient && policyCompliant && approvalObtained && customerInformed;

    const checklist = {
      allStepsExecuted,
      evidenceSufficient,
      policyCompliant,
      approvalObtained,
      customerInformed
    };

    let conclusion = '';
    if (isFullyVerified) {
      conclusion = 'All verification gates passed: investigation complete, policy rules validated, required approvals secured, tool actions executed, and customer response formulated.';
    } else {
      const failedItems = Object.entries(checklist)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      conclusion = `Verification gate failed on: ${failedItems.join(', ')}. Workflow cannot mark ticket as RESOLVED.`;
    }

    return {
      verified: isFullyVerified,
      checklist,
      conclusion
    };
  }
}

export const verificationAgent = new VerificationAgent();
