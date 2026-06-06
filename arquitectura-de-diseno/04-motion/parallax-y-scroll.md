# Motion — Parallax y scroll

## Stack

- **Framer Motion** (`useScroll`, `useTransform`, `motion`)
- Utilidades centralizadas: `frontend/src/components/ui/scroll-parallax.tsx`

---

## Hook base

```tsx
const { ref, scrollYProgress } = useSectionScroll();
// offset: ['start end', 'end start']
```

Asignar `ref` al `<section>` padre. Pasar `scrollYProgress` a hijos.

---

## Componentes de motion

### `GhostIndex`

Número decorativo en background.

| Propiedad | Transform |
|-----------|-----------|
| `y` | `8%` → `-18%` según scroll |
| `opacity` | `0.03 → 0.07 → 0.02` |

Siempre `aria-hidden`, `pointer-events-none`, `select-none`.

### `ParallaxFloat`

Contenido foreground a velocidad distinta.

| Prop | Default |
|------|---------|
| `speed` | `0.35` (plataforma headline: `0.2`, columnas: `±0.12–0.15`) |
| `y` | `speed * 120` → `speed * -120` |
| `opacity` | fade en entradas/salidas de sección |

### `ScrollReveal`

Entrada progresiva ligada al scroll (no solo `whileInView`).

| Prop | Default |
|------|---------|
| `enter` | `[0.12, 0.42]` — rango de `scrollYProgress` |
| Efecto | opacity 0→1, y 48→0, scale 0.97→1 |

Bloques plataforma usan rangos escalonados: `[0.08,0.32]`, `[0.22,0.52]`, `[0.38,0.68]`, etc.

### `SectionParallaxBridge`

Entre secciones en `LandingPage.tsx`:

- Orbes cyan/violet con `y` en `%`
- Línea horizontal con `scaleX` 0→1→0
- Altura fija ~14vh

Insertar **entre** secciones editoriales, no dentro de ellas.

---

## Parallax por fila (funciones)

Cada fila tiene su propio `useScroll` en el `<div>` de fila:

```
contentY:  [0,1] → [24, -24]
opacity:   [0.12, 0.35, 0.75] → [0.35, 1, 1]
lineWidth: [0.2, 0.5] → ['0%', '100%']
```

---

## Hero (complemento)

- `RotatingHeadlines` — fade + blur entre líneas, intervalo ~3.2s
- Hint scroll — `animate y` infinito en línea vertical

---

## Reglas de motion

1. **Suave, no circo** — desplazamientos ≤120px; opacidades graduales.
2. **Una velocidad por capa** — ghost lento, texto medio, puente independiente.
3. **No autoplay agresivo** en bloques editoriales (salvo hero lines).
4. **`viewport once: true`** solo en micro-detalles (bullets); el grueso usa scroll progress.
5. Respetar `prefers-reduced-motion` — *pendiente implementar* si el usuario lo pide.

---

## Orden de secciones con puentes (LandingPage)

```
ReplaceStackSection
→ SectionParallaxBridge
→ PlatformEditorialSection (#platform)
→ SectionParallaxBridge
→ HowItWorks (#how-it-works)
→ SectionParallaxBridge
→ Testimonials
→ …
```
