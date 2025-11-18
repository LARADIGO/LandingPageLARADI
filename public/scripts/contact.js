// Versión reforzada: evita POST nativo con email inválido,
// quita action + novalidate si JS carga, valida con pattern y regex,
// y loguea el flujo. Si JS falla -> fallback nativo (redirección).
(function(){
  const ENDPOINT = window.CONTACT_ENDPOINT || '';
  const form = document.getElementById('contact-form');
  if(!form){
    console.warn('[contact] Formulario no encontrado');
    return;
  }

  // Quita atributos para impedir fallback mientras JS está activo
  // (si quieres mantener fallback elimina estas dos líneas)
  form.removeAttribute('action');
  form.removeAttribute('novalidate');

  const statusEl = document.getElementById('contact-status');
  const submitBtn = form.querySelector('[data-contact-submit]');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const messages = {
    MISSING_FIELDS: 'Rellena todos los campos.',
    INVALID_EMAIL: 'El email no parece válido.',
    SERVER_NOT_CONFIGURED: 'Configuración del correo incompleta.',
    SES_REJECTED: 'El correo fue rechazado por SES (sandbox o identidad).',
    SES_ACCESS_DENIED: 'Permisos SES insuficientes.',
    BAD_JSON: 'Formato de datos incorrecto.',
    UNSUPPORTED_MEDIA_TYPE: 'Formato de envío no soportado.',
    INTERNAL_ERROR: 'Error interno. Inténtalo más tarde.',
    METHOD_NOT_ALLOWED: 'Método no permitido.',
    SENT: 'Mensaje enviado correctamente.'
  };

  function setStatus(msg, type){
    if(!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
  }

  function setLoading(loading){
    if(!submitBtn) return;
    if(loading){
      if(!submitBtn.dataset.original) submitBtn.dataset.original = submitBtn.innerHTML;
      submitBtn.classList.add('is-loading');
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando...';
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.setAttribute('disabled','true');
    } else {
      submitBtn.classList.remove('is-loading');
      submitBtn.innerHTML = submitBtn.dataset.original || 'Enviar';
      submitBtn.removeAttribute('aria-busy');
      submitBtn.removeAttribute('disabled');
    }
  }

  function scrollToForm(){
    const sec = document.getElementById('contacto');
    try { sec && sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }

  async function handleSubmit(ev){
    ev.preventDefault();
    setStatus('', '');

    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const hp = (fd.get('hp_field')||'').toString().trim();

    // Validación básica previa
    if(hp){
      setStatus('Enviado.', 'success');
      form.reset();
      return;
    }
    if(!name || !email || !message){
      setStatus(messages.MISSING_FIELDS, 'error');
      scrollToForm();
      return;
    }
    if(!EMAIL_REGEX.test(email)){
      setStatus(messages.INVALID_EMAIL, 'error');
      const emailInput = form.querySelector('input[name="email"]');
      emailInput && emailInput.focus();
      scrollToForm();
      return;
    }

    if(!ENDPOINT){
      setStatus('Error de configuración. Inténtalo más tarde.', 'error');
      return;
    }

    setStatus('Enviando...', 'loading');
    setLoading(true);

    try {
      const payload = {
        name, email, message,
        url: location.href,
        ua: navigator.userAgent
      };

      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
        mode:'cors',
        credentials:'omit'
      });

      let data = null;
      try { data = await res.json(); } catch {}

      if(!res.ok){
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || `Error ${res.status}`, 'error');
        scrollToForm();
        return;
      }

      if(data?.ok){
        setStatus('Enviado. Redirigiendo...', 'success');
        setTimeout(()=> { location.href='/gracias'; }, 350);
        form.reset();
      } else {
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || 'Error al enviar.', 'error');
        scrollToForm();
      }
    } catch(err){
      console.error('[contact] Error de red:', err);
      setStatus('Fallo de red o servidor. Inténtalo más tarde.', 'error');
      scrollToForm();
    } finally {
      setLoading(false);
    }
  }

  // Listener en capture para interceptar antes que cualquier otro
  form.addEventListener('submit', handleSubmit, { capture: true });

  setStatus('', '');
  console.log('[contact] Inicializado. ENDPOINT:', ENDPOINT || '(no definido)');
})();