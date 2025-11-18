// Controlador de contacto con manejo de códigos de error y accesibilidad.
(function(){
  const ENDPOINT = window.CONTACT_ENDPOINT || '';
  function $(sel){ return document.querySelector(sel); }
  const statusEl = $('#contact-status');

  function setStatus(msg, type){
    if(!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
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

  async function handleSubmit(ev){
    ev.preventDefault();
    const form = ev.target;
    if(!form) return;

    const btn = form.querySelector('button[type="submit"]');
    btn && btn.setAttribute('disabled','true');

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

      if(!ENDPOINT){
        console.warn('[contact] Sin ENDPOINT. Fallback nativo.');
        form.method = 'POST';
        form.action = '/';
        form.submit();
        return;
      }

      setStatus('Enviando...', 'loading');

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
        setTimeout(()=> { location.href='/gracias'; }, 400);
        form.reset();
      } else {
        const code = data?.code || 'INTERNAL_ERROR';
        setStatus(messages[code] || 'Error al enviar.', 'error');
      }
    } catch(err){
      console.error('[contact] Error:', err);
      setStatus('Fallo de red o servidor. Inténtalo más tarde.', 'error');
    } finally {
      btn && btn.removeAttribute('disabled');
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