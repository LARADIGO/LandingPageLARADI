// Animaciones de características (extraído del inline original)
(() => {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const list = document.querySelector('[data-features]');
  if (!list || prefersReduce) return;

  const items = Array.from(list.querySelectorAll('.feature-item'));

  const featureClassMap = {
    cobros: 'fx-cobros',
    facturas: 'fx-facturas',
    informes: 'fx-informes',
    inventario: 'fx-inventario',
    arqueo: 'fx-arqueo',
    empleados: 'fx-empleados',
    verifactu: 'fx-verifactu',
    clientes: 'fx-clientes'
  };

  const runFeature = (el) => {
    const f = el.dataset.feature;
    const cls = featureClassMap[f];
    if (!cls) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (!el.classList.contains('revealed')) {
        el.classList.add('revealed');
        runFeature(el);
      }
      io.unobserve(el);
    });
  }, { threshold: .35, rootMargin: '0px 0px -5% 0px' });

  items.forEach(it => io.observe(it));

  items.forEach(el => {
    const trigger = () => runFeature(el);
    el.addEventListener('mouseenter', trigger);
    el.addEventListener('focus', trigger);
    el.addEventListener('click', trigger);
    el.addEventListener('touchstart', trigger, { passive: true });
  });

  // Detección de multilínea en móvil
  let resizeT;
  const markMultilines = () => {
    items.forEach(it => {
      const title = it.querySelector('.feature-title');
      if (!title) return;
      const cs = getComputedStyle(title);
      let lh = parseFloat(cs.lineHeight);
      if (Number.isNaN(lh)) {
        const fs = parseFloat(cs.fontSize) || 14;
        lh = fs * 1.2;
      }
      const sh = title.scrollHeight;
      if (sh > lh * 1.6) {
        it.classList.add('is-multiline');
      } else {
        it.classList.remove('is-multiline');
      }
    });
  };
  const scheduleMark = () => requestAnimationFrame(markMultilines);
  scheduleMark();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(markMultilines).catch(() => {});
  }
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(markMultilines, 120);
  }, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(markMultilines, 150), { passive: true });
})();