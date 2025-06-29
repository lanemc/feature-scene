import { BatchJob } from '../models';
import { logger } from '../utils/logger';

// In-memory store for MVP - replace with proper database
let batchJobHistory: BatchJob[] = [];
let currentJob: BatchJob | null = null;

export async function getCurrentBatchJob(): Promise<BatchJob | null> {
  return currentJob;
}

export async function setCurrentBatchJob(job: BatchJob | null): Promise<void> {
  currentJob = job;
  
  if (job && job.status === 'completed') {
    // Move to history when completed
    batchJobHistory.unshift(job);
    
    // Keep only last 100 jobs in history
    if (batchJobHistory.length > 100) {
      batchJobHistory = batchJobHistory.slice(0, 100);
    }
    
    currentJob = null;
  }
}

export async function getBatchJobHistory(limit: number = 10): Promise<BatchJob[]> {
  return batchJobHistory.slice(0, limit);
}

export async function clearBatchHistory(): Promise<void> {
  batchJobHistory = [];
  currentJob = null;
  logger.info('Cleared batch job history');
}