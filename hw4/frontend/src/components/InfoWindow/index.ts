/**
 * InfoWindow components and utilities
 */

export { LocationInfoWindow } from './LocationInfoWindow';
export { 
  INFO_WINDOW_STYLES, 
  getInfoWindowContainerStyle, 
  getInfoWindowCardStyle 
} from './InfoWindowStyles';
export type { LocationInfoWindowProps } from './LocationInfoWindow';

// Re-export for backwards compatibility if needed
export * from './LocationInfoWindow';
export * from './InfoWindowStyles';
