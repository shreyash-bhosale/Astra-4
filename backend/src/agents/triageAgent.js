import { aiService } from '../services/aiService.js';
import { TriageOutputSchema } from '../validators/index.js';

export class TriageAgent {
  constructor() {
    this.name = 'Triage Agent';
    this.badge = '△';
  }

  async run({ ticket, customer }) {
    const prompt = `Customer: ${customer ? customer.name : 'Unknown'}
Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}`;

    const systemInstruction = `You are the Triage Agent in ResolveAI.
Classify the support ticket into one of the standard categories:
- damaged_product
- wrong_product
- missing_delivery
- cancellation
- refund_request
- billing_issue
- product_question
- account_issue

Determine priority ('low', 'medium', 'high', 'urgent') and identify the core customer intent.`;

    const schemaHint = `{
  "category": "damaged_product",
  "priority": "high",
  "intent": "replacement",
  "confidence": 0.94,
  "missingInformation": [],
  "summary": "Customer received damaged headphones with snapped headband, requesting urgent replacement."
}`;

    const aiResult = await aiService.generateStructuredJSON({
      systemInstruction,
      prompt,
      schemaHint
    });

    if (aiResult) {
      const parsed = TriageOutputSchema.safeParse(aiResult);
      if (parsed.success) {
        return parsed.data;
      }
      console.warn('Triage AI output did not match schema:', parsed.error);
    }

    // Deterministic fallback
    const desc = (ticket.title + ' ' + ticket.description).toLowerCase();
    let category = 'general';
    let intent = 'support';
    let priority = 'medium';

    if (desc.includes('damage') || desc.includes('broken') || desc.includes('cracked') || desc.includes('snapped')) {
      category = 'damaged_product';
      intent = 'replacement';
      priority = 'high';
    } else if (desc.includes('cancel') || desc.includes('stop order')) {
      category = 'cancellation';
      intent = 'cancellation';
      priority = 'medium';
    } else if (desc.includes('refund') || desc.includes('money back') || desc.includes('return')) {
      category = 'refund_request';
      intent = 'refund';
      priority = 'medium';
    } else if (desc.includes('wrong') || desc.includes('switch') || desc.includes('incorrect')) {
      category = 'wrong_product';
      intent = 'exchange';
      priority = 'medium';
    }

    return {
      category,
      priority,
      intent,
      confidence: 0.91,
      missingInformation: [],
      summary: `Triage identified intent '${intent}' for category '${category}' with ${priority} priority.`
    };
  }
}

export const triageAgent = new TriageAgent();
