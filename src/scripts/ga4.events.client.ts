// GA4 eventos personalizados adaptados a tu sitio (Astro + Amplify)
// - pricing_view al entrar #precios en viewport
// - faq_open / faq_close sobre <details> del bloque FAQ (selectores robustos)
// - clics en "Probar gratis" (#contacto) con origen y plan si aplica
// - delegación genérica data-analytics / data-analytics-props
// - tracking de enlaces outbound (opcional y seguro)
//
// Notas:
// - Respeta Do Not Track del navegador (no envía nada si DNT=1).
// - Es tolerante si gtag aún no está disponible: las IIFE verifican gtag antes de disparar.
// - No requiere export; se ejecuta al cargar el bundle en el navegador.

type Props = Record<string, any>;

const hasGTAG = () => typeof (window as any).gtag === 'function';
const DNT = (() => {
  try {
    // dnt: '1' (FF/Edge/IE); window.doNotTrack algunos navegadores antiguos
    return navigator.doNotTrack === '1' || (window as any).doNotTrack === '1';
  } catch { return false; }
})();

function sendEvent(name: string, props: Props = {}) {
  try {
    if (DNT || !hasGTAG()) return;
    (window as any).gtag('event', name, {
      ...props,
      page_path: location.pathname,
      transport_type: 'beacon'
    });
  } catch {}
}

/* pricing_view al ver la sección de precios */
(function setupPricingView() {
  try {
    if (DNT || !hasGTAG()) return;
    const section = document.querySelector('#precios');
    if (!section) return;

    const seenKey = 'ga_pricing_seen_' + location.pathname;
    if (sessionStorage.getItem(seenKey)) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting && (e.intersectionRatio ?? 0) >= 0.35) {
            sendEvent('pricing_view');
            sessionStorage.setItem(seenKey, '1');
            io.disconnect();
            break;
          }
        }
      }, { threshold: [0.35] });
      io.observe(section);
    } else {
      // Fallback sin IO
      setTimeout(() => {
        sendEvent('pricing_view');
        sessionStorage.setItem(seenKey, '1');
      }, 1000);
    }
  } catch {}
})();

/* FAQ: abrir/cerrar (selectores robustos) */
(function setupFaqEvents() {
  try {
    if (DNT || !hasGTAG()) return;

    // Intentamos localizar el contenedor FAQ por varias pistas
    const faqRoot =
      document.querySelector('.faq-section') ||
      document.querySelector('[data-faq-root]') ||
      document.querySelector('#faq') ||
      document.querySelector('[id*="faq"]');

    if (!faqRoot) return;

    document.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      // Cualquier <summary> dentro de <details> en el bloque FAQ
      const summary = target.closest('details summary') as HTMLElement | null;
      if (!summary) return;

      // Asegurar que el <details> pertenece al bloque FAQ
      const details = summary.closest('details');
      if (!details || !faqRoot.contains(details)) return;

      // Espera a que el navegador toggle el atributo open
      setTimeout(() => {
        const isOpen = details.hasAttribute('open');
        // Buscar el texto de la pregunta
        const q =
          (details.querySelector('.faq-question')?.textContent ??
            summary.textContent ??
            '')
            .toString()
            .trim()
            .slice(0, 120);

        // Índice aproximado: posición del details dentro del root
        const all = Array.from(faqRoot.querySelectorAll('details'));
        const index = Math.max(0, all.indexOf(details));

        sendEvent(isOpen ? 'faq_open' : 'faq_close', {
          faq_id: (details as HTMLElement).id || '',
          question: q,
          index
        });
      }, 20);
    }, { capture: true });
  } catch {}
})();

/* CTA "Probar gratis" (#contacto) */
(function setupCtaClick() {
  try {
    if (DNT || !hasGTAG()) return;

    document.addEventListener('click', (ev) => {
      const a = (ev.target as HTMLElement | null)?.closest?.(
        'a[href="#contacto"], a[href="/#contacto"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;

      const section =
        a.closest('section[id]') as HTMLElement | null;
      const from =
        section?.id ||
        (a.closest('header, main, footer, section') as HTMLElement | null)?.tagName.toLowerCase() ||
        'unknown';

      const plan =
        a.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';

      // Dispara el evento; no bloqueamos la navegación intra-página
      sendEvent('cta_probar_gratis_click', {
        from,
        ...(plan ? { plan } : {}),
        link_text: (a.textContent || '').trim().slice(0, 64)
      });
    }, { capture: true });
  } catch {}
})();

/* Delegación genérica: data-analytics="nombre_evento" */
(function setupDataAnalytics() {
  try {
    if (DNT || !hasGTAG()) return;

    document.addEventListener('click', (ev) => {
      const el = (ev.target as HTMLElement | null)?.closest?.('[data-analytics]') as HTMLElement | null;
      if (!el) return;

      const name = el.getAttribute('data-analytics') || '';
      if (!name) return;

      let props: Props = {};
      try {
        const raw = el.getAttribute('data-analytics-props');
        if (raw) props = JSON.parse(raw);
      } catch {}

      // Si no viene plan, intenta inferirlo desde una .pricing-card
      if (!props['plan']) {
        const plan = el.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';
        if (plan) props['plan'] = plan;
      }

      sendEvent(name, props);
    }, { capture: true });
  } catch {}
})();

/* (Opcional) Outbound links tracking básico */
(function setupOutbound() {
  try {
    if (DNT || !hasGTAG()) return;

    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="http"]') as HTMLAnchorElement | null;
      if (!a) return;

      const url = a.href;
      const sameOrigin = (() => {
        try { return new URL(url).origin === location.origin; } catch { return true; }
      })();
      if (sameOrigin) return;

      sendEvent('outbound_click', { url });
    }, { capture: true });
  } catch {}
})();