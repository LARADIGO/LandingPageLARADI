// Controlador de contacto con spinner, validación de email en cliente,
// redirección a /gracias y manejo de errores.
(function(){
  const ENDPOINT = window.CONTACT_ENDPOINT || '';
  function $(sel){ return document.querySelector(sel); }
  const statusEl = $('#contact-status');

  function setStatus(msg, type){
    if(!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
    // Asegura que el usuario vea el mensaje
    const sec = document.getElementById('contacto');
    try { sec && sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setLoading(btn, loading){
    if(!btn) return;
    if(loading){
      if(!btn.dataset.original) btn.dataset.original = btn.innerHTML;
      btn.classList.add('is-loading');
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Enviando...';
      btn.setAttribute('aria-busy', 'true');
      btn.setAttribute('disabled','true');
    } else {
      btn.classList.remove('is-loading');
      btn.innerHTML = btn.dataset.original || 'Enviar';
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('disabled');
    }
  }

  async function handleSubmit(ev){
    ev.preventDefault();
    const form = ev.target;
    if(!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector('input[name="email"]');

    try {
      const fd = new FormData(form);
      const hp = (fd.get('hp_field')||'').toString().trim();
      if(hp){
        setStatus('Enviado.', 'success');
        form.reset();
        return;
      }

      const payload = {
        name: (fd.get('name')||'').toString().trim(),
        email: (fd.get('email')||'').toString().trim(),
        message: (fd.get('message')||'').toString().trim(),
        url: location.href,
        ua: navigator.userAgent
      };

      if(!payload.name || !payload.email || !payload.message){
        setStatus(messages.MISSING_FIELDS, 'error');
        return;
      }
      if(!emailRegex.test(payload.email)){
        setStatus(messages.INVALID_EMAIL, 'error');
        emailInput && emailInput.focus();
        return;
      }

      if(!ENDPOINT){
        console.error('[contact] Falta CONTACT_ENDPOINT');
        setStatus('Error de configuración. Inténtalo más tarde.', 'error');
        return;
      }

      setStatus('Enviando...', 'loading');
      setLoading(btn, true);

      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
        mode:'cors',
        credentials:'omit'
      });

      let data = null;
      try { data = await res.json(); } catch { data = null; }

      if(!res.ok){
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || `Error ${res.status}`, 'error');
        return;
      }

      if(data && data.ok){
        setStatus('Enviado. Redirigiendo...', 'success');
        setTimeout(()=> { location.href='/gracias'; }, 350);
        form.reset();
      } else {
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || 'Error al enviar.', 'error');
      }
    } catch(err){
      console.error('[contact] Error:', err);
      setStatus('Fallo de red o servidor. Inténtalo más tarde.', 'error');
    } finally {
      setLoading(btn, false);
    }
  }

  const form = document.getElementById('contact-form');
  if(!form){
    console.warn('[contact] Formulario no encontrado');
    return;
  }
  form.addEventListener('submit', handleSubmit);
  setStatus('', '');
  console.log('[contact] Inicializado. ENDPOINT:', ENDPOINT || '(no definido)');
})();