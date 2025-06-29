import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { z } from 'zod';

// PostHog Event Schema
export const PostHogEventSchema = z.object({
  event: z.string(),
  timestamp: z.string(),
  distinct_id: z.string(),
  properties: z.record(z.any()).optional(),
  elements: z.array(z.any()).optional(),
});

export type PostHogEvent = z.infer<typeof PostHogEventSchema>;

// PostHog Person Schema
export const PostHogPersonSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  distinct_ids: z.array(z.string()),
  properties: z.record(z.any()),
  created_at: z.string(),
});

export type PostHogPerson = z.infer<typeof PostHogPersonSchema>;

export class PostHogService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${config.POSTHOG_HOST}/api/projects/${config.POSTHOG_PROJECT_ID}`,
      headers: {
        'Authorization': `Bearer ${config.POSTHOG_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getEvents(
    startDate: Date,
    endDate: Date,
    eventNames?: string[],
    limit: number = 10000
  ): Promise<PostHogEvent[]> {
    try {
      const params: any = {
        limit,
        after: startDate.toISOString(),
        before: endDate.toISOString(),
      };

      if (eventNames && eventNames.length > 0) {
        params.event = eventNames.join(',');
      }

      const response = await this.client.get('/events', { params });
      
      logger.info(`Fetched ${response.data.results.length} events from PostHog`);
      
      return response.data.results.map((event: any) => 
        PostHogEventSchema.parse(event)
      );
    } catch (error) {
      logger.error('Error fetching events from PostHog:', error);
      throw error;
    }
  }

  async getPersons(limit: number = 1000): Promise<PostHogPerson[]> {
    try {
      const response = await this.client.get('/persons', { 
        params: { limit } 
      });
      
      return response.data.results.map((person: any) => 
        PostHogPersonSchema.parse(person)
      );
    } catch (error) {
      logger.error('Error fetching persons from PostHog:', error);
      throw error;
    }
  }

  async getUserPaths(
    startDate: Date,
    endDate: Date,
    pathType: 'screen' | 'custom_event' | '$pageview' = '$pageview'
  ): Promise<any> {
    try {
      const response = await this.client.post('/insights/path', {
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString(),
        path_type: pathType,
        insight: 'PATHS',
      });

      logger.info('Fetched user paths from PostHog');
      return response.data;
    } catch (error) {
      logger.error('Error fetching user paths from PostHog:', error);
      throw error;
    }
  }

  async getFunnels(steps: string[]): Promise<any> {
    try {
      const response = await this.client.post('/insights/funnel', {
        events: steps.map(step => ({ id: step, type: 'events' })),
        insight: 'FUNNELS',
      });

      logger.info('Fetched funnel data from PostHog');
      return response.data;
    } catch (error) {
      logger.error('Error fetching funnel data from PostHog:', error);
      throw error;
    }
  }

  async executeHogQL(query: string): Promise<any> {
    try {
      const response = await this.client.post('/query', {
        query: { kind: 'HogQLQuery', query },
      });

      return response.data.results;
    } catch (error) {
      logger.error('Error executing HogQL query:', error);
      throw error;
    }
  }
}

export const postHogService = new PostHogService();