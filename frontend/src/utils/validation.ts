// Validation utilities for form inputs

export interface CoordinateValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates latitude coordinate
 * @param lat - Latitude value to validate
 * @returns Validation result with error message if invalid
 */
export function validateLatitude(lat: number | string): CoordinateValidationResult {
  if (lat === '' || lat === null || lat === undefined) {
    return { isValid: false, error: 'Latitude is required' };
  }

  const latNum = Number(lat);
  
  if (isNaN(latNum)) {
    return { isValid: false, error: 'Latitude must be a valid number' };
  }

  if (latNum < -90 || latNum > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  return { isValid: true };
}

/**
 * Validates longitude coordinate
 * @param lng - Longitude value to validate
 * @returns Validation result with error message if invalid
 */
export function validateLongitude(lng: number | string): CoordinateValidationResult {
  if (lng === '' || lng === null || lng === undefined) {
    return { isValid: false, error: 'Longitude is required' };
  }

  const lngNum = Number(lng);
  
  if (isNaN(lngNum)) {
    return { isValid: false, error: 'Longitude must be a valid number' };
  }

  if (lngNum < -180 || lngNum > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true };
}

/**
 * Validates coordinates (latitude and longitude)
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns Validation result with error message if invalid
 */
export function validateCoordinates(
  lat: number | string,
  lng: number | string
): CoordinateValidationResult {
  const latResult = validateLatitude(lat);
  if (!latResult.isValid) {
    return latResult;
  }

  const lngResult = validateLongitude(lng);
  if (!lngResult.isValid) {
    return lngResult;
  }

  return { isValid: true };
}

/**
 * Validates file type for photo uploads
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileType(file: File): FileValidationResult {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  
  if (!validTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Only JPEG and PNG images are allowed' 
    };
  }

  return { isValid: true };
}

/**
 * Validates file size for photo uploads
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(
  file: File, 
  maxSizeMB: number = 5
): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `Photo size must be less than ${maxSizeMB}MB` 
    };
  }

  return { isValid: true };
}

/**
 * Validates photo file (type and size)
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Validation result with error message if invalid
 */
export function validatePhotoFile(
  file: File,
  maxSizeMB: number = 5
): FileValidationResult {
  const typeResult = validateFileType(file);
  if (!typeResult.isValid) {
    return typeResult;
  }

  const sizeResult = validateFileSize(file, maxSizeMB);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  return { isValid: true };
}
