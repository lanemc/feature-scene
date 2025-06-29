import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { batchScheduler } from '../../jobs/scheduler';
import { getBatchJobHistory, getCurrentBatchJob } from '../../services/batch-store';

const router = Router();

// Manually trigger batch job (admin only)
router.post('/run', async (req: Request, res: Response) => {
  try {
    // In production, this should be protected by authentication
    const { force } = req.body;
    
    const currentJob = await getCurrentBatchJob();
    if (currentJob && currentJob.status === 'running' && !force) {
      return res.status(409).json({ 
        error: 'Batch job is already running',
        jobId: currentJob.id 
      });
    }
    
    // Run batch job asynchronously
    batchScheduler.runOnce().catch(error => {
      logger.error('Batch job failed:', error);
    });
    
    res.json({ 
      message: 'Batch job started',
      note: 'Check /api/batch/status for progress' 
    });
  } catch (error) {
    logger.error('Error starting batch job:', error);
    res.status(500).json({ error: 'Failed to start batch job' });
  }
});

// Get batch job status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const currentJob = await getCurrentBatchJob();
    
    if (!currentJob) {
      return res.json({ 
        status: 'idle',
        message: 'No batch job running' 
      });
    }
    
    res.json(currentJob);
  } catch (error) {
    logger.error('Error fetching batch status:', error);
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
});

// Get batch job history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    
    const history = await getBatchJobHistory(Number(limit));
    
    res.json({
      history,
      total: history.length,
    });
  } catch (error) {
    logger.error('Error fetching batch history:', error);
    res.status(500).json({ error: 'Failed to fetch batch history' });
  }
});

export default router;