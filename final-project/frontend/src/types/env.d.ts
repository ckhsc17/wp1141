/// <reference types="vite/client" />
/// <reference types="google.maps" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_MAPS_JS_KEY: string;
  readonly VITE_PUSHER_KEY: string;
  readonly VITE_PUSHER_CLUSTER: string;
  readonly VITE_PUSHER_BEAMS_INSTANCE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


