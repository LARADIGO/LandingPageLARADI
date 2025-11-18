// Reforzado: elimina action para evitar POST nativo si el JS está activo.
// Valida con pattern/regex y usa fetch; muestra errores en la misma página.
(function(){
  const ENDPOINT = window.CONTACT_ENDPOINT || '';
  const form = document.getElementById('contact-form');
  if(!form){
    console.warn('[contact] Formulario no encontrado');
    return;
  }

  // Desactiva envío nativo mientras JS está activo (evita redirecciones 303)
  form.setAttribute('data-js-active','1');
  form.removeAttribute('action');

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
    const sec = document.getElementById('contacto');
    try { sec && sec.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
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

  function preventNative(ev){
    // Capa extra de seguridad: bloquear envío nativo pase lo que pase
    ev.preventDefault();
    ev.stopPropagation();
  }
  // Captura para asegurarnos de interceptar siempre
  form.addEventListener('submit', preventNative, { capture: true });

  // Limpia el estado al teclear
  form.addEventListener('input', () => setStatus('', ''));

  async function handleSubmit(ev){
    // preventDefault ya aplicado arriba
    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const hp = (fd.get('hp_field')||'').toString().trim();

    if(hp){
      setStatus('Enviado.', 'success');
      form.reset();
      return;
    }
    if(!name || !email || !message){
      setStatus(messages.MISSING_FIELDS, 'error');
      form.querySelector('input[name="name"]')?.focus();
      return;
    }
    if(!EMAIL_REGEX.test(email)){
      setStatus(messages.INVALID_EMAIL, 'error');
      form.querySelector('input[name="email"]')?.focus();
      return;
    }
    if(!ENDPOINT){
      setStatus('Error de configuración. Inténtalo más tarde.', 'error');
      return;
    }

    setStatus('Enviando...', 'loading');
    setLoading(true);

    try {
      const payload = { name, email, message, url: location.href, ua: navigator.userAgent };
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
        return;
      }

      if(data?.ok){
        setStatus('Enviado. Redirigiendo...', 'success');
        setTimeout(()=> { location.href='/gracias'; }, 350);
        form.reset();
      } else {
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || 'Error al enviar.', 'error');
      }
    } catch(err){
      console.error('[contact] Error de red:', err);
      setStatus('Fallo de red o servidor. Inténtalo más tarde.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Listener principal en burbuja (prevención ya está en capture)
  form.addEventListener('submit', handleSubmit, { capture: false });

  setStatus('', '');
  console.log('[contact] Inicializado. JS activo, action eliminado. ENDPOINT:', ENDPOINT || '(no definido)');
})();