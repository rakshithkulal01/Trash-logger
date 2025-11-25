import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Create a custom icon for landmarks
const landmarkIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface MangaloreLandmark {
  name: string;
  position: [number, number];
  description: string;
  type: 'landmark' | 'area' | 'beach' | 'commercial';
}

const mangaloreLandmarks: MangaloreLandmark[] = [
  {
    name: 'Mangalore City Center',
    position: [12.9141, 74.8560],
    description: 'Main city center and commercial hub',
    type: 'commercial'
  },
  {
    name: 'Panambur Beach',
    position: [12.9581, 74.7936],
    description: 'Popular beach destination',
    type: 'beach'
  },
  {
    name: 'Ullal Beach',
    position: [12.8058, 74.8603],
    description: 'Scenic beach area south of Mangalore',
    type: 'beach'
  },
  {
    name: 'Kadri Manjunath Temple',
    position: [12.9089, 74.8414],
    description: 'Historic temple and cultural landmark',
    type: 'landmark'
  },
  {
    name: 'Hampankatta',
    position: [12.8697, 74.8420],
    description: 'Central business district',
    type: 'commercial'
  },
  {
    name: 'Surathkal',
    position: [13.0067, 74.7939],
    description: 'Northern coastal area with NITK campus',
    type: 'area'
  },
  {
    name: 'Bunder',
    position: [12.8697, 74.8420],
    description: 'Port area and old town',
    type: 'commercial'
  },
  {
    name: 'Kankanady',
    position: [12.8833, 74.8833],
    description: 'Residential and commercial area',
    type: 'area'
  }
];

interface MangaloreOverlayProps {
  showLandmarks?: boolean;
}

const MangaloreOverlay: React.FC<MangaloreOverlayProps> = ({ 
  showLandmarks = false 
}) => {
  if (!showLandmarks) return null;

  return (
    <>
      {/* Area circles for major regions */}
      <Circle
        center={[12.9141, 74.8560]}
        radius={2000}
        pathOptions={{
          color: '#3498db',
          fillColor: '#3498db',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }}
      >
        <Popup>
          <strong>Mangalore City Center</strong>
          <br />
          Main urban area with commercial and residential zones
        </Popup>
      </Circle>

      <Circle
        center={[12.9581, 74.7936]}
        radius={1500}
        pathOptions={{
          color: '#e67e22',
          fillColor: '#e67e22',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }}
      >
        <Popup>
          <strong>Panambur Beach Area</strong>
          <br />
          Coastal region with beach activities and tourism
        </Popup>
      </Circle>

      {/* Landmark markers */}
      {mangaloreLandmarks.map((landmark, index) => (
        <Marker
          key={index}
          position={landmark.position}
          icon={landmarkIcon}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <strong>{landmark.name}</strong>
              <br />
              <em>{landmark.type.charAt(0).toUpperCase() + landmark.type.slice(1)}</em>
              <br />
              {landmark.description}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default MangaloreOverlay;