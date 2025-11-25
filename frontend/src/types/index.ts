// Shared TypeScript interfaces for the application

export type TrashType = 
  | 'plastic' 
  | 'glass' 
  | 'paper' 
  | 'bulky_item' 
  | 'hazardous' 
  | 'other';

export interface TrashEntry {
  id: string;
  timestamp: string;
  trash_type: TrashType;
  latitude: number;
  longitude: number;
  photo_url?: string;
  user_name?: string;
}

export interface Hotspot {
  latitude: number;
  longitude: number;
  count: number;
  radius: number;
}

export interface Statistics {
  total_count: number;
  most_common_type: string;
  hotspots: Hotspot[];
  type_breakdown: Record<TrashType, number>;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
