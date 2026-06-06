# Anti-patrones — Qué evitar

Lista explícita derivada de feedback del usuario (jun 2026).

---

## ❌ Cards y contenedores

- Cajas con `rounded-2xl`, `border`, `bg-white/[0.03]`, `ring-1`
- Bento grid en landing marketing
- Carrusel móvil con `Card` / `CardContent` de shadcn
- Badges tipo pill (`rounded-lg px-2.5 py-1 bg-sky-500/15`)
- Tags con hash en pastillas de color (`#Propiedades` en chip)

**Alternativa:** texto inline, divisores `border-t`, meta con ` · `

---

## ❌ Layout

- Secciones editoriales centradas con `text-center max-w-2xl mx-auto` para todo el bloque
- Encerrar el bloque *Donde → se convierte en* en una sola card
- Pilares en 3 mini-cards con hover border

---

## ❌ Tipografía

- Title case en labels de sección (usar **UPPERCASE**)
- Tracking normal en eyebrows (`01/ PLATAFORMA`)
- Mezclar fuentes distintas a Inter en landing

---

## ❌ Color

- Gradientes fuertes de botón primario en CTAs editoriales
- Fondos `#0f172a` mezclados con `#061020` en la misma vista
- Demasiados acentos simultáneos en un mismo bloque

---

## ❌ Motion

- Parallax extremo (>200px) o parallax en todo a la vez
- Autoplay de cards/carruseles donde el usuario espera scroll editorial
- `overflow-hidden` en `<section>` que contiene `position: sticky` (rompe sticky)

---

## ❌ Proceso

- Rediseñar landing sin leer `arquitectura-de-diseno/`
- Hardcodear español en componentes nuevos sin i18n
- Reintroducir `BentoGrid` / carousel cards “porque en móvil se ve mejor” sin probar lista vertical editorial

---

## ✅ Cuándo sí usar cards

- **App autenticada** (dashboard, properties, settings) — `GlassCard`, `surface-card`, KPI tiles
- **FAQ tabs**, testimonial carousel — pendiente migración editorial; no bloquean el resto

El usuario distingue **marketing/landing** (abierto) vs **producto** (cards OK).
