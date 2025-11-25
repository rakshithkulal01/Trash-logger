import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// Fix for default marker icons in React-Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
  setPosition: (pos: [number, number]) => void;
}> = ({ onLocationSelect, setPosition }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      
      // Validate coordinates
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setPosition([lat, lng]);
        onLocationSelect(lat, lng);
      }
    },
  });

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
}) => {
  // Default to a central location if no initial location provided
  const defaultCenter: [number, number] = initialLocation
    ? [initialLocation.lat, initialLocation.lng]
    : [12.9141, 74.8560]; // Mangalore, Karnataka as default

  const [position, setPosition] = useState<[number, number]>(defaultCenter);
  const [manualLat, setManualLat] = useState(
    initialLocation?.lat.toString() || ''
  );
  const [manualLng, setManualLng] = useState(
    initialLocation?.lng.toString() || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (initialLocation) {
      setPosition([initialLocation.lat, initialLocation.lng]);
      setManualLat(initialLocation.lat.toString());
      setManualLng(initialLocation.lng.toString());
    }
  }, [initialLocation]);

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      
      // Validate coordinates
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setPosition([lat, lng]);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        onLocationSelect(lat, lng);
        setValidationError(null);
      }
    }
  };

  const handleManualInput = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      setValidationError('Please enter valid numbers for latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90) {
      setValidationError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setValidationError('Longitude must be between -180 and 180');
      return;
    }

    setValidationError(null);
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  return (
    <div className="location-picker">
      <div className="location-picker-instructions" id="location-picker-instructions">
        Click on the map or drag the marker to set your location
      </div>

      <div className="map-container" role="application" aria-label="Interactive map for selecting location" aria-describedby="location-picker-instructions">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={true}
          minZoom={11}
          maxZoom={18}
          maxBounds={[
            [12.7500, 74.7000], // Southwest corner (Ullal area)
            [13.1000, 75.0000]  // Northeast corner (Surathkal area)
          ]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={markerRef}
            aria-label="Draggable location marker"
          />
          <MapClickHandler
            onLocationSelect={onLocationSelect}
            setPosition={setPosition}
          />
        </MapContainer>
      </div>

      <div className="manual-coordinates">
        <div className="manual-coordinates-title" id="manual-coords-label">Or enter coordinates manually:</div>
        <div className="coordinate-inputs" role="group" aria-labelledby="manual-coords-label">
          <div className="coordinate-input-group">
            <label htmlFor="manual-lat">Latitude</label>
            <input
              id="manual-lat"
              type="number"
              step="any"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="-90 to 90"
              className={validationError && validationError.includes('Latitude') ? 'error' : ''}
              aria-invalid={validationError && validationError.includes('Latitude') ? 'true' : 'false'}
              aria-describedby={validationError ? 'location-validation-error' : undefined}
            />
          </div>
          <div className="coordinate-input-group">
            <label htmlFor="manual-lng">Longitude</label>
            <input
              id="manual-lng"
              type="number"
              step="any"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="-180 to 180"
              className={validationError && validationError.includes('Longitude') ? 'error' : ''}
              aria-invalid={validationError && validationError.includes('Longitude') ? 'true' : 'false'}
              aria-describedby={validationError ? 'location-validation-error' : undefined}
            />
          </div>
          <button
            type="button"
            className="btn-apply"
            onClick={handleManualInput}
            aria-label="Apply manually entered coordinates"
          >
            Apply
          </button>
        </div>
        {validationError && (
          <div className="validation-error" id="location-validation-error" role="alert">{validationError}</div>
        )}
      </div>

      <div className="current-location" role="status" aria-live="polite">
        <strong>Selected Location:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
      </div>
    </div>
  );
};

export default LocationPicker;
