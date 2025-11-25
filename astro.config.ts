import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://https://tepeuve.es', // cámbialo cuando tengas dominio
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: false, // usamos nuestros estilos base
    }),
  ],
});