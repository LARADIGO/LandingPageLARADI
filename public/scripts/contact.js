// Versión estable: mantiene fallback nativo y valida antes de hacer fetch.
// Si la variable global no está, usa form.action. No elimina el action.
(function(){
  const form = document.getElementById('contact-form');
  if(!form){ console.warn('[contact] Form no encontrado'); return; }

  const statusEl = document.getElementById('contact-status');
  const submitBtn = form.querySelector('[data-contact-submit]');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Determinar endpoint (JS o action del form)
  let ENDPOINT = (window.CONTACT_ENDPOINT || '').trim();
  if(!ENDPOINT){
    ENDPOINT = form.getAttribute('action') || '';
    console.warn('[contact] Usando fallback form.action:', ENDPOINT || '(vacío)');
  } else {
    console.log('[contact] Usando CONTACT_ENDPOINT:', ENDPOINT);
  }

  const messages = {
    MISSING_FIELDS:'Rellena todos los campos.',
    INVALID_EMAIL:'El email no parece válido.',
    INTERNAL_ERROR:'Error interno. Inténtalo más tarde.',
    SENT:'Mensaje enviado correctamente.'
  };

  function setStatus(msg,type){
    if(!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
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
    // Siempre interceptamos para decidir si hacemos fetch o dejamos el envío nativo.
    ev.preventDefault();

    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const hp = (fd.get('hp_field')||'').toString().trim();

    setStatus('', '');

    if(hp){
      setStatus('Ok.', 'success');
      form.reset();
      return;
    }
    if(!name || !email || !message){
      setStatus(messages.MISSING_FIELDS,'error');
      form.querySelector('input[name="name"]')?.focus();
      return;
    }
    if(!EMAIL_REGEX.test(email)){
      setStatus(messages.INVALID_EMAIL,'error');
      form.querySelector('input[name="email"]')?.focus();
      return;
    }

    // Si no tenemos ENDPOINT, dejamos fallback nativo (submit real)
    if(!ENDPOINT){
      console.warn('[contact] Sin endpoint, fallback nativo.');
      form.removeEventListener('submit', arguments.callee); // evitar bucle
      form.submit();
      return;
    }

    setStatus('Enviando...','loading');
    setLoading(true);

    try {
      const payload = { name, email, message, url:location.href, ua:navigator.userAgent };
      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
        mode:'cors'
      });

      let data=null;
      try { data = await res.json(); } catch {}

      if(!res.ok){
        setStatus((data && data.message) || messages.INTERNAL_ERROR,'error');
        return;
      }
      if(data?.ok){
        setStatus('Enviado. Redirigiendo...','success');
        setTimeout(()=> location.href='/gracias', 450);
        form.reset();
      } else {
        setStatus(data?.message || messages.INTERNAL_ERROR,'error');
      }
    } catch(err){
      console.error('[contact] Fetch error', err);
      setStatus(messages.INTERNAL_ERROR,'error');
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener('input', () => { if(statusEl?.textContent) setStatus('', ''); });

  console.log('[contact] Inicializado. Endpoint final:', ENDPOINT || '(vacío)');
})();