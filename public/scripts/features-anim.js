// Secuenciación SOLO de las animaciones específicas (fx-*); el fade aparece simultáneo.
(() => {
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const list = document.querySelector('[data-features]');
  if (!list) return;

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

  const FX_GAP_MS = 240;     // separación entre animaciones específicas
  const FIRST_FX_DELAY = 0;  // primer item arranca sin espera extra (puedes poner 80ms si quieres)
  const threshold = 0.30;
  const rootMargin = '0px 0px -6% 0px';

  const runFeature = (el) => {
    const f = el.dataset.feature;
    const cls = featureClassMap[f];
    if (!cls) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  function revealAllNow() {
    items.forEach(it => {
      if (!it.classList.contains('revealed')) {
        it.classList.add('revealed');
      }
    });
  }

  function sequenceFX() {
    let delay = FIRST_FX_DELAY;
    items.forEach(it => {
      // asignar variable CSS para usarla en animation-delay
      it.style.setProperty('--fx-seq-delay', delay + 'ms');
      if (!prefersReduce) {
        setTimeout(() => runFeature(it), delay);
      } else {
        // reduce motion: dispara inmediatamente
        runFeature(it);
      }
      delay += FX_GAP_MS;
    });
  }

  // Si se carga ya visible (arriba), iniciar directamente
  const containerVisible = () => {
    const r = list.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };

  if (prefersReduce) {
    revealAllNow();
    sequenceFX();
    return;
  }

  if (containerVisible()) {
    revealAllNow();
    sequenceFX();
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          revealAllNow();
          sequenceFX();
          io.disconnect();
        }
      });
    }, { threshold, rootMargin });
    io.observe(list);
  }

  // Re-disparo manual (hover/focus/click/touch) mantiene la misma fx sin cambiar secuencia
  items.forEach(el => {
    const trigger = () => runFeature(el);
    el.addEventListener('mouseenter', trigger);
    el.addEventListener('focus', trigger);
    el.addEventListener('click', trigger);
    el.addEventListener('touchstart', trigger, { passive:true });
  });

  // Multilínea en móvil (igual que antes)
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
  requestAnimationFrame(markMultilines);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(markMultilines).catch(()=>{});
  }
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(markMultilines, 120);
  }, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(markMultilines, 150), { passive:true });
})();