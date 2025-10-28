# One Page con Astro

Landing estática "one page" con Astro, sin dependencias externas, ideal para desplegar en Netlify.

## Requisitos
- Node 18.17+ (o 20+)
- npm

## Desarrollo
```bash
npm install
npm run dev
```
La app se abrirá en http://localhost:4321

## Build
```bash
npm run build
npm run preview
```

## Estructura
- `src/pages/index.astro`: página principal con secciones (hero, características, sobre, demo, precios, FAQ, contacto).
- `src/layouts/BaseLayout.astro`: layout base, cabecera/nav y footer.
- `src/styles/global.css`: estilos globales, sin frameworks.
- `public/assets/*`: imágenes SVG de placeholder (cámbialas por tus capturas).
- `public/media/`: añade `demo.mp4` si quieres un video en la sección Demo.

## Despliegue en Netlify
1. Conecta el repo en Netlify → “Add new site” → “Import from Git”.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Añade tu dominio y SSL automático.

## Personalización rápida
- Cambia el título y descripción en `src/pages/index.astro` o pasando props al `BaseLayout`.
- Ajusta colores/espaciados en `src/styles/global.css`.
- Sustituye los SVGs en `public/assets/` por tus imágenes.
- Si necesitas formularios Netlify, el de Contacto ya está preparado con `data-netlify="true"`.