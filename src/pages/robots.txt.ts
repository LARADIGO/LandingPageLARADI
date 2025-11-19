export const prerender = true;

export function GET({ request }: { request: Request }) {
  const origin = (import.meta as any).env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const sitemap = `${origin.replace(/\/$/, '')}/sitemap.xml`;
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}