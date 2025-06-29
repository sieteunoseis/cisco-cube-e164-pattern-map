import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

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
  label: string;
  pattern: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Simple validation for pattern data
function validatePatternData(data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Validate label (required) - can be comma-separated
  if (!data.label || typeof data.label !== 'string') {
    errors.push('Label is required and must be a string');
  } else {
    // Split by comma and validate each label
    const labels = data.label.split(',').map((label: string) => label.trim()).filter(Boolean);
    if (labels.length === 0) {
      errors.push('At least one label is required');
    } else {
      const invalidLabels = labels.filter((label: string) => !/^[a-z0-9_-]+$/.test(label));
      if (invalidLabels.length > 0) {
        errors.push(`Invalid label format for: ${invalidLabels.join(', ')}. Each label must be lowercase alphanumeric with hyphens or underscores only`);
      }
    }
  }

  // Validate pattern (required)
  if (!data.pattern || typeof data.pattern !== 'string') {
    errors.push('Pattern is required and must be a string');
  }

  // Description is optional - no validation needed
  
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
    label: data.label ? escapeHtml(data.label) : '',
    pattern: data.pattern ? escapeHtml(data.pattern) : '',
    description: data.description ? escapeHtml(data.description) : ''
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


// Health check endpoints
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString(), endpoint: 'api' });
});

// Initialize database tables
async function initializeDatabase(db: D1Database) {
  try {
    // Create patterns table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        hostname TEXT,
        username TEXT,
        password TEXT,
        version TEXT,
        label TEXT,
        pattern TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Create download_logs table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS download_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 200
      )
    `).run();
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Get all patterns or specific pattern by ID
app.get('/api/data', async (c) => {
  try {
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
  } catch (error) {
    console.error('GET /api/data error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Create new pattern
app.post('/api/data', async (c) => {
  try {
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
      'placeholder',
      'placeholder', 
      'placeholder',
      'placeholder',
      '',
      sanitizedData.label,
      sanitizedData.pattern,
      sanitizedData.description || null
    ).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Pattern created successfully' 
    }, 201);
  } catch (error) {
    console.error('POST /api/data error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
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
    SET label = ?, pattern = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    sanitizedData.label,
    sanitizedData.pattern,
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
app.get('/api/config-files/*', async (c) => {
  try {
    const db = c.env.DB;
    
    // Extract labels from path
    const pathParts = c.req.path.split('/');
    const filename = pathParts[pathParts.length - 1];
    const labelsString = filename.replace('.cfg', '');
    
    // Parse comma-separated labels
    const requestedLabels = labelsString.split(',').map(label => label.trim()).filter(Boolean);
    
    // Check if labels exist
    if (requestedLabels.length === 0) {
      return c.json({ error: 'At least one label is required' }, 400);
    }
    
    // Validate each label format
    const invalidLabels = requestedLabels.filter(label => !/^[a-z0-9_-]+$/.test(label));
    if (invalidLabels.length > 0) {
      return c.json({ 
        error: `Invalid label format for: ${invalidLabels.join(', ')}. Labels must be lowercase alphanumeric with hyphens or underscores only` 
      }, 400);
    }
    
    console.log(`Searching for patterns with labels: ${requestedLabels.join(', ')}`);
    
    // Build query to find patterns that match any of the requested labels
    // This handles both exact matches and comma-separated labels in the database
    let allPatterns: any[] = [];
    const seenPatternIds = new Set();
    
    for (const requestedLabel of requestedLabels) {
      // Query for patterns where the label field contains this specific label
      const query = `
        SELECT * FROM patterns WHERE 
        label = ? OR 
        label LIKE ? OR 
        label LIKE ? OR 
        label LIKE ?
      `;
      const searchPatterns = [
        requestedLabel,                    // exact match
        `${requestedLabel},%`,            // starts with label,
        `%,${requestedLabel},%`,          // contains ,label,
        `%,${requestedLabel}`             // ends with ,label
      ];
      
      const result = await db.prepare(query).bind(...searchPatterns).all();
      
      if (result.results) {
        for (const pattern of result.results) {
          if (!seenPatternIds.has(pattern.id)) {
            seenPatternIds.add(pattern.id);
            allPatterns.push(pattern);
          }
        }
      }
    }
    
    console.log(`Found ${allPatterns.length} patterns for labels: ${requestedLabels.join(', ')}`);
    
    if (allPatterns.length === 0) {
      // Log failed download attempt
      const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
      const userAgent = c.req.header('user-agent') || '';
      
      try {
        await db.prepare(`
          INSERT INTO download_logs (label, ip_address, user_agent, status_code)
          VALUES (?, ?, ?, ?)
        `).bind(labelsString, clientIP, userAgent, 404).run();
      } catch (logError) {
        console.error('Failed to log 404 download attempt:', logError);
      }
      
      return c.json({ error: `No patterns found for labels: ${requestedLabels.join(', ')}` }, 404);
    }
    
    // Log successful download
    const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || '';
    
    try {
      await db.prepare(`
        INSERT INTO download_logs (label, ip_address, user_agent, status_code)
        VALUES (?, ?, ?, ?)
      `).bind(labelsString, clientIP, userAgent, 200).run();
    } catch (logError) {
      console.error('Failed to log successful download:', logError);
    }
    
    // Format patterns as simple text file
    const configContent = allPatterns
      .map((pattern: any) => pattern.pattern)
      .filter(p => p)
      .join('\n');
    
    console.log(`Generated config content: ${configContent}`);
    
    // Set appropriate headers for .cfg file
    c.header('Content-Type', 'text/plain');
    c.header('Content-Disposition', `attachment; filename="${labelsString}.cfg"`);
    
    return c.text(configContent);
  } catch (error) {
    console.error('Config file endpoint error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
});

// Get download logs
app.get('/api/logs', async (c) => {
  try {
    const db = c.env.DB;
    
    const limit = parseInt(c.req.query('limit') || '100');
    
    if (limit > 1000) {
      return c.json({ error: 'Limit cannot exceed 1000' }, 400);
    }
    
    const logs = await db.prepare('SELECT * FROM download_logs ORDER BY downloaded_at DESC LIMIT ?').bind(limit).all();
    return c.json(logs.results || []);
  } catch (error) {
    console.error('Logs endpoint error:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, 500);
  }
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

// SPA fallback - serve index.html for all non-API routes
app.get('*', async (c) => {
  try {
    // Try to get the requested asset first (for static files like CSS, JS, etc.)
    const url = new URL(c.req.url);
    const pathname = url.pathname;
    
    // If it's a static asset request, let it fall through to the default asset handling
    if (pathname.includes('.') && !pathname.includes('/api/')) {
      // This will be handled by Cloudflare's static asset serving
      return new Response(null, { status: 404 });
    }
    
    // For all other routes (SPA routes), serve index.html
    return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="/config.js"></script>
    <title>Automate Builders</title>
    <script type="module" crossorigin src="/assets/index-CXgjuKjM.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BYfb2SEB.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`);
  } catch (error) {
    console.error('SPA fallback error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});

export default app;