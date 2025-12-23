import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;
let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsLoader(): Loader {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  return loaderInstance;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (!loadPromise) {
    loadPromise = getGoogleMapsLoader().load();
  }
  return loadPromise;
}

