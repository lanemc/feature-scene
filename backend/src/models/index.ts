import { z } from 'zod';

// User Journey Models
export const UserJourneyEventSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  eventType: z.string(),
  pageUrl: z.string(),
  pageTitle: z.string().optional(),
  timestamp: z.date(),
  properties: z.record(z.any()).optional(),
});

export type UserJourneyEvent = z.infer<typeof UserJourneyEventSchema>;

// Pain Point Models
export const PainPointSchema = z.object({
  id: z.string(),
  type: z.enum(['dropoff', 'cycle', 'underused', 'slow_interaction', 'error']),
  severity: z.enum(['high', 'medium', 'low']),
  location: z.string(),
  description: z.string(),
  affectedUsers: z.number(),
  affectedPercentage: z.number(),
  metrics: z.record(z.any()),
  detectedAt: z.date(),
});

export type PainPoint = z.infer<typeof PainPointSchema>;

// Insight Models
export const InsightSchema = z.object({
  id: z.string(),
  painPointId: z.string(),
  title: z.string(),
  summary: z.string(),
  recommendation: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  impact: z.string(),
  effort: z.enum(['high', 'medium', 'low']),
  category: z.enum(['onboarding', 'conversion', 'engagement', 'performance', 'usability']),
  metrics: z.record(z.any()),
  createdAt: z.date(),
  status: z.enum(['new', 'reviewed', 'in_progress', 'resolved', 'dismissed']),
  jiraTicketId: z.string().optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// Analytics Summary Models
export const AnalyticsSummarySchema = z.object({
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  totalUsers: z.number(),
  totalEvents: z.number(),
  avgSessionDuration: z.number(),
  topPages: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    visits: z.number(),
    avgTimeSpent: z.number(),
  })),
  conversionFunnels: z.array(z.object({
    name: z.string(),
    steps: z.array(z.object({
      name: z.string(),
      users: z.number(),
      conversionRate: z.number(),
    })),
  })),
  painPointsSummary: z.object({
    total: z.number(),
    byType: z.record(z.number()),
    bySeverity: z.record(z.number()),
  }),
  trends: z.object({
    userGrowth: z.number(),
    engagementChange: z.number(),
    conversionChange: z.number(),
  }),
});

export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;

// Batch Job Models
export const BatchJobSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
  metrics: z.object({
    eventsProcessed: z.number().optional(),
    painPointsDetected: z.number().optional(),
    insightsGenerated: z.number().optional(),
    duration: z.number().optional(),
  }).optional(),
});

export type BatchJob = z.infer<typeof BatchJobSchema>;