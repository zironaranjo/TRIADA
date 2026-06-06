# ⭐ Patrón aprobado — 01 Plataforma Triadak

**Estado:** ✅ Aprobado por el usuario (jun 2026) — *“esto me gustó mucho”*  
**URL producción:** https://triadak.io → sección `#platform`  
**Código:** `frontend/src/components/ui/platform-editorial-section.tsx`  
**Inspiración:** [haptikos.tech](https://haptikos.tech/) — adaptado a Triadak, sin copia literal

---

## Captura de referencia

El usuario guardó captura (jun 2026) mostrando:

- Fondo `#061020` uniforme
- Label `01/ PLATAFORMA TRIADAK` arriba a la izquierda
- Headline en dos tonos: **CAPTURA LA** (gris) + **VERDAD OPERATIVA** (blanco)
- Párrafo + tagline cian *Menos caos operativo. Más control real.*
- Ghost **01** grande a la derecha, muy tenue
- Abajo: bloque comparativo sin caja — **DONDE / RESERVAS DISPERSAS** | **SE CONVIERTE EN** | **UN PANEL TRIADAK UNIFICADO**

---

## Anatomía del bloque

```
┌─────────────────────────────────────────────────────────────┐
│  01/ PLATAFORMA TRIADAK                          [ghost 01] │
│                                                             │
│  CAPTURA LA                    (slate-500, uppercase)       │
│  VERDAD OPERATIVA              (white, uppercase)           │
│                                                             │
│  [párrafo body slate-400]                                   │
│  [tagline cyan-300]                                         │
│                                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                             │
│  DONDE              │  SE CONVIERTE EN  │  UN PANEL… (cyan)  │
│  RESERVAS…          │      (líneas)     │  detalle + tags    │
│  detalle calendarios│                   │                    │
│                                                             │
│  ─── Sincroniza ─── Automatiza ─── Controla ─── (3 cols)   │
│                                                             │
│  EXPLORAR TRIADAK →                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Tokens clave

Ver detalle en:

- [../01-color/paleta.md](../01-color/paleta.md)
- [../02-tipografia/jerarquia.md](../02-tipografia/jerarquia.md)
- [../04-motion/parallax-y-scroll.md](../04-motion/parallax-y-scroll.md)

---

## i18n (claves)

Prefijo: `landing.editorial.*` en `es.json`, `en.json`, `de.json`, `fr.json`

| Clave | Ejemplo ES |
|-------|------------|
| `sectionLabel` | `01/ Plataforma Triadak` |
| `headlineMuted` | `Captura la` |
| `headlineBold` | `verdad operativa` |
| `description` | Párrafo largo |
| `tagline` | Menos caos operativo… |
| `whereLabel` / `whereTitle` / `whereDetail` | Columna izquierda |
| `becomesLabel` / `becomesTitle` / … | Columna derecha |
| `pillars.0–2` | Tres pilares inferiores |
| `cta` | Explorar Triadak |

---

## Motion en esta sección

1. `GhostIndex` — `01` parallax lento
2. `ScrollReveal` escalonado para intro, comparación, pilares, CTA
3. `ParallaxFloat` en headline y columnas comparativas (speed ±0.12–0.2)

---

## Reglas de fidelidad

Al retocar esta sección:

1. **No añadir card** alrededor del bloque comparativo
2. Mantener headline **split** en dos colores
3. Mantener ghost **01** visible pero sutil
4. CTA = link textual, no botón sólido

---

## Extensiones permitidas

- Ajustar copy i18n
- Afinar speeds de parallax
- Añadir puente `SectionParallaxBridge` antes/después (ya en landing)

## Extensiones no permitidas (sin OK del usuario)

- Volver a `rounded-2xl border` wrapper
- Centrar todo el bloque
- Quitar uppercase editorial
