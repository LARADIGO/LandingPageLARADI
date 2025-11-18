// Versión estable: valida en cliente, usa fetch si hay endpoint,
// y mantiene fallback nativo. NO elimina el action del <form>.
(function(){
  const form = document.getElementById('contact-form');
  if(!form){ console.warn('[contact] Form no encontrado'); return; }

  const statusEl = document.getElementById('contact-status');
  const submitBtn = form.querySelector('[data-contact-submit]');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function getEndpoint(){
    const env = (window.CONTACT_ENDPOINT || '').trim();
    const act = (form.getAttribute('action') || '').trim();
    const ep = env || act || '';
    console.log('[contact] Endpoint actual:', ep || '(vacío)', '| env:', env || '(vacío)', '| action:', act || '(vacío)');
    return ep;
  }

  function setStatus(msg,type){
    if(!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
  }
  function scrollToForm(){
    const sec = document.getElementById('contacto');
    try { sec && sec.scrollIntoView({ behavior:'smooth', block:'center' }); } catch {}
  }
  function setLoading(on){
    if(!submitBtn) return;
    if(on){
      if(!submitBtn.dataset.original) submitBtn.dataset.original = submitBtn.innerHTML;
      submitBtn.classList.add('is-loading');
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando...';
      submitBtn.setAttribute('disabled','true');
      submitBtn.setAttribute('aria-busy','true');
    } else {
      submitBtn.classList.remove('is-loading');
      submitBtn.innerHTML = submitBtn.dataset.original || 'Enviar';
      submitBtn.removeAttribute('disabled');
      submitBtn.removeAttribute('aria-busy');
    }
  }

  form.addEventListener('submit', async (ev) => {
    // Deja que el navegador bloquee si algo no es válido (required/pattern/type=email)
    if (!form.checkValidity()) {
      ev.preventDefault();
      form.reportValidity();
      setStatus('Revisa los campos resaltados.', 'error');
      scrollToForm();
      return;
    }

    ev.preventDefault(); // Vamos a decidir fetch vs nativo

    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const hp = (fd.get('hp_field')||'').toString().trim();

    setStatus('', '');

    // Honeypot
    if(hp){
      setStatus('Enviado.', 'success');
      form.reset();
      return;
    }

    // Validación adicional
    if(!name || !email || !message){
      setStatus('Rellena todos los campos.', 'error');
      scrollToForm();
      return;
    }
    if(!EMAIL_REGEX.test(email)){
      setStatus('El email no parece válido.', 'error');
      form.querySelector('input[name="email"]')?.focus();
      scrollToForm();
      return;
    }

    const ENDPOINT = getEndpoint();

    // Si NO tenemos endpoint, dejamos que el submit nativo se encargue (fallback)
    if(!ENDPOINT){
      console.warn('[contact] Sin endpoint: envío nativo (action).');
      form.removeEventListener('submit', arguments.callee); // no reinterceptar
      form.submit();
      return;
    }

    // Envío por fetch (JSON)
    setStatus('Enviando...','loading');
    setLoading(true);

    try {
      const payload = { name, email, message, url: location.href, ua: navigator.userAgent };
      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        mode:'cors',
        credentials:'omit'
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if(!res.ok){
        setStatus((data && data.message) || 'Error interno. Inténtalo más tarde.', 'error');
        scrollToForm();
        return;
      }

      if(data && data.ok){
        setStatus('Enviado. Redirigiendo...','success');
        setTimeout(()=> { location.href = '/gracias'; }, 450);
        form.reset();
      } else {
        setStatus((data && data.message) || 'Error al enviar.', 'error');
        scrollToForm();
      }
    } catch (err){
      console.error('[contact] Error fetch', err);
      setStatus('Fallo de red o servidor. Inténtalo más tarde.', 'error');
      scrollToForm();
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener('input', () => { if(statusEl?.textContent) setStatus('', ''); });

  console.log('[contact] Inicializado. Endpoint final:', getEndpoint() || '(vacío)');
})();