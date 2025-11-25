import React, { useMemo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { TrashEntry } from '../types';

interface HotspotOverlayProps {
  entries: TrashEntry[];
  showHotspots?: boolean;
}

interface Hotspot {
  center: [number, number];
  count: number;
  radius: number;
  entries: TrashEntry[];
}

const HotspotOverlay: React.FC<HotspotOverlayProps> = ({ 
  entries, 
  showHotspots = true 
}) => {
  // Calculate hotspots based on entry clustering
  const hotspots = useMemo(() => {
    if (!showHotspots || entries.length === 0) return [];

    const clusters: Hotspot[] = [];
    const processed = new Set<string>();
    const clusterRadius = 0.005; // ~500m clustering radius

    entries.forEach(entry => {
      if (processed.has(entry.id)) return;

      // Find nearby entries
      const nearbyEntries = entries.filter(other => {
        if (processed.has(other.id)) return false;
        
        const distance = Math.sqrt(
          Math.pow(entry.latitude - other.latitude, 2) + 
          Math.pow(entry.longitude - other.longitude, 2)
        );
        
        return distance <= clusterRadius;
      });

      if (nearbyEntries.length >= 2) { // Only create hotspot if 2+ entries
        // Calculate center point
        const centerLat = nearbyEntries.reduce((sum, e) => sum + e.latitude, 0) / nearbyEntries.length;
        const centerLng = nearbyEntries.reduce((sum, e) => sum + e.longitude, 0) / nearbyEntries.length;
        
        // Calculate radius based on entry count (more entries = larger circle)
        const radius = Math.min(50 + (nearbyEntries.length * 10), 200);
        
        clusters.push({
          center: [centerLat, centerLng],
          count: nearbyEntries.length,
          radius,
          entries: nearbyEntries
        });

        // Mark entries as processed
        nearbyEntries.forEach(e => processed.add(e.id));
      }
    });

    return clusters;
  }, [entries, showHotspots]);

  if (!showHotspots || hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hotspot, index) => (
        <CircleMarker
          key={index}
          center={hotspot.center}
          radius={hotspot.radius}
          pathOptions={{
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.3,
            weight: 2,
            opacity: 0.8
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px' }}>
              <strong>🔥 Trash Hotspot</strong>
              <br />
              <strong>{hotspot.count} items</strong> logged in this area
              <br />
              <br />
              <strong>Types found:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {Object.entries(
                  hotspot.entries.reduce((acc, entry) => {
                    acc[entry.trash_type] = (acc[entry.trash_type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <li key={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: {count}
                  </li>
                ))}
              </ul>
              <br />
              <em>This area needs attention!</em>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

export default HotspotOverlay;