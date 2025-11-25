import React, { useState, useEffect } from 'react';
import { Statistics, DateRange, TrashEntry } from '../types';
import { getStatistics, getTrashEntries } from '../services/api';
import StatCard from '../components/StatCard';
import TypeBreakdown from '../components/TypeBreakdown';
import HotspotsList from '../components/HotspotsList';
import DateRangePicker from '../components/DateRangePicker';
import Map from '../components/Map';
import SkeletonLoader from '../components/SkeletonLoader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { generateReportPDF, formatDateForFilename } from '../utils/pdfExport';
import { useNotification } from '../context/NotificationContext';
import { getFriendlyErrorMessage } from '../utils/errorMessages';
import './Views.css';
import './ReportView.css';

const TRASH_TYPE_LABELS: Record<string, string> = {
  plastic: 'Plastic',
  glass: 'Glass',
  paper: 'Paper',
  bulky_item: 'Bulky Item',
  hazardous: 'Hazardous',
  other: 'Other',
};

const ReportView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [entries, setEntries] = useState<TrashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchData = async (range?: DateRange) => {
    setLoading(true);
    setError(null);
    
    try {
      const filters = range ? {
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
      } : undefined;

      // Fetch both statistics and entries in parallel
      const [stats, entriesData] = await Promise.all([
        getStatistics(filters),
        getTrashEntries(filters)
      ]);

      setStatistics(stats);
      setEntries(entriesData.entries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Parse query parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start');
    const endParam = params.get('end');
    
    if (startParam && endParam) {
      try {
        const start = new Date(startParam);
        const end = new Date(endParam);
        
        // Validate dates
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          setDateRange({ start, end });
        }
      } catch (err) {
        console.error('Failed to parse date parameters:', err);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange || undefined);
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange | null) => {
    setDateRange(range);
    
    // Update URL with query parameters
    if (range) {
      const params = new URLSearchParams();
      params.set('start', range.start.toISOString());
      params.set('end', range.end.toISOString());
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const getMostCommonTypeLabel = (type: string): string => {
    return TRASH_TYPE_LABELS[type] || type;
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    
    try {
      // Generate filename based on date range
      let filename = 'trash-report';
      if (dateRange) {
        const startStr = formatDateForFilename(dateRange.start);
        const endStr = formatDateForFilename(dateRange.end);
        filename = `trash-report-${startStr}-to-${endStr}.pdf`;
      } else {
        filename = `trash-report-${formatDateForFilename(new Date())}.pdf`;
      }

      await generateReportPDF('report-content', {
        filename,
        dateRange: dateRange || undefined,
      });
      showSuccess('PDF exported successfully!');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showError('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      let url = window.location.origin + window.location.pathname;
      
      // Add query parameters if date range is set
      if (dateRange) {
        const params = new URLSearchParams();
        params.set('start', dateRange.start.toISOString());
        params.set('end', dateRange.end.toISOString());
        url += `?${params.toString()}`;
      }
      
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      showSuccess('Link copied to clipboard!');
      
      // Reset the success message after 3 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      showError('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className="view-container">
      <div className="report-header">
        <h2 className="view-title">Report Dashboard</h2>
        <div className="report-header-actions">
          <DateRangePicker 
            onDateRangeChange={(start, end) => {
              if (start && end) {
                handleDateRangeChange({ start: new Date(start), end: new Date(end) });
              } else {
                handleDateRangeChange(null);
              }
            }}
          />
          <button 
            className="export-pdf-button"
            onClick={handleExportPDF}
            disabled={loading || exportingPDF || !statistics}
          >
            {exportingPDF ? (
              <>
                <span className="button-spinner"></span>
                Generating...
              </>
            ) : (
              '📄 Export PDF'
            )}
          </button>
          <button 
            className="copy-link-button"
            onClick={handleCopyLink}
            disabled={loading || !statistics}
          >
            {linkCopied ? '✓ Link Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="report-loading">
          <LoadingSpinner size="large" message="Loading statistics..." />
          <div className="stats-grid">
            <SkeletonLoader type="stat" count={2} />
          </div>
          <SkeletonLoader type="map" />
        </div>
      )}

      {error && (
        <ErrorMessage
          title="Failed to Load Report"
          message={getFriendlyErrorMessage(error).message}
          onRetry={() => fetchData(dateRange || undefined)}
          retryLabel="Reload Report"
        />
      )}

      {!loading && !error && statistics && (
        <div className="report-content" id="report-content">
          <div className="stats-grid">
            <StatCard
              title="Total Items"
              value={statistics.total_count}
              icon="🗑️"
              subtitle="Logged trash entries"
            />
            <StatCard
              title="Most Common Type"
              value={getMostCommonTypeLabel(statistics.most_common_type)}
              icon="📊"
              subtitle="Most frequently logged"
            />
          </div>

          <div className="report-map-section">
            <h3 className="section-title">Trash Distribution Map & Hotspots</h3>
            <div className="report-map-container">
              <Map 
                entries={entries} 
                showHotspots={true}
                showLandmarks={false}
                showIndividualMarkers={true}
              />
            </div>
            <div className="map-legends">
              <p className="map-legend">
                📍 Each pin shows the exact location of a logged trash item
              </p>
              <p className="map-legend">
                🔴 Red circles indicate trash hotspots - areas with high concentration of logged items
              </p>
            </div>
          </div>

          <div className="stats-details">
            <TypeBreakdown breakdown={statistics.type_breakdown} />
            <HotspotsList hotspots={statistics.hotspots} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
