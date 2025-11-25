import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { submitTrashEntry, getTrashEntries, getStatistics } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('API Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('submitTrashEntry', () => {
    it('should submit valid trash entry successfully', async () => {
      const mockResponse = {
        id: '123',
        timestamp: '2024-01-01T00:00:00Z',
        trash_type: 'plastic',
        latitude: 45.5,
        longitude: -122.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await submitTrashEntry({
        trash_type: 'plastic',
        latitude: 45.5,
        longitude: -122.5,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle submission with photo', async () => {
      const mockResponse = {
        id: '123',
        timestamp: '2024-01-01T00:00:00Z',
        trash_type: 'plastic',
        latitude: 45.5,
        longitude: -122.5,
        photo_url: '/photos/test.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const photo = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await submitTrashEntry({
        trash_type: 'plastic',
        latitude: 45.5,
        longitude: -122.5,
        photo,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        submitTrashEntry({
          trash_type: 'plastic',
          latitude: 45.5,
          longitude: -122.5,
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid trash type',
          },
        }),
      });

      await expect(
        submitTrashEntry({
          trash_type: 'invalid',
          latitude: 45.5,
          longitude: -122.5,
        })
      ).rejects.toThrow('Invalid trash type');
    });
  });

  describe('getTrashEntries', () => {
    it('should fetch entries successfully', async () => {
      const mockResponse = {
        entries: [
          {
            id: '1',
            timestamp: '2024-01-01T00:00:00Z',
            trash_type: 'plastic',
            latitude: 45.5,
            longitude: -122.5,
          },
        ],
        total: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getTrashEntries();
      expect(result).toEqual(mockResponse);
    });

    it('should handle network failures with retry', async () => {
      // Fail twice, succeed on third attempt
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ entries: [], total: 0 }),
        });

      const result = await getTrashEntries();
      expect(result).toEqual({ entries: [], total: 0 });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getTrashEntries()).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStatistics', () => {
    it('should fetch statistics successfully', async () => {
      const mockResponse = {
        total_count: 10,
        most_common_type: 'plastic',
        hotspots: [],
        type_breakdown: { plastic: 5, glass: 3, paper: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStatistics();
      expect(result).toEqual(mockResponse);
    });

    it('should handle date range filters', async () => {
      const mockResponse = {
        total_count: 5,
        most_common_type: 'plastic',
        hotspots: [],
        type_breakdown: { plastic: 3, glass: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStatistics({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('start_date=2024-01-01');
      expect(callUrl).toContain('end_date=2024-01-31');
    });
  });
});
