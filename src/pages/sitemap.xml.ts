export const prerender = true;

const pages = [
  '/',          // Home
  '/politica-privacidad',
  '/aviso-legal',
  '/terminos',
];

function makeXml(urls: string[], origin: string) {
  const lastmod = new Date().toISOString();
  const rows = urls.map((u) => {
    const loc = `${origin.replace(/\/$/, '')}${u}`;
    const priority = u === '/' ? '1.0' : '0.7';
    return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows}</urlset>`;
}

export async function GET({ request }: { request: Request }) {
  const origin = (import.meta as any).env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const body = makeXml(pages, origin);
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}