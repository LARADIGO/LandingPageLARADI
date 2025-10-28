# POS Landing (Astro + Netlify)

Sitio estático ultra rápido para presentar tu software POS. Construido con [Astro](https://astro.build). Soporta islas React donde haga falta.

## Requisitos
- Node 18.17+ (o 20+)
- npm

## Desarrollo local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Estructura
- `src/pages`: páginas (`.astro`), generan rutas estáticas.
- `src/layouts`: layouts compartidos.
- `src/components`: componentes (incluye ejemplo React).
- `public`: estáticos (favicon, media). Pon tus imágenes en `public/assets/` y videos en `public/media/`.

## Optimización de medios
- Imágenes: exporta a `jpg/webp` y tamaños razonables (1200–1600px). Usa `loading="lazy"`.
- Video: comprime a 720p (~2–5 Mbps). Si esperas mucho tráfico o videos largos, considera YouTube/Vimeo para streaming.
- Evita subir binarios muy grandes al repo. Alternativas: Git LFS o almacenamiento externo.

## Despliegue en Netlify
1. Crea el sitio en Netlify: “Add new site” → “Import from Git”.
2. Selecciona este repo.
3. Build command: `npm run build` — Publish directory: `dist`.
4. Dominio: añade tu dominio y configura DNS. SSL se emite automáticamente.

## Personalización rápida
- Cambia `site` en `astro.config.mjs`.
- Edita textos en `src/pages/index.astro`.
- Sustituye imágenes de `public/assets/` y video en `public/media/`.
