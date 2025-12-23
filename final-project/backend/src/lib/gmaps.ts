import { Client } from '@googlemaps/google-maps-services-js';

// Validate environment variable (skip in test mode)
if (process.env.NODE_ENV !== 'test' && !process.env.GOOGLE_MAPS_SERVER_KEY) {
  console.error('❌ GOOGLE_MAPS_SERVER_KEY is not set in environment variables');
  console.error('   Please add it to your .env file');
  process.exit(1);
}

/**
 * Google Maps Services client instance
 */
export const gmapsClient = new Client({});

/**
 * Google Maps API key from environment
 */
export const GMAPS_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || '';


