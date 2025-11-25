import L from 'leaflet';
import { TrashType } from '../types';

// Color scheme for different trash types
const trashTypeColors: Record<TrashType, string> = {
  plastic: '#3B82F6',      // Blue
  glass: '#10B981',        // Green
  paper: '#F59E0B',        // Amber
  bulky_item: '#8B5CF6',   // Purple
  hazardous: '#EF4444',    // Red
  other: '#6B7280',        // Gray
};

// Create custom marker icon for each trash type
export const createTrashIcon = (trashType: TrashType, isIndividual: boolean = false): L.DivIcon => {
  const color = trashTypeColors[trashType];
  const size = isIndividual ? 36 : 30; // Larger for individual markers
  const iconSize = isIndividual ? 20 : 16; // Larger emoji for individual markers
  
  return L.divIcon({
    className: `custom-trash-marker ${isIndividual ? 'individual-marker' : 'clustered-marker'}`,
    html: `
      <div class="marker-pin" style="background-color: ${color}; width: ${size}px; height: ${size}px; margin: -${size/2}px 0 0 -${size/2}px;">
        <div class="marker-icon" style="font-size: ${iconSize}px;">${getTrashEmoji(trashType)}</div>
      </div>
      <div class="marker-shadow" style="width: ${size * 0.7}px; height: ${size * 0.7}px; margin-left: -${size * 0.35}px;"></div>
    `,
    iconSize: [size, size + 12],
    iconAnchor: [size/2, size + 12],
    popupAnchor: [0, -(size + 12)],
  });
};

// Get emoji representation for trash type
const getTrashEmoji = (trashType: TrashType): string => {
  const emojiMap: Record<TrashType, string> = {
    plastic: '🥤',
    glass: '🍾',
    paper: '📄',
    bulky_item: '🛋️',
    hazardous: '☢️',
    other: '🗑️',
  };
  return emojiMap[trashType];
};

// Get color for trash type (useful for clustering)
export const getTrashTypeColor = (trashType: TrashType): string => {
  return trashTypeColors[trashType];
};

// Get display name for trash type
export const getTrashTypeName = (trashType: TrashType): string => {
  return trashType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};
