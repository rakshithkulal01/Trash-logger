import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { TrashEntry } from '../types';
import { createTrashIcon, getTrashTypeName } from '../utils/markerIcons';
import { getPhotoUrl } from '../services/api';
import MangaloreOverlay from './MangaloreOverlay';
import HotspotOverlay from './HotspotOverlay';
import './Map.css';

interface MapProps {
  entries: TrashEntry[];
  onMarkerClick?: (entry: TrashEntry) => void;
  center?: [number, number];
  zoom?: number;
  showLandmarks?: boolean;
  showHotspots?: boolean;
  showIndividualMarkers?: boolean; // New prop to control individual vs clustered markers
}

interface MarkerPopupProps {
  entry: TrashEntry;
  onPhotoClick: (photoUrl: string) => void;
}

const MarkerPopupContent: React.FC<MarkerPopupProps> = ({ entry, onPhotoClick }) => {
  const photoUrl = entry.photo_url ? getPhotoUrl(entry.photo_url) : null;

  return (
    <div className="marker-popup">
      <strong>{getTrashTypeName(entry.trash_type)}</strong>
      <p className="popup-timestamp">
        <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
      </p>
      {entry.user_name && <p className="popup-user">Logged by: {entry.user_name}</p>}
      {photoUrl && (
        <img 
          src={photoUrl} 
          alt={`Photo of ${getTrashTypeName(entry.trash_type)} trash logged on ${new Date(entry.timestamp).toLocaleDateString()}`}
          onClick={() => onPhotoClick(photoUrl)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPhotoClick(photoUrl);
            }
          }}
          title="Click to view full size"
          tabIndex={0}
          role="button"
        />
      )}
    </div>
  );
};

// Component to handle map updates when entries change
const MapUpdater: React.FC<{ entries: TrashEntry[] }> = ({ entries }) => {
  const map = useMap();

  useEffect(() => {
    // Define Mangalore region bounds (expanded area around Mangalore)
    const mangaloreBounds = L.latLngBounds(
      [12.7500, 74.7000], // Southwest corner (Ullal area)
      [13.1000, 75.0000]  // Northeast corner (Surathkal area)
    );

    // Set max bounds to keep focus on Mangalore region
    map.setMaxBounds(mangaloreBounds);
    map.setMinZoom(11); // Prevent zooming out too far from Mangalore
    map.setMaxZoom(18); // Allow detailed street-level view

    if (entries.length > 0) {
      // Calculate bounds to fit all markers, but constrain to Mangalore region
      const entryBounds = L.latLngBounds(
        entries.map(entry => [entry.latitude, entry.longitude] as [number, number])
      );
      
      // Use the intersection of entry bounds and Mangalore bounds
      const constrainedBounds = entryBounds.intersects(mangaloreBounds) 
        ? entryBounds 
        : mangaloreBounds;
      
      map.fitBounds(constrainedBounds, { 
        padding: [30, 30], 
        maxZoom: 16 // Good detail level for trash locations
      });
    } else {
      // If no entries, show the full Mangalore area
      map.fitBounds(mangaloreBounds, { padding: [20, 20] });
    }
  }, [entries, map]);

  return null;
};

const Map: React.FC<MapProps> = ({ 
  entries, 
  onMarkerClick,
  center = [12.9141, 74.8560], // Default to Mangalore, Karnataka
  zoom = 13, // Show Mangalore city view by default
  showLandmarks = false,
  showHotspots = true,
  showIndividualMarkers = false
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return entries.map((entry) => ({
      id: entry.id,
      position: [entry.latitude, entry.longitude] as [number, number],
      icon: createTrashIcon(entry.trash_type, showIndividualMarkers),
      entry,
    }));
  }, [entries, showIndividualMarkers]);

  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-map"
        ref={mapRef}
        scrollWheelZoom={true}
        touchZoom={true}
        dragging={true}
        zoomControl={true}
        aria-label={`Map showing ${entries.length} trash entries`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MangaloreOverlay showLandmarks={showLandmarks} />
        <HotspotOverlay entries={entries} showHotspots={showHotspots} />
        
        {showIndividualMarkers ? (
          // Individual markers - each trash item gets its own pin
          <>
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={marker.icon}
                eventHandlers={{
                  click: () => onMarkerClick?.(marker.entry)
                }}
                aria-label={`${getTrashTypeName(marker.entry.trash_type)} trash marker at ${marker.entry.latitude.toFixed(4)}, ${marker.entry.longitude.toFixed(4)}`}
              >
                <Popup>
                  <MarkerPopupContent entry={marker.entry} onPhotoClick={handlePhotoClick} />
                </Popup>
              </Marker>
            ))}
          </>
        ) : (
          // Clustered markers - groups nearby markers together
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
            removeOutsideVisibleBounds={true}
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                icon={marker.icon}
                eventHandlers={{
                  click: () => onMarkerClick?.(marker.entry)
                }}
                aria-label={`${getTrashTypeName(marker.entry.trash_type)} trash marker at ${marker.entry.latitude.toFixed(4)}, ${marker.entry.longitude.toFixed(4)}`}
              >
                <Popup>
                  <MarkerPopupContent entry={marker.entry} onPhotoClick={handlePhotoClick} />
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}

        <MapUpdater entries={entries} />
      </MapContainer>

      {/* Photo modal */}
      {selectedPhoto && (
        <div 
          className="photo-modal" 
          onClick={closePhotoModal}
          role="dialog"
          aria-modal="true"
          aria-label="Full size photo viewer"
        >
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="photo-modal-close" 
              onClick={closePhotoModal}
              aria-label="Close photo viewer"
            >
              <span aria-hidden="true">×</span>
            </button>
            <img src={selectedPhoto} alt="Full size trash photo" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
