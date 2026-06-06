# Patrón aprobado — Hero landing

**Estado:** ✅ Actualizado jun 2026 — jerarquía editorial alineada con `#platform`  
**URL:** https://triadak.io (above the fold)  
**Código:** `frontend/src/pages/LandingPage.tsx` → función `Hero`

---

## Jerarquía

```
ALQUILER VACACIONAL          ← eyebrow, slate-400, tracking 0.35em
GESTIONA TUS ALQUILERES      ← h1 línea 1, slate-400, uppercase
A TODA VELOCIDAD             ← h1 línea 2, white, uppercase
[subtítulo una línea]        ← slate-400
Gratis para empezar · …      ← tagline, cyan-300/90
EMPEZAR GRATIS →             ← CTA link editorial
VER FUNCIONES                ← CTA secundario slate-500
★★★★★ 5.0 · PLAN STARTER     ← meta inline uppercase
¿BUSCAS ALOJAMIENTO? …       ← link explore
DESPLÁZATE                   ← scroll hint
```

---

## Qué se eliminó

- Badge pill con borde
- `LustreText` animado
- Líneas rotativas duplicadas
- Botones ghost con `rounded-xl border`
- Layout centrado

---

## Tokens

- Contenedor: `max-w-7xl`, bloque contenido `max-w-3xl`, **alineado izquierda**
- Headline: `text-[clamp(2rem,6.5vw,4.25rem)]` uppercase `tracking-[0.03em]`
- Overlay imagen: `from-[#061020]/75` → `to-[#061020]/95`

Ver [../02-tipografia/jerarquia.md](../02-tipografia/jerarquia.md) y [../01-color/paleta.md](../01-color/paleta.md).

---

## i18n

Prefijo: `landing.hero.*` — incluye `tagline`, `explorePrompt`, `exploreLink`
