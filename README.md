# Feature Scene - AI-driven User Behavior Analytics & Feature Recommendation Tool

Feature Scene is a comprehensive analytics platform that leverages PostHog, Neo4j, and AI to transform user behavior data into actionable product insights and feature recommendations.

## Overview

This tool automatically analyzes user interactions, identifies pain points, and generates AI-powered recommendations for product improvements. It integrates seamlessly with your existing workflow through Jira and provides a user-friendly dashboard for visualizing insights.

## Key Features

- **Comprehensive Event Tracking**: Captures all user interactions via PostHog
- **Graph-based Journey Analysis**: Uses Neo4j to model and analyze user paths
- **AI-Powered Insights**: Leverages LLMs to generate actionable recommendations
- **Automated Pain Point Detection**: Identifies drop-offs, confusion patterns, and underused features
- **Jira Integration**: One-click ticket creation for recommended improvements
- **Batch Processing**: Daily analysis for scalable, cost-effective insights

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   PostHog API   │────▶│  Data Pipeline  │────▶│     Neo4j       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   AI/LLM API    │     │  Graph Analysis │
                        └─────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │    Dashboard    │◀────│ Insights Store  │
                        └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Jira API      │
                        └─────────────────┘
```

## Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: Neo4j Community Edition
- **Frontend**: React, TypeScript, Vite
- **Analytics**: PostHog
- **AI**: OpenAI GPT-4 (configurable)
- **Integrations**: Jira Cloud/Server

## Prerequisites

- Node.js 18+ and npm
- Neo4j Community Edition
- PostHog account (cloud or self-hosted)
- OpenAI API key
- Jira account (optional)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lanemc/feature-scene.git
cd feature-scene
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Neo4j database

5. Run database migrations:
```bash
npm run migrate
```

## Development

Start the development servers:

```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- Frontend dashboard on http://localhost:3000

## Testing

Run tests for all workspaces:

```bash
npm test
```

## Building for Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### Batch Schedule

The analysis pipeline runs on a configurable schedule (default: 2 AM daily). Adjust the `BATCH_SCHEDULE_CRON` environment variable to change the schedule.

## API Documentation

The backend exposes the following endpoints:

- `GET /api/insights` - Fetch latest insights
- `GET /api/insights/:id` - Get specific insight details
- `POST /api/insights/:id/jira` - Create Jira ticket from insight
- `GET /api/analytics/summary` - Get analytics summary
- `POST /api/batch/run` - Manually trigger batch analysis (admin only)

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License.