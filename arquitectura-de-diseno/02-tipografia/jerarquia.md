# Tipografía — Jerarquía editorial

## Familia

- **Principal:** `Inter` (cargada en `frontend/src/index.css`)
- **Fallback:** `ui-sans-serif, system-ui, -apple-system, sans-serif`
- **Iconos:** Lucide (`strokeWidth={1.5}` – `1.75` en editorial)

---

## Filosofía

La landing editorial usa **sans-serif geométrica + MAYÚSCULAS + tracking amplio** en labels y titulares. El cuerpo puede ir en sentence case con tracking normal.

---

## Roles tipográficos

### 1. Section label (eyebrow)

Etiqueta numerada de sección. Ejemplo: `01/ PLATAFORMA TRIADAK`

```
text-[10px] sm:text-xs
font-medium
uppercase
tracking-[0.35em]   /* labels principales */
tracking-[0.32em]   /* sub-labels (DONDE, 02.01/) */
text-slate-500
```

### 2. Display headline (hero de sección)

Titular grande partido en dos bloques de color:

```
text-[clamp(2rem,6vw,4.5rem)]
font-bold
uppercase
leading-[1.02]
tracking-[0.03em]
```

- Línea 1: `text-slate-500` — palabras de contexto (*CAPTURA LA*)
- Línea 2: `text-white` — palabras de impacto (*VERDAD OPERATIVA*)

Variante funciones / subsección:

```
text-[clamp(1.75rem,5vw,3.5rem)]   /* título sección funciones */
text-[clamp(1.35rem,3vw,2rem)]     /* título de fila */
```

### 3. Tagline (acento)

Una línea corta bajo el párrafo:

```
text-sm sm:text-base
font-medium
tracking-[0.12em]
text-cyan-300/90
```

### 4. Body

```
text-base sm:text-lg lg:text-xl   /* intro plataforma */
text-sm sm:text-base lg:text-lg   /* descripciones estándar */
leading-relaxed
text-slate-400
max-w-2xl                         /* limitar ancho lectura */
```

### 5. Comparison block (Donde / se convierte en)

**Columna problema:**

```
Label:   text-[10px] uppercase tracking-[0.32em] text-slate-500
Title:   text-[clamp(1.25rem,3vw,2rem)] font-bold uppercase tracking-[0.05em] text-white
Detail:  text-xs sm:text-sm uppercase tracking-[0.16em] text-slate-500
```

**Conector central:**

```
text-[10px] sm:text-xs uppercase tracking-[0.4em] text-slate-600
```

**Columna solución:**

```
Title:  text-cyan-200 (mismo clamp que problema)
Detail: text-slate-500 uppercase tracking-[0.16em]
Tags:   text-[10px] uppercase tracking-[0.28em] text-slate-600
```

### 6. Meta inline (sin badges)

Sustituye pills y badges:

```
text-[10px] sm:text-xs
font-medium
uppercase
tracking-[0.22em]
text-slate-600
Contenido: "Multi-propiedad · Esencial · #tag1 · #tag2"
Separador: middle dot ` · `
```

### 7. Ghost index (decorativo)

Número o código grande en background:

```
font-bold uppercase tracking-tighter text-white
opacity 0.03–0.07 (animada con scroll)
text-[clamp(5rem,18vw,14rem)]   /* 01 plataforma */
text-[clamp(4rem,16vw,12rem)]   /* 06 funciones */
```

### 8. CTA editorial

```
text-xs sm:text-sm
font-semibold
uppercase
tracking-[0.22em]
```

---

## Título split en filas (funciones)

Primera palabra del título → `text-slate-500`  
Resto → `text-white`

Ejemplo: **GESTIÓN** (muted) + **DE PROPIEDADES** (white)

---

## i18n

Todos los textos visibles deben vivir en `frontend/src/i18n/locales/{es,en,de,fr}.json` bajo `landing.*`. No hardcodear copy en componentes salvo hints temporales.
