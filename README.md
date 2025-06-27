# Cisco CUBE E164 Pattern Map

A specialized React application for managing Cisco CUBE E164 pattern mappings with dynamic pattern generation and configuration file serving. Built with TypeScript, Express.js backend, and SQLite database for enterprise voice routing management.

## ✨ Features

- **📞 E164 Pattern Management**: Create, edit, and organize Cisco CUBE E164 patterns with label-based grouping
- **🎯 Pattern Generator**: Convert number ranges to optimized E164 patterns with intelligent sub-range splitting
- **📁 Configuration File Serving**: Automatic .cfg file generation for Cisco router consumption
- **🔄 Bulk Operations**: Process multiple patterns, bulk number input, and batch operations
- **🎨 Modern UI**: React 19, Tailwind CSS, Radix UI components with dark/light themes
- **🔒 Enterprise Security**: Input validation, sanitization, and XSS protection for production use
- **📘 TypeScript**: Full TypeScript implementation for both frontend and backend
- **🗄️ SQLite Database**: Pattern storage with automatic schema management
- **🐳 Docker Ready**: Containerized deployment with Docker Compose
- **📖 Cisco Integration**: Built-in configuration guides and copy-paste commands

## 📸 Screenshots

See the application in action! Check out the [screenshots folder](screenshots/) for visual examples of:

- **Pattern Management Dashboard** - Add, edit, and organize E164 patterns
- **Intelligent Pattern Generator** - Convert ranges to optimized patterns
- **Configuration Guide** - Copy-ready Cisco router commands

[View all screenshots →](screenshots/README.md)

## 🎯 Easiest Deployment (Recommended)

**The simplest way to deploy this application is using the Docker setup from the `docker/` folder:**

```bash
# Download the Docker Compose file
wget https://raw.githubusercontent.com/sieteunoseis/cisco-cube-e164-pattern-map/master/docker/docker-compose.yml

# Set your environment variables (optional)
export VITE_BRANDING_NAME="Your Company E164 Manager"
export VITE_BRANDING_URL="https://yourcompany.com"

# Start the application (that's it!)
docker compose up -d
```

**Why this is the easiest:**
- ✅ **No building required** - uses pre-built images from GitHub Container Registry
- ✅ **Single command deployment** - just `docker compose up -d`
- ✅ **Production ready** - nginx proxy, health checks, persistent storage
- ✅ **Single port** - only exposes port 3000 (secure architecture)
- ✅ **Auto-restart** - containers restart automatically if they fail

See the [`docker/README.md`](docker/README.md) for detailed deployment instructions and configuration options.

## Quick Start (Development)

### 1. Clone and Install
```bash
git clone <this-repository>
cd cisco-cube-e164-pattern-map
npm run install-all
```

### 2. Configure Environment
Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key configuration options:

```bash
# Backend Configuration
PORT=5001                               # Backend server port
NODE_ENV=development                    # Environment mode

# Application Branding
VITE_BRANDING_NAME="Your Company Name"
VITE_BRANDING_URL="https://yourcompany.com"
VITE_BACKGROUND_LOGO_TEXT="AB"          # Background logo: text or Lucide icon (prefix with "lucide-")
VITE_TABLE_COLUMNS=label,pattern,description

```

**Background Logo Options:**

- **Text**: Any text string (e.g., "AB", "ACME")
- **Lucide Icons**: Use `lucide-` prefix with any icon name from [Lucide Icons](https://lucide.dev/icons/)
  - Examples: `lucide-frown`, `lucide-settings`, `lucide-phone`, `lucide-network`
  - Icons automatically resize and adapt to dark/light themes

### 3. Start Development Server

```bash
npm run dev  # Starts both frontend and backend in development mode
```

The application will be available at:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:5001> (development) or via frontend proxy (production)
- **Config Files**: <http://localhost:5001/config-files/{label}.cfg> (development)

## Using the Application

### E164 Pattern Management

1. **Home Page**: Add individual E164 patterns with labels and descriptions
2. **Pattern Generator**: Convert number ranges (e.g., 5551000-5551999) to optimized patterns
3. **Bulk Operations**: Process multiple numbers at once or delete entire label groups
4. **Configuration Guide**: Built-in Cisco router configuration examples

### Cisco Router Integration

The application automatically serves `.cfg` files for each label at:

```text
http://your-server:3000/config-files/{label}.cfg
```

Use in Cisco configuration:

```cisco
voice class e164-pattern-map 101
 url https://your-frontend.domain.com/config-files/us-local.cfg
```

**Production Example**:

```cisco
voice class e164-pattern-map 101
 url http://your-server:3000/config-files/portland-npa-503.cfg
```

### 4. Docker Deployment

> **💡 For production, see the [Recommended Deployment](#-recommended-deployment) section above using the `docker/` folder setup.**

#### Local Development Docker

```bash
# Build and run with Docker Compose (builds locally)
npm run build  # or docker-compose up --build

# Individual commands
docker-compose up --build   # Build and start containers
docker-compose up           # Start existing containers  
docker-compose down         # Stop containers
```

#### Production Deployment with Docker

For production with custom domains and environment variables:

```bash
# Set environment variables for production
export FRONTEND_URL=http://your-server:3000
export VITE_BRANDING_NAME="Your Company E164 Manager"
export VITE_BRANDING_URL="https://yourcompany.com"
export VITE_BACKGROUND_LOGO_TEXT="E164"

# Download and run with pre-built images
wget https://raw.githubusercontent.com/sieteunoseis/cisco-cube-e164-pattern-map/master/docker/docker-compose.yml
docker compose up -d
```

#### Environment Variables for Production

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FRONTEND_URL` | **Yes** | Frontend URL for CORS | `http://your-server:3000` |
| `VITE_BRANDING_NAME` | No | Application title | `"My E164 Manager"` |
| `VITE_BRANDING_URL` | No | Company/project URL | `"https://company.com"` |
| `VITE_BACKGROUND_LOGO_TEXT` | No | Background logo text/icon | `"E164"` or `"lucide-phone"` |
| `PORT` | No | Backend port | `3001` |

**Important**:

- `FRONTEND_URL` must match your frontend domain for CORS to work properly
- Config files are served through the frontend proxy at `/config-files/` for better security

#### Testing with Pre-built Images

For testing with images from GitHub Container Registry:

```bash
cd docker
./test.sh          # Test with pre-built images
./test.sh --dev     # Test with local builds

# Manual Docker Compose
docker-compose up -d                    # Use pre-built images
docker-compose -f docker-compose.dev.yml up -d  # Use local builds
```

### 6. Build for production (manual)

```bash
cd frontend && npm run build  # Frontend build only
cd backend && npm run build   # Backend TypeScript compilation
```

### 6. Run tests

```bash
# Backend tests (Jest + TypeScript)
cd backend && npm test

# Frontend tests (Vitest + React Testing Library)  
cd frontend && npm test
```

### 7. Type checking

```bash
cd backend && npm run type-check   # TypeScript type checking
cd frontend && npm run build       # Includes type checking
```

### 8. Sync upstream changes from the template to your project
```bash
npm run sync-remote  # Pulls latest template updates
```

## 🔧 Development Guide

### Project Structure
```
├── frontend/               # React + TypeScript + Vite
│   ├── src/components/    # Reusable UI components
│   ├── src/pages/         # Application pages
│   └── public/dbSetup.json # Database schema configuration
├── backend/               # Express.js + TypeScript
│   ├── src/              # TypeScript source files
│   ├── dist/             # Compiled JavaScript
│   ├── tests/            # Jest test files
│   └── db/               # SQLite database files
└── scripts/              # Utility scripts
```

### Security Features
- **Input Validation**: Server-side validation using validator.js
- **Data Sanitization**: HTML escaping and XSS protection
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error logging and secure responses

### Database Features
- **Auto Schema Migration**: Automatically updates database schema
- **Dynamic Table Creation**: Based on environment configuration
- **Connection Selection Logic**: Transaction-based with race condition prevention
- **Optional Fields**: Support for optional fields (e.g., version numbers)

## 🧮 Pattern Generator

The Pattern Generator converts number ranges into Cisco CUBE-compatible E164 patterns with intelligent optimization.

### Key Features
- **Range to Pattern Conversion**: Convert number ranges (e.g., 5551000-5551999) into optimized E164 patterns
- **Bulk Number Processing**: Process lists of individual numbers with smart range grouping
- **Sub-range Optimization**: Automatically splits large ranges into efficient sub-patterns
- **Multiple Export Options**: Copy, download, or add directly to database
- **Wildcard Support**: Uses Cisco E164 format with proper wildcard characters

### Pattern Generation Examples

**Simple Range**:
```
Input: 5551000-5551999
Output: 5551...
```

**Complex Range**:
```
Input: 100-199
Output: 1..
```

**Bulk Numbers**:
```
Input: 1000, 1001, 1002, 2008, 2009
Output: 
- 100[0-2] (covers 1000-1002)
- 200[8-9] (covers 2008-2009)
```

### Wildcard Reference

The application includes a comprehensive wildcard guide for Cisco dial-peer patterns:
- `.` - Matches any single digit
- `T` - Variable length match (up to 32 digits)
- `[1-5]` - Range of characters
- `+` - E164 number indicator
- `?` - Optional preceding digit
- And more...

### API Integration

REST API endpoint for programmatic access:

```bash
POST /api/generate-patterns
Content-Type: application/json

{
  "startNumber": 5551000,
  "endNumber": 5551999
}
```

## 🚨 Troubleshooting

### Permission denied when running the script
```bash
chmod +x git-template-remote.sh
```

### Git divergent branches error
```bash
git config pull.rebase false  # merge (recommended)
git config pull.rebase true   # rebase
git config pull.ff only       # fast-forward only
```

### SQLite database error: SQLITE_CANTOPEN
```bash
mkdir backend/db  # Create database directory
```

### TypeScript compilation errors
```bash
cd backend && npm run build  # Check for TypeScript errors
cd frontend && npm run build # Frontend type checking
```

### Test failures
```bash
# Clean install and rebuild
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install-all
npm run build
```

### Port conflicts (EADDRINUSE)
```bash
# Check what's using your backend port
lsof -i :5000

# Kill processes using common ports
lsof -ti:3000 | xargs kill -9   # Frontend (production)
lsof -ti:5173 | xargs kill -9   # Frontend (dev)
lsof -ti:5000 | xargs kill -9   # Backend (default)

# Or change the backend port in .env
echo "PORT=8000" >> .env        # Use port 8000 instead
```

### Changing the backend port
To use a different backend port:

1. **Update `.env` file**:
   ```bash
   PORT=8000  # Your preferred port
   ```

2. **Restart the application**:
   ```bash
   npm run dev
   ```

The frontend will automatically proxy to the new port via Vite configuration.

---

**Template Reference**: Script based on [Propagating Git Template Changes](https://www.mslinn.com/git/700-propagating-git-template-changes.html)
