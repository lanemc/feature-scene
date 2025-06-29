import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import api from './api';
import { batchScheduler } from './jobs/scheduler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', api);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  
  // Start batch scheduler
  if (config.NODE_ENV !== 'test') {
    batchScheduler.start();
    logger.info('Batch scheduler started');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  batchScheduler.stop();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;