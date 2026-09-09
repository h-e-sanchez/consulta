# Roadmap — consulta

Estado al **2026-09-08**. El sitio está en vivo
([`h-e-sanchez.github.io/consulta`](https://h-e-sanchez.github.io/consulta/)) y
funcional. Este archivo se edita a mano: marcá las casillas y elegí el camino de
cada sesión.

---

## Caminos A → B → C — **los tres cerrados 2026-09-08** (`?v=7`)

> Una sesión por camino. El bloque de trabajo planificado quedó completo; lo que
> sigue está en los backlogs P1/P2 de abajo.

### ☑ Camino A — Gráfico — **hecho 2026-09-08** (`?v=5`)

- [x] **Zoom en el gráfico** — arrastrar para seleccionar un rango del eje X y
      re-encuadrar; doble clic o botón «reset zoom» para volver.
- [x] **Etiquetas de datos** — valor sobre cada punto/barra/último punto de serie,
      con toggle on/off; se ocultan (con aviso) sobre 40 valores.
- [x] Leyenda para barras (agrupadas por serie) y dispersión (coloreada por serie)
      cuando hay columna de serie.
- [x] Botón «descargar SVG» — clona el SVG, resuelve los `var(--…)` a color y embebe
      las reglas de tipografía para que se vea igual fuera de la página.
- [ ] Relleno pendiente: tooltip al pasar por un punto; más marcas en el eje Y.

### ☑ Camino B — Offline — **hecho 2026-09-08** (`?v=6`) — **P0 cerrado**

- [x] **`vendor/duckdb/` con el runtime completo.** Glue ESM bundleado con
      `apache-arrow@17` (paso puntual de esbuild) + `duckdb-{mvp,eh}.wasm` +
      los dos workers. `app.js` apunta `selectBundle()` a `LOCAL_BUNDLES` y solo cae
      a `getJsDelivrBundles()` si el runtime local falla. Peso real: **~75 MB al
      repo** (los .wasm raw pesan 34–39 MB c/u; el descargable es ~7 MB gzip). Se
      quitó `vendor/*.wasm` del `.gitignore`.
- [x] Verificado: el access log del server local solo registra `/vendor/duckdb/*`
      (glue + eh.worker + eh.wasm), cero peticiones a jsDelivr. El `mjs` del bundle
      se renombró a `.js` (Python `http.server` sirve `.mjs` como `text/plain` y el
      navegador lo rechaza como módulo).
- [x] Documentado en `README.md`, `glosario.html` (#vendor) y `vendor/README.md`
      (cómo regenerar al subir de versión).
- [x] **Cierre completo (`?v=18`):** las tipografías IBM Plex también van
      auto-alojadas (`vendor/fonts/`, subset latin, `@font-face`). El sitio ya **no
      hace ninguna petición saliente**.

### ☑ Camino C — Persistencia y perfilado — **hecho 2026-09-08** (`?v=7`)

- [x] **Guardar la última consulta** en `localStorage` (`consulta:last-sql`) y
      restaurarla al cargar una relación (no se auto-ejecuta: puede referir a otras
      columnas).
- [x] **Historial** — `consulta:history`, últimas 15 consultas, dedup, clickeables,
      botón «limpiar». Bloque bajo el panel «Ver la consulta que se ejecutó».
- [x] **Matriz de correlación** (Pearson) entre numéricas en el perfilado: hasta 8
      columnas, una sola consulta con `corr()`, heatmap por `|r|` con `color-mix`.
- [x] Helper `LS` con `try/catch` en toda lectura/escritura (modo privado / cuota).

### Relleno hecho

- [x] Persistir el **tipo de gráfico** (`consulta:chart-type`) y el toggle de
      **etiquetas** (`consulta:chart-labels`) entre sesiones. Los ejes no: son
      posicionales, no se traducen entre consultas distintas.

### Relleno pendiente (cualquier sesión futura)

- [ ] Atajo para copiar una celda de una tabla al portapapeles.
- [ ] En «pega encabezados», detectar separador (`,` `;` tab) automáticamente. *(ya
      lo hace parcialmente — revisar TSV)*

---

## Backlog P1 — robustez y uso

- [x] **Gráfico: zoom** (arrastrar rango en X) y **etiquetas de datos** (toggle) —
      Camino A, 2026-09-08.
- [x] **Gráfico:** leyenda en barras/dispersión con serie; descargar SVG — Camino A.
- [ ] **Gráfico:** más marcas de eje; tooltip al pasar por un punto.
- [ ] **Progreso de consulta.** Tiempo transcurrido; para archivos grandes, aviso de
      que la inferencia de tipos (`SAMPLE_SIZE=-1`) puede tardar — con opción de
      acotarla.
- [x] **Persistir la última consulta** (`localStorage`) e **historial** de consultas
      — Camino C, 2026-09-08.
- [ ] **Archivos grandes.** Probar 50–100 MB; ajustar `SAMPLE_SIZE` según tamaño.
- [x] **Perfilado.** Matriz de correlación entre numéricas — Camino C. Falta: marcar
      `VARCHAR` que «parecen» fechas y ofrecer castearlas.

## Backlog P2 — alcance

- [x] **Excel (.xlsx / .xls / .ods).** — hecho 2026-09-08 (`?v=10`). SheetJS 0.20.3
      vendorizado en `vendor/sheetjs/`, import dinámico, `sheet_to_csv` → mismo camino
      que un CSV. Selector de hoja para libros multi-hoja.
- [ ] **Múltiples relaciones.** Cargar más de un archivo y permitir `JOIN`.
- [ ] **Exportar el resultado a Parquet** (además de CSV).
- [ ] **Compartir por URL.** Serializar solo el SQL en el hash — nunca los datos.
- [ ] **Modo notebook.** Celdas SQL independientes encadenadas.
- [ ] **i18n mínimo.** Toggle ES / EN del copy de la interfaz.

## No hacer (por ahora)

- Autenticación o guardado en servidor — rompe el modelo client-side.
- Editor con autocompletado tipo Monaco — peso desproporcionado.
- Framework de UI — el vanilla actual entra en un archivo y se mantiene solo.

---

## Nota técnica de deploy

`?v=N` en `style.css`/`app.js` dentro del HTML salta el caché de borde de GitHub
Pages. **Bumpear el número** en cada cambio de esos archivos, o Pages sirve la
versión vieja unos minutos.

---

## Bitácora

### 2026-09-08 — Docs de estilo alineados con `?v=23` + workflow por PR

- `docs/guia-de-estilo.md` y `docs/revision-visual-2026-09.md` reescritos: describían
  todavía «Grafito» (gris frío, mono en todo, plano, teal). Ahora reflejan la
  dirección «técnico cálido / notebook» (`?v=19`) y el acento azul pizarra (`?v=23`):
  tokens cálidos, reparto sans/mono por rol, escala 15px, `--r`/`--shadow`/`--t`,
  movimiento (ya hecho), y la restricción de estilo de los briefs de nano banana
  actualizada (paleta azul pizarra, esquinas de 4px, registro notebook).
- **Desde acá el trabajo va por PR**, agrupando commits por temática (pedido del
  dueño). Se sigue bumpeando `?v=N` y anotando esta bitácora.

### 2026-09-08 — Acento: azul pizarra (`?v=23`)

Segunda evaluación de paleta, esta vez apuntando al perfil del dueño (portafolio de
control de gestión / FP&A). Sobre una página de comparación (teal actual vs azul
pizarra vs verde petróleo, en la dirección «notebook»), se eligió **azul pizarra**:
registro de finanzas / consultoría, reconocible para un reclutador del área.

- `--accent` `#33518f` (claro) / `#8aa9e6` (oscuro). `--accent-weak` `#e7ebf5` /
  `#1a2338`. `--on-accent` sin cambios (`#fff` / `#16140f` — el azul claro del modo
  noche pide tinta oscura encima).
- Contraste: 6.7 sobre `--bg`, 6.1 sobre `--surface-2`, 6.9 texto blanco encima
  (claro); ≥7.6 en oscuro. AA holgado.
- **El teal retirado pasa a ser color de rol**: `.sc-group[data-kind="temporal"]`
  usa `#0f6d80` (antes violeta `#8a7cae`). Roles del esquema ahora: teal (fecha),
  azul (medida), verde (dimensión), gris (id) — cuatro tonos distintos.
- Neutrales cálidos, formas y tipografía de `?v=19` sin cambios.

### 2026-09-08 — Gráfico: los presets recomiendan sin ejecutar SQL (`?v=22`)

Reporte: al elegir un preset del gráfico «se cambia todo» — sobrescribía el editor
SQL, corría una consulta de agregación, saltaba de pestaña y renombraba los ejes a
`mes`/`total`.

- `chartPresets()` ahora devuelve **recomendaciones de configuración**
  `{ n, type, x, y, series, about }` derivadas de `guessRoles()` sobre las columnas de
  la **relación cargada** — no SQL.
- `loadChartPreset()` restaura `state.baseGrid` (el `SELECT *` de la relación),
  reconfigura tipo + ejes y redibuja. **No toca el editor SQL, no ejecuta nada, no
  cambia de pestaña.** El propio gráfico agrega al vuelo (suma por categoría).
- `state.baseGrid` nuevo: copia del `SELECT * LIMIT` que hace `finishIngest`; una
  consulta del usuario cambia `lastResult` pero `baseGrid` queda de referencia.
- Los botones de preset llevan `title` en lenguaje llano
  («Grafica valor a lo largo de periodo.»).
- Se perdió el rollup diario→mensual que hacía el SQL viejo; para eso están las
  plantillas de la pestaña Consulta SQL. Un «agrupar X por mes/día» en el gráfico
  queda como posible mejora.

### 2026-09-08 — Carga: elegir qué fila es el encabezado (`?v=21`)

Para CSV con filas de título / notas antes de la cabecera real (reportes exportados).

- Control **«encabezado: fila N»** en la barra de archivo (solo texto delimitado, no
  Parquet). Al cambiarlo, `reingestWithHeader()` relee el archivo **ya registrado** en
  DuckDB con `read_csv_auto(..., skip=N-1)` — sin volver a pedir el archivo.
- `state.ingest` guarda `{ virtualName, kind, displayName, ext, encNote, sizeBytes,
  headerRow }`; lo setean `loadBuffer` (CSV/Parquet) y `selectSheet` (Excel). Se limpia
  en «Cargar otro».
- `read_csv_auto` ya salta bastante basura solo; el control es para cuando su
  detección falla. Verificado: skip=1/3, vuelta a fila 1, hoja de Excel.
- Glosario: término «fila de encabezado».

### 2026-09-08 — Gráfico: títulos de eje + eje X consciente de fechas (`?v=20`)

- **Títulos de eje.** El nombre de la columna del eje X va centrado abajo; el del eje
  Y, girado a la izquierda (clase `.axis-title`, en sans). Aplica a todos los tipos
  (barras, línea, multi, área, dispersión). `pad` del SVG ampliado para el espacio.
- **Eje X con fechas.** `dateTickMode()` mira los valores crudos de la columna X:
  - todos caen el **día 1** → serie **mensual** → rótulo `"sep 26"` (mes en español +
    año de 2 dígitos), horizontal.
  - todos a **medianoche** pero no día 1 → **diaria** → fecha ISO `2026-09-08`, girada.
  - con hora → `2026-09-08 14:30`, girada.
  - Rótulos cortos (≤8) van horizontales y más densos; los largos, girados −40°.
- La descarga a SVG embebe el estilo de `.axis-title`.

### 2026-09-08 — Nueva dirección visual: «técnico cálido / notebook» (`?v=19`)

El dueño del repo encontró la identidad «Grafito» (plana, gris, mono en todo)
demasiado *fome*. Se pivotó a un registro de **cuaderno analítico moderno**:

- **Tipografía por rol.** IBM Plex **Sans** para toda la interfaz y los títulos;
  IBM Plex **Mono** reservado a datos, SQL y código (tabla, editor, nombres de
  columna/archivo, chips de esquema, `code`, `dt` del glosario). El `h1` pasa de mono
  1.5rem a sans 2rem con tracking ajustado.
- **Paleta cálida.** Papel tibio `#fbfaf7` (antes `#f7f8f8` frío), grises y tinta
  cálidos; oscuro `#16140f`. El acento teal no cambia.
- **Formas.** Esquinas de 4px (`--r`) y una sombra apenas perceptible (`--shadow`) en
  las superficies elevadas (drop-zone, tablas, celdas de esquema). Antes: todo a 0.
- **Escala.** Base 15px, ratio ~1.25, más contraste entre `h1`/`h2`/cuerpo.
- **Movimiento.** Micro-transiciones ≤130ms (`--t`) en hover/foco; `#workspace` y los
  paneles entran con un fade corto; `@media (prefers-reduced-motion: reduce)` global.
- **Selects nativos** con chevron propio (antes se veía el widget crudo del SO).
- Sin fuentes nuevas — sigue 100 % offline. Estructura y acento intactos.

(Los docs `docs/guia-de-estilo.md` y `docs/revision-visual-2026-09.md` quedaron
alineados con esta dirección en el commit de docs del 2026-09-08.)

### 2026-09-08 — Tipografías IBM Plex auto-alojadas — cierre 100 % offline (`?v=18`)

Era el único fetch externo que quedaba. Ahora `consulta` no hace **ninguna** petición
saliente.

- **`vendor/fonts/`** — 4 woff2, subset **latin**, ~89 KB: `ibm-plex-mono-400/500/600`
  (estáticos) + `ibm-plex-sans.woff2` (**fuente variable**, un archivo cubre 400–600).
  Bajados del `css2` de Google con UA de Chrome. Licencia OFL.
- **`style.css`** — bloque `@font-face` (×4) al inicio, `font-display: swap`.
  `--mono`/`--sans` sin cambios (mismos nombres de familia).
- **`index.html` + `glosario.html`** — fuera los 2 `preconnect` + el `<link>` de
  Google Fonts; en su lugar 2 `<link rel="preload">` (Mono 400 + Sans) que arrancan la
  descarga junto con el CSS. `style.css`/`app.js` a `?v=18`.
- Sin `size-adjust`/`ascent-override`: mismo origen, sin DNS/TLS, el `swap` casi no se
  nota. Pulido opcional a futuro.
- `.gitattributes` (`vendor/fonts/** binary`), `vendor/README.md` (sección + regenerar),
  `README.md` («Operación aislada» ES + EN), `docs/revision-visual-2026-09.md` §2 y
  `docs/guia-de-estilo.md` §3 actualizados.

### 2026-09-08 — Documentación de estilo: guía viva + revisión con fecha

Sin cambios de código. Se consolidó la identidad visual (repintado teal `?v=15`,
día/noche `?v=16`, pesos de fuente `?v=17`) en dos documentos:

- **[`docs/guia-de-estilo.md`](docs/guia-de-estilo.md)** — la referencia viva:
  tokens de color (claro/oscuro), reparto tipográfico y escala, espaciado, snippets
  canónicos de cada componente, presupuesto de movimiento, principios de texto
  explicativo, y un checklist para reusar la identidad en el próximo repo del
  portafolio. Complementa a `referencias-estilo.md` (que es investigación).
- **[`docs/revision-visual-2026-09.md`](docs/revision-visual-2026-09.md)** — la
  auditoría con fecha y la cola de trabajo (`✅`/`⬜`/`❌`): auto-alojar las woff2
  (cierre 100 % offline, P0), la escala `--fs-*` bypasseada por ~20 `font-size`
  hardcodeados, colores de rol sin tokenizar, propuesta de movimiento (micro +
  3 momentos, siempre con `prefers-reduced-motion`), 2–3 añadidos de texto
  explicativo, y **briefs listos para pegar en nano banana** (favicon, tarjeta OG,
  banner de README, ilustraciones de conceptos) con restricciones de estilo
  incrustadas. Prioridad y secuencia al final.

### 2026-09-08 — Defecto siempre claro + revisión de tipografía (`?v=17`)

**Tema:** el defecto es **siempre "día"**, sin mirar `prefers-color-scheme`. Se quitó
el bloque `@media (prefers-color-scheme: dark)`; el oscuro se activa solo por
`:root[data-theme="dark"]` (elección explícita, persistida). Se agregó
`color-scheme: light` / `dark` para que los controles nativos (`select`) sigan al
tema, no al SO.

**Tipografía — auditoría:**
- **Pesos cargados que no se usaban:** IBM Plex Sans venía en `400;450;500;600`. En
  todo el CSS, *cada* `font-weight: 500/600` cae en contexto monoespaciado (títulos,
  tablas, `dt`). Sans solo se usa a **400**. Se recortó la URL a Sans `400;600` — el
  `600` queda para `b, strong`, ahora explícito (antes el navegador sintetizaba una
  700 falsa). Dos archivos de fuente menos por carga.
- IBM Plex Mono `400;500;600`: los tres se usan (cuerpo mono / `fname`,`thead` /
  títulos). Sin cambios.
- Stacks de *fallback* (`--mono`, `--sans`): correctos y multiplataforma. `swap` ya
  estaba. Sin cambio.
- Descarga de gráfico a SVG: embebe el *nombre* de familia + fallback a `monospace`,
  no el binario de la fuente. Es lo correcto para un export liviano; un SVG abierto
  sin IBM Plex usa `monospace` y sigue legible.
- **Pendiente (P1, cierre offline):** las fuentes son el único fetch externo que
  queda (Google Fonts). Auto-alojarlas (`@font-face` + woff2 en `vendor/fonts/`)
  cierra el 100% offline. ~4 archivos woff2 latin (~180–220 KB). No hecho aún.

### 2026-09-08 — Interruptor día / noche (`?v=16`)

- Botón `#theme-toggle` en la cabecera (arriba a la derecha) en `index.html` y
  `glosario.html`. Alterna claro ↔ oscuro y **persiste la elección** en
  `localStorage` (`consulta:theme`).
- Lógica en un `<script>` inline en el `<head>` de cada página (glosario no carga
  `app.js`): corre **antes del primer render** para no parpadear, estampa
  `data-theme` en `<html>`, sigue al SO mientras no haya elección explícita.
- CSS: los tokens oscuros ahora se aplican por
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` **y** por
  `:root[data-theme="dark"]`, así una elección a mano gana en ambos sentidos.
- `app.js` escucha `consulta:themechange` y redibuja el gráfico (colores embebidos
  del SVG + descarga).

### 2026-09-08 — Paleta: neutrales fríos estilo Google + acento teal (`?v=15`)

Cierre de la investigación `docs/referencias-estilo.md` con una decisión de paleta,
tomada sobre una página de comparación (los 3 acentos candidatos sobre un facsímil de
la UI, en claro y oscuro, con contrastes WCAG).

- **Neutrales compartidos (para éste y próximos repos), alineados a la spec de
  documentación de Google:** fondo casi blanco `#f7f8f8` / `--surface #ffffff`,
  `--surface-2 #f1f3f4`, `--muted #5f6368` (gris secundario exacto de Google),
  divisores de 1px, cero sombras. Oscuro: `--bg #0e0e10` … `--muted #9a9da3` (registro
  Linear/Vercel: hairline sin sombra).
- **Acento teal:** `--accent #0f6d80` (claro) / `#3fbcd4` (oscuro). Contraste
  ≥5.5:1 sobre `--bg` y `--surface-2`, 6.2:1 con texto blanco encima (botón). Lee
  «herramienta de datos» sin copiar a nadie (DuckDB usa amarillo).
- `--accent-weak` re-teñido (`#e1eef1` / `#122a30`). `--error` terracota sin cambios
  (rojo semántico, complementa al teal).
- Esquema de columnas: `temporal` pasa de azul-gris a violeta `#8a7cae` para no
  confundirse con el teal; `medida` sigue el acento. Paleta multi-serie del gráfico
  recompuesta como set categórico que arma con el teal (coral, oro, salvia, violeta…).
- Sin tocar tipografía (IBM Plex Mono/Sans) ni el registro plano «ficha técnica».

### 2026-09-08 — Fix: los ejes del gráfico se elegían por «la primera columna de cada tipo» (`?v=14`)

- Reporte: con un CSV real ancho (nómina) el gráfico agrupaba por `Fecha Ingreso` en
  vez de `Periodo`, la serie era `RUT` (120 valores), y sumaba `Sueldo Base` en vez de
  `Líquido a Pagar`. Los presets salían inservibles.
- Causa: `firstOf` elegía la primera columna numérica / temporal / categórica del
  esquema, sin mirar nombre ni cardinalidad.
- **`guessRoles(cols, n)`** nuevo: puntúa cada columna por
  - **medida:** nombre (`monto|total|valor|sueldo|l[ií]quido|neto|…`), bonus por
    «final» (`líquido|neto|a pagar|…`), castigo a enteros casi-únicos **solo si el
    nombre no la declara** como medida, castigo a `id|rut|folio|…`.
  - **tiempo:** nombre (`periodo|mes|fecha|…`), fuerte bonus a `^periodo$`, preferencia
    por baja cardinalidad (un periodo se repite; una fecha por fila no).
  - **dimensión:** cardinalidad en [2, 20] preferida, castigo a `id`/nombre/near-unique.
- `refreshSchema` ahora trae `approx_count_distinct` por columna (una consulta).
- Lo usan `chartPresets`, `deriveChartDefaults`, `defaultQuery`, `templateGroups`,
  `ctePresets`. Los presets con dimensión filtran nulos (`WHERE … IS NOT NULL`) y
  «comparar dimensiones» corta en `LIMIT 30`.

### 2026-09-08 — Pulido de accesibilidad y estilo (`?v=13`)

Basado en `docs/referencias-estilo.md` (investigación de cómo Google estiliza su
documentación). Cambios de bajo riesgo, sin tocar la identidad «Grafito»:

- **Contraste de enlaces (defecto AA):** el ámbar `#a9661a` sobre `--bg` daba ~4.2:1
  (bajo el mínimo). Oscurecido a `#8f5615` → ≥5:1 en todas las superficies claras.
  Los enlaces del cuerpo pasan a color de texto + subrayado tenue (siempre legible),
  ámbar al `:hover`; los del pie a `--muted`. El ámbar queda para acentos deliberados
  (botones, pestaña activa, `dt` del glosario, siglas del subtítulo).
- **Foco de teclado:** ring unificado `outline: 2px solid var(--accent); offset 2px`
  vía token `--focus`, aplicado también a `a`, `summary` y `.file-button:focus-within`.
- **«Elegir archivo» accesible:** el `<input type=file>` estaba en `display:none`
  (no enfocable por Tab). Ahora va oculto a la vista pero enfocable.
- **Callouts:** componente `.callout` / `.callout--warn` / `.callout--danger`
  (border-left + fondo tenue con `color-mix` + label mono). El `#file-error` pasa a
  callout de peligro; nota introductoria en `glosario.html`.
- **Tokens** `--fs-*` (escala ~1.2) y `--sp-*` (ritmo 4px) en `:root`, aplicados a
  encabezados y callouts. `.panel .hint` y el texto del glosario acotados a ~46–68ch.

### 2026-09-08 — Fix: los presets de gráfico rompían con nombres de columna con espacios (`?v=12`)

- Reporte: al hacer clic en un preset, el gráfico se rompía.
- Causa: `chartPresets()` generaba `SELECT "region comercial" AS region comercial` —
  el alias `AS ${dim}` sin comillas es un error de sintaxis con nombres con espacio o
  reservados. La consulta fallaba, `runQuery` volvía sin re-sincronizar, y
  `loadChartPreset` seguía adelante forzando el tipo sobre `state.lastResult` viejo →
  gráfico roto. El error solo se veía en la pestaña Consulta SQL, que el usuario no
  estaba mirando.
- Fix: los dos presets con dimensión ya no aliasan el campo (`${qid(dim)}` conserva
  el nombre solo). Además `runQuery` devuelve `true/false` y `loadChartPreset` corta
  a la pestaña Consulta SQL si el preset falla, en vez de dejar un gráfico roto.

### 2026-09-08 — Fix: el gráfico quedaba con las columnas del dataset anterior (`?v=11`)

- Reporte: al cargar una nueva base, los selectores de eje del Gráfico seguían
  mostrando `mes`/`total` (o lo que fuera) del dataset previo — parecía hardcodeado.
- Causa: `finishIngest` reconstruía los presets pero nunca re-sembraba
  `state.lastResult` ni llamaba a `syncChartControls`; el SVG y los `<select>` de eje
  quedaban con el estado anterior (`state.lastResult` solo lo setea `runQuery`).
- Fix: `finishIngest` ahora siembra `state.lastResult` con
  `SELECT * FROM datos LIMIT 20000` (`CHART_ROW_CAP`) y llama `syncChartControls()`
  — el gráfico arranca sobre la tabla recién cargada, con sus columnas reales en los
  ejes; una consulta lo reemplaza como antes.
- Además: sin preferencia guardada, el tipo de gráfico por defecto es **línea** si
  hay una columna temporal (antes siempre barras → 200 barras ilegibles con datos
  crudos). Hint del panel actualizado.

### 2026-09-08 — Excel / ODS por hojas (`?v=10`)

- **SheetJS 0.20.3** vendorizado en `vendor/sheetjs/xlsx.esm.js` (del CDN propio de
  SheetJS, no del `xlsx@0.18.5` de npm con CVEs). Import **dinámico** — los ~985 KB
  solo cargan al abrir una planilla.
- `loadBuffer` ramifica por extensión: `xlsx`/`xls`/`ods` → `loadWorkbook` →
  `sheetjs.read` → `selectSheet` convierte la hoja a CSV con `utils.sheet_to_csv` y
  la pasa por el tramo común nuevo **`finishIngest`** (mismo camino que un CSV).
- Selector `#sheet-picker` en la barra de archivo, visible solo con ≥2 hojas; el
  libro queda en `state.workbook` para cambiar de hoja sin re-parsear. «Cargar otro»
  lo limpia.
- `.gitattributes` ampliado a `vendor/** binary`.

### 2026-09-08 — Esquema visual + enlaces al glosario (`?v=9`)

- Las siglas del subtítulo (SQL / CSV / Parquet) ahora enlazan al glosario
  (`glosario.html#sql|#csv|#parquet`) — antes eran solo `<abbr title>` sin destino.
- Panel **«Esquema»** al inicio del Perfilado (`renderSchemaTree`): agrupa las
  columnas por rol — Fechas (`temporal`), Medidas, Dimensiones, Identificadores
  (cardinalidad ≥ `max(50, 0.9·filas)` y texto o entero — un DOUBLE casi-único
  sigue siendo medida). Chips con `tipo · N dist.`, clic para copiar el nombre.
  La tabla grande pasó a «Detalle por columna».

### 2026-09-08 — Fix: CSV no-UTF-8 (`?v=8`)

- Reporte: un CSV real fallaba con «Invalid unicode (byte sequence mismatch)» —
  DuckDB lee CSV como UTF-8 estricto y la planilla venía en Windows-1252.
- `normalizeTextBytes()` en `loadBuffer`: detecta BOM (UTF-8/UTF-16 LE/BE), valida
  UTF-8 con `TextDecoder({fatal:true})` y si falla cae a `windows-1252` (nunca falla
  byte a byte). Registra siempre bytes UTF-8. La barra de archivo muestra
  «reinterpretado desde …» cuando hubo conversión.
- Verificado con CSV en cp1252, UTF-16 LE (BOM) y UTF-8 (BOM); UTF-8 limpio pasa sin
  tocar. Pendiente relacionado: **soporte de Excel (.xlsx) con selección de hoja** —
  ver backlog P2.

### 2026-09-08 — Camino C (persistencia y perfilado)

- Helper `LS` (get/set con `try/catch`, prefijo `consulta:`). `runQuery()` guarda
  `last-sql` y llama `pushHistory()` al terminar OK; `loadBuffer()` restaura la
  última consulta en el editor (sin ejecutar) y pinta el historial.
- Historial: `#history` bajo `#explain-panel`, botones de una línea (title = SQL
  completo), click → carga en editor + tab Consulta. Dedup, tope 15, «limpiar».
- `renderCorrelation()` en `renderProfile()`: `corr()` de cada par (i<j) en una
  consulta, tabla NxN con `color-mix(in srgb, var(--accent) |r|·65% …)`. Oculta si
  hay < 2 numéricas; tope de 8 columnas.
- Persistencia de gráfico: `chart-type` y `chart-labels` a `localStorage`;
  `syncChartControls()` restaura el tipo antes de `deriveChartDefaults()`.

### 2026-09-08 — Camino B (offline, P0)

- Runtime de DuckDB-WASM auto-alojado en `vendor/duckdb/`: `duckdb-wasm.js` (glue
  `dist/duckdb-browser.mjs` bundleado con `apache-arrow@17` vía esbuild), los dos
  `.wasm` y los dos workers `.js`. `vendor/README.md` documenta la regeneración.
- `app.js`: import del glue local; `LOCAL_BUNDLES` + `instantiateFrom()` con el
  worker cargado por `importScripts` de URL absoluta; fallback a `getJsDelivrBundles()`
  si el runtime local no carga. Se quitó `vendor/*.wasm` del `.gitignore`.
- Gotcha: el bundle salió como `.mjs` y `python -m http.server` lo sirve como
  `text/plain` → el navegador lo rechaza como módulo. Renombrado a `.js`.
- Peso real vs. el estimado del roadmap: los `.wasm` raw son 34–39 MB (no ~11 MB;
  ese número era el gzip). El repo crece ~75 MB. Decisión del candidato: committear
  ambos bundles (offline en cualquier navegador).

### 2026-09-08 — Camino A (gráfico)

- **Zoom del eje X por arrastre** (`chartZoom`, siempre referido al dominio completo):
  categórico recorta la ventana de categorías, dispersión recorta el dominio numérico.
  Rect transparente `#chart-zoom-capture` sobre el área de plot captura el drag; botón
  «reset zoom» + doble clic para volver; se resetea al cambiar tipo/ejes o consulta.
- **Etiquetas de datos** con toggle (`#chart-labels`): barras, área (total apilado),
  línea (solo la última serie) y dispersión; tope de 40 con aviso en `#chart-note`.
- **Leyenda por serie** extendida a barras (ahora agrupadas por serie: `bw` repartido
  entre grupos) y a dispersión (puntos coloreados por la categórica elegida).
- **Descarga a SVG autónomo** (`downloadChartSvg`): resuelve `var(--…)` a color vía
  `getComputedStyle` y embebe un `<style>` con la tipografía.
- Los avisos del gráfico pasan a `setChartNote()`; `updateChartUiState()` solo maneja
  la visibilidad del selector de serie.

### 2026-09-08 — v2 y v3

- Publicado como repo **público** + **GitHub Pages**.
- **v2:** generador de 4 formas sintéticas (serie mensual · panel diario · registro
  de eventos · métrica con quiebres), perfilado enriquecido (cuantiles, % de ceros,
  desglose por dimensión), 9 plantillas de consulta, asistente de CTEs, 5 tipos de
  gráfico.
- **v3:** glosario (`glosario.html`), definiciones del perfilado con `?` y tooltips,
  3 presets de CTE, 3 presets de gráfico, re-derivación de ejes según el tipo.
- Estilo **«Grafito»** — IBM Plex Mono para títulos, IBM Plex Sans para el cuerpo,
  acento ámbar, todo plano.

### 2026-09-07

- Creado a partir del Proyecto 3 del `portfolio-scaffold` («Laboratorio de CSV»),
  reescrito de un perfilador en JS puro a un motor SQL real (DuckDB-WASM).
