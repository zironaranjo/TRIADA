# Patrón aprobado — Funciones (lista editorial)

**Estado:** ✅ Implementado tras feedback “funciones en cards encerradas”  
**URL:** https://triadak.io → `#features`  
**Código:** `frontend/src/components/ui/editorial-features-section.tsx`

---

## Qué sustituyó

| Antes | Después |
|-------|---------|
| `BentoGrid` desktop (cards) | Lista 12 columnas, divisores |
| `FeaturesMobileCarousel` (cards móvil) | Misma lista vertical responsive |
| Tags en chips | Tags inline ` · ` |
| Status/meta en badge | Meta inline uppercase |

---

## Anatomía de fila

```
02   (índice acento sky/cyan/violet…)
[icono lucide slate-400]

GESTIÓN          ← slate-500
DE PROPIEDADES   ← white

Multi-propiedad · Esencial   ← meta slate-600
────── (línea acento animada)

                    [descripción slate-400, parallax y]
                    Propiedades · Fotos · Precios
```

Ghost de sección: **06** (6 funciones).

Fondo: `StripedGrid` muy tenue (`opacity 0.08`) — textura, no contenedor.

---

## Coherencia con plataforma

Mismo lenguaje que [01-plataforma-triadak.md](./01-plataforma-triadak.md):

- Sin cards
- Uppercase + tracking
- Título split primera palabra / resto
- Parallax por fila
- CTA link → `#how-it-works`

---

## i18n

Prefijo: `landing.features.*`

Items: `landing.features.items.0` … `5` (title, description, meta, status, tags)
