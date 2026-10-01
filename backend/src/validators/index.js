import { z } from 'zod';

// Authentication
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['agent', 'manager', 'admin']).default('agent')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Tickets
export const CreateTicketSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  customer_id: z.string().optional().nullable(),
  order_id: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().optional().default('general')
});

export const UpdateTicketSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'AI_PROCESSING', 'WAITING_APPROVAL', 'ESCALATED', 'RESOLVED', 'FAILED']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  assigned_user_id: z.string().optional().nullable(),
  resolution_summary: z.string().optional().nullable(),
  customer_response: z.string().optional().nullable()
});

// Customers
export const CreateCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  tier: z.string().optional().default('Standard'),
  company: z.string().optional()
});

// Policies
export const CreatePolicySchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  content: z.string().min(10),
  active: z.boolean().default(true)
});

// Approvals
export const ReviewApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional()
});

// Email Notifications
export const SendCustomerEmailSchema = z.object({
  recipient: z.string().email('Invalid recipient email address').optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(5000, 'Message exceeds 5000 characters')
});

// ==========================================
// AI AGENT OUTPUT SCHEMAS (PRD Section 33)
// ==========================================

export const TriageOutputSchema = z.object({
  category: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  missingInformation: z.array(z.string()).default([]),
  summary: z.string()
});

export const PlanStepSchema = z.object({
  step: z.number(),
  agent: z.string(),
  action: z.string(),
  description: z.string(),
  requiresApproval: z.boolean().default(false),
  dependencies: z.array(z.number()).default([])
});

export const PlanOutputSchema = z.object({
  objective: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  steps: z.array(PlanStepSchema)
});

export const InvestigationOutputSchema = z.object({
  customerFound: z.boolean(),
  orderFound: z.boolean(),
  customerName: z.string().nullable().optional(),
  orderId: z.string().nullable().optional(),
  productName: z.string().nullable().optional(),
  orderDate: z.string().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
  daysSinceDelivery: z.number().nullable().optional(),
  isEligibleForWarranty: z.boolean(),
  keyFindings: z.array(z.string())
});

export const PolicyOutputSchema = z.object({
  decision: z.string(),
  permitted: z.boolean(),
  policyCited: z.string(),
  policyId: z.string().optional(),
  reason: z.string(),
  requiresHumanApproval: z.boolean(),
  recommendedAction: z.string(),
  confidence: z.number().min(0).max(1)
});

export const ActionOutputSchema = z.object({
  actionExecuted: z.string(),
  status: z.string(),
  requiresApproval: z.boolean(),
  details: z.record(z.any()).default({}),
  resultMessage: z.string()
});

export const CommunicationOutputSchema = z.object({
  customerMessage: z.string(),
  internalSummary: z.string(),
  tone: z.string()
});

export const VerificationOutputSchema = z.object({
  verified: z.boolean(),
  checklist: z.object({
    allStepsExecuted: z.boolean(),
    evidenceSufficient: z.boolean(),
    policyCompliant: z.boolean(),
    approvalObtained: z.boolean(),
    customerInformed: z.boolean()
  }),
  conclusion: z.string()
});
