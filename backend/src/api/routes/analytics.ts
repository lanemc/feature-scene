import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { neo4jService } from '../../integrations/neo4j';
import { postHogService } from '../../integrations/posthog';

const router = Router();

// Get analytics summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    // Fetch various analytics data
    const [
      topDropoffs,
      commonPaths,
      underusedFeatures,
      userCycles,
    ] = await Promise.all([
      neo4jService.getTopDropoffPages(10),
      neo4jService.getCommonPaths(undefined, 5),
      neo4jService.getUnderusedFeatures(0.05),
      neo4jService.getUserCycles(2),
    ]);
    
    const summary = {
      period: {
        start,
        end,
      },
      painPoints: {
        dropoffs: topDropoffs.length,
        cycles: userCycles.length,
        underused: underusedFeatures.length,
      },
      topDropoffs: topDropoffs.slice(0, 5),
      commonPaths: commonPaths.slice(0, 5),
      underusedFeatures: underusedFeatures.slice(0, 5),
    };
    
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// Get user paths analysis
router.get('/paths', async (req: Request, res: Response) => {
  try {
    const { startPage, maxLength = 5 } = req.query;
    
    const paths = await neo4jService.getCommonPaths(
      startPage as string | undefined,
      Number(maxLength)
    );
    
    res.json({
      startPage,
      maxLength,
      paths,
    });
  } catch (error) {
    logger.error('Error fetching user paths:', error);
    res.status(500).json({ error: 'Failed to fetch user paths' });
  }
});

// Get funnel analysis
router.post('/funnel', async (req: Request, res: Response) => {
  try {
    const { steps } = req.body;
    
    if (!Array.isArray(steps) || steps.length < 2) {
      return res.status(400).json({ 
        error: 'Funnel must have at least 2 steps' 
      });
    }
    
    const funnelData = await postHogService.getFunnels(steps);
    
    res.json(funnelData);
  } catch (error) {
    logger.error('Error fetching funnel data:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

// Get page performance metrics
router.get('/pages/performance', async (req: Request, res: Response) => {
  try {
    const avgTimes = await neo4jService.getAverageTimeOnPage();
    
    res.json({
      pages: avgTimes,
      metadata: {
        unit: 'milliseconds',
        description: 'Average time spent on each page',
      },
    });
  } catch (error) {
    logger.error('Error fetching page performance:', error);
    res.status(500).json({ error: 'Failed to fetch page performance' });
  }
});

export default router;