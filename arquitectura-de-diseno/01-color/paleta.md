# Color — Triadak Landing editorial

## Fondo principal

| Token | Hex / valor | Uso |
|-------|-------------|-----|
| `bg-landing` | `#061020` | Fondo de todas las secciones editoriales y landing root |
| `bg-landing-footer` | `#061020` | Footer (clase `bg-lp-footer` en CSS) |

El azul marino profundo es la base. **No** usar grises planos tipo `#0f172a` en nuevas secciones de marketing si ya existe `#061020` en la sección vecina.

---

## Texto

| Rol | Tailwind | Aprox. | Uso |
|-----|----------|--------|-----|
| Titular principal | `text-white` | `#FFFFFF` | Segunda línea del headline, titulares de solución |
| Titular muted | `text-slate-500` | ~slate-500 | Primera línea del headline split, subtítulos de contraste |
| Cuerpo | `text-slate-400` | ~slate-400 | Párrafos descriptivos |
| Label / meta | `text-slate-500` | ~slate-500 | `01/ PLATAFORMA`, `DONDE`, etiquetas pequeñas |
| Meta tenue | `text-slate-600` | ~slate-600 | Tags inferiores, separadores textuales |
| Tagline acento | `text-cyan-300/90` | cian suave | Frases clave bajo el párrafo (*Menos caos…*) |
| Solución / highlight | `text-cyan-200` | cian claro | Columna derecha del bloque *se convierte en* |

---

## Acentos por bloque (rotación)

Usar **uno** por fila o pilar, nunca todos a la vez en el mismo bloque:

| Acento | Clase | Uso típico |
|--------|-------|------------|
| Sky | `text-sky-400/80` – `text-sky-400/90` | Pilar 1, fila funciones 1 |
| Cyan | `text-cyan-400/85`, `text-cyan-300` | Taglines, CTAs hover, fila 2 |
| Violet | `text-violet-400/80` – `text-violet-400/90` | Pilar 2, fila 3 |
| Emerald / Amber / Rose | `text-emerald-400/85` etc. | Solo en listas largas (funciones 4–6) |

---

## Bordes y líneas (sutiles)

| Elemento | Valor |
|----------|--------|
| Separador sección | `border-white/[0.06]` |
| Separador fila / pilar | `border-white/[0.08]` |
| Línea vertical central | `bg-gradient-to-b from-transparent via-white/20 to-transparent` |
| Línea de acento animada | `bg-gradient-to-r from-cyan-400/50 to-transparent` |
| Divisor horizontal puente | `via-white/15` en gradiente |

---

## Fondos decorativos (no cajas)

| Efecto | Implementación |
|--------|----------------|
| Ghost index | `text-white` a opacidad 0.03–0.07 vía motion |
| Orbe parallax | `bg-cyan-500/[0.07] blur-3xl`, `bg-violet-500/[0.06] blur-3xl` |
| Radial suave | `radial-gradient(ellipse_at_top, rgba(56,189,248,0.08), transparent 55%)` |
| Striped grid (funciones) | `stripeColor: 56, 189, 248`, `opacity: 0.08` — textura, no contenedor |

---

## CTAs editoriales

| Estado | Estilo |
|--------|--------|
| Default | Texto link: `text-white/90`, `uppercase`, `tracking-[0.22em]` |
| Hover | `hover:text-cyan-300` + flecha `translate-x-1.5` |
| Evitar | Botones sólidos grandes, cards con `bg-white/10` en secciones editoriales |

---

## Referencia visual aprobada

Sección `#platform` — captura guardada por el usuario (jun 2026): fondo `#061020`, headline split slate/blanco, tagline cian, ghost `01`, bloque *Donde → se convierte en* sin caja.
