import { vi } from 'vitest';

/**
 * Mock Loader for @googlemaps/js-api-loader
 * Prevents real Google Maps script loading in tests
 */
export class Loader {
  constructor(public options: any) {}

  /**
   * Mock load method that returns mocked google.maps object
   */
  load = vi.fn().mockResolvedValue(
    // Return the global google object (defined in setupTests.ts)
    (global as any).google
  );
}

// Default export for compatibility
export default { Loader };


