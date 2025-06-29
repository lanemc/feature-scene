import { postHogService } from '../integrations/posthog';
import { neo4jService } from '../integrations/neo4j';
import { aiAnalysisService } from '../services/ai-analysis';
import { logger } from '../utils/logger';
import { 
  UserJourneyEvent, 
  PainPoint, 
  Insight, 
  BatchJob,
  AnalyticsSummary 
} from '../models';
import { v4 as uuidv4 } from 'uuid';
import { setCurrentBatchJob } from '../services/batch-store';
import { saveInsights } from '../services/insights-store';

export class BatchProcessor {
  private currentJob: BatchJob | null = null;

  async run(): Promise<BatchJob> {
    const jobId = uuidv4();
    this.currentJob = {
      id: jobId,
      status: 'running',
      startedAt: new Date(),
      metrics: {
        eventsProcessed: 0,
        painPointsDetected: 0,
        insightsGenerated: 0,
      },
    };

    logger.info(`Starting batch job ${jobId}`);

    // Save current job to store
    await setCurrentBatchJob(this.currentJob);

    try {
      // Step 1: Fetch data from PostHog
      const events = await this.fetchRecentEvents();
      this.currentJob.metrics!.eventsProcessed = events.length;

      // Step 2: Process events into Neo4j
      await this.processEventsIntoGraph(events);

      // Step 3: Analyze graph for pain points
      const painPoints = await this.detectPainPoints();
      this.currentJob.metrics!.painPointsDetected = painPoints.length;

      // Step 4: Generate insights using AI
      const insights = await this.generateInsights(painPoints);
      this.currentJob.metrics!.insightsGenerated = insights.length;

      // Step 5: Store insights
      await this.storeInsights(insights);

      // Step 6: Generate summary
      const summary = await this.generateAnalyticsSummary();

      this.currentJob.status = 'completed';
      this.currentJob.completedAt = new Date();
      this.currentJob.metrics!.duration = 
        this.currentJob.completedAt.getTime() - this.currentJob.startedAt!.getTime();

      logger.info(`Batch job ${jobId} completed successfully`, this.currentJob.metrics);

      // Save completed job to history
      await setCurrentBatchJob(this.currentJob);

      return this.currentJob;
    } catch (error) {
      logger.error(`Batch job ${jobId} failed:`, error);
      this.currentJob.status = 'failed';
      this.currentJob.error = error instanceof Error ? error.message : 'Unknown error';
      this.currentJob.completedAt = new Date();
      
      // Save failed job
      await setCurrentBatchJob(this.currentJob);
      
      throw error;
    }
  }

  private async fetchRecentEvents(): Promise<UserJourneyEvent[]> {
    logger.info('Fetching recent events from PostHog');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Last 24 hours

    const rawEvents = await postHogService.getEvents(startDate, endDate);
    
    // Transform PostHog events to our internal format
    return rawEvents
      .filter(event => event.properties?.['$current_url']) // Only events with URLs
      .map(event => ({
        userId: event.distinct_id,
        sessionId: event.properties?.['$session_id'] || 'unknown',
        eventType: event.event,
        pageUrl: event.properties['$current_url'],
        pageTitle: event.properties?.['$title'],
        timestamp: new Date(event.timestamp),
        properties: event.properties,
      }));
  }

  private async processEventsIntoGraph(events: UserJourneyEvent[]): Promise<void> {
    logger.info(`Processing ${events.length} events into Neo4j`);

    // Group events by user session
    const sessionEvents = new Map<string, UserJourneyEvent[]>();
    
    events.forEach(event => {
      const key = `${event.userId}-${event.sessionId}`;
      if (!sessionEvents.has(key)) {
        sessionEvents.set(key, []);
      }
      sessionEvents.get(key)!.push(event);
    });

    // Process each session
    for (const [sessionKey, sessionEvents] of sessionEvents) {
      // Sort events by timestamp
      sessionEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const [userId] = sessionKey.split('-');
      
      // Create user if doesn't exist
      await neo4jService.createOrUpdateUser(userId);

      // Process events in sequence
      for (let i = 0; i < sessionEvents.length; i++) {
        const event = sessionEvents[i];
        const pageId = this.generatePageId(event.pageUrl);

        // Create page node
        await neo4jService.createOrUpdatePage(pageId, event.pageUrl, event.pageTitle);

        // Create event
        await neo4jService.createEvent(
          userId,
          event.eventType,
          pageId,
          event.properties || {},
          event.timestamp
        );

        // Create transition if not first event
        if (i > 0) {
          const prevEvent = sessionEvents[i - 1];
          const prevPageId = this.generatePageId(prevEvent.pageUrl);
          
          await neo4jService.createPageTransition(
            userId,
            prevPageId,
            pageId,
            event.timestamp
          );
        }
      }
    }
  }

  private async detectPainPoints(): Promise<PainPoint[]> {
    logger.info('Detecting pain points from graph data');
    
    const painPoints: PainPoint[] = [];

    // 1. Detect high drop-off pages
    const dropoffs = await neo4jService.getTopDropoffPages();
    dropoffs.forEach(dropoff => {
      if (dropoff.dropoffRate > 30) { // 30% threshold
        painPoints.push({
          id: uuidv4(),
          type: 'dropoff',
          severity: dropoff.dropoffRate > 50 ? 'high' : 'medium',
          location: dropoff.page,
          description: `${dropoff.dropoffRate.toFixed(1)}% of users drop off at ${dropoff.title || dropoff.page}`,
          affectedUsers: dropoff.incoming - dropoff.outgoing,
          affectedPercentage: dropoff.dropoffRate,
          metrics: {
            incoming: dropoff.incoming,
            outgoing: dropoff.outgoing,
            dropoffRate: dropoff.dropoffRate,
          },
          detectedAt: new Date(),
        });
      }
    });

    // 2. Detect navigation cycles
    const cycles = await neo4jService.getUserCycles();
    cycles.forEach(cycle => {
      painPoints.push({
        id: uuidv4(),
        type: 'cycle',
        severity: cycle.cycleCount > 20 ? 'high' : 'medium',
        location: cycle.page,
        description: `Users are navigating in circles at ${cycle.title || cycle.page} (${cycle.cycleCount} occurrences)`,
        affectedUsers: cycle.cycleCount,
        affectedPercentage: 0, // Will calculate based on total users
        metrics: {
          cycleCount: cycle.cycleCount,
        },
        detectedAt: new Date(),
      });
    });

    // 3. Detect underused features
    const underused = await neo4jService.getUnderusedFeatures();
    underused.forEach(feature => {
      painPoints.push({
        id: uuidv4(),
        type: 'underused',
        severity: feature.usageRate < 1 ? 'high' : 'low',
        location: feature.page,
        description: `Feature at ${feature.title || feature.page} is only used by ${feature.usageRate.toFixed(1)}% of users`,
        affectedUsers: feature.totalUsers - feature.visits,
        affectedPercentage: 100 - feature.usageRate,
        metrics: {
          visits: feature.visits,
          totalUsers: feature.totalUsers,
          usageRate: feature.usageRate,
        },
        detectedAt: new Date(),
      });
    });

    logger.info(`Detected ${painPoints.length} pain points`);
    return painPoints;
  }

  private async generateInsights(painPoints: PainPoint[]): Promise<Insight[]> {
    logger.info(`Generating insights for ${painPoints.length} pain points`);
    
    const insights: Insight[] = [];

    // Generate insights for each pain point
    for (const painPoint of painPoints) {
      try {
        const insight = await aiAnalysisService.analyzePainPoint(painPoint);
        insights.push(insight);
      } catch (error) {
        logger.error(`Failed to generate insight for pain point ${painPoint.id}:`, error);
      }
    }

    // Prioritize insights
    const prioritizedInsights = await aiAnalysisService.prioritizeInsights(insights);

    return prioritizedInsights;
  }

  private async storeInsights(insights: Insight[]): Promise<void> {
    logger.info(`Storing ${insights.length} insights`);
    
    await saveInsights(insights);
  }

  private async generateAnalyticsSummary(): Promise<AnalyticsSummary> {
    logger.info('Generating analytics summary');
    
    // This would aggregate all the data for the dashboard
    // For now, returning a placeholder
    return {
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      totalUsers: 0,
      totalEvents: this.currentJob?.metrics?.eventsProcessed || 0,
      avgSessionDuration: 0,
      topPages: [],
      conversionFunnels: [],
      painPointsSummary: {
        total: this.currentJob?.metrics?.painPointsDetected || 0,
        byType: {},
        bySeverity: {},
      },
      trends: {
        userGrowth: 0,
        engagementChange: 0,
        conversionChange: 0,
      },
    };
  }

  private generatePageId(url: string): string {
    // Generate a consistent ID for a page based on its URL
    // Remove query parameters and hash for consistency
    const cleanUrl = url.split('?')[0].split('#')[0];
    return cleanUrl.replace(/[^a-zA-Z0-9]/g, '_');
  }
}

export const batchProcessor = new BatchProcessor();