import cron from 'node-cron';
import { config } from '../config';
import { logger } from '../utils/logger';
import { batchProcessor } from './batch-processor';

export class BatchScheduler {
  private task: cron.ScheduledTask | null = null;

  start(): void {
    if (this.task) {
      logger.warn('Batch scheduler is already running');
      return;
    }

    logger.info(`Starting batch scheduler with cron: ${config.BATCH_SCHEDULE_CRON}`);

    this.task = cron.schedule(config.BATCH_SCHEDULE_CRON, async () => {
      logger.info('Running scheduled batch job');
      
      try {
        await batchProcessor.run();
      } catch (error) {
        logger.error('Scheduled batch job failed:', error);
      }
    });

    this.task.start();
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Batch scheduler stopped');
    }
  }

  async runOnce(): Promise<void> {
    logger.info('Running batch job once');
    await batchProcessor.run();
  }
}

export const batchScheduler = new BatchScheduler();