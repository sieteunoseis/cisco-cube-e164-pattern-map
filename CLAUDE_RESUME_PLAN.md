# Claude Resume Plan - Nginx Proxy Setup

## Current Status
- Frontend has nginx.conf with `/api/` proxy already configured
- Need to add `/config-files/` proxy to hide backend completely
- Backend currently exposed at port 3001, want to limit to docker network only

## Tasks to Complete

### 1. Update nginx.conf
File: `frontend/nginx.conf`
- Add `/config-files/` location block (copy from `/api/` block)
- Ensure both proxy to backend via docker network

### 2. Update Docker Compose
File: `docker/docker-compose.yml`
- Remove backend `ports` section (lines 29-30) to stop exposing port 3001
- Keep `expose: - "${PORT:-3001}"` for internal docker network
- Remove VITE_API_URL entirely (use relative URLs)

### 3. Update Frontend Dockerfile
File: `frontend/Dockerfile`
- Ensure BACKEND_HOST and BACKEND_PORT env vars are passed to nginx
- May need to add environment substitution

### 4. Update Documentation
Files: `docker/README.md` and `README.md`
- Remove references to backend being accessible at port 3001
- Update examples to show single frontend URL
- Update Cisco config examples to use frontend domain for .cfg files

### 5. Test Changes
- Verify frontend can reach backend via docker network
- Verify .cfg files accessible through frontend proxy
- Test that backend is not accessible from outside docker network

## Current nginx.conf Analysis
- Already has `/api/` proxy configured
- Uses `${BACKEND_HOST}` and `${BACKEND_PORT}` env vars
- Just need to duplicate for `/config-files/`

## Expected Result
- Frontend: https://e164.apps.automate.builders (exposed)
- Backend: Only accessible via docker network (not exposed)
- Cisco .cfg URLs: https://e164.apps.automate.builders/config-files/label.cfg