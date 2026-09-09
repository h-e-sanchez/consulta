# Revisión visual — 2026-09

> Foto de la deuda de estilo de `consulta` al 2026-09-08 y la cola de trabajo para
> saldarla. **No es la referencia viva** — esa es [`guia-de-estilo.md`](guia-de-estilo.md).
> Este documento se cierra cuando todos los ⬜ pasan a ✅.
>
> Estado: `✅` hecho · `⬜` pendiente · `❌` descartado a propósito.

---

## 1. Contexto

`consulta` cerró tres iteraciones seguidas de identidad visual:

- `?v=15` — repintado a acento **teal** (`#0f6d80` / `#3fbcd4`) sobre neutrales fríos
  estilo Google. Cierre de la investigación de `referencias-estilo.md`.
- `?v=16` — interruptor **día / noche** en la cabecera, con defecto **siempre claro**.
- `?v=17` — recorte de pesos de IBM Plex Sans y `b, strong` explícito a 600.

Antes de seguir tocando la UI conviene consolidar: ¿la escala tipográfica se usa de
verdad?, ¿se cierra el 100 % offline (fuentes)?, ¿cuánto movimiento y cuánto texto
explicativo se agregan sin romper el registro «ficha técnica»?, y ¿el repo tiene una
cara compartible (favicon, tarjeta social, banner)?

Reglas y snippets: [`guia-de-estilo.md`](guia-de-estilo.md). Investigación:
[`referencias-estilo.md`](referencias-estilo.md).

---

## 2. Hallazgos — tipografía

### ✅ Recorte de pesos (`?v=17`)
IBM Plex Sans venía en `400;450;500;600`. En todo el CSS, *cada* `font-weight ≥ 500`
cae en contexto monoespaciado. Sans solo se usa a 400. URL recortada a Sans `400;600`
(dos archivos menos). El `600` quedó para `b, strong`, ahora explícito en vez de
negrita 700 sintética. Mono `400;500;600`: los tres se usan, sin cambios.

### ✅ Auto-alojar IBM Plex — **cierra el 100 % offline** (`?v=18`)
Las fuentes eran el **único fetch externo que quedaba**. Hecho:

- **4 archivos** en `vendor/fonts/` (subset **latin**, ~89 KB total): Mono 400 / 500 /
  600 (estáticos) + `ibm-plex-sans.woff2` (**fuente variable**, un archivo cubre
  400–600). Bloque `@font-face` al inicio de `style.css`, `font-display: swap`.
- Quitados los dos `<link rel="preconnect">` y el `<link>` de Google Fonts de
  `index.html` **y** `glosario.html`; agregados 2 `<link rel="preload">` (Mono 400 +
  Sans) para arrancar la descarga junto con el CSS.
- **Sin `size-adjust`/`ascent-override`**: las fuentes cargan del mismo origen (sin
  DNS/TLS), el flash del `swap` es mínimo. Queda como pulido opcional si molesta.
- `.gitattributes`: `vendor/fonts/** binary`. README «Operación aislada» reescrito
  (ES + EN): sin fetch externo. `vendor/README.md`: sección + cómo regenerar.
- Optimización futura documentada: subset a los ~120 glifos usados con `pyftsubset`
  (~8–15 KB/archivo).

### ⬜ La escala `--fs-*` está bypasseada (P1)
`:root` define `--fs-xs … --fs-xl` pero hay **~20 valores `font-size` hardcodeados**
(`0.6rem`–`0.85rem`) repartidos por `style.css` que no la usan.

- Fijar la escala canónica. Probable: **6 pasos**, agregando un `--fs-2xs ≈ 0.65rem`
  para labels de gráfico (`.bar-label`, `.data-label`) y usos `em`.
- Mapear cada rol de texto a un token (tabla `rol → token → rem` en la guía).
- `--fs-lg` (1.15rem) hoy **no se usa**: asignarlo (`dt` del glosario o `h2` de panel)
  o eliminarlo.
- Criterio: después del cambio, **nada** de la UI cambia de tamaño perceptiblemente,
  salvo donde se decida a propósito.

---

## 3. Hallazgos — color / tokens

### ⬜ Colores de rol sin tokenizar (P1)
`.sc-group[data-kind="temporal"]` usa `#8a7cae`, `[data-kind="dimension"]` usa
`#7d9a6f`, hardcodeados. La paleta multi-serie del gráfico es un array en `app.js`.

- Promover los 4 colores de rol a tokens: `--role-time`, `--role-measure` (`= --accent`),
  `--role-dim`, `--role-id` (`= --faint`), con variantes en el bloque oscuro.
- Usarlos desde `.sc-group` y, si se ve bien, desde la leyenda del gráfico.
- La paleta de 8 del gráfico: documentada en la guía §2; evaluar si vale derivarla de
  tokens o dejarla como array (se asigna por índice de serie en runtime — el array es
  legítimo).

### ✅ Contraste, foco, callouts (`?v=13`)
Contraste de enlaces subido a AA, ring de foco unificado vía `--focus`, componente
`.callout` de 3 niveles. Hecho.

---

## 4. Hallazgos — espaciado

### ⬜ `--sp-*` infrautilizado (P2 — cosmético interno)
`--sp-2/3/4/6` casi solo los usa `.callout`. El resto del espaciado es `rem`
hardcodeado. Barrido de bajo riesgo: reemplazar por tokens donde el valor ya coincide
con la escala de 4 px (no cambia nada visual, deja el próximo ajuste consistente). Sin
urgencia.

---

## 5. Movimiento — propuesta

Objetivo: **micro-transiciones + 2–3 momentos deliberados**, manteniéndolo simple.
Presupuesto permanente en la guía §6.

### ⬜ Base
```css
:root { --t-fast: 120ms ease; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ⬜ Micro (hoy instantáneas → `--t-fast`)
`transition: color var(--t-fast), border-color var(--t-fast)` en: enlaces,
`.tabs button`, `button`, `.tpl-group button`, `.sc-chip`, `.history-item`,
`.theme-toggle`. El flash `.sc-chip.copied` gana un fade de salida (`opacity` +
`color` sobre `--t-fast`, con el `setTimeout` que ya existe en `app.js`).

### ⬜ 3 momentos deliberados
Todos parten de un **estado visible en reposo** — nunca `opacity:0` esperando un
`IntersectionObserver`.

1. **Revelado de `#workspace`** al cargar el primer archivo: `opacity 0→1` +
   `translateY(4px)→0` en 150 ms, **una sola vez** (clase que se agrega al quitar
   `hidden`, o animación CSS que corre al mostrarse).
2. **Cambio de pestaña**: crossfade de 100–120 ms del `.panel` que aparece
   (`opacity` sobre el panel entrante; el saliente se sigue ocultando con `hidden`).
3. **Callouts dinámicos** (`#file-error`, `#chart-note`): entran con `opacity` +
   `translateY(4px)` sobre `--t-fast` en vez de aparecer de golpe.

### ❌ Explícitamente fuera
Revelados por scroll, parallax, skeleton loaders (el punto del motor ya comunica
«cargando»), spinners, transición de página `index` ↔ `glosario`, cualquier loop.

### Verificación
Emular `prefers-reduced-motion: reduce` → sin transiciones ni fades, la app funciona
igual. Con motion normal: cada momento se ve **una vez**, sin salto de layout.

---

## 6. Texto explicativo — propuesta

Mantener simple. Inventario actual y regla de capas: guía §7. Añadidos acotados:

### ⬜ Callout «primera vez» bajo el drop-zone
Una línea que consolida confianza y señala el camino de cero fricción:

> **nota** — El archivo se procesa en tu navegador; no se sube a ningún servidor.
> ¿Sin datos a mano? Generá una relación sintética abajo.

`.callout` neutro. Se puede ocultar con `localStorage` después de la primera carga
(opcional).

### ⬜ Descripción viva del generador
Bajo el `<select id="synth-shape">`, un texto chico (`.hint` o `.muted`) que **cambia
con la selección** y lista las columnas que produce esa forma:

| Forma | Produce (encabezados reales, `app.js`) |
|---|---|
| serie agregada mensual | `periodo, segmento, serie, valor, unidades` |
| panel diario multi-entidad | `entidad, fecha, m1, m2, m3` |
| registro de eventos | `ts, entidad, evento, valor` |
| métrica con quiebres | `fecha, valor, es_outlier, regimen` |

Reusa metadata que ya existe en el generador (`synthSerie`/`synthPanel`/`synthEventos`/
`synthQuiebres`, `SHAPES` en `app.js`).

### ⬜ *(opcional)* `<details>` «cómo funciona»
3 bullets en el pie o bajo el drop-zone: **cargás** un CSV/Parquet/Excel → `consulta`
lo **perfila** en una pasada → **consultás** con SQL. Colapsado por defecto.

### ❌ No agregar un `?` a la vista de inicio
El tagline + los `abbr` + el glosario alcanzan. La home se mantiene despejada.

---

## 7. Briefs para nano banana

`consulta` no tiene favicon, ni tarjeta social, ni banner. Estos son los prompts
**listos para pegar** en nano banana (Gemini 2.5 Flash Image). En inglés —el modelo
rinde mejor—; glosa en español arriba de cada uno.

### Restricciones de estilo — incluir en TODOS los prompts

Pegar este bloque al final de cada prompt:

```
STYLE CONSTRAINTS (strict):
- Flat vector illustration in the register of a technical documentation diagram or an
  engineering spec sheet. NOT a 3D render, NOT a photo, NOT a glossy app-store icon.
- No gradients. No drop shadows. No bevels. No ambient occlusion. No paper/noise texture.
- Sharp corners only — no rounded rectangles anywhere.
- Color palette, use ONLY these four:
    teal  #0F6D80  (single accent — use sparingly)
    ink   #1F1F22  (lines, text)
    paper #F7F8F8  (background)
    grey  #5F6368  (secondary lines, secondary text)
- 1px hairline strokes for rules and boxes. Generous white space. Calm, sparse, precise.
- Any lettering must look like IBM Plex Mono (monospaced, geometric, medium weight),
  lowercase.
- Deliver on a solid #F7F8F8 background (not transparent unless stated).
```

Límites conocidos de nano banana: el texto chico sale impreciso y los hex no son
exactos. Plan: generar, y si el lettering o el color no quedan, **retocar en un editor
SVG / Figma** o aceptar la aproximación. Pedir siempre 3–4 variantes.

---

### 7.1 Favicon / ícono

**Glosa:** una marca abstracta para la pestaña del navegador. Un caret de prompt sobre
un glifo de tabla. Teal, legible a 16 px.

**Prompt:**
```
A minimal app favicon mark on a 1024x1024 canvas, centered, with ~15% padding.
The mark: a monospaced "greater-than" prompt caret ( > ) in teal #0F6D80, sitting to
the left of a simple 3-row table glyph drawn as three stacked horizontal 1px ink lines
of decreasing width. The whole mark reads as "a query over a table". Strong silhouette
that stays legible when scaled down to 16x16 pixels. Nothing else in the frame.
Deliver 4 variants: (a) caret + table side by side, (b) caret above the table,
(c) caret formed by the table's own rows converging, (d) a magnifying lens outline
over two table columns.
[+ STYLE CONSTRAINTS block]
```

**Salida:** PNG 1024². **Cómo entra:** trazar a `favicon.svg` (Illustrator / Figma /
`potrace`), guardar en la raíz del repo. Añadir a los dos `<head>`:
```html
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0f6d80">
```
Opcional: `favicon-180.png` para `apple-touch-icon`.

**Aceptación:** distinguible a 16 px en pestaña clara y oscura; una sola forma, sin
detalle que se pierda; teal como único color además de tinta.

---

### 7.2 Tarjeta social (Open Graph)

**Glosa:** la imagen que aparece cuando se comparte la URL en LinkedIn / Slack / X.
1200×630. Wordmark a la izquierda, UI plana estilizada a la derecha.

**Prompt:**
```
A 1200x630 social share card, landscape, on a solid #F7F8F8 background with a 1px
#E3E3E6 inner border inset ~24px from the edge.
LEFT HALF: the word "consulta" in large lowercase monospaced lettering, ink #1F1F22.
Below it, smaller grey #5F6368 monospaced text: "SQL sobre CSV y Parquet, en el
navegador". Below that, a short teal #0F6D80 underline rule.
RIGHT HALF: a flat, schematic depiction of a two-pane data tool — a small SQL editor
box (a few lines of monospaced code, one line tinted teal) stacked above a result
table (header row on a light grey fill, 4-5 body rows, right-aligned numeric column
with tabular figures). All drawn with 1px hairlines. One teal accent: the active tab
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
acento teal; se distingue de las mil tarjetas con gradiente violeta.

---

### 7.3 Banner de README

**Glosa:** imagen de cabecera del `README.md` (GitHub la renderiza). Más ancha, misma
familia visual, un poco más de aire.

**Prompt:**
```
A 1280x400 wide banner on a #F7F8F8 background.
Concept: "from raw file to clean answer", read left to right.
LEFT: a loose stack of ragged comma-separated text lines in grey #5F6368 — a raw CSV,
slightly misaligned, some quotes and semicolons, deliberately messy.
CENTER: a thin teal #0F6D80 arrow, or a bracket, marking the transformation.
RIGHT: a tidy result table with an uppercase monospaced header row, aligned columns,
right-aligned numbers, one row subtly highlighted. Crisp 1px hairlines.
The eye should travel messy -> tidy. No title text needed (the README supplies it).
Wide margins top and bottom.
[+ STYLE CONSTRAINTS block]
```

**Salida:** PNG 1280×400 (o 2560×800 para retina, mismo aspecto). **Cómo entra:**
`docs/banner.png`, en la línea 7 del `README.md`, encima de `docs/captura.jpg` (la
captura real se mantiene más abajo, como «esto es de verdad»).

**Aceptación:** cuenta la historia sin texto; se ve bien en el ancho de columna de
GitHub (~900 px); no compite con la captura real.

---

### 7.4 Ilustraciones de conceptos

**Glosa:** 3 diagramas cuadrados chicos para explicar conceptos del glosario.
**Advertencia:** el estilo de `consulta` es plano y preciso; una ilustración generada
puede desentonar. Recomendación: **generar como referencia y redibujar en SVG a mano**,
o usarlas **solo en el README**, no en el glosario (que es texto puro y funciona así).

**Prompt (los tres en una corrida, para que sean consistentes):**
```
Three separate square 800x800 diagrams in one consistent flat style, each on a
#F7F8F8 background, each captioned with one lowercase monospaced word at the bottom.

1. "columnar" — contrast row storage vs column storage: on the left, a table with one
   horizontal row bracket highlighted; on the right, the same table with one vertical
   column bracket highlighted in teal #0F6D80. A small label: "por filas" vs "por
   columnas".

2. "cliente" — a simple browser window outline (tab + address bar as 1px shapes)
   containing a tiny table and a gear/engine glyph, with a struck-through cloud/server
   icon outside it and a broken connection line. Meaning: all processing happens in
   the browser, nothing goes to a server.

3. "cte" — three stacked labeled boxes connected top-to-bottom by short arrows:
   "paso 1 · resumen" -> "paso 2 · participación" -> "paso 3 · ranking". The final
   box outlined in teal. Meaning: a query built in named steps.

Keep all three visually identical in stroke weight, spacing and type.
[+ STYLE CONSTRAINTS block]
```

**Salida:** 3 × PNG 800² → redibujar a `docs/glosario/columnar.svg`,
`docs/glosario/cliente.svg`, `docs/glosario/cte.svg`. **Cómo entran:** en el README
(sección «Diseño» o una nueva «Conceptos»), o como `<img>` dentro de los `<dd>`
correspondientes del glosario **solo si** el redibujo SVG queda impecable.

**Aceptación:** los tres indistinguibles en peso de trazo y tipografía; cada uno se
entiende en 2 segundos sin leer; no rompen el registro plano del sitio.

---

## 8. Prioridad y secuencia

Cada ítem es su propio commit con bump `?v=N` (salvo los `.md` y los assets, que no
afectan el runtime).

| Prio | Ítem | Sección |
|---|---|---|
| **P0** | ✅ Auto-alojar fuentes (cierre offline) — `?v=18` | §2 |
| **P0** | Favicon + `theme-color` | §7.1 |
| **P0** | Tarjeta OG + meta tags | §7.2 |
| **P1** | Consolidar la escala tipográfica | §2 |
| **P1** | Tokens de rol (`--role-*`) | §3 |
| **P1** | Presupuesto de movimiento (base + micro + 3 momentos) | §5 |
| **P2** | Barrido de `--sp-*` | §4 |
| **P2** | Texto explicativo (callout primera-vez + generador) | §6 |
| **P2** | Banner de README | §7.3 |
| **P2** | Ilustraciones de conceptos | §7.4 |

---

## 9. Verificación (por ítem, al ejecutar)

- **Fuentes** ✅ (`?v=18`): verificado — DevTools → Network → **cero** peticiones a
  `fonts.googleapis.com` / `fonts.gstatic.com`; todas las fuentes salen de
  `…/consulta/vendor/fonts/`. Con la red cortada el sitio se ve igual.
- **OG:** pegar la URL de Pages en un validador de vista previa (LinkedIn Post
  Inspector, Slack, X card validator). `docs/og-consulta.png` accesible por HTTPS y
  ≤ 1 MB.
- **Favicon:** pestaña del navegador en tema claro y oscuro; `theme-color` visible en
  la barra de Chrome Android.
- **Movimiento:** emular `prefers-reduced-motion: reduce` (DevTools → Rendering) → sin
  transiciones. Con motion normal: cada momento corre **una vez**, sin `layout shift`
  (panel de Performance).
- **Escala tipográfica:** captura antes/después de cada vista → diff visual; nada
  cambia de tamaño salvo lo decidido.
- **Tokens de rol:** el panel Esquema y la leyenda del gráfico se ven idénticos antes
  y después (solo cambia de dónde sale el color).
