# Fefeave Backend

Backend API for the Fefeave reseller business system.

## Framework Choice: Fastify

- **Performance**: Fastify is significantly faster than Express (up to 2x in benchmarks) with lower overhead, making it ideal for high-throughput API endpoints
- **TypeScript Support**: Built-in TypeScript support with excellent type inference and schema validation capabilities that align well with our API contract requirements
- **Schema Validation**: Native JSON Schema validation reduces boilerplate and ensures type safety at runtime, critical for financial data integrity

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment configuration
│   ├── routes/          # API route handlers
│   ├── plugins/         # Fastify plugins
│   ├── utils/           # Utilities (logger, errors)
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
└── package.json
```

## Modules

The following modules are scaffolded (routes defined, implementation pending):

- `auth` - Authentication and authorization
- `users` - User management
- `wholesalers` - Wholesaler entities
- `shows` - Sales events
- `owed-line-items` - Financial obligations
- `payments` - Payment records
- `adjustments` - Adjustments, refunds, fees
- `attachments` - File uploads/downloads

## Running Locally

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests (when implemented)

### Environment Variables

The following environment variables are supported:

- `NODE_ENV` - Environment (development, production, test) - defaults to `development`
- `PORT` - Server port - defaults to `3000`
- `LOG_LEVEL` - Logging level (fatal, error, warn, info, debug, trace) - defaults to `info`
- `API_PREFIX` - API route prefix - defaults to `/api`

The application will fail to start if required environment variables are missing or invalid.

### Endpoints

- `GET /api/health` - Health check endpoint
- `GET /docs` - Swagger/OpenAPI documentation UI

All other endpoints return `501 Not Implemented` until implemented.

## Features

- **Structured Logging**: Request ID tracking per request with Pino logger
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Environment Validation**: Zod-based environment variable validation (fails fast on invalid config)
- **OpenAPI/Swagger**: API documentation scaffold (Swagger UI at `/docs`)
- **TypeScript**: Full type safety throughout the application
- **Security**: Helmet for security headers, CORS configuration
