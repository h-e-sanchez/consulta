# consulta

> *Un cuaderno de análisis que corre entero en el navegador: perfila, consulta con SQL
> y grafica una tabla de datos —CSV, Parquet o Excel— sin backend, sin ingesta y sin
> que el archivo abandone tu equipo.*

## Diseño

- **Ejecución local.** DuckDB-WASM sobre un Web Worker; el archivo se monta como
  buffer en el sistema de archivos virtual del runtime. El runtime va **vendorizado**
  (`vendor/duckdb/`): el motor no toca ningún CDN, ni en el primer arranque, y el
  archivo del usuario nunca sale del navegador.
- **Columnar y delimitado.** Ingesta nativa de Parquet (`read_parquet`) y de CSV con
  inferencia de esquema sobre el archivo completo (`read_csv_auto`, `SAMPLE_SIZE=-1`).
  El CSV se normaliza a UTF-8 antes de leerlo (respeta el BOM; cae a Windows-1252 si no
  es UTF-8 válido) — las planillas exportadas en Latin-1 o «Unicode text» cargan igual.
- **Excel y ODS.** Un `.xlsx` / `.xls` / `.ods` se lee en el navegador (SheetJS
  vendorizado, cargado bajo demanda); si tiene varias hojas, un selector deja elegir
  cuál importar y cambiar entre ellas sin volver a abrir el archivo. La hoja elegida
  se convierte a tabla y pasa por el mismo camino que un CSV.
- **Perfilado enriquecido en una pasada.** Un **esquema** que agrupa las columnas
  por rol (fecha / medida / dimensión / identificador); por columna: tipo, nulos,
  ceros, cardinalidad, cuantiles (p05 / mediana / p95), media y desviación — cada
  métrica con su definición al pasar el cursor — más un desglose de frecuencias de
  las columnas categóricas y una **matriz de correlación** (Pearson) entre las
  numéricas.
- **Editor SQL** en dialecto DuckDB contra la relación `datos`, con **plantillas**
  (exploración → tiempo → avanzado, 3 variaciones cada una), proyección del resultado
  a CSV, e **historial** (últimas 15 consultas, recuperables) — la última consulta y
  las preferencias de gráfico se restauran al reabrir (`localStorage`).
- **Combinar por pasos.** Un asistente arma cadenas de CTEs (`WITH … AS (…)`) a
  partir de subconsultas nombradas encadenadas; trae 3 ejemplos.
- **Gráfico.** Barras (agrupadas por serie), línea, multi-serie, área apilada y
  dispersión (coloreada por serie), en SVG sin librería de charting. Ejes y serie se
  derivan del tipo de gráfico y de las columnas del resultado; 3 presets arman
  consulta + gráfico de un tirón. **Zoom** arrastrando un tramo del eje X (doble clic
  o botón para volver), **etiquetas de datos** con toggle, leyenda por serie y
  **descarga a SVG** autónomo.
- **Utilidades.** Copiar los nombres de columna al portapapeles; pegar una línea de
  encabezados para armar un `SELECT`.
- **Glosario.** `glosario.html` define en lenguaje llano cada término (CSV, Parquet,
  CTE, cuantil, WASM…). Nada hace falta saberlo de antemano.
- **Sin tooling.** HTML + módulos ES + CSS, sin paso de build. Las dependencias de
  runtime (DuckDB-WASM y SheetJS) están auto-alojadas en `vendor/`; solo regenerarlas
  al subir de versión necesita Node (ver `vendor/README.md`).

## Uso

```bash
python -m http.server 8000   # un origin HTTP: los módulos ES no cargan sobre file://
```

Carga un archivo o pulsa **Generar** para una relación sintética. En ambos casos la
fuente queda expuesta como la relación `datos`.

## Generador de relaciones sintéticas

Cuatro formas dominio-neutro, todas con dimensión temporal, tipos mixtos y nulos
inyectados. El PRNG es determinista: la semilla reproduce la relación exacta. Salida
en CSV o en Parquet (este último materializado por el propio DuckDB,
`COPY … FORMAT PARQUET`). No se versiona ningún dataset.

| forma | columnas | para |
|---|---|---|
| **serie agregada mensual** | `periodo, segmento, serie, valor, unidades` | forecast, presupuesto, medias móviles, participación |
| **panel diario multi-entidad** | `entidad, fecha, m1, m2, m3` | ventanas móviles, estacionalidad semanal, comparables |
| **registro de eventos** | `ts, entidad, evento, valor` | conteo por ventana, sesionización, embudos |
| **métrica con quiebres** | `fecha, valor, es_outlier, regimen` | detección de anomalías, cambio de régimen |

Consultas que corren tal cual contra la forma *serie agregada mensual*:

```sql
-- serie de tiempo mensual
SELECT date_trunc('month', periodo) AS mes, sum(valor) AS total
FROM datos GROUP BY mes ORDER BY mes;

-- media móvil de 3 periodos
WITH m AS (SELECT date_trunc('month', periodo) AS mes, sum(valor) AS total FROM datos GROUP BY mes)
SELECT mes, total,
       round(avg(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS mm3
FROM m ORDER BY mes;

-- pivote por dimensión
PIVOT (SELECT date_trunc('month', periodo) AS mes, segmento, valor FROM datos)
ON segmento USING sum(valor) ORDER BY mes;
```

Despliegue estático (GitHub Pages), sin paso de build. Backlog en [`ROADMAP.md`](ROADMAP.md).

## Operación aislada

El runtime de DuckDB-WASM (`@duckdb/duckdb-wasm@1.29.0` + `apache-arrow@17.0.0`) y el
lector de Excel (`SheetJS 0.20.3`) van auto-alojados en `vendor/`: el **motor** no
hace ninguna petición a un CDN, ni siquiera en el primer arranque. `app.js` apunta
`selectBundle()` a los bundles locales de DuckDB y solo cae a `getJsDelivrBundles()`
si el runtime local no carga (deploy en un subpath inesperado, archivo ausente);
SheetJS se importa (dinámico) desde `vendor/sheetjs/` solo al abrir una planilla.
Regeneración documentada en [`vendor/README.md`](vendor/README.md).

Las tipografías **IBM Plex** también van auto-alojadas (`vendor/fonts/`, subset latin,
declaradas con `@font-face` en `style.css`). `consulta` **no hace ninguna petición
saliente**: con red o sin ella, se ve y funciona igual. El archivo de datos del usuario
nunca se transmite.

---

## English

In-client OLAP for exploratory inspection of tabular data: SQL over CSV and Parquet,
no backend, no ingestion, the file never leaves the browser. Reads CSV, Parquet and
Excel / ODS (multi-sheet workbooks get a sheet picker; SheetJS is vendored and loaded
on demand). DuckDB-WASM on a Web Worker; one-pass enriched profiling (a schema view
grouping columns by role, plus quantiles, nulls, zeros, per-dimension frequencies, a
Pearson correlation matrix); DuckDB-dialect SQL editor with a template
library, a query history and last-query/chart-preference recall (`localStorage`); a
CTE assistant that composes `WITH` chains; SVG charts (bar, line, multi-series,
stacked area, scatter) with drag-to-zoom on the X axis, toggleable data labels,
per-series legend and standalone-SVG export; CSV export. A deterministic
synthetic-relation generator with
four time-oriented shapes. The DuckDB-WASM runtime, the Excel reader and the IBM Plex
fonts are all self-hosted under `vendor/`, so the site makes **no outbound request** —
online or offline, with or without network. No build step.
