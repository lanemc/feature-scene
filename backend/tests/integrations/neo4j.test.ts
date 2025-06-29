import { Neo4jService } from '../../src/integrations/neo4j';
import neo4j from 'neo4j-driver';

// Mock neo4j-driver
jest.mock('neo4j-driver', () => ({
  driver: jest.fn(),
  auth: {
    basic: jest.fn()
  }
}));

describe('Neo4jService', () => {
  let neo4jService: Neo4jService;
  let mockDriver: any;
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      run: jest.fn(),
      close: jest.fn()
    };

    mockDriver = {
      session: jest.fn().mockReturnValue(mockSession)
    };

    (neo4j.driver as jest.Mock).mockReturnValue(mockDriver);
    (neo4j.auth.basic as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor and connection', () => {
    it('should verify connection on initialization', async () => {
      mockSession.run.mockResolvedValue({ records: [] });
      
      neo4jService = new Neo4jService();
      
      // Wait for async verification
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSession.run).toHaveBeenCalledWith('RETURN 1');
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should throw error if connection fails', async () => {
      mockSession.run.mockRejectedValue(new Error('Connection failed'));
      
      expect(() => new Neo4jService()).not.toThrow();
      
      // Wait for async verification
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  describe('database operations', () => {
    beforeEach(() => {
      mockSession.run.mockResolvedValue({ records: [] });
      neo4jService = new Neo4jService();
    });

    describe('createOrUpdateUser', () => {
      it('should create or update user with properties', async () => {
        await neo4jService.createOrUpdateUser('user-123', { name: 'Test User' });

        expect(mockSession.run).toHaveBeenCalledWith(
          expect.stringContaining('MERGE (u:User {id: $userId})'),
          {
            userId: 'user-123',
            properties: { name: 'Test User' }
          }
        );
      });
    });

    describe('createPageTransition', () => {
      it('should create page transition relationship', async () => {
        const timestamp = new Date();
        
        await neo4jService.createPageTransition(
          'user-123',
          'page-1',
          'page-2',
          timestamp
        );

        expect(mockSession.run).toHaveBeenCalledWith(
          expect.stringContaining('CREATE (u)-[:NAVIGATED {timestamp: $timestamp}]->(to)'),
          {
            userId: 'user-123',
            fromPageId: 'page-1',
            toPageId: 'page-2',
            timestamp
          }
        );
      });
    });

    describe('getTopDropoffPages', () => {
      it('should return top dropoff pages', async () => {
        const mockRecords = [
          {
            toObject: () => ({
              page: '/checkout',
              title: 'Checkout',
              incoming: 1000,
              outgoing: 400,
              dropoffRate: 60
            })
          }
        ];

        mockSession.run.mockResolvedValue({ records: mockRecords });

        const dropoffs = await neo4jService.getTopDropoffPages();

        expect(dropoffs).toHaveLength(1);
        expect(dropoffs[0]).toMatchObject({
          page: '/checkout',
          dropoffRate: 60
        });
      });
    });

    describe('getCommonPaths', () => {
      it('should return common user paths', async () => {
        const mockRecords = [
          {
            toObject: () => ({
              pages: ['/home', '/product', '/checkout'],
              frequency: 150
            })
          }
        ];

        mockSession.run.mockResolvedValue({ records: mockRecords });

        const paths = await neo4jService.getCommonPaths();

        expect(paths).toHaveLength(1);
        expect(paths[0].pages).toEqual(['/home', '/product', '/checkout']);
        expect(paths[0].frequency).toBe(150);
      });

      it('should filter paths by start page when provided', async () => {
        mockSession.run.mockResolvedValue({ records: [] });

        await neo4jService.getCommonPaths('/home', 3);

        expect(mockSession.run).toHaveBeenCalledWith(
          expect.stringContaining('MATCH path = (start:Page {url: $startPage})'),
          { startPage: '/home' }
        );
      });
    });

    describe('getUserCycles', () => {
      it('should detect navigation cycles', async () => {
        const mockRecords = [
          {
            toObject: () => ({
              page: '/settings',
              title: 'Settings',
              cycleCount: 25
            })
          }
        ];

        mockSession.run.mockResolvedValue({ records: mockRecords });

        const cycles = await neo4jService.getUserCycles();

        expect(cycles).toHaveLength(1);
        expect(cycles[0]).toMatchObject({
          page: '/settings',
          cycleCount: 25
        });
      });
    });

    describe('getUnderusedFeatures', () => {
      it('should return underused features', async () => {
        const mockRecords = [
          {
            toObject: () => ({
              page: '/advanced-features',
              title: 'Advanced Features',
              visits: 50,
              totalUsers: 1000,
              usageRate: 5
            })
          }
        ];

        mockSession.run.mockResolvedValue({ records: mockRecords });

        const underused = await neo4jService.getUnderusedFeatures(0.1);

        expect(underused).toHaveLength(1);
        expect(underused[0]).toMatchObject({
          page: '/advanced-features',
          usageRate: 5
        });
      });
    });

    describe('clearDatabase', () => {
      it('should clear all nodes and relationships', async () => {
        await neo4jService.clearDatabase();

        expect(mockSession.run).toHaveBeenCalledWith(
          expect.stringContaining('MATCH (n) DETACH DELETE n')
        );
      });
    });
  });

  describe('close', () => {
    it('should close the driver connection', async () => {
      mockSession.run.mockResolvedValue({ records: [] });
      neo4jService = new Neo4jService();
      
      await neo4jService.close();

      expect(mockDriver.close).toHaveBeenCalled();
    });
  });
});