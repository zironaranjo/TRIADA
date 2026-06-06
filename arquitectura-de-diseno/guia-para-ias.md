# Guía rápida para IAs

Copia mental de este documento al trabajar en la **landing Triadak**.

---

## Contexto en una frase

Triadak landing = **dark editorial SaaS** sobre `#061020`, tipografía Inter en mayúsculas con tracking amplio, **sin cards**, parallax suave con Framer Motion.

---

## Leer primero

1. [README.md](./README.md)
2. [patrones-aprobados/01-plataforma-triadak.md](./patrones-aprobados/01-plataforma-triadak.md) — **referencia favorita del usuario**
3. [06-anti-patrones/evitar.md](./06-anti-patrones/evitar.md)

---

## Do

- Usar `PlatformEditorialSection`, `EditorialFeaturesSection`, `scroll-parallax.tsx` como plantillas
- Partir titulares: `text-slate-500` + `text-white`
- Labels: `text-[10px] uppercase tracking-[0.32em+] text-slate-500`
- Taglines clave: `text-cyan-300/90`
- Divisores: `border-white/[0.06]`, líneas gradiente 1px
- i18n en 4 idiomas (`es`, `en`, `de`, `fr`)
- Responder al usuario en **español**

---

## Don't

- BentoGrid, shadcn Card, carousels con cajas en marketing
- `rounded-2xl border bg-white/[0.02] p-8` alrededor de copy
- Badges/pills para meta
- Centrar secciones editoriales completas
- `overflow-hidden` en sections con sticky
- Commits/push sin que el usuario lo pida

---

## Archivos clave

```
frontend/src/pages/LandingPage.tsx
frontend/src/components/ui/platform-editorial-section.tsx
frontend/src/components/ui/editorial-features-section.tsx
frontend/src/components/ui/editorial-feature-blocks.tsx
frontend/src/components/ui/editorial-cta.tsx
frontend/src/components/ui/scroll-parallax.tsx
frontend/src/i18n/locales/es.json  → landing.editorial.*
```

---

## Añadir patrón aprobado

Cuando el usuario diga que le gusta algo:

1. Crear `patrones-aprobados/NN-nombre.md`
2. Enlazar en README
3. Opcional: una línea en `.cursor/rules/triadak-brain.mdc`

---

## Preguntas frecuentes

**¿Cards en dashboard app?** Sí, OK fuera de landing.

**¿Inspiración Haptikos?** Sí, editorial/parallax; contenido y copy son de Triadak (alquiler vacacional).

**¿Build?** `cd frontend && npm run build` — TypeScript estricto, sin imports sin usar.
