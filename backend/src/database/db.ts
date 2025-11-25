import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/trash.db');

let db: Database | null = null;

/**
 * SQL schema for trash_entries table with constraints and indexes
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS trash_entries (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    trash_type TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    photo_url TEXT,
    user_name TEXT,
    CHECK (latitude >= -90 AND latitude <= 90),
    CHECK (longitude >= -180 AND longitude <= 180),
    CHECK (trash_type IN ('plastic', 'glass', 'paper', 'bulky_item', 'hazardous', 'other'))
  );

  CREATE INDEX IF NOT EXISTS idx_timestamp ON trash_entries(timestamp);
  CREATE INDEX IF NOT EXISTS idx_trash_type ON trash_entries(trash_type);
  CREATE INDEX IF NOT EXISTS idx_location ON trash_entries(latitude, longitude);
`;

/**
 * Initialize the SQLite database connection
 * Creates the database file if it doesn't exist
 * Applies the schema and indexes
 */
export async function initDatabase(): Promise<Database> {
  try {
    const SQL = await initSqlJs();
    
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('Database loaded from:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }

    // Apply schema
    db.exec(SCHEMA);
    console.log('Database schema initialized');

    // Save to disk
    saveDatabase();

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the current database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save the current database state to disk
 */
export function saveDatabase(): void {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.error('Failed to save database:', error);
    throw new Error(`Database save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}
