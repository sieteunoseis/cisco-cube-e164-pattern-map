import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/cloudflare-workers';

// Types for Cloudflare Worker environment
export interface Env {
  DB: D1Database;
  NODE_ENV?: string;
  VITE_TABLE_COLUMNS?: string;
  VITE_BRANDING_NAME?: string;
}

// Connection record type
interface ConnectionRecord {
  id?: number;
  name: string;
  hostname: string;
  username: string;
  password: string;
  version: string;
  label?: string;
  pattern?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Simple validation for pattern data
function validatePatternData(data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!data.hostname || typeof data.hostname !== 'string' || data.hostname.length === 0) {
    errors.push('Hostname is required and must be a non-empty string');
  }
  
  if (!data.username || typeof data.username !== 'string' || data.username.length === 0) {
    errors.push('Username is required and must be a non-empty string');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Sanitize pattern data (basic HTML escaping)
function sanitizePatternData(data: any): ConnectionRecord {
  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  return {
    name: escapeHtml(data.name || ''),
    hostname: escapeHtml(data.hostname || ''),
    username: escapeHtml(data.username || ''),
    password: escapeHtml(data.password || ''),
    version: escapeHtml(data.version || ''),
    label: data.label ? escapeHtml(data.label) : undefined,
    pattern: data.pattern ? escapeHtml(data.pattern) : undefined,
    description: data.description ? escapeHtml(data.description) : undefined
  };
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from frontend build
app.use('/*', serveStatic({ root: './' }));

// Health check endpoints
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString(), endpoint: 'api' });
});

// Initialize database tables
async function initializeDatabase(db: D1Database) {
  // Create patterns table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hostname TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      version TEXT DEFAULT '',
      label TEXT,
      pattern TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create download logs table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS download_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      status_code INTEGER,
      downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get all patterns or specific pattern by ID
app.get('/api/data', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const id = c.req.query('id');
  
  if (id) {
    const patternId = parseInt(id);
    if (isNaN(patternId)) {
      return c.json({ error: 'Invalid ID parameter' }, 400);
    }
    
    const pattern = await db.prepare('SELECT * FROM patterns WHERE id = ?').bind(patternId).first();
    if (!pattern) {
      return c.json({ error: 'Pattern not found' }, 404);
    }
    
    return c.json(pattern);
  } else {
    const patterns = await db.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
    return c.json(patterns.results);
  }
});

// Create new pattern
app.post('/api/data', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const body = await c.req.json();
  
  // Validate input data
  const validation = validatePatternData(body);
  if (!validation.isValid) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.errors 
    }, 400);
  }
  
  // Sanitize input data
  const sanitizedData = sanitizePatternData(body);
  
  const result = await db.prepare(`
    INSERT INTO patterns (name, hostname, username, password, version, label, pattern, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sanitizedData.name,
    sanitizedData.hostname,
    sanitizedData.username,
    sanitizedData.password,
    sanitizedData.version || '',
    sanitizedData.label || null,
    sanitizedData.pattern || null,
    sanitizedData.description || null
  ).run();
  
  return c.json({ 
    id: result.meta.last_row_id,
    message: 'Pattern created successfully' 
  }, 201);
});

// Update pattern by ID
app.put('/api/data/:id', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID parameter' }, 400);
  }
  
  // Check if pattern exists
  const pattern = await db.prepare('SELECT * FROM patterns WHERE id = ?').bind(id).first();
  if (!pattern) {
    return c.json({ error: 'Pattern not found' }, 404);
  }
  
  const body = await c.req.json();
  
  // Validate input data
  const validation = validatePatternData(body);
  if (!validation.isValid) {
    return c.json({ 
      error: 'Validation failed', 
      details: validation.errors 
    }, 400);
  }
  
  // Sanitize input data
  const sanitizedData = sanitizePatternData(body);
  
  await db.prepare(`
    UPDATE patterns 
    SET name = ?, hostname = ?, username = ?, password = ?, version = ?, 
        label = ?, pattern = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    sanitizedData.name,
    sanitizedData.hostname,
    sanitizedData.username,
    sanitizedData.password,
    sanitizedData.version || '',
    sanitizedData.label || null,
    sanitizedData.pattern || null,
    sanitizedData.description || null,
    id
  ).run();
  
  return c.json({ message: 'Pattern updated successfully' });
});

// Delete pattern by ID
app.delete('/api/data/:id', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const id = parseInt(c.req.param('id'));
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID parameter' }, 400);
  }
  
  // Check if pattern exists
  const pattern = await db.prepare('SELECT * FROM patterns WHERE id = ?').bind(id).first();
  if (!pattern) {
    return c.json({ error: 'Pattern not found' }, 404);
  }
  
  await db.prepare('DELETE FROM patterns WHERE id = ?').bind(id).run();
  return c.text('', 204);
});

// Serve E164 patterns as Cisco .cfg file
app.get('/api/config-files/:label.cfg', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const label = c.req.param('label');
  
  // Validate label format
  if (!/^[a-z0-9_-]+$/.test(label)) {
    return c.json({ error: 'Invalid label format' }, 400);
  }
  
  const patterns = await db.prepare('SELECT * FROM patterns WHERE label = ?').bind(label).all();
  
  if (patterns.results.length === 0) {
    // Log failed download attempt
    const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || '';
    
    await db.prepare(`
      INSERT INTO download_logs (label, ip_address, user_agent, status_code)
      VALUES (?, ?, ?, ?)
    `).bind(label, clientIP, userAgent, 404).run();
    
    return c.json({ error: `No patterns found for label: ${label}` }, 404);
  }
  
  // Log successful download
  const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const userAgent = c.req.header('user-agent') || '';
  
  await db.prepare(`
    INSERT INTO download_logs (label, ip_address, user_agent, status_code)
    VALUES (?, ?, ?, ?)
  `).bind(label, clientIP, userAgent, 200).run();
  
  // Format patterns as simple text file
  const configContent = patterns.results
    .map((pattern: any) => pattern.pattern)
    .filter(p => p)
    .join('\n');
  
  // Set appropriate headers for .cfg file
  c.header('Content-Type', 'text/plain');
  c.header('Content-Disposition', `attachment; filename="${label}.cfg"`);
  
  return c.text(configContent);
});

// Get download logs
app.get('/api/logs', async (c) => {
  const db = c.env.DB;
  await initializeDatabase(db);
  
  const limit = parseInt(c.req.query('limit') || '100');
  
  if (limit > 1000) {
    return c.json({ error: 'Limit cannot exceed 1000' }, 400);
  }
  
  const logs = await db.prepare('SELECT * FROM download_logs ORDER BY downloaded_at DESC LIMIT ?').bind(limit).all();
  return c.json(logs.results);
});

// Pattern generation endpoint (simplified for Worker)
app.post('/api/generate-patterns', async (c) => {
  const body = await c.req.json();
  const { startNumber, endNumber } = body;
  
  if (typeof startNumber !== 'number' || typeof endNumber !== 'number') {
    return c.json({ 
      error: 'Invalid input: startNumber and endNumber must be numbers' 
    }, 400);
  }
  
  if (startNumber > endNumber) {
    return c.json({ 
      error: 'Invalid range: startNumber must be less than or equal to endNumber' 
    }, 400);
  }
  
  // Simple pattern generation (basic implementation)
  const patterns: string[] = [];
  for (let i = startNumber; i <= endNumber; i++) {
    patterns.push(`^${i}$`);
  }
  
  const description = `Range: ${startNumber} to ${endNumber}`;
  
  return c.json({
    patterns,
    description,
    startNumber,
    endNumber,
    totalPatterns: patterns.length
  });
});

// Handle 404 for unmatched API routes
app.all('/api/*', (c) => {
  return c.json({ error: 'Route not found' }, 404);
});

export default app;