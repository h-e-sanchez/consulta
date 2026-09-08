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
- [ ] Queda como único fetch externo: las tipografías IBM Plex (Google Fonts,
      no bloqueante). Auto-alojarlas también sería el cierre completo.

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
