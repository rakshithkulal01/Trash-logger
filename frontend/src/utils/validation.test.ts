import { describe, it, expect } from 'vitest';
import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateFileType,
  validateFileSize,
  validatePhotoFile,
} from './validation';

describe('Coordinate Validation', () => {
  describe('validateLatitude', () => {
    it('should accept valid latitude values', () => {
      expect(validateLatitude(0).isValid).toBe(true);
      expect(validateLatitude(45.5).isValid).toBe(true);
      expect(validateLatitude(-45.5).isValid).toBe(true);
      expect(validateLatitude(90).isValid).toBe(true);
      expect(validateLatitude(-90).isValid).toBe(true);
    });

    it('should reject latitude values outside valid range', () => {
      const result1 = validateLatitude(91);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Latitude must be between -90 and 90');

      const result2 = validateLatitude(-91);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Latitude must be between -90 and 90');
    });

    it('should reject empty or invalid latitude values', () => {
      const result1 = validateLatitude('');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Latitude is required');

      const result2 = validateLatitude('invalid');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Latitude must be a valid number');
    });
  });

  describe('validateLongitude', () => {
    it('should accept valid longitude values', () => {
      expect(validateLongitude(0).isValid).toBe(true);
      expect(validateLongitude(120.5).isValid).toBe(true);
      expect(validateLongitude(-120.5).isValid).toBe(true);
      expect(validateLongitude(180).isValid).toBe(true);
      expect(validateLongitude(-180).isValid).toBe(true);
    });

    it('should reject longitude values outside valid range', () => {
      const result1 = validateLongitude(181);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Longitude must be between -180 and 180');

      const result2 = validateLongitude(-181);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Longitude must be between -180 and 180');
    });

    it('should reject empty or invalid longitude values', () => {
      const result1 = validateLongitude('');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Longitude is required');

      const result2 = validateLongitude('invalid');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Longitude must be a valid number');
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinate pairs', () => {
      expect(validateCoordinates(45.5, 120.5).isValid).toBe(true);
      expect(validateCoordinates(0, 0).isValid).toBe(true);
      expect(validateCoordinates(-45.5, -120.5).isValid).toBe(true);
    });

    it('should reject invalid latitude in coordinate pair', () => {
      const result = validateCoordinates(91, 120);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Latitude must be between -90 and 90');
    });

    it('should reject invalid longitude in coordinate pair', () => {
      const result = validateCoordinates(45, 181);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Longitude must be between -180 and 180');
    });
  });
});

describe('File Validation', () => {
  describe('validateFileType', () => {
    it('should accept valid image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(validateFileType(jpegFile).isValid).toBe(true);

      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      expect(validateFileType(pngFile).isValid).toBe(true);

      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpg' });
      expect(validateFileType(jpgFile).isValid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const result = validateFileType(pdfFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Only JPEG and PNG images are allowed');

      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const result2 = validateFileType(gifFile);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Only JPEG and PNG images are allowed');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      // 1MB file
      const smallFile = new File([new ArrayBuffer(1024 * 1024)], 'small.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileSize(smallFile, 5).isValid).toBe(true);

      // Exactly 5MB file
      const exactFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'exact.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileSize(exactFile, 5).isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      // 6MB file (exceeds 5MB limit)
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFileSize(largeFile, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Photo size must be less than 5MB');
    });
  });

  describe('validatePhotoFile', () => {
    it('should accept valid photo files', () => {
      const validFile = new File([new ArrayBuffer(1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });
      expect(validatePhotoFile(validFile).isValid).toBe(true);
    });

    it('should reject files with invalid type', () => {
      const invalidFile = new File([new ArrayBuffer(1024)], 'doc.pdf', {
        type: 'application/pdf',
      });
      const result = validatePhotoFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Only JPEG and PNG images are allowed');
    });

    it('should reject files exceeding size limit', () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = validatePhotoFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Photo size must be less than 5MB');
    });
  });
});
