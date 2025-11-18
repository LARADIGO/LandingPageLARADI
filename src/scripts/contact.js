// Script contacto (JS plano). Requiere window.CONTACT_ENDPOINT seteado en BaseLayout.
(function(){
  const ENDPOINT = window.CONTACT_ENDPOINT || '';
  function $(sel){ return document.querySelector(sel); }
  function setStatus(msg, isError){
    const el = $('#contact-status');
    if(!el) return;
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
  }
  async function handleSubmit(ev){
    ev.preventDefault();
    const form = ev.target;
    if(!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn && submitBtn.setAttribute('disabled','true');

    try {
      const fd = new FormData(form);
      const hp = (fd.get('hp_field') || '').toString().trim();
      if (hp) {
        setStatus('Gracias.', false);
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
        setStatus('Completa todos los campos.', true);
        return;
      }
      if(!ENDPOINT){
        console.warn('[contact] ENDPOINT vacío, envío fallback nativo.');
        form.method = 'POST';
        form.action = '/'; // o muestra error
        form.submit();
        return;
      }
      setStatus('Enviando...');
      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload),
        mode:'cors',
        credentials:'omit'
      });
      if(!res.ok){
        const txt = await res.text().catch(()=> '');
        throw new Error(`Error ${res.status}: ${txt || res.statusText}`);
      }
      const data = await res.json().catch(()=>({ok:true}));
      if(data.ok){
        setStatus('Enviado. Redirigiendo...', false);
        setTimeout(()=> { location.href='/gracias'; }, 400);
        form.reset();
      } else {
        throw new Error('Respuesta no OK');
      }
    } catch(err){
      console.error('[contact] Error', err);
      setStatus('No se pudo enviar. Inténtalo más tarde.', true);
    } finally {
      submitBtn && submitBtn.removeAttribute('disabled');
    }
  }
  const form = document.getElementById('contact-form');
  if(!form){
    console.warn('[contact] Formulario no encontrado');
    return;
  }
  form.addEventListener('submit', handleSubmit);
  console.log('[contact] Inicializado. ENDPOINT:', ENDPOINT || '(vacío)');
})();