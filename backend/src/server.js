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
import supervisorRoutes from './routes/supervisorRoutes.js';
import autonomyRoutes from './routes/autonomyRoutes.js';

import { generalLimiter } from './middleware/rateLimiter.js';
import { db } from './db/store.js';

const app = express();

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://astra4-delta.vercel.app',
  'https://astra-4-opal.vercel.app'
].filter(Boolean);

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (like server-to-server, curl, tests)
    if (!origin) return callback(null, true);

    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    if (config.isProduction) {
      return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serverless Lifecycle & Database Persistence Middleware
app.use(async (req, res, next) => {
  try {
    // 1. Ingress: Ensure Supabase initial hydration is complete
    await db.ready();

    // 2. Refresh table on GET reads to guarantee real-time consistency across lambdas
    if (req.method === 'GET') {
      const p = req.path;
      if (p.startsWith('/api/policies')) {
        await db.refreshTable('policies');
      } else if (p.startsWith('/api/tickets')) {
        await db.refreshTable('tickets');
      } else if (p.startsWith('/api/approvals')) {
        await Promise.all([db.refreshTable('approvals'), db.refreshTable('tickets')]);
      } else if (p.startsWith('/api/customers')) {
        await db.refreshTable('customers');
      } else if (p.startsWith('/api/orders')) {
        await db.refreshTable('orders');
      } else if (p.startsWith('/api/autonomy')) {
        await db.refreshTable('autonomy_settings');
      }
    }
  } catch (err) {
    console.warn('[SERVER] Ingress lifecycle notice:', err.message);
  }

  // 3. Egress: Ensure all in-flight database writes flush to Supabase before response returns
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = async function (data) {
    try {
      await db.flush();
    } catch (e) {
      console.error('[SERVER] Flush error before res.json:', e.message);
    }
    return originalJson(data);
  };

  res.send = async function (data) {
    try {
      await db.flush();
    } catch (e) {
      console.error('[SERVER] Flush error before res.send:', e.message);
    }
    return originalSend(data);
  };

  next();
});

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
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/autonomy', autonomyRoutes);
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

const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('server.js') || 
  process.argv[1].endsWith('server')
);

if (isMainModule) {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`⚡ ResolveAI Backend Server running on port ${PORT}`);
    console.log(`⚡ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Gemini Model: ${config.geminiModel} (${config.geminiApiKey ? 'API Key Active' : 'Fallback Mode'})`);
    console.log(`⚡ Email Service: ${config.resendApiKey && config.resendApiKey.startsWith('re_') ? 'READY (Provider: Resend)' : 'READY (Transactional Simulator Mode)'}`);
    console.log(`======================================================\n`);
  });
}

export { app };
export default app;
