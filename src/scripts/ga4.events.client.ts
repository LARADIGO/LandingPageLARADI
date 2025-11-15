// Eventos personalizados para GA4: pricing_view, faq_open/close y clics en "Probar gratis".
type Props = Record<string, any>;
const gtagExists = () => typeof (window as any).gtag === 'function';
const dnt = navigator.doNotTrack === '1' || (window as any).doNotTrack === '1';

// Vista de la sección de precios cuando entra en viewport
(function setupPricingView() {
  if (dnt || !gtagExists()) return;
  const section = document.querySelector('#precios');
  if (!section) return;

  const seenKey = 'ga_pricing_seen_' + location.pathname;
  if (sessionStorage.getItem(seenKey)) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.35) {
        (window as any).gtag('event', 'pricing_view', {
          page_path: location.pathname,
          transport_type: 'beacon'
        });
        sessionStorage.setItem(seenKey, '1');
        io.disconnect();
        break;
      }
    }
  }, { threshold: [0.35] });
  io.observe(section);
})();

// FAQ: abrir/cerrar
(function setupFaqEvents() {
  if (dnt || !gtagExists()) return;
  const faqRoot = document.querySelector('.faq-section');
  if (!faqRoot) return;

  document.addEventListener('click', (ev) => {
    const summary = (ev.target as HTMLElement).closest('.faq-section details.faq-item summary') as HTMLElement | null;
    if (!summary) return;
    const details = summary.parentElement as HTMLDetailsElement;

    setTimeout(() => {
      const open = details.hasAttribute('open');
      const q = details.querySelector('.faq-question')?.textContent?.trim().slice(0, 120) || '';
      (window as any).gtag('event', open ? 'faq_open' : 'faq_close', {
        faq_id: details.id || '',
        question: q,
        index: Number(details.getAttribute('data-index') || -1),
        page_path: location.pathname,
        transport_type: 'beacon'
      });
    }, 20);
  }, { capture: true });
})();

// CTA "Probar gratis"
(function setupCtaClick() {
  if (dnt || !gtagExists()) return;

  document.addEventListener('click', (ev) => {
    const a = (ev.target as HTMLElement).closest('a[href="#contacto"], a[href="/#contacto"]') as HTMLAnchorElement | null;
    if (!a) return;

    const section = a.closest('section[id]') as HTMLElement | null;
    const from = section?.id || (a.closest('header, main, footer, section') as HTMLElement | null)?.tagName.toLowerCase() || 'unknown';
    const plan = a.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';

    let navigated = false;
    // Si en el futuro el enlace navegara fuera, podrías prevenir default y luego:
    // ev.preventDefault();
    // setTimeout(()=> location.href = a.href, 80);

    (window as any).gtag('event', 'cta_probar_gratis_click', {
      from,
      ...(plan ? { plan } : {}),
      link_text: (a.textContent || '').trim().slice(0, 64),
      page_path: location.pathname,
      transport_type: 'beacon',
      event_callback: () => { navigated = true; }
    });

    // Seguridad por si event_callback no se ejecuta (en caso de cambio futuro):
    // if (!navigated && a.href && !a.hash) {
    //   setTimeout(()=> location.href = a.href, 120);
    // }
  }, { capture: true });
})();

// Delegación genérica: data-analytics="nombre_evento"
(function setupDataAnalytics() {
  if (dnt || !gtagExists()) return;

  document.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest('[data-analytics]') as HTMLElement | null;
    if (!el) return;

    const name = el.getAttribute('data-analytics') || '';
    if (!name) return;

    let props: Props = {};
    try {
      const raw = el.getAttribute('data-analytics-props');
      if (raw) props = JSON.parse(raw);
    } catch {}

    if (!props['plan']) {
      const plan = el.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';
      if (plan) props['plan'] = plan;
    }

    (window as any).gtag('event', name, {
      ...props,
      page_path: location.pathname,
      transport_type: 'beacon'
    });
  }, { capture: true });
})();