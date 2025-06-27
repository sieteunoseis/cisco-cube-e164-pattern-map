import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './database';
import { validatePatternData, sanitizePatternData } from './validation';
import { Logger } from './logger';
import { ConnectionRecord, ApiResponse } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const TABLE_COLUMNS = (process.env.VITE_TABLE_COLUMNS || 'name,hostname,username,password,version')
  .split(',')
  .map(col => col.trim())
  .filter(col => col !== 'password'); // Remove password from visible columns

// Initialize database
const database = new Database('./db/database.db', TABLE_COLUMNS);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('User-Agent') 
  });
  next();
});

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  Logger.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }

  const response: ApiResponse = {
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  };
  
  res.status(500).json(response);
};

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint - redirect to frontend
app.get('/', (req: Request, res: Response) => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : 'http://localhost:5173';
  res.redirect(frontendUrl);
});

// Get all patterns or specific pattern by ID
app.get('/api/data', asyncHandler(async (req: Request, res: Response) => {
  const id = req.query.id;

  if (id) {
    const patternId = parseInt(id as string);
    if (isNaN(patternId)) {
      return res.status(400).json({ error: 'Invalid ID parameter' });
    }

    const pattern = await database.getConnectionById(patternId);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }
    
    return res.json(pattern);
  } else {
    const patterns = await database.getAllConnections();
    return res.json(patterns);
  }
}));

// Create new pattern
app.post('/api/data', asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  const validation = validatePatternData(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  // Sanitize input data
  const sanitizedData = sanitizePatternData(req.body);
  
  const connectionId = await database.createConnection(sanitizedData as ConnectionRecord);
  
  return res.status(201).json({ 
    id: connectionId,
    message: 'Pattern created successfully' 
  });
}));

// Update pattern by ID
app.put('/api/data/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  // Check if pattern exists
  const pattern = await database.getConnectionById(id);
  if (!pattern) {
    return res.status(404).json({ error: 'Pattern not found' });
  }

  // Validate input data
  Logger.debug('PUT request body:', req.body);
  const validation = validatePatternData(req.body);
  if (!validation.isValid) {
    Logger.error('Validation failed for PUT request:', validation.errors);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validation.errors 
    });
  }

  // Sanitize input data
  const sanitizedData = sanitizePatternData(req.body);
  
  await database.updateConnection(id, sanitizedData as ConnectionRecord);
  
  return res.json({ 
    message: 'Pattern updated successfully' 
  });
}));

// Delete pattern by ID
app.delete('/api/data/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  // Check if pattern exists
  const pattern = await database.getConnectionById(id);
  if (!pattern) {
    return res.status(404).json({ error: 'Pattern not found' });
  }

  await database.deleteConnection(id);
  return res.status(204).send();
}));

// Serve E164 patterns as Cisco .cfg file
app.get('/config-files/:label.cfg', asyncHandler(async (req: Request, res: Response) => {
  const { label } = req.params;
  
  // Validate label format (slug validation - allow hyphens and underscores)
  if (!/^[a-z0-9_-]+$/.test(label)) {
    return res.status(400).json({ error: 'Invalid label format' });
  }

  const patterns = await database.getPatternsByLabel(label);
  
  if (patterns.length === 0) {
    return res.status(404).json({ error: `No patterns found for label: ${label}` });
  }

  // Format patterns as simple text file - just the patterns, one per line
  const configContent = patterns.map(pattern => pattern.pattern).join('\n');

  // Set appropriate headers for .cfg file
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${label}.cfg"`);
  
  Logger.info(`Served .cfg file for label: ${label} with ${patterns.length} patterns`);
  return res.send(configContent);
}));

// Pattern generation endpoint
app.post('/api/generate-patterns', asyncHandler(async (req: Request, res: Response) => {
  const { startNumber, endNumber } = req.body;

  if (typeof startNumber !== 'number' || typeof endNumber !== 'number') {
    return res.status(400).json({ 
      error: 'Invalid input: startNumber and endNumber must be numbers' 
    });
  }

  if (startNumber > endNumber) {
    return res.status(400).json({ 
      error: 'Invalid range: startNumber must be less than or equal to endNumber' 
    });
  }

  try {
    // Dynamic import for pattern generation
    const { regexForRange, didToRange } = require('./pattern-generator');
    
    const result = regexForRange(startNumber, endNumber);
    const description = didToRange(startNumber, endNumber);
    
    return res.json({
      patterns: result.patterns,
      description,
      startNumber,
      endNumber,
      totalPatterns: result.patterns.length
    });
  } catch (error) {
    Logger.error('Pattern generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate patterns' 
    });
  }
}));

// Apply error handling middleware
app.use(errorHandler);

// Handle 404 for unmatched routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = () => {
  Logger.info('Received shutdown signal, closing server...');
  database.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  Logger.info(`Server running on port ${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;