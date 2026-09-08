# vendor/duckdb — runtime de DuckDB-WASM auto-alojado

`consulta` sirve el runtime de DuckDB desde acá en vez de un CDN, así que el sitio
corre sin ningún tráfico saliente, incluso en el primer arranque. `app.js` cae a
jsDelivr solo si algo de esto no carga.

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
