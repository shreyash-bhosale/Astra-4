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

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/activity', activityRoutes);
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
