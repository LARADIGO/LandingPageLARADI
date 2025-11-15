# Guía de Analítica (GA4 + Consent Mode) para el proyecto

Esta guía resume la configuración actual de analítica en el proyecto, cómo funciona el banner de consentimiento, los eventos personalizados enviados a Google Analytics 4 (GA4), y los pasos para ampliar, depurar y analizar los datos.

---

## 1. Arquitectura resumida

- Framework: Astro.
- Analítica: Google Analytics 4 (Measurement ID: `G-6QB73LYVYN`).
- Privacidad: Consent Mode v2 activado por defecto con `analytics_storage: denied` hasta consentimiento explícito.
- Banner de consentimiento: componente `CookieConsent.astro` (almacena la elección en `localStorage` por 7 días).
- Eventos personalizados: gestionados por `ga4.events.client.ts`.
- Page views: gestionados automáticamente por `gtag('config')` con `send_page_view: true`.
- Debug local: activado en `localhost` con `debug_mode: true` para ver eventos en DebugView.

---

## 2. Ficheros relevantes

| Fichero | Descripción |
|---------|-------------|
| `src/layouts/BaseLayout.astro` | Inserta el snippet de GA4 y Consent Mode. Carga el script de eventos y el banner. |
| `src/components/CookieConsent.astro` | Banner de consentimiento (aceptar/rechazar). Guarda por 7 días. |
| `src/scripts/ga4.events.client.ts` | Lógica de envío de eventos (FAQ, Pricing, CTA, delegación genérica). |
| `README-analytics.md` | Este documento. |

---

## 3. Consent Mode v2

### Estado por defecto
Antes de que el usuario interactúe:
```js
gtag('consent', 'default', {
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  ad_storage: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted'
});
```

### Al aceptar
```js
gtag('consent', 'update', { analytics_storage: 'granted', ... });
```

### Al rechazar
```js
gtag('consent', 'update', { analytics_storage: 'denied', ... });
```

### Persistencia y expiración
- LocalStorage key: `cookie_consent`
- Formato: `{"value":"accepted"|"rejected","ts":<timestamp_ms>}`
- Caducidad: 7 días. Tras caducar se vuelve a mostrar el banner.

### Forzar re-pregunta manual (debug)
Abrir la consola y ejecutar:
```js
localStorage.removeItem('cookie_consent'); location.reload();
```

---

## 4. Eventos personalizados enviados a GA4

| Evento | Cuándo se dispara | Parámetros incluidos |
|--------|-------------------|----------------------|
| `pricing_view` | La sección `#precios` entra ≥35% en viewport (una sola vez por página) | `page_path` |
| `faq_open` | Se abre un `<details>` de FAQ | `faq_id`, `question`, `index`, `page_path` |
| `faq_close` | Se cierra un `<details>` de FAQ | `faq_id`, `question`, `index`, `page_path` |
| `cta_probar_gratis_click` | Clic en cualquier enlace a `#contacto` | `from`, `plan` (si dentro de pricing), `link_text`, `page_path` |
| `data-analytics` (genérico) | Clic en cualquier elemento con `data-analytics="nombre_evento"` | Parámetros definidos en `data-analytics-props`, más `plan` si está en `.pricing-card` |

### Notas:
- Se usa `IntersectionObserver` para `pricing_view`.
- FAQ usa delegación de eventos y espera 20 ms para leer el estado final (animación).
- Todos los eventos usan `transport_type: beacon` para robustez en salida.
- Se evita duplicar `pricing_view` usando `sessionStorage`.

---

## 5. Configuración en GA4 (pasos recomendados)

### 5.1 Marcar conversiones
Ir a: `Admin → Events`.
- Localizar `cta_probar_gratis_click`.
- Activar “Mark as conversion”.

Opcionales: `pricing_view` (como etapa de embudo), `faq_open` (indicador de interés).

### 5.2 Crear dimensiones personalizadas
Ir a: `Admin → Custom definitions → Create custom dimension`.

Recomendadas:
| Name | Event Parameter | Scope |
|------|-----------------|-------|
| From | `from` | Event |
| Plan | `plan` | Event |
| FAQ ID | `faq_id` | Event |
| FAQ Index | `index` | Event |
| Link Text (opcional) | `link_text` | Event |
| FAQ Question (solo si realmente se necesita) | `question` | Event |

Evita demasiadas dimensiones de texto largo para mantener claridad y evitar exceso de cardinalidad.

### 5.3 Explorations (embudo)
- `Explore → Funnel exploration`.
  - Paso 1: `page_view`
  - Paso 2: `pricing_view`
  - Paso 3: `cta_probar_gratis_click`
- Añade segmentación (device, plan, from) cuando definidas las custom dimensions.

### 5.4 Retención de datos
`Admin → Data Settings → Data Retention → 14 months` (si necesitas exploraciones históricas más largas).

### 5.5 Filtros de tráfico interno (opcional)
- `Admin → Data Filters → Create filter → Internal traffic`.
- Añade tu IP si es fija (para no contaminar datos).

---

## 6. Debug y verificación

### Localhost
- `debug_mode` activado automáticamente.
- Ver en GA4: `Admin → DebugView` (eventos casi inmediatos).
- Realtime: puede tardar unos segundos (5–10s).

### Comprobar envío de un evento
En DevTools (Network):
- Filtrar por `collect?` (requests a `https://www.google-analytics.com/g/collect`).
- Ver parámetros: `en=pricing_view`, `en=cta_probar_gratis_click`, etc., y los `ep.<param>` (event params).

### Latencia normal
- Realtime: segundos.
- Informes estándar: minutos.
- Custom dimensions: empiezan a poblarse tras su creación (no retroactivo).

---

## 7. Extensiones y mejoras futuras

| Mejora | Descripción |
|--------|-------------|
| Scroll depth | Enviar `scroll_depth` (25%, 50%, 75%, 100%). |
| Tiempo en sección | Medir tiempo activo en #precios antes del clic en CTA. |
| Embudo refinado | Añadir evento `faq_interaction` agrupando open/close múltiples. |
| Consent revocable global | Añadir un enlace permanente “Preferencias de cookies” en el footer. |
| Mode server-side tagging | Migrar a Tag Manager server-side (privacidad avanzada). |
| Export semanal | Script CI que extrae métricas clave y guarda JSON/CSV. |
| Data Layer enriquecido | Preparar `dataLayer.push({ecommerce:...})` si se añade venta online. |

---

## 8. Buenas prácticas

- Mantén los nombres de eventos en minúsculas y sin espacios (`cta_probar_gratis_click`, no `CTA Click`).
- No abuses de parámetros largos (texto FAQ completo si no lo analizarás).
- Versiona cambios analíticos (añadir este README al control de cambios).
- Limita re-envío de eventos con llaves (usar `sessionStorage` o flags).
- Documenta en commits cuando se añaden eventos nuevos.

---

## 9. Checklist rápido de despliegue

| Paso | Hecho |
|------|-------|
| Snippet GA4 en `BaseLayout` | ✅ |
| Consent Mode default denied | ✅ |
| Banner de consentimiento funcional y con expiración 7 días | ✅ |
| Eventos personalizados funcionando en DebugView | ✅ |
| Conversiones marcadas (`cta_probar_gratis_click`) | ☐ |
| Dimensiones personalizadas creadas (from, plan, faq_id, index) | ☐ |
| Retención extendida a 14 meses (si necesario) | ☐ |
| Filtro de tráfico interno (opcional) | ☐ |
| README-analytics agregado al repositorio | ☐ |

---

## 10. Preguntas frecuentes internas

**¿Por qué no veo el evento inmediatamente en Realtime?**  
La consola tiene latencia (segundos). DebugView es más rápido en localhost.

**¿Se envían eventos antes del consentimiento?**  
Sí, GA4 puede recibir “pings” en modo consent-denied, pero no crea cookies de analítica completas hasta aceptación.

**¿Puedo cambiar a otro sistema (Plausible / Umami)?**  
Sí. Mantendría la misma estructura de eventos y un adaptador de envío.

**¿Necesito banner si sólo uso GA4 con Consent Mode y IP anonymize?**  
Para cumplimiento estricto en la UE: sí, se considera analítica no esencial → requiere consentimiento.

---

## 11. Snippets útiles

### Forzar debug fuera de localhost
```js
gtag('config', 'G-6QB73LYVYN', { debug_mode: true });
```

### Enviar evento manual (con parámetros)
```js
gtag('event', 'demo_video_play', {
  page_path: location.pathname,
  video_id: 'intro-1',
  transport_type: 'beacon'
});
```

### Reset parcial de consentimiento
```js
gtag('consent', 'update', { analytics_storage: 'denied' });
localStorage.removeItem('cookie_consent');
```

---

## 12. Mantenimiento

Revisa trimestralmente:
- Eventos en uso (¿alguno obsoleto?).
- Conversiones (¿siguen siendo representativas?).
- Dimensiones personalizadas (¿alguna innecesaria que aumente cardinalidad?).
- Políticas de privacidad (mantener enlace y texto del banner actualizado).

---

## 13. Anexos

### Valor de parámetros clave

| Parámetro | Uso |
|-----------|-----|
| `from` | Identifica la zona de clic de la CTA (`precios`, `caracteristicas`, `header`, etc.). |
| `plan` | Plan asociado al clic (si CTA dentro de tarjeta de pricing). |
| `faq_id` | ID único para correlacionar preguntas. |
| `index` | Posición (0-based) de la pregunta en la lista. |
| `question` | Texto de la pregunta (solo si realmente necesario para análisis cualitativo). |
| `link_text` | Texto exacto del enlace clicado. |

---

## 14. Contacto interno

Para cualquier cambio en la analítica:
1. Editar `ga4.events.client.ts`
2. Actualizar este README (sección 4 y 7).
3. Hacer PR con título: `feat(analytics): nuevo evento XYZ`
4. Revisar en DebugView antes de marcarlo como conversión.

---

¿Necesitas que se genere una versión en inglés o un script de exportación a CSV vía la Reporting API? Avísame y lo añadimos.

Fin.