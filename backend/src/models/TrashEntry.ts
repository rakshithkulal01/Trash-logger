/**
 * Enum for all supported trash types
 */
export enum TrashType {
  PLASTIC = 'plastic',
  GLASS = 'glass',
  PAPER = 'paper',
  BULKY_ITEM = 'bulky_item',
  HAZARDOUS = 'hazardous',
  OTHER = 'other'
}

/**
 * Interface for a trash entry record
 */
export interface TrashEntry {
  id: string;                    // UUID
  timestamp: string;             // ISO 8601 format
  trash_type: TrashType;
  latitude: number;              // -90 to 90
  longitude: number;             // -180 to 180
  photo_url?: string;            // Relative URL to photo
  user_name?: string;            // Optional, null for anonymous
}

/**
 * Interface for creating a new trash entry (without id and timestamp)
 */
export interface CreateTrashEntryInput {
  trash_type: TrashType;
  latitude: number;
  longitude: number;
  photo_url?: string;
  user_name?: string;
}

/**
 * Validate if a string is a valid TrashType
 */
export function isValidTrashType(type: string): type is TrashType {
  return Object.values(TrashType).includes(type as TrashType);
}

/**
 * Validate latitude coordinate
 * @param lat - Latitude value to validate
 * @returns true if latitude is valid (-90 to 90)
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude coordinate
 * @param lng - Longitude value to validate
 * @returns true if longitude is valid (-180 to 180)
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validate coordinates (both latitude and longitude)
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns true if both coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Validate a complete trash entry input
 * @param input - The trash entry input to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateTrashEntryInput(input: any): { isValid: boolean; error?: string } {
  if (!input.trash_type) {
    return { isValid: false, error: 'trash_type is required' };
  }

  if (!isValidTrashType(input.trash_type)) {
    return { isValid: false, error: `Invalid trash_type. Must be one of: ${Object.values(TrashType).join(', ')}` };
  }

  if (input.latitude === undefined || input.latitude === null) {
    return { isValid: false, error: 'latitude is required' };
  }

  if (input.longitude === undefined || input.longitude === null) {
    return { isValid: false, error: 'longitude is required' };
  }

  if (!isValidLatitude(input.latitude)) {
    return { isValid: false, error: 'latitude must be between -90 and 90' };
  }

  if (!isValidLongitude(input.longitude)) {
    return { isValid: false, error: 'longitude must be between -180 and 180' };
  }

  return { isValid: true };
}
