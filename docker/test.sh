#!/bin/bash

# Test script for Docker deployment
set -e

echo "🐳 Docker Testing Script"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if docker compose is available
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker with Compose V2 support."
    exit 1
fi

print_status "Docker Compose is available"

# Choose compose file
COMPOSE_FILE="docker-compose.yml"
if [[ "$1" == "--dev" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    print_status "Using development build"
else
    print_status "Using pre-built images from GitHub Container Registry"
fi

# Stop any existing containers
print_status "Stopping existing containers..."
docker compose -f $COMPOSE_FILE down > /dev/null 2>&1 || true

# Start services
print_status "Starting services..."
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 10

# Check if containers are running
if ! docker compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    print_error "Containers failed to start"
    docker compose -f $COMPOSE_FILE logs
    exit 1
fi

print_status "Containers are running"

# Test backend health endpoint through frontend proxy
print_status "Testing backend health endpoint via proxy..."
sleep 5  # Give backend more time to start

if curl -f "http://localhost:3000/api/health" > /dev/null 2>&1; then
    print_status "Backend health check passed (via proxy)"
else
    print_warning "Backend health check failed, checking if API is responding..."
    if curl -f "http://localhost:3000/api/data" > /dev/null 2>&1; then
        print_status "Backend API is responding (via proxy)"
    else
        print_error "Backend is not responding via proxy"
        echo "Backend logs:"
        docker compose -f $COMPOSE_FILE logs backend
        echo "Frontend logs:"
        docker compose -f $COMPOSE_FILE logs frontend
        exit 1
    fi
fi

# Test frontend
print_status "Testing frontend..."
if curl -f "http://localhost:3000" > /dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not accessible"
    echo "Frontend logs:"
    docker compose -f $COMPOSE_FILE logs frontend
    exit 1
fi

# Test API endpoint via proxy
print_status "Testing API endpoint via proxy..."
if curl -f "http://localhost:3000/api/data" > /dev/null 2>&1; then
    print_status "API endpoint is responding (via proxy)"
else
    print_error "API endpoint is not responding via proxy"
    exit 1
fi

echo ""
print_status "All tests passed! 🎉"
echo ""
echo "Services are running:"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:3000/api (proxied to backend)"
echo "  Config:   http://localhost:3000/api/config-files/"
echo ""
echo "To stop services: docker compose -f $COMPOSE_FILE down"
echo "To view logs:     docker compose -f $COMPOSE_FILE logs -f"