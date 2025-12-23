import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import MapContainer from '../components/MapContainer';
import { Loader } from '@googlemaps/js-api-loader';

// Mock the Loader (uses __mocks__/@googlemaps/js-api-loader.ts)
vi.mock('@googlemaps/js-api-loader');

describe('MapContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render map container element', () => {
    const { container } = render(<MapContainer />);
    
    // MapContainer should render a Box component (MUI)
    const mapDiv = container.querySelector('[class*="MuiBox"]');
    expect(mapDiv).toBeInTheDocument();
  });

  it('should call Loader.load() once', async () => {
    render(<MapContainer />);

    // Wait for Loader to be instantiated and load() to be called
    await waitFor(() => {
      // Check if Loader was instantiated
      expect(Loader).toHaveBeenCalled();
    });

    // Get the mock instance and verify load was called
    const loaderInstance = vi.mocked(Loader).mock.results[0]?.value;
    if (loaderInstance) {
      await waitFor(() => {
        expect(loaderInstance.load).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('should create Map instance when loaded', async () => {
    render(<MapContainer />);

    // Wait for google.maps.Map to be called
    await waitFor(() => {
      expect((global as any).google.maps.Map).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should create markers when provided', async () => {
    const markers = [
      { lat: 25.033, lng: 121.565, title: 'Marker 1' },
      { lat: 25.047, lng: 121.517, title: 'Marker 2' },
    ];

    render(<MapContainer markers={markers} />);

    // Wait for markers to be created
    await waitFor(() => {
      expect((global as any).google.maps.Marker).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  it('should handle empty markers array', async () => {
    render(<MapContainer markers={[]} />);

    // Map should be created even with no markers
    await waitFor(() => {
      expect((global as any).google.maps.Map).toHaveBeenCalled();
    });

    // No markers should be created
    expect((global as any).google.maps.Marker).not.toHaveBeenCalled();
  });

  it('should use VITE_GOOGLE_MAPS_JS_KEY from environment', () => {
    render(<MapContainer />);

    // Loader should be instantiated with API key from environment
    expect(Loader).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: expect.any(String),
      })
    );
  });
});

