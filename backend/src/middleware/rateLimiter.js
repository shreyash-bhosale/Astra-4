import rateLimit from 'express-rate-limit';

// General API Rate Limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP address, please try again after a minute.'
  }
});

// Authentication Rate Limiter (Brute-force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// AI Workflow Trigger Rate Limiter (Quota & compute protection)
export const aiWorkflowLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 agent executions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Autonomous agent execution rate limit reached. Please wait a moment before launching new agent workflows.'
  }
});
