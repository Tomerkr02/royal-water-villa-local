/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_DEVICE_PROVIDER?: 'tuya' | 'home-assistant' | 'cloud' | 'mock';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
