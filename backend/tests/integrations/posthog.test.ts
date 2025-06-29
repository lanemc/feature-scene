import axios from 'axios';
import { PostHogService } from '../../src/integrations/posthog';
import { config } from '../../src/config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PostHogService', () => {
  let postHogService: PostHogService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
    };
    
    mockedAxios.create.mockReturnValue(mockClient);
    postHogService = new PostHogService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should fetch events with correct parameters', async () => {
      const mockEvents = {
        data: {
          results: [
            {
              event: '$pageview',
              timestamp: '2024-01-01T00:00:00Z',
              distinct_id: 'user-123',
              properties: {
                '$current_url': '/home',
                '$title': 'Home Page'
              }
            }
          ]
        }
      };

      mockClient.get.mockResolvedValue(mockEvents);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const events = await postHogService.getEvents(startDate, endDate);

      expect(mockClient.get).toHaveBeenCalledWith('/events', {
        params: {
          limit: 10000,
          after: startDate.toISOString(),
          before: endDate.toISOString()
        }
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        event: '$pageview',
        distinct_id: 'user-123'
      });
    });

    it('should filter by event names when provided', async () => {
      mockClient.get.mockResolvedValue({ data: { results: [] } });

      const startDate = new Date();
      const endDate = new Date();
      const eventNames = ['$pageview', 'button_click'];
      
      await postHogService.getEvents(startDate, endDate, eventNames);

      expect(mockClient.get).toHaveBeenCalledWith('/events', {
        params: expect.objectContaining({
          event: '$pageview,button_click'
        })
      });
    });

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      const startDate = new Date();
      const endDate = new Date();

      await expect(postHogService.getEvents(startDate, endDate))
        .rejects.toThrow('API Error');
    });
  });

  describe('getUserPaths', () => {
    it('should fetch user paths data', async () => {
      const mockPathData = {
        data: {
          paths: [
            { nodes: ['/home', '/product', '/checkout'], count: 100 }
          ]
        }
      };

      mockClient.post.mockResolvedValue(mockPathData);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');
      const paths = await postHogService.getUserPaths(startDate, endDate);

      expect(mockClient.post).toHaveBeenCalledWith('/insights/path', {
        date_from: startDate.toISOString(),
        date_to: endDate.toISOString(),
        path_type: '$pageview',
        insight: 'PATHS'
      });

      expect(paths).toEqual(mockPathData.data);
    });

    it('should support different path types', async () => {
      mockClient.post.mockResolvedValue({ data: {} });

      const startDate = new Date();
      const endDate = new Date();
      
      await postHogService.getUserPaths(startDate, endDate, 'custom_event');

      expect(mockClient.post).toHaveBeenCalledWith('/insights/path', 
        expect.objectContaining({
          path_type: 'custom_event'
        })
      );
    });
  });

  describe('getFunnels', () => {
    it('should fetch funnel data for given steps', async () => {
      const mockFunnelData = {
        data: {
          steps: [
            { name: 'View Product', count: 1000, conversion_rate: 100 },
            { name: 'Add to Cart', count: 600, conversion_rate: 60 },
            { name: 'Checkout', count: 400, conversion_rate: 66.67 }
          ]
        }
      };

      mockClient.post.mockResolvedValue(mockFunnelData);

      const steps = ['view_product', 'add_to_cart', 'checkout'];
      const funnelData = await postHogService.getFunnels(steps);

      expect(mockClient.post).toHaveBeenCalledWith('/insights/funnel', {
        events: [
          { id: 'view_product', type: 'events' },
          { id: 'add_to_cart', type: 'events' },
          { id: 'checkout', type: 'events' }
        ],
        insight: 'FUNNELS'
      });

      expect(funnelData).toEqual(mockFunnelData.data);
    });
  });

  describe('executeHogQL', () => {
    it('should execute HogQL query', async () => {
      const mockQueryResult = {
        data: {
          results: [
            ['user-1', 10],
            ['user-2', 15]
          ]
        }
      };

      mockClient.post.mockResolvedValue(mockQueryResult);

      const query = 'SELECT distinct_id, count() FROM events GROUP BY distinct_id';
      const result = await postHogService.executeHogQL(query);

      expect(mockClient.post).toHaveBeenCalledWith('/query', {
        query: { kind: 'HogQLQuery', query }
      });

      expect(result).toEqual(mockQueryResult.data.results);
    });
  });
});