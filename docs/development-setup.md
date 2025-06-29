# Development Setup Guide

This guide will help you set up the Feature Scene project for local development.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)
- **Neo4j Desktop** (optional, for GUI) - [Download](https://neo4j.com/download/)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/lanemc/feature-scene.git
   cd feature-scene
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Docker services** (Neo4j)
   ```bash
   docker-compose up -d neo4j
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API: http://localhost:5000
   - Frontend Dashboard: http://localhost:3000

## Detailed Setup

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# PostHog Configuration
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_PROJECT_ID=your_posthog_project_id
POSTHOG_HOST=https://app.posthog.com

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Jira Configuration (optional)
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your_jira_email
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=PROJ

# Application Configuration
PORT=5000
NODE_ENV=development
BATCH_SCHEDULE_CRON=0 2 * * *
LOG_LEVEL=debug
```

### 2. PostHog Setup

1. **Create a PostHog account** at [app.posthog.com](https://app.posthog.com) (or self-host)

2. **Get your API credentials**:
   - Navigate to Project Settings
   - Copy your API Key and Project ID

3. **Install PostHog on your website**:
   ```html
   <script>
     !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
     posthog.init('YOUR_PROJECT_API_KEY',{api_host:'https://app.posthog.com'})
   </script>
   ```

### 3. Neo4j Setup

#### Using Docker (Recommended)

```bash
# Start Neo4j
docker-compose up -d neo4j

# Check logs
docker-compose logs neo4j

# Access Neo4j Browser
# Navigate to http://localhost:7474
# Login with neo4j/password123
```

#### Manual Installation

1. Download Neo4j Community Edition from [neo4j.com](https://neo4j.com/download/)
2. Install and start Neo4j
3. Set initial password
4. Update `.env` with connection details

### 4. OpenAI API Setup

1. **Create an OpenAI account** at [platform.openai.com](https://platform.openai.com/)
2. **Generate an API key**:
   - Go to API Keys section
   - Create new secret key
   - Copy and save securely
3. **Add to `.env` file**

### 5. Jira Integration (Optional)

1. **Generate Jira API token**:
   - Go to [Atlassian account settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Create new API token
   - Copy the token

2. **Configure in `.env`**:
   - Add your Jira instance URL
   - Add your email
   - Add the API token
   - Add your project key

## Development Workflow

### Running the Application

```bash
# Start all services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
cd backend && npm test -- --watch
```

### Linting and Type Checking

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### Building for Production

```bash
# Build all packages
npm run build

# Build specific workspace
npm run build --workspace=backend
```

## Project Structure

```
feature-scene/
├── backend/                 # Backend API service
│   ├── src/
│   │   ├── api/            # REST API routes
│   │   ├── config/         # Configuration
│   │   ├── integrations/   # External service integrations
│   │   ├── jobs/           # Batch processing jobs
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── tests/              # Backend tests
├── frontend/               # React dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── tests/              # Frontend tests
├── database/               # Database migrations
├── docs/                   # Documentation
├── k8s/                    # Kubernetes configurations
└── scripts/                # Utility scripts
```

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file in `backend/src/api/routes/`
2. Add route to `backend/src/api/index.ts`
3. Create tests in `backend/tests/api/`
4. Update API documentation

### Adding a New Frontend Component

1. Create component in `frontend/src/components/`
2. Add styles (CSS modules)
3. Create tests in `frontend/tests/components/`
4. Use in pages as needed

### Modifying the Data Model

1. Update TypeScript interfaces in `backend/src/models/`
2. Update Neo4j queries if needed
3. Update tests
4. Consider migration strategy

### Adding a New Pain Point Type

1. Add to `PainPointSchema` in models
2. Update batch processor detection logic
3. Add UI handling in frontend
4. Update AI prompts if needed

## Debugging

### Backend Debugging

1. **VSCode Debug Configuration**:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Backend",
     "skipFiles": ["<node_internals>/**"],
     "program": "${workspaceFolder}/backend/src/index.ts",
     "preLaunchTask": "tsc: build - backend/tsconfig.json",
     "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
   }
   ```

2. **Logging**:
   - Set `LOG_LEVEL=debug` in `.env`
   - Check `logs/` directory for log files

### Frontend Debugging

1. Use React DevTools browser extension
2. Check browser console for errors
3. Use network tab to inspect API calls

### Neo4j Debugging

1. **Access Neo4j Browser**: http://localhost:7474
2. **Run queries directly**:
   ```cypher
   MATCH (n) RETURN n LIMIT 25
   ```
3. **Check constraints and indexes**:
   ```cypher
   SHOW CONSTRAINTS
   SHOW INDEXES
   ```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

2. **Neo4j connection refused**
   - Check if Neo4j is running: `docker ps`
   - Verify credentials in `.env`
   - Check Neo4j logs: `docker-compose logs neo4j`

3. **PostHog events not appearing**
   - Verify API key and project ID
   - Check network tab for failed requests
   - Ensure events are being sent from your website

4. **OpenAI API errors**
   - Check API key validity
   - Monitor usage limits
   - Check for rate limiting

### Getting Help

1. Check existing [GitHub issues](https://github.com/lanemc/feature-scene/issues)
2. Review documentation in `/docs`
3. Create a new issue with:
   - Steps to reproduce
   - Error messages
   - Environment details

## Best Practices

1. **Commit frequently** with clear messages
2. **Write tests** for new features
3. **Update documentation** when changing functionality
4. **Use TypeScript** types properly
5. **Follow existing code style**
6. **Handle errors gracefully**
7. **Log important operations**
8. **Keep secrets secure** (never commit `.env`)