import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://your-domain.com', // cámbialo cuando tengas dominio
  build: {
    inlineStylesheets: 'auto'
  }
});