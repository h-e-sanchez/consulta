# Roadmap — consulta

Estado al **2026-09-08**. El sitio está en vivo
([`h-e-sanchez.github.io/consulta`](https://h-e-sanchez.github.io/consulta/)) y
funcional. Este archivo se edita a mano: marcá las casillas y elegí el camino de
cada sesión.

---

## Presupuesto: 2–3 h por camino · orden pactado A → B → C

> Una sesión por camino. Marcá lo hecho y, si sobra tiempo, sumá algo del «relleno».

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

### ☐ Camino C — Persistencia y perfilado

- [ ] **Guardar la última consulta** en `localStorage` y restaurarla al abrir.
- [ ] **Historial** — las últimas ~15 consultas, clickeables para recuperar.
- [ ] Si sobra: matriz de correlación entre columnas numéricas en el perfilado.

### Relleno (si sobra tiempo en cualquier camino)

- [ ] Persistir el tipo de gráfico y los ejes elegidos entre consultas.
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
- [ ] **Persistir la última consulta** (`localStorage`) e **historial** de consultas.
- [ ] **Archivos grandes.** Probar 50–100 MB; ajustar `SAMPLE_SIZE` según tamaño.
- [ ] **Perfilado.** Matriz de correlación entre numéricas; marcar `VARCHAR` que
      «parecen» fechas y ofrecer castearlas.

## Backlog P2 — alcance

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
