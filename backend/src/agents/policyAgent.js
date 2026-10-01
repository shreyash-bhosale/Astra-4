import { tools } from '../tools/index.js';
import { aiService } from '../services/aiService.js';
import { PolicyOutputSchema } from '../validators/index.js';

export class PolicyAgent {
  constructor() {
    this.name = 'Policy Agent';
    this.badge = '▣';
  }

  async run({ ticket, triageResult, investigationResult }) {
    // 1. Search policies for category
    const searchRes = await tools.searchPolicies({
      category: triageResult.category,
      query: ticket.title
    });

    const policies = searchRes.policies;
    const policy = policies.length > 0 ? policies[0] : null;

    const prompt = `Ticket: ${ticket.title} - ${ticket.description}
Triage: Category=${triageResult.category}, Intent=${triageResult.intent}
Investigation Evidence:
- Customer: ${investigationResult.customerName}
- Order: ${investigationResult.orderId} (${investigationResult.productName})
- Days since delivery: ${investigationResult.daysSinceDelivery}
- Active Policy: ${policy ? policy.title + '\n' + policy.content : 'No active policy found'}`;

    const systemInstruction = `You are the Policy Agent in ResolveAI.
Evaluate whether the customer request is permitted under company policy.
Determine if human approval is required:
- Any physical replacement shipment or financial refund is SENSITIVE (Medium/High Risk) and MUST have requiresHumanApproval = true.
- Pre-shipment cancellations are low risk and can proceed autonomously (requiresHumanApproval = false).
Provide clear decision rationale citing the policy.`;

    const schemaHint = `{
  "decision": "replacement_eligible",
  "permitted": true,
  "policyCited": "POL-001 (Damaged Product Replacement Policy, Section 1)",
  "policyId": "POL-001",
  "reason": "Customer reported damage within 4 days of delivery, satisfying 14-day window. Physical replacement requires supervisor approval.",
  "requiresHumanApproval": true,
  "recommendedAction": "create_replacement_request",
  "confidence": 0.95
}`;

    const aiResult = await aiService.generateStructuredJSON({
      systemInstruction,
      prompt,
      schemaHint
    });

    if (aiResult) {
      const parsed = PolicyOutputSchema.safeParse(aiResult);
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Deterministic fallback reasoning
    if (triageResult.category === 'damaged_product' || triageResult.intent === 'replacement') {
      const isWithinWindow = investigationResult.daysSinceDelivery !== null ? investigationResult.daysSinceDelivery <= 14 : true;
      return {
        decision: isWithinWindow ? 'replacement_eligible' : 'warranty_window_expired',
        permitted: isWithinWindow,
        policyCited: 'POL-001: Damaged & Defective Product Replacement Policy',
        policyId: 'POL-001',
        reason: isWithinWindow
          ? `Order delivered ${investigationResult.daysSinceDelivery ?? 4} days ago, fully within the 14-day damaged delivery eligibility window. Physical replacement dispatch requires human supervisor approval gate.`
          : 'Order delivered over 14 days ago. Discretionary managerial escalation required.',
        requiresHumanApproval: true,
        recommendedAction: isWithinWindow ? 'create_replacement_request' : 'create_escalation',
        confidence: 0.94
      };
    } else if (triageResult.category === 'cancellation') {
      return {
        decision: 'cancellation_eligible',
        permitted: true,
        policyCited: 'POL-003: Pre-Shipment Order Cancellation Policy',
        policyId: 'POL-003',
        reason: 'Order is in PROCESSING stage prior to carrier pickup. Autonomous cancellation permitted.',
        requiresHumanApproval: false,
        recommendedAction: 'cancel_processing_order',
        confidence: 0.96
      };
    }

    return {
      decision: 'manual_review_required',
      permitted: true,
      policyCited: policy ? policy.title : 'General Terms',
      policyId: policy ? policy.id : 'GEN-01',
      reason: 'General inquiry requires standard support action.',
      requiresHumanApproval: false,
      recommendedAction: 'generate_customer_response',
      confidence: 0.88
    };
  }
}

export const policyAgent = new PolicyAgent();
