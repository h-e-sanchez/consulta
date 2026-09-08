# consulta

> Consulta un CSV o un Parquet con SQL real sin instalar nada ni subir el archivo a
> ningún servidor: perfilado automático + editor SQL, todo en el navegador.

En control de gestión y people analytics, la primera pregunta ante un archivo que
acaba de llegar no es *"¿cómo automatizo esto?"* sino *"¿qué hay acá dentro?"* —
cuántas filas, qué columnas, cuántos nulos, y un `GROUP BY` rápido para entender el
orden de magnitud antes de decidir si vale la pena montar algo en Power BI o en un
notebook. **`consulta`** resuelve ese primer paso sin fricción y sin sacar el dato de
la máquina: útil incluso en una red corporativa que bloquea herramientas externas.

## Características de ingeniería

- **Motor SQL de verdad, en el navegador.** Usa [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview)
  en un Web Worker. El archivo se registra como un buffer en memoria y **nunca se
  envía a ningún servidor** — el procesamiento es 100% client-side.
- **CSV y Parquet nativos.** Inferencia de tipos escaneando el archivo completo
  (`read_csv_auto(..., SAMPLE_SIZE=-1)`); lectura columnar directa de Parquet
  (`read_parquet`).
- **Perfilado de una pasada** con `SUMMARIZE`: tipo, conteo, % de nulos, cardinalidad
  aproximada, min/max/promedio/desviación por columna.
- **Editor SQL** con dialecto DuckDB sobre la tabla `datos`, atajos de teclado
  (`Ctrl/Cmd + Enter`), sugerencias de consulta derivadas del esquema real del
  archivo, y exportación del resultado a CSV.
- **Gráfico de barras en SVG** generado a mano sobre el resultado de la consulta —
  sin librería de charting.
- **Sin build step.** HTML + un módulo JS + CSS. La única dependencia de runtime
  (DuckDB-WASM) se resuelve desde jsDelivr en la primera carga (~11 MB, luego queda
  en caché del navegador).

## Guía de uso rápido

```bash
# Servir la carpeta con cualquier servidor estático (necesario para los ejemplos:
# fetch() no funciona sobre file://).
python -m http.server 8000
# abrir http://localhost:8000
```

```sql
-- Ejemplos sobre la tabla `datos` (dialecto DuckDB)
SELECT count(*) AS filas FROM datos;

SELECT centro_costo, sum(monto) AS total
FROM datos
GROUP BY centro_costo
ORDER BY total DESC;

SUMMARIZE datos;
```

En producción se sirve tal cual vía **GitHub Pages** — no requiere paso de compilación.

## Datos de ejemplo

`data/muestra.csv` y `data/muestra.parquet` contienen el **mismo dataset sintético**
(16 filas): un presupuesto de nómina ilustrativo de 4 centros de costo × 2 meses × 2
componentes. **No proviene de ninguna organización real** — se generó a mano para
ejercitar el perfilado y las agregaciones. Cualquier parecido con cifras reales es
coincidencia.

## Nota sobre la dependencia de runtime

`consulta` prioriza *capacidad* (SQL + Parquet) sobre *cero dependencias absolutas*:
carga el runtime de DuckDB una vez desde un CDN. Para un despliegue 100% offline o en
una red que bloquee jsDelivr, los bundles de `@duckdb/duckdb-wasm` (`.wasm` + worker)
se pueden **auto-alojar** en `vendor/` y apuntar `getJsDelivrBundles()` a rutas
locales; queda como mejora pendiente.

---

## English summary

Query a CSV or Parquet file with real SQL, entirely in the browser. `consulta` runs
DuckDB-WASM in a Web Worker: the file is registered as an in-memory buffer and never
leaves the machine. Automatic one-pass profiling via `SUMMARIZE`, a DuckDB-dialect SQL
editor with schema-aware query suggestions, CSV export, and a hand-drawn SVG bar chart
over the query result — no build step, no charting library. Built as the entry point
for taking a first, serious look at a dataset before committing it to Python or Power BI.
