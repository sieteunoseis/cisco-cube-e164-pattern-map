# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack React application with TypeScript, Express.js backend, and SQLite database designed for managing connection data with dynamic form generation. The app features a Cisco Cube E164 pattern mapping system with comprehensive security and validation.

**Key Components:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Radix UI components
- **Backend:** Express.js + TypeScript + SQLite with bcrypt password hashing
- **Database:** SQLite with dynamic schema migration based on `dbSetup.json` configuration
- **Security:** Input validation with validator.js, XSS protection, sanitization
- **Theming:** Dark/light mode support with theme context
- **Testing:** Jest (backend) + Vitest (frontend) with comprehensive coverage

## Essential Commands

### Development
```bash
# Install all dependencies
npm run install-all

# Start development servers (both frontend and backend)
npm run dev

# Start individual services
cd frontend && npm run dev  # Frontend only (Vite dev server)
cd backend && npm run dev   # Backend only (nodemon + ts-node)
```

### Building
```bash
# Build for production
npm run build  # Docker Compose build

# Build individual services
cd frontend && npm run build  # TypeScript compilation + Vite build
cd backend && npm run build   # TypeScript compilation to dist/
```

### Testing
```bash
# Backend tests (Jest)
cd backend && npm test
cd backend && npm run test:watch     # Watch mode
cd backend && npm run test:coverage  # With coverage

# Frontend tests (Vitest)
cd frontend && npm test
cd frontend && npm run test:run      # Single run
cd frontend && npm run test:coverage # With coverage
```

### Type Checking and Linting
```bash
# Backend type checking
cd backend && npm run type-check

# Frontend linting
cd frontend && npm run lint

# Frontend build includes type checking
cd frontend && npm run build
```

### Docker Operations
```bash
# Development with Docker
docker-compose up --build
docker-compose down

# Testing with pre-built images
cd docker && ./test.sh
cd docker && ./test.sh --dev  # Local builds
```

## Database Configuration

The application uses dynamic database schema generation based on `frontend/public/dbSetup.json`. This configuration file defines:
- Database table columns and types
- Validation rules using validator.js
- Optional field specifications
- Form generation parameters

The backend automatically creates/migrates the SQLite database schema on startup based on this configuration.

## Environment Configuration

Key environment variables in `.env`:
- `PORT`: Backend server port (default: 5000)
- `NODE_ENV`: Environment mode
- `VITE_TABLE_COLUMNS`: Comma-separated list of visible table columns
- `VITE_BRANDING_NAME`: Application branding

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- Input validation and sanitization on both client and server
- XSS protection with HTML escaping
- CORS configuration for development/production
- TypeScript for type safety throughout the stack

## API Endpoints

### Pattern Management
- `GET /api/data` - Get all patterns
- `POST /api/data` - Create new pattern
- `DELETE /api/data/:id` - Delete pattern

### Cisco Configuration Files
- `GET /config-files/:label.cfg` - Serve patterns for a specific label as Cisco .cfg file
  - Example: `GET /config-files/us-local-numbers.cfg`
  - Returns properly formatted Cisco configuration with E164 patterns
  - Used in Cisco config: `voice class e164-pattern-map 11 url http://host/config-files/us-local-numbers.cfg`

## Key File Locations

- **Database Schema:** `frontend/public/dbSetup.json`
- **Backend API:** `backend/src/server.ts`
- **Frontend Routes:** `frontend/src/App.jsx`
- **Database Logic:** `backend/src/database.ts`
- **Validation:** `backend/src/validation.ts`
- **UI Components:** `frontend/src/components/`
- **API Client:** `frontend/src/lib/api.ts`