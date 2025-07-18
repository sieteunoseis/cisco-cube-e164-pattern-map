# Docker Testing Environment

This folder contains Docker Compose configuration for testing the application with pre-built images from GitHub Container Registry.

## Quick Start

### Download Docker Compose File
```bash
# Download docker-compose.yml directly from GitHub
wget https://raw.githubusercontent.com/sieteunoseis/cisco-cube-e164-pattern-map/master/docker/docker-compose.yml

# Or download entire docker folder
wget -r --no-parent --reject="index.html*" https://raw.githubusercontent.com/sieteunoseis/cisco-cube-e164-pattern-map/master/docker/
```

### Run Application
```bash
# Start the application
docker compose up -d

# Check logs
docker compose logs -f

# Stop the application
docker compose down
```

## Configuration

### Environment Variables

The application supports several environment variables for customization:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `BACKEND_HOST` | `backend` | Backend hostname for internal communication |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS (production) |
| `VITE_BRANDING_NAME` | `Automate Builders` | Application branding name |
| `VITE_BRANDING_URL` | `https://github.com/sieteunoseis/cisco-cube-e164-pattern-map` | Branding URL |
| `VITE_TABLE_COLUMNS` | `label,pattern,description` | Visible table columns |
| `VITE_BACKGROUND_LOGO_TEXT` | `AB` | Background logo text |
| `FRONTEND_TAG` | `latest` | Frontend Docker image tag |
| `BACKEND_TAG` | `latest` | Backend Docker image tag |

#### Local Development
For local development, use default settings:
```bash
docker compose up -d
```

#### Production Deployment
For production with custom domains:
```bash
# Set your URLs and branding
export FRONTEND_URL=http://your-server:3000
export VITE_BRANDING_NAME="Your Company Name"
export VITE_BRANDING_URL="https://your-company.com"

docker compose up -d
```

#### Custom Environment File
Create a `.env` file for persistent configuration:
```bash
# .env
FRONTEND_URL=http://your-server:3000
VITE_BRANDING_NAME=My E164 Pattern Manager
VITE_BRANDING_URL=https://my-company.com
VITE_TABLE_COLUMNS=label,pattern,description
VITE_BACKGROUND_LOGO_TEXT=E164
PORT=3001
```

### Available Images
The compose file pulls images from GitHub Container Registry:
- `ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/frontend:latest`
- `ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/backend:latest`

### Port Configuration
- **Frontend**: http://localhost:3000
- **Backend API**: Accessible only via frontend proxy (not directly exposed)
- **Health Check**: http://localhost:3000/api/health
- **Config Files**: http://localhost:3000/config-files/{label}.cfg

## Testing Different Versions

To test specific versions, update the docker-compose.yml image tags:

```yaml
services:
  frontend:
    image: ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/frontend:v1.1.0
  backend:
    image: ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/backend:v1.1.0
```

## Data Persistence

Database data is persisted in a Docker volume `backend_data`. To reset:

```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Start fresh
```

## Troubleshooting

### Apple Silicon (ARM64) Support
Pre-built images support both AMD64 and ARM64 architectures. If you encounter issues with the pre-built images, build locally:

```bash
# Clone the repository
git clone https://github.com/sieteunoseis/cisco-cube-e164-pattern-map.git
cd cisco-cube-e164-pattern-map

# Create .env file (optional, has sensible defaults)
cp .env.example .env

# Build and run locally using root docker-compose.yaml
docker compose -f docker-compose.yaml up -d --build
```

Or download just the build compose file:
```bash
# Download the local build version
wget https://raw.githubusercontent.com/sieteunoseis/cisco-cube-e164-pattern-map/master/docker-compose.yaml

# Build and run
docker compose -f docker-compose.yaml up -d --build
```

### Image Pull Issues
If images aren't available in GitHub Container Registry yet:
```bash
# Build images locally first
cd ..
docker compose build
docker tag cisco-cube-e164-pattern-map_frontend ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/frontend:latest
docker tag cisco-cube-e164-pattern-map_backend ghcr.io/sieteunoseis/cisco-cube-e164-pattern-map/backend:latest
```

### Health Check Failures
```bash
# Check backend health via proxy
curl http://localhost:3000/api/health

# Check backend logs
docker compose logs backend
```

### Container Communication Issues
```bash
# Test internal network connectivity
docker compose exec cisco-cube-frontend ping cisco-cube-backend
docker compose exec cisco-cube-frontend curl http://backend:3001/health

# Test proxy functionality
curl http://localhost:3000/api/health
curl http://localhost:3000/config-files/test.cfg

# If using different container names, override the backend host
BACKEND_HOST=cisco-cube-backend docker compose up -d
```

## Development vs Testing

| Environment | Frontend | Backend | Use Case |
|-------------|----------|---------|-----------|
| **Development** | `npm run dev` | `npm run dev` | Local development with hot reload |
| **Local Docker** | `docker compose up` | `docker compose up` | Test production build locally |
| **Testing** | Pre-built images | Pre-built images | Test deployed versions |

## Monitoring

### Container Status
```bash
docker-compose ps
docker-compose top
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```