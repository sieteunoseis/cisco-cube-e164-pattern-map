import sqlite3 from 'sqlite3';
import fs from 'fs';
import { ConnectionRecord, DatabaseError } from './types';
import { Logger } from './logger';

export class Database {
  private db: sqlite3.Database;
  private tableColumns: string[];

  constructor(dbPath: string, tableColumns: string[]) {
    this.tableColumns = tableColumns;
    
    // Ensure database directory exists
    const dbDir = './db';
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database connection
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        Logger.error('Failed to connect to database:', err);
        throw err;
      }
      Logger.info('Connected to SQLite database');
    });

    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Initialize patterns and logs tables
    this.initializePatternsTable();
    this.initializeLogsTable();
  }


  private initializePatternsTable(): void {
    // Check if patterns table exists
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='patterns'", (err, row) => {
      if (err) {
        Logger.error('Failed to check patterns table existence:', err);
        throw err;
      }

      if (!row) {
        // Patterns table doesn't exist, create it
        this.createPatternsTable();
      } else {
        // Table exists, check and migrate schema if needed
        this.migratePatternsSchema();
      }
    });
  }


  private createPatternsTable(): void {
    const createTableQuery = `
      CREATE TABLE patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${this.tableColumns.map(col => `${col} TEXT`).join(', ')},
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createTableQuery, (err) => {
      if (err) {
        Logger.error('Failed to create patterns table:', err);
        throw err;
      }
      Logger.info('Patterns table created with schema:', this.tableColumns);
    });
  }

  private migratePatternsSchema(): void {
    // Get current patterns table schema
    this.db.all("PRAGMA table_info(patterns)", (err, columns: any[]) => {
      if (err) {
        Logger.error('Failed to get patterns table info:', err);
        throw err;
      }

      const existingColumns = columns.map(col => col.name);
      const requiredColumns = ['id', ...this.tableColumns, 'created_at', 'updated_at'];
      
      // Check for missing columns
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        Logger.info('Missing columns detected in patterns table, adding:', missingColumns);
        this.addMissingColumnsToPatterns(missingColumns);
      } else {
        Logger.info('Patterns table schema is up to date');
      }
    });
  }

  private addMissingColumnsToPatterns(missingColumns: string[]): void {
    let completed = 0;
    const total = missingColumns.length;

    missingColumns.forEach(column => {
      let columnDef = 'TEXT';
      if (column === 'created_at' || column === 'updated_at') {
        columnDef = 'DATETIME DEFAULT CURRENT_TIMESTAMP';
      }

      const alterQuery = `ALTER TABLE patterns ADD COLUMN ${column} ${columnDef}`;
      
      this.db.run(alterQuery, (err) => {
        if (err) {
          Logger.error(`Failed to add column ${column} to patterns table:`, err);
        } else {
          Logger.info(`Added column ${column} to patterns table`);
        }
        
        completed++;
        if (completed === total) {
          Logger.info('Patterns table schema migration completed');
        }
      });
    });
  }

  private initializeLogsTable(): void {
    // Check if logs table exists
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='download_logs'", (err, row) => {
      if (err) {
        Logger.error('Failed to check logs table existence:', err);
        throw err;
      }

      if (!row) {
        // Logs table doesn't exist, create it
        this.createLogsTable();
      } else {
        Logger.info('Download logs table already exists');
      }
    });
  }

  private createLogsTable(): void {
    const createTableQuery = `
      CREATE TABLE download_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status INTEGER DEFAULT 200
      )
    `;

    this.db.run(createTableQuery, (err) => {
      if (err) {
        Logger.error('Failed to create download_logs table:', err);
        throw err;
      }
      Logger.info('Download logs table created successfully');
    });
  }

  getAllConnections(): Promise<ConnectionRecord[]> {
    return new Promise((resolve, reject) => {
      // Get all columns for patterns from patterns table
      const baseColumns = ['id', ...this.tableColumns];
      const query = `SELECT ${baseColumns.join(', ')} FROM patterns`;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          Logger.error('Failed to fetch patterns:', err);
          reject(err);
        } else {
          Logger.debug(`Retrieved ${rows.length} patterns`);
          resolve(rows as ConnectionRecord[]);
        }
      });
    });
  }

  getConnectionById(id: number): Promise<ConnectionRecord | null> {
    return new Promise((resolve, reject) => {
      // Get all columns for patterns from patterns table
      const baseColumns = ['id', ...this.tableColumns];
      const query = `SELECT ${baseColumns.join(', ')} FROM patterns WHERE id = ?`;
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          Logger.error('Failed to fetch pattern by ID:', err);
          reject(err);
        } else {
          Logger.debug(`Retrieved pattern with ID: ${id}`);
          resolve(row as ConnectionRecord || null);
        }
      });
    });
  }


  async createConnection(data: Omit<ConnectionRecord, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      // Get column values for the pattern data
      const columnValues = this.tableColumns.map(col => (data as any)[col] || null);

      const insertQuery = `
        INSERT INTO patterns (${this.tableColumns.join(', ')}) 
        VALUES (${this.tableColumns.map(() => '?').join(', ')})
      `;

      this.db.run(
        insertQuery,
        columnValues,
        function (err) {
          if (err) {
            Logger.error('Failed to create pattern:', err);
            reject(err);
          } else {
            Logger.info(`Created pattern with ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        }
      );
    });
  }

  updateConnection(id: number, data: Omit<ConnectionRecord, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get column values for the pattern data
      const columnValues = this.tableColumns.map(col => (data as any)[col] || null);
      const setClause = this.tableColumns.map(col => `${col} = ?`).join(', ');

      const updateQuery = `
        UPDATE patterns 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(
        updateQuery,
        [...columnValues, id],
        function (err) {
          if (err) {
            Logger.error('Failed to update pattern:', err);
            reject(err);
          } else {
            Logger.info(`Updated pattern with ID: ${id}`);
            resolve();
          }
        }
      );
    });
  }

  deleteConnection(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Delete the pattern from patterns table (no selection logic needed for patterns)
      this.db.run('DELETE FROM patterns WHERE id = ?', [id], (err) => {
        if (err) {
          Logger.error('Failed to delete pattern:', err);
          reject(err);
        } else {
          Logger.info(`Deleted pattern with ID: ${id}`);
          resolve();
        }
      });
    });
  }


  getPatternsByLabel(label: string): Promise<ConnectionRecord[]> {
    return new Promise((resolve, reject) => {
      const baseColumns = ['id', ...this.tableColumns];
      // Use LIKE with wildcards to find patterns that contain the label
      // This handles comma-separated labels: "label1,label2,label3"
      const query = `SELECT ${baseColumns.join(', ')} FROM patterns WHERE 
        label = ? OR 
        label LIKE ? OR 
        label LIKE ? OR 
        label LIKE ?`;
      
      const searchPatterns = [
        label,                    // exact match
        `${label},%`,            // starts with label,
        `%,${label},%`,          // contains ,label,
        `%,${label}`             // ends with ,label
      ];
      
      this.db.all(query, searchPatterns, (err, rows) => {
        if (err) {
          Logger.error('Failed to fetch patterns by label:', err);
          reject(err);
        } else {
          Logger.debug(`Retrieved ${rows ? rows.length : 0} patterns for label: ${label}`);
          resolve((rows as ConnectionRecord[]) || []);
        }
      });
    });
  }

  logDownload(label: string, ipAddress: string, userAgent?: string, status: number = 200): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO download_logs (label, ip_address, user_agent, status)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [label, ipAddress, userAgent || null, status], function(err) {
        if (err) {
          Logger.error('Failed to log download:', err);
          reject(err);
        } else {
          Logger.debug(`Logged download for label: ${label} from IP: ${ipAddress}`);
          resolve();
        }
      });
    });
  }

  getDownloadLogs(limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, label, ip_address, user_agent, timestamp, status
        FROM download_logs
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          Logger.error('Failed to fetch download logs:', err);
          reject(err);
        } else {
          Logger.debug(`Retrieved ${rows ? rows.length : 0} download logs`);
          resolve(rows || []);
        }
      });
    });
  }

  close(): void {
    this.db.close((err) => {
      if (err) {
        Logger.error('Failed to close database:', err);
      } else {
        Logger.info('Database connection closed');
      }
    });
  }
}