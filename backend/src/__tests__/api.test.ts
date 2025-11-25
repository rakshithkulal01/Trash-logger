import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from '../database/db';
import { createApp } from '../app';
import { TrashType } from '../models/TrashEntry';

const TEST_DB_PATH = path.join(__dirname, '../../data/test-trash.db');
const TEST_UPLOAD_DIR = path.join(__dirname, '../../data/test-photos');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;
process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;

let app: any;

beforeAll(async () => {
  // Ensure test directories exist
  const testDataDir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  if (!fs.existsSync(TEST_UPLOAD_DIR)) {
    fs.mkdirSync(TEST_UPLOAD_DIR, { recursive: true });
  }

  // Initialize test database
  await initDatabase();
  
  // Create app instance
  app = createApp();
});

afterAll(() => {
  // Clean up test database and photos
  closeDatabase();
  
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  
  if (fs.existsSync(TEST_UPLOAD_DIR)) {
    const files = fs.readdirSync(TEST_UPLOAD_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(TEST_UPLOAD_DIR, file));
    });
    fs.rmdirSync(TEST_UPLOAD_DIR);
  }
});

describe('POST /api/trash', () => {
  it('should create a trash entry with valid data', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PLASTIC,
        latitude: 40.7128,
        longitude: -74.0060,
        user_name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.trash_type).toBe(TrashType.PLASTIC);
    expect(response.body.latitude).toBe(40.7128);
    expect(response.body.longitude).toBe(-74.0060);
    expect(response.body.user_name).toBe('Test User');
  });

  it('should create an anonymous trash entry without user_name', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.GLASS,
        latitude: 34.0522,
        longitude: -118.2437
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_name).toBeUndefined();
  });

  it('should reject trash entry with missing trash_type', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        latitude: 40.7128,
        longitude: -74.0060
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toContain('trash_type');
  });

  it('should reject trash entry with invalid trash_type', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: 'invalid_type',
        latitude: 40.7128,
        longitude: -74.0060
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  it('should reject trash entry with missing latitude', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PAPER,
        longitude: -74.0060
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toContain('latitude');
  });

  it('should reject trash entry with invalid latitude', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PAPER,
        latitude: 95,
        longitude: -74.0060
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toContain('latitude');
  });

  it('should reject trash entry with invalid longitude', async () => {
    const response = await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PAPER,
        latitude: 40.7128,
        longitude: -200
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toContain('longitude');
  });
});

describe('POST /api/trash with photo upload', () => {
  it('should create trash entry with photo upload', async () => {
    // Create a test image buffer
    const testImageBuffer = Buffer.from('fake-image-data');
    
    const response = await request(app)
      .post('/api/trash')
      .field('trash_type', TrashType.BULKY_ITEM)
      .field('latitude', '51.5074')
      .field('longitude', '-0.1278')
      .field('user_name', 'Photo User')
      .attach('photo', testImageBuffer, 'test.jpg');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('photo_url');
    expect(response.body.photo_url).toMatch(/^\/photos\/.+\.jpg$/);
  });

  it('should reject photo upload with invalid file type', async () => {
    const testFileBuffer = Buffer.from('fake-file-data');
    
    const response = await request(app)
      .post('/api/trash')
      .field('trash_type', TrashType.HAZARDOUS)
      .field('latitude', '48.8566')
      .field('longitude', '2.3522')
      .attach('photo', testFileBuffer, 'test.txt');

    expect(response.status).toBe(500);
  });
});

describe('GET /api/trash', () => {
  beforeAll(async () => {
    // Create test entries
    await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PLASTIC,
        latitude: 40.7128,
        longitude: -74.0060,
        user_name: 'User 1'
      });

    await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.GLASS,
        latitude: 34.0522,
        longitude: -118.2437,
        user_name: 'User 2'
      });

    await request(app)
      .post('/api/trash')
      .send({
        trash_type: TrashType.PLASTIC,
        latitude: 51.5074,
        longitude: -0.1278,
        user_name: 'User 3'
      });
  });

  it('should retrieve all trash entries', async () => {
    const response = await request(app)
      .get('/api/trash');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('entries');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.entries)).toBe(true);
    expect(response.body.entries.length).toBeGreaterThan(0);
  });

  it('should filter trash entries by trash_type', async () => {
    const response = await request(app)
      .get('/api/trash')
      .query({ trash_type: TrashType.PLASTIC });

    expect(response.status).toBe(200);
    expect(response.body.entries.length).toBeGreaterThan(0);
    response.body.entries.forEach((entry: any) => {
      expect(entry.trash_type).toBe(TrashType.PLASTIC);
    });
  });

  it('should filter trash entries by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const response = await request(app)
      .get('/api/trash')
      .query({
        start_date: yesterday.toISOString(),
        end_date: tomorrow.toISOString()
      });

    expect(response.status).toBe(200);
    expect(response.body.entries.length).toBeGreaterThan(0);
  });

  it('should return empty array when no entries match filter', async () => {
    const futureDate = new Date('2099-01-01').toISOString();
    
    const response = await request(app)
      .get('/api/trash')
      .query({
        start_date: futureDate
      });

    expect(response.status).toBe(200);
    expect(response.body.entries).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should support pagination', async () => {
    const response = await request(app)
      .get('/api/trash')
      .query({ page: 1, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
    expect(response.body).toHaveProperty('totalPages');
    expect(response.body.entries.length).toBeLessThanOrEqual(2);
  });
});

describe('GET /api/stats', () => {
  it('should return statistics for all trash entries', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_count');
    expect(response.body).toHaveProperty('most_common_type');
    expect(response.body).toHaveProperty('hotspots');
    expect(response.body).toHaveProperty('type_breakdown');
    expect(response.body).toHaveProperty('date_range');
    expect(typeof response.body.total_count).toBe('number');
    expect(Array.isArray(response.body.hotspots)).toBe(true);
  });

  it('should filter statistics by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const response = await request(app)
      .get('/api/stats')
      .query({
        start_date: yesterday.toISOString(),
        end_date: tomorrow.toISOString()
      });

    expect(response.status).toBe(200);
    expect(response.body.total_count).toBeGreaterThan(0);
  });

  it('should return zero count for future date range', async () => {
    const futureDate = new Date('2099-01-01').toISOString();
    
    const response = await request(app)
      .get('/api/stats')
      .query({
        start_date: futureDate
      });

    expect(response.status).toBe(200);
    expect(response.body.total_count).toBe(0);
  });

  it('should calculate most common trash type correctly', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.status).toBe(200);
    expect(response.body.most_common_type).toBe(TrashType.PLASTIC);
  });

  it('should include type breakdown', async () => {
    const response = await request(app)
      .get('/api/stats');

    expect(response.status).toBe(200);
    expect(response.body.type_breakdown).toHaveProperty(TrashType.PLASTIC);
    expect(typeof response.body.type_breakdown[TrashType.PLASTIC]).toBe('number');
  });
});

describe('GET /api/photos/:filename', () => {
  let photoFilename: string;

  beforeAll(async () => {
    // Create a test photo entry
    const testImageBuffer = Buffer.from('test-photo-data');
    
    const response = await request(app)
      .post('/api/trash')
      .field('trash_type', TrashType.OTHER)
      .field('latitude', '35.6762')
      .field('longitude', '139.6503')
      .attach('photo', testImageBuffer, 'photo-test.jpg');

    photoFilename = response.body.photo_url.split('/').pop();
  });

  it('should serve uploaded photo', async () => {
    const response = await request(app)
      .get(`/api/photos/${photoFilename}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/image/);
  });

  it('should return 404 for non-existent photo', async () => {
    const response = await request(app)
      .get('/api/photos/non-existent-photo.jpg');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('FILE_NOT_FOUND');
  });

  it('should reject invalid filename format', async () => {
    const response = await request(app)
      .get('/api/photos/invalid-file.txt');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_FILENAME');
  });
});

describe('GET /health', () => {
  it('should return health status with system metrics', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
    expect(response.body.memory).toHaveProperty('heapUsed');
    expect(response.body.memory).toHaveProperty('heapTotal');
    expect(response.body.memory).toHaveProperty('rss');
    expect(response.body).toHaveProperty('environment');
    expect(response.body.environment).toBe('test');
  });
});
