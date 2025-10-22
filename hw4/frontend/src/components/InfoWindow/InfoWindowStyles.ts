import { CSSProperties } from 'react';

/**
 * Shared styling constants for InfoWindow components
 */
export const INFO_WINDOW_STYLES = {
  container: {
    position: 'absolute' as const,
    bottom: '50px',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'auto' as const,
    minWidth: '300px',
    maxWidth: '90vw',
    overflow: 'visible' as const
  },
  
  card: {
    backgroundColor: 'white',
    position: 'relative' as const,
    border: '2px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    width: '100%',
    overflow: 'visible' as const
  },
  
  arrowBorder: {
    position: 'absolute' as const,
    bottom: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    borderTop: '12px solid #dee2e6',
    zIndex: 1
  },
  
  arrow: {
    position: 'absolute' as const,
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '10px solid #ffffff',
    zIndex: 2
  },
  
  closeButton: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      backgroundColor: 'rgba(248, 249, 250, 1)'
    }
  }
} as const;

/**
 * Generate InfoWindow container style
 */
export const getInfoWindowContainerStyle = (customStyles?: Partial<CSSProperties>): CSSProperties => ({
  ...INFO_WINDOW_STYLES.container,
  ...customStyles
});

/**
 * Generate InfoWindow card style
 */
export const getInfoWindowCardStyle = (customStyles?: Partial<CSSProperties>): CSSProperties => ({
  ...INFO_WINDOW_STYLES.card,
  ...customStyles
});
