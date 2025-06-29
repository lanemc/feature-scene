import { Router } from 'express';
import insightsRoutes from './routes/insights';
import analyticsRoutes from './routes/analytics';
import batchRoutes from './routes/batch';

const router = Router();

// API routes
router.use('/insights', insightsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/batch', batchRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;