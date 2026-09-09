# Revisión visual — 2026-09

> Cola de trabajo de estilo de `consulta` y los briefs de generación de imágenes.
> **No es la referencia viva** — esa es [`guia-de-estilo.md`](guia-de-estilo.md), al
> día con `?v=23`. Este documento se cierra cuando todos los ⬜ pasan a ✅.
>
> Estado: `✅` hecho · `⬜` pendiente · `❌` descartado a propósito.

---

## 1. Contexto

Iteraciones de identidad visual, en orden:

| `?v` | Qué |
|---|---|
| 13 | Pulido de accesibilidad (contraste de enlaces AA, ring de foco `--focus`, `.callout` de 3 niveles). |
| 15 | Repintado a acento **teal** sobre neutrales fríos estilo Google (identidad «Grafito»). |
| 16 | Interruptor **día / noche**, defecto siempre claro. |
| 17 | Recorte de pesos de IBM Plex Sans a `400;600`. |
| 18 | **Fuentes auto-alojadas** — cierre 100 % offline. |
| 19 | **Pivote a «técnico cálido / notebook»** — el dueño encontró «Grafito» *fome*. Papel tibio, sans en la UI, mono solo en datos, esquinas de 4 px, sombra sutil, movimiento medido. |
| 20 | Gráfico: títulos de eje + eje X consciente de fechas. |
| 21 | Carga: elegir qué fila es el encabezado. |
| 22 | Presets del gráfico: recomiendan sin ejecutar SQL. |
| 23 | Acento **azul pizarra** `#33518f` (registro finanzas / control de gestión). |

Lo que queda por saldar: la **escala tipográfica** (parcialmente hecha en `?v=19`), los
**colores de rol sin tokenizar**, el barrido de `--sp-*`, un par de textos explicativos,
y darle al repo una **cara compartible** (favicon, tarjeta social, banner) — los briefs
de nano banana en §7.

Reglas y snippets: [`guia-de-estilo.md`](guia-de-estilo.md). Investigación (habla en
términos de «Grafito», que ya no es el estado actual): [`referencias-estilo.md`](referencias-estilo.md).

---

## 2. Hallazgos — tipografía

### ✅ Recorte de pesos (`?v=17`) + auto-alojar (`?v=18`)
Sans a `400;600` (`600` solo para `b, strong`). 4 woff2 en `vendor/fonts/` (subset
latin, ~89 KB): Mono 400/500/600 + `ibm-plex-sans.woff2` (variable, 400–600).
`@font-face` al inicio de `style.css`, `font-display: swap`, 2 `<link rel="preload">`.
Verificado: **cero peticiones a Google Fonts**.

### ✅ Reparto por rol (`?v=19`)
Sans para toda la interfaz y los títulos; mono reservado a datos, SQL y código. `h1`
pasó de mono 1.5rem a **sans 2rem** (`--fs-2xl`, tracking −0.022em). Detalle en la guía
§3.

### ⬜ La escala `--fs-*` sigue parcialmente bypasseada (P1)
`?v=19` movió la base a 15 px, ratio ~1.25, y agregó `--fs-2xl`. Pero quedan
**~15 valores `font-size` hardcodeados** (`0.6rem`–`0.85rem`) — sobre todo labels de
`0.68rem` (synth, chart-controls, tpl-title, dim-n) y rótulos del SVG del gráfico.

- Agregar `--fs-2xs ≈ 0.68rem` y mapear todos esos labels.
- `--fs-xl` (1.6rem) hoy queda reservado sin uso — decidir (¿`h2` del glosario más
  grande?) o eliminar.
- Criterio: nada de la UI cambia de tamaño perceptiblemente, salvo lo que se decida.

---

## 3. Hallazgos — color / tokens

### ✅ Acento azul pizarra (`?v=23`)
`--accent` `#33518f` / `#8aa9e6`, elegido sobre una página de comparación apuntando al
perfil del dueño. El teal retirado (`#0f6d80`) se recicló como color de rol «fecha».

### ⬜ Colores de rol sin tokenizar (P1)
En `style.css`, `.sc-group[data-kind=…]` usa 4 colores hardcodeados:

| Rol | Color actual |
|---|---|
| temporal | `#0f6d80` (teal) |
| medida | `var(--accent)` |
| dimensión | `#7d9a6f` |
| id | `var(--faint)` |

- Promoverlos a tokens `--role-time`, `--role-measure` (`= --accent`), `--role-dim`,
  `--role-id` (`= --faint`), con variantes en el bloque oscuro (los dos hex fijos
  necesitan una versión clara para modo noche).
- La paleta de 8 del gráfico (array en `app.js`): documentada en la guía §2; el array
  es legítimo (se asigna por índice de serie al dibujar). Evaluar solo si el
  `#5f7f8a` (pizarra, 6º) choca demasiado con el acento azul ahora.

---

## 4. Hallazgos — espaciado

### ⬜ `--sp-*` infrautilizado (P2 — cosmético interno)
`--sp-2/3/4/6` casi solo los usa `.callout`. El resto es `rem` hardcodeado. Barrido de
bajo riesgo: reemplazar por tokens donde el valor ya coincide con la escala de 4 px.
Sin urgencia.

---

## 5. Movimiento — ✅ hecho (`?v=19`)

Presupuesto permanente en la guía §6. Lo aplicado:

- **Base:** `--t: 130ms ease`; `@keyframes fadeUp` / `fadeIn`; un
  `@media (prefers-reduced-motion: reduce)` **global** que anula animaciones y
  transiciones.
- **Micro-transiciones** de `--t` en enlaces, `.tabs button`, botones, `.tpl-group
  button`, `.sc-chip`, `.history-item`, `.theme-toggle`, controles.
- **Dos entradas con fade**, ambas desde un estado visible en reposo:
  `#workspace:not([hidden])` → `fadeUp 200ms`; `.panel:not([hidden])` → `fadeIn 140ms`.
- El punto del motor parpadea solo mientras carga el runtime.

**Pendiente menor:** los callouts dinámicos (`#file-error`, `#chart-note`) todavía
aparecen de golpe — podrían entrar con `fadeIn`. P2.

---

## 6. Texto explicativo — propuesta

Mantener simple. Inventario y regla de capas: guía §7. Añadidos acotados:

### ⬜ Callout «primera vez» bajo el drop-zone
Una línea que consolida confianza y señala el camino de cero fricción:

> **nota** — El archivo se procesa en tu navegador; no se sube a ningún servidor.
> ¿Sin datos a mano? Generá una relación sintética abajo.

`.callout` neutro. Se puede ocultar con `localStorage` tras la primera carga (opcional).

### ⬜ Descripción viva del generador
Bajo `<select id="synth-shape">`, un texto chico (`.hint` / `.muted`) que **cambia con
la selección** y lista las columnas de esa forma:

| Forma | Produce (encabezados reales, `app.js`) |
|---|---|
| serie agregada mensual | `periodo, segmento, serie, valor, unidades` |
| panel diario multi-entidad | `entidad, fecha, m1, m2, m3` |
| registro de eventos | `ts, entidad, evento, valor` |
| métrica con quiebres | `fecha, valor, es_outlier, regimen` |

Reusa metadata de `SHAPES` en `app.js`.

### ⬜ *(opcional)* `<details>` «cómo funciona»
3 bullets: **cargás** un CSV/Parquet/Excel → `consulta` lo **perfila** en una pasada →
**consultás** con SQL. Colapsado por defecto.

### ⬜ *(opcional)* «agrupar X por mes / día» en el gráfico
`?v=22` quitó el rollup diario→mensual que hacía el SQL de los presets. Un selector
chico en los controles del gráfico lo devolvería sin volver a ejecutar consultas.

### ❌ No agregar un `?` a la vista de inicio
El tagline + los `abbr` + el glosario alcanzan.

---

## 7. Briefs para nano banana

`consulta` no tiene favicon, ni tarjeta social, ni banner. Estos son los prompts
**listos para pegar** en nano banana (Gemini 2.5 Flash Image). En inglés —el modelo
rinde mejor—; glosa en español arriba de cada uno.

**Estado:** ninguno generado todavía. Cuando tengas las imágenes, entran al repo como
dice cada brief y se marca ✅ acá.

### Restricciones de estilo — pegar al final de CADA prompt

Actualizado a la dirección «notebook» + azul pizarra (`?v=23`):

```
STYLE CONSTRAINTS (strict):
- Flat vector illustration in the register of a MODERN ANALYTICAL NOTEBOOK
  (think Observable / Quarto / Linear docs) on warm paper. NOT a 3D render, NOT a
  photo, NOT a glossy app-store icon, NOT a dense engineering spec sheet.
- No gradients. No photographic texture. No heavy drop shadows — at most one very
  faint, tight shadow to lift a card off the page.
- Rounded corners of ~4px on rectangles and cards (subtle, not pill-shaped). Sharp
  corners on lines, arrows and small marks.
- Color palette, use ONLY these:
    slate blue  #33518F  (single accent — use sparingly)
    ink         #23211C  (lines, text — warm near-black)
    paper       #FBFAF7  (background — warm off-white)
    grey        #6A6357  (secondary lines, secondary text)
    surface-2   #F3F1EA  (subtle fills: header rows, chips)
- 1px hairline strokes for rules and boxes. Generous white space. Calm, precise, warm.
- Lettering: UI text and any wordmark look like IBM Plex Sans (humanist grotesque,
  medium weight); data/code labels look like IBM Plex Mono. Lowercase.
- Deliver on a solid #FBFAF7 background (not transparent unless stated).
```

Límites conocidos de nano banana: el texto chico sale impreciso y los hex no son
exactos. Plan: generar, y si el lettering o el color no quedan, **retocar en un editor
SVG / Figma** o aceptar la aproximación. Pedir siempre 3–4 variantes.

---

### 7.1 Favicon / ícono

**Glosa:** una marca abstracta para la pestaña del navegador. Un caret de prompt sobre
un glifo de tabla. Azul pizarra, legible a 16 px.

**Prompt:**
```
A minimal app favicon mark on a 1024x1024 canvas, centered, with ~15% padding.
The mark: a "greater-than" prompt caret ( > ) in slate blue #33518F, sitting to the
left of a simple 3-row table glyph drawn as three stacked horizontal 1px ink lines of
decreasing width. The whole mark reads as "a query over a table". Strong silhouette
that stays legible when scaled down to 16x16 pixels. Nothing else in the frame.
Deliver 4 variants: (a) caret + table side by side, (b) caret above the table,
(c) caret formed by the table's own rows converging, (d) a magnifying-lens outline
over two table columns.
[+ STYLE CONSTRAINTS block]
```

**Salida:** PNG 1024². **Cómo entra:** trazar a `favicon.svg` (Illustrator / Figma /
`potrace`), guardar en la raíz del repo. Añadir a los dos `<head>`:
```html
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#33518f">
```
Opcional: `favicon-180.png` para `apple-touch-icon`.

**Aceptación:** distinguible a 16 px en pestaña clara y oscura; una sola forma; azul
pizarra como único color además de tinta.

---

### 7.2 Tarjeta social (Open Graph)

**Glosa:** la imagen que aparece al compartir la URL en LinkedIn / Slack / X. 1200×630.
Wordmark a la izquierda, UI estilizada a la derecha.

**Prompt:**
```
A 1200x630 social share card, landscape, on a solid #FBFAF7 background with a 1px
#E7E3D8 inner border inset ~28px from the edge, corners rounded ~4px.
LEFT HALF: the word "consulta" in large lowercase IBM Plex Sans lettering, weight 600,
tight tracking, ink #23211C. Below it, smaller grey #6A6357 text: "SQL sobre CSV y
Parquet, en el navegador". Below that, a short slate-blue #33518F underline rule.
RIGHT HALF: a clean, schematic depiction of a two-pane data notebook — a small SQL
editor card (a few lines of monospaced code, one token tinted slate blue) stacked
above a result table card (uppercase monospaced header row on a #F3F1EA fill, 4-5 body
rows, right-aligned numeric column with tabular figures). Cards have 1px #E7E3D8
borders, ~4px corners and a barely-there shadow. One slate-blue accent: the active tab
underline or the run button.
Balanced composition, lots of breathing room, no clutter.
[+ STYLE CONSTRAINTS block]
```

**Salida:** PNG 1200×630, ≤ 1 MB. **Cómo entra:** `docs/og-consulta.png`. Meta en los
dos `<head>`:
```html
<meta property="og:title" content="consulta — SQL sobre CSV y Parquet en el navegador">
<meta property="og:description" content="Motor OLAP embebido en el cliente: SQL sobre CSV, Parquet y Excel sin backend, sin que el archivo salga del navegador.">
<meta property="og:image" content="https://h-e-sanchez.github.io/consulta/docs/og-consulta.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
```

**Aceptación:** legible como miniatura de ~500 px de ancho; el wordmark se lee; un solo
acento; se distingue de las tarjetas con gradiente violeta.

---

### 7.3 Banner de README

**Glosa:** imagen de cabecera del `README.md` (GitHub la renderiza). Más ancha, misma
familia visual, un poco más de aire.

**Prompt:**
```
A 1280x400 wide banner on a #FBFAF7 background.
Concept: "from raw file to clean answer", read left to right.
LEFT: a loose stack of ragged comma-separated text lines in grey #6A6357 — a raw CSV,
slightly misaligned, some quotes and semicolons, deliberately messy.
CENTER: a thin slate-blue #33518F arrow or bracket, marking the transformation.
RIGHT: a tidy result table card with an uppercase monospaced header row on a #F3F1EA
fill, aligned columns, right-aligned numbers, one row subtly highlighted, 1px #E7E3D8
border with ~4px corners and a faint shadow.
The eye should travel messy -> tidy. No title text needed (the README supplies it).
Wide margins top and bottom.
[+ STYLE CONSTRAINTS block]
```

**Salida:** PNG 1280×400 (o 2560×800 retina). **Cómo entra:** `docs/banner.png`, en la
línea 7 del `README.md`, encima de `docs/captura.jpg`.

**Aceptación:** cuenta la historia sin texto; se ve bien en el ancho de columna de
GitHub (~900 px); no compite con la captura real.

---

### 7.4 Ilustraciones de conceptos

**Glosa:** 3 diagramas cuadrados chicos para conceptos del glosario. **Advertencia:**
una ilustración generada puede desentonar con el resto. Recomendación: **generar como
referencia y redibujar en SVG a mano**, o usarlas **solo en el README**, no en el
glosario (que es texto puro y funciona así).

**Prompt (los tres en una corrida, para consistencia):**
```
Three separate square 800x800 diagrams in one consistent flat style, each on a
#FBFAF7 background, each captioned with one lowercase monospaced word at the bottom.
Cards and boxes have 1px #E7E3D8 borders with ~4px corners.

1. "columnar" — contrast row storage vs column storage: on the left, a table with one
   horizontal row bracket highlighted; on the right, the same table with one vertical
   column bracket highlighted in slate blue #33518F. Small labels: "por filas" vs
   "por columnas".

2. "cliente" — a simple browser window outline (tab + address bar as 1px shapes)
   containing a tiny table and a gear/engine glyph, with a struck-through cloud/server
   icon outside it and a broken connection line. Meaning: all processing happens in
   the browser, nothing goes to a server.

3. "cte" — three stacked labeled boxes connected top-to-bottom by short arrows:
   "paso 1 · resumen" -> "paso 2 · participación" -> "paso 3 · ranking". The final box
   outlined in slate blue. Meaning: a query built in named steps.

Keep all three visually identical in stroke weight, spacing and type.
[+ STYLE CONSTRAINTS block]
```

**Salida:** 3 × PNG 800² → redibujar a `docs/glosario/columnar.svg`,
`docs/glosario/cliente.svg`, `docs/glosario/cte.svg`. **Cómo entran:** en el README, o
como `<img>` en los `<dd>` del glosario **solo si** el redibujo SVG queda impecable.

**Aceptación:** los tres indistinguibles en peso de trazo y tipografía; cada uno se
entiende en 2 segundos sin leer.

---

## 8. Prioridad y secuencia

Desde `?v=24` el trabajo va **por PR** agrupando commits por temática. Se sigue
bumpeando `?v=N` por cambio de `style.css`/`app.js` y anotando la bitácora del
`ROADMAP.md`.

| Prio | Ítem | Sección | Estado |
|---|---|---|---|
| **P0** | Auto-alojar fuentes (cierre offline) | §2 | ✅ `?v=18` |
| **P0** | Presupuesto de movimiento | §5 | ✅ `?v=19` |
| **P0** | Favicon + `theme-color` | §7.1 | ⬜ (necesita nano banana) |
| **P0** | Tarjeta OG + meta tags | §7.2 | ⬜ (necesita nano banana) |
| **P1** | Consolidar la escala tipográfica | §2 | ⬜ |
| **P1** | Tokens de rol (`--role-*`) | §3 | ⬜ |
| **P2** | Barrido de `--sp-*` | §4 | ⬜ |
| **P2** | Texto explicativo (callout primera-vez + generador) | §6 | ⬜ |
| **P2** | «agrupar X por mes/día» en el gráfico | §6 | ⬜ |
| **P2** | Fade de entrada de callouts dinámicos | §5 | ⬜ |
| **P2** | Banner de README | §7.3 | ⬜ |
| **P2** | Ilustraciones de conceptos | §7.4 | ⬜ |
| **P2** | Regenerar `docs/captura.jpg` con `?v=23` | — | ⬜ |

---

## 9. Verificación (por ítem, al ejecutar)

- **Fuentes** ✅ (`?v=18`): DevTools → Network → cero peticiones a `fonts.g*`; con la
  red cortada el sitio se ve igual.
- **Movimiento** ✅ (`?v=19`): emular `prefers-reduced-motion: reduce` → sin
  transiciones ni fades; con motion normal, cada entrada corre una vez sin salto de
  layout.
- **Favicon:** pestaña del navegador en claro y oscuro; `theme-color` visible en la
  barra de Chrome Android.
- **OG:** pegar la URL de Pages en un validador (LinkedIn Post Inspector, Slack, X);
  `docs/og-consulta.png` accesible por HTTPS y ≤ 1 MB.
- **Escala tipográfica:** captura antes/después de cada vista → diff visual; nada
  cambia de tamaño salvo lo decidido.
- **Tokens de rol:** el panel Esquema se ve idéntico antes y después (solo cambia de
  dónde sale el color).
