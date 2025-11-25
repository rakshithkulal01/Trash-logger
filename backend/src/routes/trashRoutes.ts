import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createTrashEntry, getTrashEntries, getStatistics } from '../services/trashRepository';
import { validateTrashEntryInput, TrashType } from '../models/TrashEntry';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for photo uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../data/photos');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent path traversal and conflicts
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Only allow JPEG and PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

/**
 * POST /api/trash
 * Create a new trash entry
 */
router.post('/trash', upload.single('photo'), (req: Request, res: Response) => {
  try {
    // Parse request body
    const { trash_type, latitude, longitude, user_name } = req.body;

    // Convert string coordinates to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate input
    const validation = validateTrashEntryInput({
      trash_type,
      latitude: lat,
      longitude: lng
    });

    if (!validation.isValid) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: validation.error
        }
      });
    }

    // Build photo URL if file was uploaded
    let photo_url: string | undefined;
    if (req.file) {
      photo_url = `/photos/${req.file.filename}`;
    }

    // Create trash entry
    const entry = createTrashEntry({
      trash_type: trash_type as TrashType,
      latitude: lat,
      longitude: lng,
      photo_url,
      user_name: user_name || undefined
    });

    res.status(201).json(entry);
  } catch (error) {
    logger.error('Error creating trash entry', {
      error: error instanceof Error ? error.message : error,
      trash_type: req.body.trash_type,
      hasPhoto: !!req.file
    });
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting file after failed upload', {
          error: unlinkError instanceof Error ? unlinkError.message : unlinkError,
          filename: req.file.filename
        });
      }
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create trash entry'
      }
    });
  }
});

/**
 * GET /api/trash
 * Retrieve trash entries with optional filtering
 */
router.get('/trash', (req: Request, res: Response) => {
  try {
    const { start_date, end_date, trash_type, page = '1', limit = '100' } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (start_date && typeof start_date === 'string') {
      filter.start_date = start_date;
    }
    
    if (end_date && typeof end_date === 'string') {
      filter.end_date = end_date;
    }
    
    if (trash_type && typeof trash_type === 'string') {
      filter.trash_type = trash_type as TrashType;
    }

    // Get all entries matching filter
    const allEntries = getTrashEntries(filter);
    const total = allEntries.length;

    // Apply pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 100;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const entries = allEntries.slice(startIndex, endIndex);

    res.json({
      entries,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    logger.error('Error fetching trash entries', {
      error: error instanceof Error ? error.message : error,
      filter: req.query
    });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch trash entries'
      }
    });
  }
});

/**
 * GET /api/stats
 * Get aggregated statistics for trash entries
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (start_date && typeof start_date === 'string') {
      filter.start_date = start_date;
    }
    
    if (end_date && typeof end_date === 'string') {
      filter.end_date = end_date;
    }

    // Get statistics
    const stats = getStatistics(filter);

    res.json(stats);
  } catch (error) {
    logger.error('Error calculating statistics', {
      error: error instanceof Error ? error.message : error,
      filter: req.query
    });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to calculate statistics'
      }
    });
  }
});

/**
 * GET /api/photos/:filename
 * Serve uploaded photo files
 */
router.get('/photos/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent path traversal attacks
    // Only allow alphanumeric, hyphens, underscores, and file extensions
    const safeFilenameRegex = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png)$/i;
    
    if (!safeFilenameRegex.test(filename)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILENAME',
          message: 'Invalid filename format'
        }
      });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Photo not found'
        }
      });
    }

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    logger.error('Error serving photo', {
      error: error instanceof Error ? error.message : error,
      filename: req.params.filename
    });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to serve photo'
      }
    });
  }
});

export default router;
