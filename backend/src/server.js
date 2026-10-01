import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import customerPortalRoutes from './routes/customerPortalRoutes.js';

import { generalLimiter } from './middleware/rateLimiter.js';

const app = express();

// Allowed Origins
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://astra4-delta.vercel.app'
].filter(Boolean);

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like server-to-server, curl, tests)
    if (!origin) return callback(null, true);

    if (config.isProduction) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
    }

    // Development mode
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation in dev: Origin '${origin}' is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply global rate limiting to all API routes
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/customer', customerPortalRoutes);
app.use('/api/system', systemRoutes);
app.use('/api', systemRoutes);

// Root fallback / ping
app.get('/', (req, res) => {
  res.json({
    product: 'ResolveAI API',
    tagline: 'From customer issue to verified resolution — autonomously.',
    status: 'ONLINE',
    docs: '/api/health'
  });
});

// Global error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ ResolveAI Backend Server running on port ${PORT}`);
  console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Gemini Model: ${config.geminiModel} (${config.geminiApiKey ? 'API Key Active' : 'Fallback Mode'})`);
  console.log(`======================================================\n`);
});
