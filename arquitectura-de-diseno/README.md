# Arquitectura de diseño — Triadak

Documentación viva del **lenguaje visual** que el producto debe seguir, especialmente en la **landing pública** (`triadak.io`).

> **Para humanos:** aquí se guarda todo lo que te gusta del diseño actual. Añade nuevas entradas en `patrones-aprobados/` cuando apruebes una sección o pantalla.
>
> **Para IAs:** lee este README y los archivos enlazados **antes** de rediseñar la landing o crear secciones nuevas. Prioriza estos patrones sobre estilos genéricos (cards, bento, SaaS template).

---

## Estado

| Campo | Valor |
|-------|--------|
| Producto | Triadak — SaaS gestión alquiler vacacional |
| Ámbito principal | Landing pública + marketing |
| Estilo base | **Editorial abierta** (inspiración Haptikos, adaptado a Triadak) |
| Stack UI | React, Tailwind v3, Framer Motion, Lucide |
| Fuente | Inter |
| Última actualización | Junio 2026 |

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [01-color/paleta.md](./01-color/paleta.md) | Colores, opacidades, acentos |
| [02-tipografia/jerarquia.md](./02-tipografia/jerarquia.md) | Escalas, tracking, roles tipográficos |
| [03-layout/composicion.md](./03-layout/composicion.md) | Grid, espaciado, divisores, sin cards |
| [04-motion/parallax-y-scroll.md](./04-motion/parallax-y-scroll.md) | Parallax, reveal, puentes entre secciones |
| [05-componentes/implementacion.md](./05-componentes/implementacion.md) | Mapa código ↔ diseño |
| [06-anti-patrones/evitar.md](./06-anti-patrones/evitar.md) | Qué **no** hacer |
| [patrones-aprobados/00-hero-landing.md](./patrones-aprobados/00-hero-landing.md) | Hero above-the-fold editorial |
| [patrones-aprobados/01-plataforma-triadak.md](./patrones-aprobados/01-plataforma-triadak.md) | ⭐ Referencia favorita del usuario |
| [patrones-aprobados/02-funciones-editorial.md](./patrones-aprobados/02-funciones-editorial.md) | Lista funciones sin cards |
| [guia-para-ias.md](./guia-para-ias.md) | Instrucciones compactas para otros agentes |

---

## Principios (resumen)

1. **Tipografía primero** — el diseño se sostiene con jerarquía de texto, no con cajas.
2. **Sin cards en marketing** — no encerrar bloques en `border`, `rounded-2xl`, `bg-white/[0.03]` salvo excepción explícita del usuario.
3. **Aire y asimetría** — mucho negative space; ghost numbers en background.
4. **Scroll con intención** — parallax suave, reveals progresivos, puentes entre secciones.
5. **Dark only** — fondo `#061020`, acentos cian/sky/violet puntuales.
6. **Uppercase editorial** — labels y titulares de sección en mayúsculas con tracking amplio.

---

## Cómo ampliar este catálogo

1. Crea un archivo en `patrones-aprobados/` con nombre `NN-nombre-corto.md`.
2. Incluye: captura o descripción, qué gustó, tokens usados, archivo de código, qué evitar.
3. Enlázalo desde este README en la tabla de índice.
