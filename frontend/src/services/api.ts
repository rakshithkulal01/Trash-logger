import { TrashEntry, Statistics, ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate exponential backoff delay
const getRetryDelay = (attempt: number): number => {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
};

// Fetch wrapper with error handling and retry logic
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          code: errorData.error?.code || `HTTP_${response.status}`,
          message: errorData.error?.message || response.statusText,
          details: errorData.error?.details,
        };
        throw new Error(apiError.message);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === retries - 1) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await sleep(getRetryDelay(attempt));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// Submit a new trash entry with retry logic
export async function submitTrashEntry(
  data: {
    trash_type: string;
    latitude: number;
    longitude: number;
    photo?: File;
    user_name?: string;
  },
  onProgress?: (progress: number) => void
): Promise<TrashEntry> {
  const formData = new FormData();
  formData.append('trash_type', data.trash_type);
  formData.append('latitude', data.latitude.toString());
  formData.append('longitude', data.longitude.toString());
  
  if (data.photo) {
    formData.append('photo', data.photo);
  }
  
  if (data.user_name) {
    formData.append('user_name', data.user_name);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const xhr = new XMLHttpRequest();
      
      const promise = new Promise<TrashEntry>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error?.message || 'Failed to submit trash entry'));
            } catch (e) {
              reject(new Error(`Request failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Request was aborted'));
        });

        xhr.open('POST', `${API_BASE_URL}/trash`);
        xhr.send(formData);
      });

      return await promise;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await sleep(getRetryDelay(attempt));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// Get trash entries with optional filters
export async function getTrashEntries(filters?: {
  start_date?: string;
  end_date?: string;
  trash_type?: string;
}): Promise<{ entries: TrashEntry[]; total: number }> {
  const params = new URLSearchParams();
  
  if (filters?.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters?.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters?.trash_type) {
    params.append('trash_type', filters.trash_type);
  }

  const url = `${API_BASE_URL}/trash${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchWithRetry<{ entries: TrashEntry[]; total: number }>(url);
}

// Get statistics with optional date range
export async function getStatistics(filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<Statistics> {
  const params = new URLSearchParams();
  
  if (filters?.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters?.end_date) {
    params.append('end_date', filters.end_date);
  }

  const url = `${API_BASE_URL}/stats${params.toString() ? `?${params.toString()}` : ''}`;
  return fetchWithRetry<Statistics>(url);
}

// Get photo URL
export function getPhotoUrl(filename: string): string {
  return `${API_BASE_URL}/photos/${filename}`;
}
