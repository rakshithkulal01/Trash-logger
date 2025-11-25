import React from 'react';
import { Hotspot } from '../types';
import './HotspotsList.css';

interface HotspotsListProps {
  hotspots: Hotspot[];
}

const HotspotsList: React.FC<HotspotsListProps> = ({ hotspots }) => {
  // Show top 5 hotspots
  const topHotspots = hotspots.slice(0, 5);

  if (topHotspots.length === 0) {
    return (
      <div className="hotspots-list">
        <h3 className="hotspots-list-title">Top Hotspots</h3>
        <p className="hotspots-list-empty">No hotspots identified yet</p>
      </div>
    );
  }

  return (
    <div className="hotspots-list">
      <h3 className="hotspots-list-title">Top 5 Hotspots</h3>
      <div className="hotspots-list-items">
        {topHotspots.map((hotspot, index) => (
          <div key={index} className="hotspot-item">
            <div className="hotspot-rank">{index + 1}</div>
            <div className="hotspot-details">
              <div className="hotspot-location">
                <span className="hotspot-icon">📍</span>
                <span className="hotspot-coords">
                  {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                </span>
              </div>
              <div className="hotspot-stats">
                <span className="hotspot-count">{hotspot.count} items</span>
                <span className="hotspot-radius">
                  ~{Math.round(hotspot.radius)}m radius
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotspotsList;
