// GA4 eventos personalizados (ampliado)
(function(){
  const gtag = window.gtag || function(){};
  const DNT = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if(DNT) return;

  function send(name, props){
    try {
      gtag('event', name, {
        page_path: location.pathname,
        page_title: document.title || '',
        transport_type: 'beacon',
        ...props
      });
    } catch {}
  }

  // pricing_view (una vez por sesión)
  (function(){
    const section = document.querySelector('#precios');
    if(!section) return;
    const key = 'ga_pricing_seen_' + location.pathname;
    if(sessionStorage.getItem(key)) return;
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting && (e.intersectionRatio||0)>=0.35){
            send('pricing_view',{});
            sessionStorage.setItem(key,'1');
            io.disconnect();
          }
        });
      }, {threshold:[0.35]});
      io.observe(section);
    } else {
      setTimeout(()=>{ send('pricing_view',{}); sessionStorage.setItem(key,'1'); },1200);
    }
  })();

  // FAQ open/close
  (function(){
    const faqRoot = document.querySelector('.faq-section');
    if(!faqRoot) return;
    document.addEventListener('click', (ev)=>{
      const summary = ev.target.closest?.('details summary');
      if(!summary) return;
      const details = summary.parentElement;
      if(!details || !faqRoot.contains(details)) return;
      setTimeout(()=>{
        const open = details.hasAttribute('open');
        const q = (details.querySelector('.faq-question')?.textContent || '').trim().slice(0,120);
        const all = Array.from(faqRoot.querySelectorAll('details'));
        const index = Math.max(0, all.indexOf(details));
        send(open?'faq_open':'faq_close',{ question:q, faq_id:details.id||'', index });
      },30);
    }, {capture:true});
  })();

  // Expand/collapse all
  (function(){
    document.addEventListener('click',(ev)=>{
      if(ev.target.closest('.faq-expand-all')) send('faq_expand_all',{});
      if(ev.target.closest('.faq-collapse-all')) send('faq_collapse_all',{});
    }, {capture:true});
  })();

  // CTA probar gratis
  (function(){
    document.addEventListener('click',(ev)=>{
      const a = ev.target.closest?.('a[href="#contacto"], a[href="/#contacto"]');
      if(!a) return;
      const section = a.closest('section[id]');
      const from = section?.id || (a.closest('header, main, footer, section')?.tagName.toLowerCase()) || 'unknown';
      const plan = a.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';
      send('cta_probar_gratis_click',{
        from,
        link_text:(a.textContent||'').trim().slice(0,64),
        ...(plan?{plan}:{})
      });
    }, {capture:true});
  })();

  // Delegación genérica data-analytics
  (function(){
    document.addEventListener('click',(ev)=>{
      const el = ev.target.closest?.('[data-analytics]');
      if(!el) return;
      const name = el.getAttribute('data-analytics') || '';
      if(!name) return;
      let props = {};
      try {
        const raw = el.getAttribute('data-analytics-props');
        if(raw) props = JSON.parse(raw);
      } catch {}
      if(!props.plan){
        const plan = el.closest('.pricing-card')?.querySelector('h3')?.textContent?.trim() || '';
        if(plan) props.plan = plan;
      }
      send(name, props);
    }, {capture:true});
  })();

  // outbound links
  (function(){
    document.addEventListener('click',(e)=>{
      const a = e.target.closest?.('a[href^="http"]');
      if(!a) return;
      try {
        const url = new URL(a.href);
        if(url.origin === location.origin) return;
        send('outbound_click',{ url:a.href });
      } catch {}
    }, {capture:true});
  })();

  console.log('[ga4] Inicializado');
})();