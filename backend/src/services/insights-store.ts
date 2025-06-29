import { Insight } from '../models';
import { logger } from '../utils/logger';

// In-memory store for MVP - replace with proper database
let insightsStore: Insight[] = [];

export async function getInsightsFromStore(): Promise<Insight[]> {
  return [...insightsStore];
}

export async function getInsightById(id: string): Promise<Insight | null> {
  return insightsStore.find(insight => insight.id === id) || null;
}

export async function updateInsightStatus(
  id: string, 
  status: Insight['status']
): Promise<Insight | null> {
  const index = insightsStore.findIndex(insight => insight.id === id);
  
  if (index === -1) {
    return null;
  }
  
  insightsStore[index].status = status;
  logger.info(`Updated insight ${id} status to ${status}`);
  
  return insightsStore[index];
}

export async function saveInsights(insights: Insight[]): Promise<void> {
  // Add new insights, update existing ones
  insights.forEach(newInsight => {
    const existingIndex = insightsStore.findIndex(i => i.id === newInsight.id);
    
    if (existingIndex >= 0) {
      insightsStore[existingIndex] = newInsight;
    } else {
      insightsStore.push(newInsight);
    }
  });
  
  logger.info(`Saved ${insights.length} insights to store`);
}

export async function clearInsights(): Promise<void> {
  insightsStore = [];
  logger.info('Cleared all insights from store');
}