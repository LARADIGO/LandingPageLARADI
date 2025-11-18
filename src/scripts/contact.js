// Controlador de contacto con spinner, validación nativa del navegador,
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

    // Fuerza la validación nativa del navegador aunque el <form> tenga novalidate
    try { form.noValidate = false; } catch {}
    if (!form.checkValidity()) {
      // Muestra UI nativa de validación (tooltip del navegador) y no envía
      form.reportValidity();
      setStatus('Revisa los campos resaltados.', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const fd = new FormData(form);

    try {
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

      setStatus('Enviando...', 'loading');
      setLoading(btn, true);

      if(!ENDPOINT){
        console.error('[contact] Falta CONTACT_ENDPOINT');
        setStatus('Error de configuración. Inténtalo más tarde.', 'error');
        return;
      }

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

  // Sugerencia: añade sugerencias de teclado/autocompletado
  try {
    const email = form.querySelector('input[name="email"]');
    if (email) { email.setAttribute('inputmode','email'); email.setAttribute('autocomplete','email'); }
    const name = form.querySelector('input[name="name"]');
    if (name) name.setAttribute('autocomplete','name');
  } catch {}

  form.addEventListener('submit', handleSubmit);
  setStatus('', '');
  console.log('[contact] Inicializado. ENDPOINT:', ENDPOINT || '(no definido)');
})();