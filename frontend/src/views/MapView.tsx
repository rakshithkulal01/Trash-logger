import React, { useState, useEffect, useMemo } from 'react';
import Map from '../components/Map';
import DateRangePicker from '../components/DateRangePicker';
import SkeletonLoader from '../components/SkeletonLoader';
import ErrorMessage from '../components/ErrorMessage';
import { TrashEntry } from '../types';
import { getTrashEntries } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useNotification } from '../context/NotificationContext';
import { getFriendlyErrorMessage } from '../utils/errorMessages';
import './Views.css';

const MapView: React.FC = () => {
  const { entries: contextEntries, setEntries } = useAppContext();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [showIndividualMarkers, setShowIndividualMarkers] = useState(true); // Default to individual markers

  useEffect(() => {
    loadEntries();
  }, [startDate, endDate]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: { start_date?: string; end_date?: string } = {};
      
      if (startDate) {
        filters.start_date = startDate;
      }
      if (endDate) {
        // Add time to end date to include the entire day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filters.end_date = endDateTime.toISOString();
      }

      const data = await getTrashEntries(filters);
      setEntries(data.entries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trash entries';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleMarkerClick = (entry: TrashEntry) => {
    console.log('Marker clicked:', entry);
  };

  // Calculate filtered entries count
  const totalEntries = contextEntries.length;
  const displayText = useMemo(() => {
    if (startDate || endDate) {
      return `Showing ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}`;
    }
    return `Showing all ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}`;
  }, [totalEntries, startDate, endDate]);

  return (
    <div className="view-container map-view-container">
      <h2 className="view-title">Mangalore Trash Map</h2>
      <div className="view-content map-view-content">
        <div className="map-controls">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          
          <div className="map-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showIndividualMarkers}
                onChange={(e) => setShowIndividualMarkers(e.target.checked)}
              />
              <span>📍 Show Individual Pin Points</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
              />
              <span>🏛️ Show Mangalore Landmarks</span>
            </label>
          </div>
        </div>
        
        {loading && <SkeletonLoader type="map" />}
        {error && (
          <ErrorMessage
            title="Failed to Load Map"
            message={getFriendlyErrorMessage(error).message}
            onRetry={loadEntries}
            retryLabel="Reload Map"
          />
        )}
        {!loading && !error && (
          <>
            <div className="map-info">
              <span className="entry-count">{displayText}</span>
              <span className="region-info">📍 Focused on Mangalore, Karnataka</span>
              {showIndividualMarkers && (
                <span className="marker-mode-info">📍 Individual pin points active</span>
              )}
            </div>
            <Map 
              entries={contextEntries} 
              onMarkerClick={handleMarkerClick}
              showLandmarks={showLandmarks}
              showHotspots={true}
              showIndividualMarkers={showIndividualMarkers}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MapView;
