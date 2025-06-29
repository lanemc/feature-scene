import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  
  // PostHog Configuration
  POSTHOG_API_KEY: z.string(),
  POSTHOG_PROJECT_ID: z.string(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  
  // Neo4j Configuration
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USERNAME: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string(),
  
  // OpenAI Configuration
  OPENAI_API_KEY: z.string(),
  
  // Jira Configuration
  JIRA_HOST: z.string().optional(),
  JIRA_EMAIL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_PROJECT_KEY: z.string().optional(),
  
  // Application Configuration
  BATCH_SCHEDULE_CRON: z.string().default('0 2 * * *'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Gemini Configuration (future)
  GEMINI_API_KEY: z.string().optional(),
});

export type Config = z.infer<typeof envSchema>;

export const config: Config = envSchema.parse(process.env);

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';