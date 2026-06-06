# Componentes — Mapa código ↔ diseño

## Landing editorial (aprobado)

| Componente | Ruta | Sección DOM | Documentación |
|------------|------|-------------|---------------|
| `PlatformEditorialSection` | `frontend/src/components/ui/platform-editorial-section.tsx` | `#platform` | [01-plataforma-triadak.md](../patrones-aprobados/01-plataforma-triadak.md) |
| `EditorialFeaturesSection` | `frontend/src/components/ui/editorial-features-section.tsx` | `#features` | [02-funciones-editorial.md](../patrones-aprobados/02-funciones-editorial.md) |
| `EditorialFeatureBlocks` | `frontend/src/components/ui/editorial-feature-blocks.tsx` | dentro `#how-it-works` | Mismo lenguaje, bloques 02.01–03 |
| `EditorialCTA` | `frontend/src/components/ui/editorial-cta.tsx` | antes footer | CTA palabras + parallax |
| `scroll-parallax.tsx` | `frontend/src/components/ui/scroll-parallax.tsx` | shared | [parallax-y-scroll.md](../04-motion/parallax-y-scroll.md) |
| `RotatingHeadlines` | `frontend/src/components/ui/rotating-headlines.tsx` | hero | Líneas rotativas |
| `StripedGrid` | `frontend/src/components/ui/striped-grid.tsx` | fondo `#features` | Textura baja opacidad |

## Orquestación

| Archivo | Rol |
|---------|-----|
| `frontend/src/pages/LandingPage.tsx` | Composición de secciones + puentes |
| `frontend/src/i18n/locales/*.json` | Copy bajo `landing.editorial.*`, `landing.features.*` |

## Componentes legacy (evitar en landing nueva)

| Componente | Motivo |
|------------|--------|
| `BentoGrid` | Cards con border — reemplazado por editorial |
| `FeaturesMobileCarousel` + `FeaturePremiumCard` | Cards en carrusel móvil |
| `HowItWorksParallax` + `ParallaxCards` | Sticky cards — reemplazado por `EditorialFeatureBlocks` |

Pueden seguir existiendo en el repo; **no reintroducir** en landing sin pedido explícito.

## Reglas del proyecto

- `.cursor/rules/triadak-brain.mdc` — punto 46 resume preferencia editorial
- `arquitectura-de-diseno/` — fuente detallada (este folder)

## Checklist al crear sección nueva

- [ ] Fondo `#061020`, sin card wrapper
- [ ] Label uppercase + tracking ≥ 0.32em
- [ ] Headline split slate/white si aplica
- [ ] Ghost index o línea acento
- [ ] `useSectionScroll` + al menos un `ScrollReveal`
- [ ] Copy en i18n (4 idiomas)
- [ ] Documento en `patrones-aprobados/` si el usuario aprueba
