// Contacto con accesibilidad, consentimiento, anti-spam y Turnstile.
(function(){
  const form = document.getElementById('contact-form');
  if(!form){ return; }

  const statusEl = document.getElementById('contact-status');
  const submitBtn = form.querySelector('[data-contact-submit]');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Anti-spam
  const FORM_MIN_MS = 1500;
  const RATE_LIMIT_MS = 15000;
  const BOOT_T0 = performance.now();

  function setStatus(msg,type){
    if(!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.className = 'muted';
    if(type) statusEl.classList.add('status-'+type);
    statusEl.classList.add('status-pop');
    statusEl.addEventListener('animationend', () => {
      statusEl.classList.remove('status-pop');
    }, { once:true });
  }

  function scrollToForm(){
    try { form.scrollIntoView({behavior:'smooth', block:'center'}); } catch {}
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

  function markInvalid(el,on){
    if(!el) return;
    if(on) el.setAttribute('aria-invalid','true');
    else el.removeAttribute('aria-invalid');
  }

  function tooFast(){ return performance.now() - BOOT_T0 < FORM_MIN_MS; }

  function rateLimited(){
    try{
      const last = parseInt(localStorage.getItem('contactLastTs')||'0',10);
      const now = Date.now();
      if(now - last < RATE_LIMIT_MS) return true;
      localStorage.setItem('contactLastTs', String(now));
      return false;
    }catch{ return false; }
  }

  function getEndpoint(){
    return (window.CONTACT_ENDPOINT || '').trim() || (form.getAttribute('action')||'').trim();
  }

  function getCaptchaToken(){
    try {
      if(window.turnstile && window.turnstile.getResponse){
        return window.turnstile.getResponse();
      }
    } catch(_) {}
    return '';
  }

  form.addEventListener('submit', async (ev) => {
    if(tooFast()){
      ev.preventDefault();
      setStatus('Enviado. (Filtro rápido activado)', 'success');
      form.reset();
      return;
    }
    if(rateLimited()){
      ev.preventDefault();
      setStatus('Espera unos segundos antes de reenviar.', 'error');
      scrollToForm();
      return;
    }

    // Limpia estados previos
    ['name','email','message'].forEach(id => markInvalid(form[id], false));

    if(!form.checkValidity()){
      ev.preventDefault();
      form.reportValidity();
      setStatus('Revisa los campos.', 'error');
      scrollToForm();
      return;
    }

    const fd = new FormData(form);
    const name = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim();
    const message = (fd.get('message')||'').toString().trim();
    const hp = (fd.get('hp_field')||'').toString().trim();
    const privacy = form.querySelector('#privacy');
    const captchaToken = getCaptchaToken();

    setStatus('', '');

    if(hp){
      ev.preventDefault();
      setStatus('Enviado.', 'success');
      form.reset();
      return;
    }
    if(!name){ ev.preventDefault(); markInvalid(form.name,true); setStatus('El nombre es obligatorio.', 'error'); scrollToForm(); return; }
    if(!EMAIL_REGEX.test(email)){ ev.preventDefault(); markInvalid(form.email,true); setStatus('El email no parece válido.', 'error'); form.email.focus(); scrollToForm(); return; }
    if(!message){ ev.preventDefault(); markInvalid(form.message,true); setStatus('Escribe un mensaje.', 'error'); scrollToForm(); return; }
    if(privacy && !privacy.checked){ ev.preventDefault(); setStatus('Debes aceptar la Política de privacidad.', 'error'); privacy.focus(); scrollToForm(); return; }

    const endpoint = getEndpoint();
    if(!endpoint){
      // Fallback envío nativo
      return;
    }

    // Validar CAPTCHA si sitekey presente
    const sitekey = (import.meta && import.meta.env && import.meta.env.PUBLIC_TURNSTILE_SITEKEY) ? import.meta.env.PUBLIC_TURNSTILE_SITEKEY : '';
    if(sitekey && !captchaToken){
      ev.preventDefault();
      setStatus('Completa la verificación (CAPTCHA).', 'error');
      scrollToForm();
      return;
    }

    ev.preventDefault();
    setStatus('Enviando...','loading');
    setLoading(true);

    try {
      const payload = { name, email, message, url: location.href, ua: navigator.userAgent, captchaToken };
      const res = await fetch(endpoint, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        mode:'cors',
        credentials:'omit',
        keepalive:true
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
        setTimeout(()=>{ location.href='/gracias'; }, 450);
        form.reset();
        if(window.turnstile && window.turnstile.reset){
          try { window.turnstile.reset(); } catch {}
        }
      } else {
        setStatus((data && data.message) || 'Error al enviar.', 'error');
        scrollToForm();
      }
    } catch(err){
      console.error('[contact] Error fetch', err);
      setStatus('Fallo de red o servidor.','error');
      scrollToForm();
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener('input', (e) => {
    const t = e.target;
    if(t && ['name','email','message'].includes(t.id)){
      markInvalid(t,false);
    }
    if(statusEl?.textContent) setStatus('', '');
  });
})();