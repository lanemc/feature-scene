# Testing Guide

This document describes the testing strategy and how to run tests for the Feature Scene application.

## Test Structure

The project uses Jest as the testing framework for both backend and frontend:

- **Backend Tests**: Located in `/backend/tests/`
- **Frontend Tests**: Located in `/frontend/tests/`

## Running Tests

### Run all tests
```bash
npm test
```

### Run backend tests only
```bash
npm run test:backend
```

### Run frontend tests only
```bash
npm run test:frontend
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Backend Testing

### Unit Tests

#### Services
- `ai-analysis.test.ts` - Tests AI/LLM integration for generating insights
- `batch-processor.test.ts` - Tests the batch processing pipeline

#### Integrations
- `posthog.test.ts` - Tests PostHog API integration
- `neo4j.test.ts` - Tests Neo4j database operations
- `jira.test.ts` - Tests Jira API integration (when implemented)

#### API Endpoints
- `insights.test.ts` - Tests insights REST endpoints
- `analytics.test.ts` - Tests analytics endpoints (when implemented)
- `batch.test.ts` - Tests batch job endpoints (when implemented)

### Mocking Strategy

The backend tests use Jest mocks for external dependencies:
- OpenAI API calls are mocked to avoid costs and ensure consistent test results
- Database connections are mocked to avoid requiring a test database
- External API calls (PostHog, Jira) are mocked for isolation

## Frontend Testing

### Component Tests

#### Components
- `StatsCard.test.tsx` - Tests the statistics card component
- `InsightsList.test.tsx` - Tests the insights list component
- Additional component tests for charts and visualizations

#### Pages
- `Dashboard.test.tsx` - Tests the main dashboard page
- Additional page tests for Insights, Analytics, and Batch Jobs pages

### Testing Libraries

The frontend uses:
- `@testing-library/react` - For component testing
- `@testing-library/jest-dom` - For DOM assertions
- `@testing-library/user-event` - For simulating user interactions

### Mocking Strategy

- API calls are mocked using Jest
- Chart.js components are mocked to avoid canvas rendering issues
- React Router is wrapped for navigation testing

## Writing New Tests

### Backend Test Example

```typescript
describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should perform expected behavior', async () => {
    const result = await service.doSomething();
    expect(result).toEqual(expectedValue);
  });
});
```

### Frontend Test Example

```typescript
describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" value={42} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
```

## Test Coverage

The project aims for:
- 80%+ code coverage for critical business logic
- 70%+ coverage for UI components
- 90%+ coverage for utility functions

Coverage reports are generated in:
- Backend: `/backend/coverage/`
- Frontend: `/frontend/coverage/`

## CI/CD Integration

Tests are run automatically on:
- Pull request creation
- Commits to main branch
- Before deployment

## Debugging Tests

### Run tests in watch mode
```bash
# Backend
cd backend && npm test -- --watch

# Frontend
cd frontend && npm test -- --watch
```

### Debug a specific test file
```bash
# Backend
cd backend && npm test -- path/to/test.ts

# Frontend
cd frontend && npm test -- path/to/test.tsx
```

### Run tests with verbose output
```bash
npm test -- --verbose
```