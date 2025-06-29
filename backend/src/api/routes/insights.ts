import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { jiraService } from '../../integrations/jira';
import { getInsightsFromStore, getInsightById, updateInsightStatus } from '../../services/insights-store';

const router = Router();

// Get all insights
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, priority } = req.query;
    
    let insights = await getInsightsFromStore();
    
    // Apply filters
    if (status) {
      insights = insights.filter(i => i.status === status);
    }
    if (category) {
      insights = insights.filter(i => i.category === category);
    }
    if (priority) {
      insights = insights.filter(i => i.priority === priority);
    }
    
    res.json({
      insights,
      total: insights.length,
      filters: { status, category, priority },
    });
  } catch (error) {
    logger.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get single insight
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const insight = await getInsightById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json(insight);
  } catch (error) {
    logger.error('Error fetching insight:', error);
    res.status(500).json({ error: 'Failed to fetch insight' });
  }
});

// Update insight status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const updated = await updateInsightStatus(req.params.id, status);
    
    if (!updated) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json(updated);
  } catch (error) {
    logger.error('Error updating insight status:', error);
    res.status(500).json({ error: 'Failed to update insight status' });
  }
});

// Create Jira ticket from insight
router.post('/:id/jira', async (req: Request, res: Response) => {
  try {
    const insight = await getInsightById(req.params.id);
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    if (insight.jiraTicketId) {
      return res.status(400).json({ 
        error: 'Jira ticket already created',
        ticketId: insight.jiraTicketId 
      });
    }
    
    if (!jiraService.isAvailable()) {
      return res.status(503).json({ 
        error: 'Jira integration not configured' 
      });
    }
    
    const jiraIssue = await jiraService.createIssue(insight);
    
    if (!jiraIssue) {
      return res.status(500).json({ error: 'Failed to create Jira ticket' });
    }
    
    // Update insight with Jira ticket reference
    insight.jiraTicketId = jiraIssue.key;
    await updateInsightStatus(insight.id, 'in_progress');
    
    res.json({
      message: 'Jira ticket created successfully',
      ticketKey: jiraIssue.key,
      ticketUrl: `${jiraIssue.self.split('/rest/')[0]}/browse/${jiraIssue.key}`,
    });
  } catch (error) {
    logger.error('Error creating Jira ticket:', error);
    res.status(500).json({ error: 'Failed to create Jira ticket' });
  }
});

export default router;