# vendor/ — dependencias de terceros auto-alojadas

Todo lo que `consulta` necesita en runtime vive acá, no en un CDN: el sitio corre
sin tráfico saliente, incluso en el primer arranque.

- **`duckdb/`** — el runtime de DuckDB-WASM (motor SQL).
- **`sheetjs/`** — SheetJS, para leer libros de Excel / ODS.
- **`fonts/`** — las tipografías IBM Plex (Mono + Sans), subset latin.

---

## vendor/duckdb — runtime de DuckDB-WASM

`app.js` cae a jsDelivr solo si algo de esto no carga.

## Contenido

| archivo | origen (`@duckdb/duckdb-wasm@1.29.0`) | qué es |
|---|---|---|
| `duckdb-wasm.js` | `dist/duckdb-browser.mjs` **bundleado** con `apache-arrow@17.0.0` | glue ESM; expone `AsyncDuckDB`, `selectBundle`, `getJsDelivrBundles`, … |
| `duckdb-mvp.wasm` | `dist/duckdb-mvp.wasm` | binario del motor, build MVP (navegadores sin wasm exceptions) |
| `duckdb-eh.wasm` | `dist/duckdb-eh.wasm` | binario del motor, build EH (el que usan los navegadores actuales) |
| `duckdb-browser-mvp.worker.js` | `dist/duckdb-browser-mvp.worker.js` | worker que hostea el binario MVP |
| `duckdb-browser-eh.worker.js` | `dist/duckdb-browser-eh.worker.js` | worker que hostea el binario EH |

No se vendoriza `duckdb-coi.wasm` (build con threads / cross-origin isolation):
GitHub Pages no manda las cabeceras COOP/COEP que necesita.

El sitio **no tiene paso de build**. Solo regenerar este directorio al subir de
versión necesita Node.

## Regenerar (al actualizar DuckDB-WASM)

```bash
# 1. instalar el paquete en un node_modules temporal (gitignoreado)
npm install @duckdb/duckdb-wasm@<versión>

# 2. bundlear el glue ESM con apache-arrow adentro
#    (el .mjs del paquete importa "apache-arrow" bare; un navegador sin bundler no lo resuelve)
npx esbuild node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser.mjs \
  --bundle --format=esm --platform=browser --minify --legal-comments=none \
  --outfile=vendor/duckdb/duckdb-wasm.js

# 3. copiar los 4 binarios
cp node_modules/@duckdb/duckdb-wasm/dist/{duckdb-mvp.wasm,duckdb-eh.wasm,duckdb-browser-mvp.worker.js,duckdb-browser-eh.worker.js} \
   vendor/duckdb/

# 4. borrar node_modules; verificar offline (DevTools → bloquear cdn.jsdelivr.net → recargar)
```

Si cambia la versión de `apache-arrow` que DuckDB pide, sale sola en el paso 2
(es dependencia transitiva). Si `dist/` reorganiza nombres de archivo, ajustar
`LOCAL_BUNDLES` en `app.js`.

---

## vendor/sheetjs — lectura de Excel / ODS

| archivo | origen | qué es |
|---|---|---|
| `xlsx.esm.js` | `https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs` | SheetJS Community Edition (MIT), build ESM auto-contenido; expone `read()` y `utils.sheet_to_csv()` |

`app.js` lo importa **de forma diferida** (`import()` dinámico) solo al abrir una
planilla — el usuario de CSV/Parquet no descarga los ~985 KB. Al elegir una hoja se
convierte a CSV con `utils.sheet_to_csv` y se pasa por el mismo camino de ingesta
que un CSV normal.

**Por qué el CDN de SheetJS y no npm:** la CE mantenida se distribuye por
`cdn.sheetjs.com`; el paquete `xlsx` de npm está congelado en `0.18.5`, que arrastra
CVE-2023-30533 (prototype pollution) y CVE-2024-22363 (ReDoS). **Por qué `.esm.js` y
no `.mjs`:** `python -m http.server` sirve `.mjs` como `text/plain` y el navegador
lo rechaza como módulo.

### Regenerar (al actualizar SheetJS)

```bash
curl -o vendor/sheetjs/xlsx.esm.js https://cdn.sheetjs.com/xlsx-<versión>/package/xlsx.mjs
node --check vendor/sheetjs/xlsx.esm.js   # el .mjs debe ser ESM auto-contenido (sin imports externos)
```

---

## vendor/fonts — tipografías IBM Plex

Las declara `@font-face` al inicio de `style.css`. Sin `@font-face` no hay fallback a
un CDN — si un archivo falta, el navegador cae al stack de sistema (`Consolas`/`Menlo`
para mono, `Segoe UI`/`system-ui` para sans), definido en `--mono` / `--sans`.

| archivo | origen | qué es |
|---|---|---|
| `ibm-plex-mono-400.woff2` | `fonts.gstatic.com` (subset **latin** del `css2` de Google) | IBM Plex Mono Regular |
| `ibm-plex-mono-500.woff2` | ídem | IBM Plex Mono Medium (`.fname`, `thead`) |
| `ibm-plex-mono-600.woff2` | ídem | IBM Plex Mono SemiBold (títulos) |
| `ibm-plex-sans.woff2` | ídem | IBM Plex Sans **variable** (un archivo cubre 400–600); cuerpo + `b, strong` |

Licencia **SIL Open Font License 1.1** — redistribuir dentro del repo está
explícitamente permitido.

**Subset:** solo `latin` (`U+0000–00FF` + puntuación tipográfica). Cubre todo el
español. Los símbolos sueltos de la UI (`→ ∅ ◐ ✓ ≥ ×`) caen a fuente de sistema — IBM
Plex Mono tampoco los trae, así que no cambia nada.

### Regenerar (al actualizar IBM Plex)

```bash
mkdir -p vendor/fonts
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
# el css2 de Google, con UA moderno, devuelve woff2 agrupados por subset (/* latin */, …)
curl -s -H "User-Agent: $UA" \
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;600&display=swap'
# de la salida, tomar la URL .woff2 que sigue a cada comentario `/* latin */`:
#   Mono 400 / 500 / 600  → 3 archivos estáticos distintos
#   Sans 400 y Sans 600   → la MISMA URL (fuente variable) → un solo archivo
# bajar cada una al nombre de la tabla de arriba y verificar con `file *.woff2`
```

Optimización futura (no hecha): subset a los ~120 glifos que usa el sitio con
`pyftsubset` (`fonttools` + `brotli`) → ~8–15 KB por archivo en vez de 14–45 KB.
