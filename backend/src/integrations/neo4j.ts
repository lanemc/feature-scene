import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config';
import { logger } from '../utils/logger';

export class Neo4jService {
  private driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      config.NEO4J_URI,
      neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
    );

    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run('RETURN 1');
      logger.info('Neo4j connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Neo4j:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async runQuery(query: string, params: Record<string, any> = {}): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  async createOrUpdateUser(userId: string, properties: Record<string, any> = {}): Promise<void> {
    const query = `
      MERGE (u:User {id: $userId})
      SET u += $properties
      SET u.lastUpdated = datetime()
    `;
    
    await this.runQuery(query, { userId, properties });
  }

  async createOrUpdatePage(pageId: string, url: string, title?: string): Promise<void> {
    const query = `
      MERGE (p:Page {id: $pageId})
      SET p.url = $url,
          p.title = $title,
          p.lastUpdated = datetime()
    `;
    
    await this.runQuery(query, { pageId, url, title });
  }

  async createPageTransition(
    userId: string,
    fromPageId: string,
    toPageId: string,
    timestamp: Date
  ): Promise<void> {
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (from:Page {id: $fromPageId})
      MATCH (to:Page {id: $toPageId})
      CREATE (u)-[:NAVIGATED {timestamp: $timestamp}]->(to)
      MERGE (from)-[t:TRANSITION_TO]->(to)
      ON CREATE SET t.count = 1, t.firstSeen = $timestamp
      ON MATCH SET t.count = t.count + 1, t.lastSeen = $timestamp
    `;
    
    await this.runQuery(query, { userId, fromPageId, toPageId, timestamp });
  }

  async createEvent(
    userId: string,
    eventType: string,
    pageId: string,
    properties: Record<string, any>,
    timestamp: Date
  ): Promise<void> {
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (p:Page {id: $pageId})
      CREATE (e:Event {
        id: randomUUID(),
        type: $eventType,
        timestamp: $timestamp,
        properties: $properties
      })
      CREATE (u)-[:PERFORMED]->(e)
      CREATE (e)-[:OCCURRED_ON]->(p)
    `;
    
    await this.runQuery(query, { userId, eventType, pageId, properties, timestamp });
  }

  async getTopDropoffPages(limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (from:Page)-[t:TRANSITION_TO]->(to:Page)
      WITH from, sum(t.count) as outgoing
      MATCH (from)<-[t2:TRANSITION_TO]-(prev:Page)
      WITH from, outgoing, sum(t2.count) as incoming
      WHERE incoming > outgoing * 1.5
      RETURN from.url as page, 
             from.title as title,
             incoming, 
             outgoing, 
             (incoming - outgoing) * 100.0 / incoming as dropoffRate
      ORDER BY dropoffRate DESC
      LIMIT $limit
    `;
    
    return await this.runQuery(query, { limit });
  }

  async getCommonPaths(startPage?: string, maxLength: number = 5): Promise<any[]> {
    const query = startPage ? `
      MATCH path = (start:Page {url: $startPage})-[:TRANSITION_TO*1..${maxLength}]->(end:Page)
      WITH path, reduce(total = 1, r IN relationships(path) | total * r.count) as frequency
      RETURN [n IN nodes(path) | n.url] as pages, frequency
      ORDER BY frequency DESC
      LIMIT 20
    ` : `
      MATCH path = (start:Page)-[:TRANSITION_TO*1..${maxLength}]->(end:Page)
      WITH path, reduce(total = 1, r IN relationships(path) | total * r.count) as frequency
      WHERE frequency > 10
      RETURN [n IN nodes(path) | n.url] as pages, frequency
      ORDER BY frequency DESC
      LIMIT 20
    `;
    
    return await this.runQuery(query, { startPage });
  }

  async getUserCycles(minCycleLength: number = 2): Promise<any[]> {
    const query = `
      MATCH (p:Page)-[:TRANSITION_TO*${minCycleLength}..5]->(p)
      WITH p, count(*) as cycleCount
      WHERE cycleCount > 5
      RETURN p.url as page, p.title as title, cycleCount
      ORDER BY cycleCount DESC
      LIMIT 20
    `;
    
    return await this.runQuery(query);
  }

  async getUnderusedFeatures(threshold: number = 0.05): Promise<any[]> {
    const query = `
      MATCH (p:Page)
      OPTIONAL MATCH ()<-[:TRANSITION_TO]-(p)
      WITH p, count(*) as visits
      MATCH (:User)
      WITH p, visits, count(*) as totalUsers
      WHERE visits < totalUsers * $threshold
      RETURN p.url as page, 
             p.title as title, 
             visits, 
             totalUsers,
             visits * 100.0 / totalUsers as usageRate
      ORDER BY usageRate ASC
      LIMIT 20
    `;
    
    return await this.runQuery(query, { threshold });
  }

  async getAverageTimeOnPage(): Promise<any[]> {
    const query = `
      MATCH (p:Page)<-[:OCCURRED_ON]-(e1:Event)
      MATCH (p)<-[:OCCURRED_ON]-(e2:Event)
      WHERE e1.timestamp < e2.timestamp
      WITH p, avg(duration.between(e1.timestamp, e2.timestamp).milliseconds) as avgTime
      RETURN p.url as page, p.title as title, avgTime
      ORDER BY avgTime DESC
      LIMIT 20
    `;
    
    return await this.runQuery(query);
  }

  async clearDatabase(): Promise<void> {
    const query = `
      MATCH (n)
      DETACH DELETE n
    `;
    
    await this.runQuery(query);
    logger.info('Neo4j database cleared');
  }

  async close(): Promise<void> {
    await this.driver.close();
    logger.info('Neo4j connection closed');
  }
}

export const neo4jService = new Neo4jService();