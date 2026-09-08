# consulta

> Motor OLAP embebido en el cliente para inspección exploratoria de datos tabulares:
> SQL sobre CSV y Parquet sin backend, sin ingesta y sin que el archivo abandone el
> navegador.

![consulta — editor SQL y perfilado sobre una relación sintética](docs/captura.jpg)

## Diseño

- **Ejecución local.** DuckDB-WASM sobre un Web Worker; el archivo se monta como
  buffer en el sistema de archivos virtual del runtime. Cero tráfico saliente, cero
  superficie de servidor.
- **Columnar y delimitado.** Ingesta nativa de Parquet (`read_parquet`) y de CSV con
  inferencia de esquema sobre el archivo completo (`read_csv_auto`, `SAMPLE_SIZE=-1`).
- **Perfilado en una pasada.** `SUMMARIZE` deriva tipo, cardinalidad aproximada,
  fracción nula y estadística descriptiva por columna en un único barrido.
- **Superficie de consulta.** Editor SQL en dialecto DuckDB contra la relación
  `datos`; sugerencias parametrizadas por el esquema materializado; proyección del
  resultado a CSV.
- **Visualización mínima.** Serie categórica a barras en SVG, sin dependencia de
  charting.
- **Sin tooling.** HTML + módulo ES + CSS. Única dependencia de runtime: el bundle
  WASM, resuelto desde CDN en el primer arranque y cacheado.

## Uso

```bash
python -m http.server 8000   # un origin HTTP: los módulos ES no cargan sobre file://
```

Carga un archivo o pulsa **Generar** para una relación sintética. En ambos casos la
fuente queda expuesta como la relación `datos`.

## Relación de ejemplo

El generador integrado produce una relación dominio-neutro con tipos mixtos y nulos
inyectados (~2–3 %), hasta 10⁶ filas, en CSV o en Parquet — este último materializado
por el propio DuckDB (`COPY … FORMAT PARQUET`). El PRNG es determinista: una semilla
reproduce la relación exacta. No se versiona ningún dataset.

| columna     | tipo    | nota                                  |
|-------------|---------|---------------------------------------|
| `id`        | BIGINT  | secuencial, sin nulos                 |
| `categoria` | VARCHAR | 6 niveles, ~2 % nulo                   |
| `grupo`     | VARCHAR | 3 niveles                             |
| `fecha`     | DATE    | 24 meses                              |
| `valor`     | DOUBLE  | ~lognormal, ~3 % nulo                 |
| `cantidad`  | BIGINT  | 0–499                                 |
| `activo`    | BOOLEAN | ~68 % verdadero                       |

Consultas que corren tal cual contra esa relación:

```sql
-- perfilado de una pasada
SUMMARIZE datos;

-- agregación por dimensión categórica
SELECT grupo, count(*) AS n, round(avg(valor), 1) AS valor_medio
FROM datos
GROUP BY grupo
ORDER BY n DESC;

-- serie de tiempo mensual
SELECT date_trunc('month', fecha) AS mes, sum(valor) AS total
FROM datos
GROUP BY mes
ORDER BY mes;

-- fracción de nulos de una columna
SELECT count(*) - count(valor) AS nulos, count(*) AS total
FROM datos;
```

Despliegue estático (GitHub Pages), sin paso de build.

## Límite conocido

El runtime se descarga desde jsDelivr en el primer arranque (~11 MB, luego en caché).
Para operación aislada, los bundles de `@duckdb/duckdb-wasm` se auto-alojan en
`vendor/` y se apunta `getJsDelivrBundles()` a rutas locales — pendiente.

---

## English

In-client OLAP for exploratory inspection of tabular data: SQL over CSV and Parquet,
no backend, no ingestion, the file never leaves the browser. DuckDB-WASM on a Web
Worker; one-pass profiling via `SUMMARIZE`; DuckDB-dialect SQL editor with
schema-parametrized suggestions; SVG bar chart; CSV projection of the result. No
build step.
