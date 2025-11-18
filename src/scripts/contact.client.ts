// Controlador del formulario de contacto: POST JSON a API Gateway.
// Requiere PUBLIC_CONTACT_ENDPOINT definida en el build (Amplify Hosting).
const ENDPOINT = import.meta.env.PUBLIC_CONTACT_ENDPOINT;

function $(sel: string, root: Document | HTMLElement = document) {
  return root.querySelector(sel) as HTMLElement | null;
}
function setStatus(msg: string, isError = false) {
  const el = $('#contact-status');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('error', isError);
}

async function handleSubmit(ev: Event) {
  ev.preventDefault();
  const form = ev.target as HTMLFormElement;
  if (!form) return;

  // Si no hay ENDPOINT (no configurado), dejamos que el form haga POST normal (fallback) si action está puesto.
  if (!ENDPOINT) {
    console.warn('[contact] Falta PUBLIC_CONTACT_ENDPOINT; usando fallback form action.');
    form.submit(); // continúa envío nativo (x-www-form-urlencoded)
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  submitBtn?.setAttribute('disabled', 'true');

  try {
    const fd = new FormData(form);
    const hp = (fd.get('hp_field') || '').toString().trim();
    if (hp) {
      setStatus('Gracias, enviado.', false);
      form.reset();
      return;
    }

    const payload = {
      name: (fd.get('name') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      message: (fd.get('message') || '').toString().trim(),
      url: location.href,
      ua: navigator.userAgent
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus('Por favor, rellena todos los campos.', true);
      return;
    }

    setStatus('Enviando...');
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit'
    });

    if (!res.ok) {
      const txt = await res.text().catch(()=> '');
      throw new Error(`Error ${res.status}: ${txt || res.statusText}`);
    }

    const data = await res.json().catch(()=> ({ ok: true }));
    if (data.ok) {
      setStatus('Enviado correctamente. Redirigiendo...', false);
      setTimeout(() => { window.location.href = '/gracias'; }, 400);
      form.reset();
    } else {
      throw new Error('No se pudo enviar el mensaje.');
    }
  } catch (err:any) {
    console.error('[contact] Error envío:', err);
    setStatus('No se pudo enviar el mensaje. Inténtalo más tarde.', true);
  } finally {
    submitBtn?.removeAttribute('disabled');
  }
}

(function init() {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) {
    console.warn('[contact] Formulario no encontrado');
    return;
  }
  form.addEventListener('submit', handleSubmit);
  console.log('[contact] Inicializado. ENDPOINT:', ENDPOINT || '(no definido)');
})();