import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from '../database/db';
import { TrashEntry, CreateTrashEntryInput, TrashType } from '../models/TrashEntry';

/**
 * Interface for filtering trash entries
 */
export interface TrashEntryFilter {
  start_date?: string;
  end_date?: string;
  trash_type?: TrashType;
}

/**
 * Interface for statistics response
 */
export interface Statistics {
  total_count: number;
  most_common_type: string;
  hotspots: Hotspot[];
  type_breakdown: Record<string, number>;
  date_range: {
    start: string;
    end: string;
  };
}

/**
 * Interface for hotspot data
 */
export interface Hotspot {
  latitude: number;
  longitude: number;
  count: number;
  radius: number;  // in meters
}

/**
 * Create a new trash entry in the database
 * @param input - The trash entry data
 * @returns The created trash entry with generated id and timestamp
 */
export function createTrashEntry(input: CreateTrashEntryInput): TrashEntry {
  const db = getDatabase();
  
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  
  const entry: TrashEntry = {
    id,
    timestamp,
    trash_type: input.trash_type,
    latitude: input.latitude,
    longitude: input.longitude,
    photo_url: input.photo_url,
    user_name: input.user_name
  };

  try {
    // Use parameterized query to prevent SQL injection
    db.run(
      `INSERT INTO trash_entries (id, timestamp, trash_type, latitude, longitude, photo_url, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, timestamp, entry.trash_type, entry.latitude, entry.longitude, entry.photo_url || null, entry.user_name || null]
    );

    // Save database to disk
    saveDatabase();

    return entry;
  } catch (error) {
    console.error('Error creating trash entry:', error);
    throw new Error(`Failed to create trash entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get trash entries with optional filtering
 * @param filter - Optional filter criteria
 * @returns Array of trash entries
 */
export function getTrashEntries(filter?: TrashEntryFilter): TrashEntry[] {
  const db = getDatabase();
  
  let query = 'SELECT * FROM trash_entries WHERE 1=1';
  const params: any[] = [];

  if (filter?.start_date) {
    query += ' AND timestamp >= ?';
    params.push(filter.start_date);
  }

  if (filter?.end_date) {
    query += ' AND timestamp <= ?';
    params.push(filter.end_date);
  }

  if (filter?.trash_type) {
    query += ' AND trash_type = ?';
    params.push(filter.trash_type);
  }

  query += ' ORDER BY timestamp DESC';

  try {
    const result = db.exec(query, params);
    
    if (result.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    return values.map(row => {
      const entry: any = {};
      columns.forEach((col, index) => {
        entry[col] = row[index];
      });
      return entry as TrashEntry;
    });
  } catch (error) {
    console.error('Error fetching trash entries:', error);
    throw new Error(`Failed to fetch trash entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a single trash entry by ID
 * @param id - The trash entry ID
 * @returns The trash entry or null if not found
 */
export function getTrashEntryById(id: string): TrashEntry | null {
  const db = getDatabase();

  try {
    const result = db.exec('SELECT * FROM trash_entries WHERE id = ?', [id]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const columns = result[0].columns;
    const row = result[0].values[0];

    const entry: any = {};
    columns.forEach((col, index) => {
      entry[col] = row[index];
    });

    return entry as TrashEntry;
  } catch (error) {
    console.error('Error fetching trash entry by ID:', error);
    throw new Error(`Failed to fetch trash entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get aggregated statistics for trash entries
 * @param filter - Optional filter criteria
 * @returns Statistics object with counts, types, and hotspots
 */
export function getStatistics(filter?: TrashEntryFilter): Statistics {
  const db = getDatabase();
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (filter?.start_date) {
    whereClause += ' AND timestamp >= ?';
    params.push(filter.start_date);
  }

  if (filter?.end_date) {
    whereClause += ' AND timestamp <= ?';
    params.push(filter.end_date);
  }

  try {
    // Get total count
    const countResult = db.exec(`SELECT COUNT(*) as total FROM trash_entries ${whereClause}`, params);
    const total_count = countResult[0]?.values[0]?.[0] as number || 0;

    // Get type breakdown and most common type
    const typeResult = db.exec(
      `SELECT trash_type, COUNT(*) as count 
       FROM trash_entries ${whereClause}
       GROUP BY trash_type 
       ORDER BY count DESC`,
      params
    );

    const type_breakdown: Record<string, number> = {};
    let most_common_type = '';
    let maxCount = 0;

    if (typeResult.length > 0) {
      typeResult[0].values.forEach(row => {
        const type = row[0] as string;
        const count = row[1] as number;
        type_breakdown[type] = count;
        
        if (count > maxCount) {
          maxCount = count;
          most_common_type = type;
        }
      });
    }

    // Get hotspots using geographic clustering
    const hotspots = calculateHotspots(filter);

    // Determine date range
    const dateRangeResult = db.exec(
      `SELECT MIN(timestamp) as start, MAX(timestamp) as end 
       FROM trash_entries ${whereClause}`,
      params
    );

    const start = dateRangeResult[0]?.values[0]?.[0] as string || new Date().toISOString();
    const end = dateRangeResult[0]?.values[0]?.[1] as string || new Date().toISOString();

    return {
      total_count,
      most_common_type,
      hotspots,
      type_breakdown,
      date_range: { start, end }
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw new Error(`Failed to calculate statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate hotspots using simple geographic clustering
 * Groups entries within 0.01 degrees (~1km) of each other
 */
function calculateHotspots(filter?: TrashEntryFilter): Hotspot[] {
  const entries = getTrashEntries(filter);
  
  if (entries.length === 0) {
    return [];
  }

  const CLUSTER_THRESHOLD = 0.01; // ~1km in degrees
  const clusters: Map<string, { lat: number; lng: number; count: number }> = new Map();

  entries.forEach(entry => {
    // Round coordinates to create cluster keys
    const clusterLat = Math.round(entry.latitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
    const clusterLng = Math.round(entry.longitude / CLUSTER_THRESHOLD) * CLUSTER_THRESHOLD;
    const key = `${clusterLat},${clusterLng}`;

    if (clusters.has(key)) {
      const cluster = clusters.get(key)!;
      cluster.count++;
      // Update average position
      cluster.lat = (cluster.lat * (cluster.count - 1) + entry.latitude) / cluster.count;
      cluster.lng = (cluster.lng * (cluster.count - 1) + entry.longitude) / cluster.count;
    } else {
      clusters.set(key, {
        lat: entry.latitude,
        lng: entry.longitude,
        count: 1
      });
    }
  });

  // Convert to hotspots array and sort by count
  const hotspots: Hotspot[] = Array.from(clusters.values())
    .map(cluster => ({
      latitude: cluster.lat,
      longitude: cluster.lng,
      count: cluster.count,
      radius: 1000 // 1km radius
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 hotspots

  return hotspots;
}
