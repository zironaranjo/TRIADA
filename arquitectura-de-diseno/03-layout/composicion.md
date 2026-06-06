# Layout y composición

## Contenedor

```
mx-auto max-w-7xl
px-4 sm:px-6 lg:px-8
```

Secciones editoriales full-bleed en fondo; el **contenido** respeta `max-w-7xl`.

---

## Altura y ritmo vertical

| Sección | Padding / altura |
|---------|------------------|
| Plataforma `#platform` | `min-h-[90vh]`, `py-20 sm:py-28 lg:py-36` |
| Funciones `#features` | `py-16 sm:py-24 lg:py-32` dentro de StripedGrid |
| Feature row | `py-10 sm:py-14 lg:py-16` |
| Feature block (cómo funciona) | `min-h-[85vh]` – `min-h-screen` |
| Puente entre secciones | `h-[clamp(6rem,14vh,10rem)]` |

Espaciado entre bloques internos: `mt-20 sm:mt-28` (bloques grandes), `mt-16 sm:mt-20` (CTAs).

---

## Alineación

| Zona | Alineación |
|------|------------|
| Headline plataforma | Izquierda |
| Bloque comparación | Grid 3 cols en desktop; solución `lg:text-right` |
| Funciones | Izquierda; grid 12 cols en desktop |
| Testimonios / FAQ | Puede mantener centrado (aún no migrado a editorial) |

**Preferencia del usuario:** evitar bloques centrados con `max-w-2xl text-center` en secciones editoriales nuevas.

---

## Grid patterns

### Comparación *Donde → se convierte en*

```
lg:grid-cols-[1fr_auto_1fr]
lg:gap-16
```

Centro: líneas verticales + texto `SE CONVIERTE EN` — **sin card wrapper**.

### Pilares (3 columnas)

```
sm:grid-cols-3
border-t / sm:border-l entre columnas
py-8 sm:py-10
```

Solo líneas estructurales, sin fondo.

### Fila de función

```
sm:grid-cols-12
Col título: sm:col-span-4 lg:col-span-5
Col texto:  sm:col-span-8 lg:col-span-7
divide-y divide-white/[0.06] entre filas
```

### Feature sticky (cómo funciona)

Título `lg:sticky lg:top-28` en desktop; contenido scroll con parallax.

---

## Divisores permitidos

✅ `border-t border-white/[0.06]`  
✅ `divide-y divide-white/[0.06]`  
✅ Líneas gradiente 1px  
✅ `h-px` con `max-w-[8rem]` animada  

❌ `rounded-2xl border bg-white/[0.02] p-6`  
❌ Bento cards  
❌ Carousels con Card de shadcn  

---

## Overflow

Landing root: `overflow-x-clip` (no `overflow-x-hidden` — rompe sticky en algunos casos).

Secciones editoriales: `overflow-x-clip` en `<section>`.

---

## Numeración de secciones (landing)

| ID | Label editorial | Ghost |
|----|-----------------|-------|
| `#features` | FUNCIONES (badge i18n) | `06` |
| `#platform` | `01/ PLATAFORMA TRIADAK` | `01` |
| `#how-it-works` | `02/ CÓMO FUNCIONA` | `02.01`–`02.03` |
| Testimonios | `03/ TESTIMONIOS` | — |
| CTA final | — | `04` |

Mantener coherencia al añadir secciones.
