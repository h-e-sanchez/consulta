# Roadmap — consulta

Estado al **2026-09-08**. El sitio está en vivo
([`h-e-sanchez.github.io/consulta`](https://h-e-sanchez.github.io/consulta/)) y
funcional. Esto es el backlog, ordenado por prioridad.

## P0 — cerrar lo abierto

- **`vendor/` con los bundles de DuckDB-WASM.** Auto-alojar el `.wasm` + el worker y
  apuntar `getJsDelivrBundles()` a rutas locales, para operar sin salida a jsDelivr
  (redes corporativas que bloqueen CDNs). Es el único punto que hoy rompe el «cero
  red». Costo: ~11 MB comiteados; o dejarlo como modo opcional detrás de un flag.

## P1 — robustez y uso

- **Progreso de consulta.** Hoy una consulta lenta solo muestra «Ejecutando…».
  Añadir tiempo transcurrido y, para archivos grandes, aviso de que la inferencia de
  tipos (`SAMPLE_SIZE=-1`) puede tardar — con opción de acotarla.
- **Persistir la última consulta** en `localStorage` para no perderla al recargar.
- **Historial de consultas** (las últimas N, clickeables para recuperar).
- **Archivos grandes.** Probar 50–100 MB y medir; ajustar `SAMPLE_SIZE` según tamaño.
- **Gráfico.** Leyenda en barras y dispersión cuando hay serie; más marcas de eje;
  botón «descargar SVG».
- **Perfilado.** Matriz de correlación entre columnas numéricas; marcar columnas
  `VARCHAR` que «parecen» fechas y ofrecer castearlas.

## P2 — alcance

- **Múltiples relaciones.** Cargar más de un archivo y permitir `JOIN` entre ellos.
- **Exportar el resultado a Parquet** (además de CSV).
- **Compartir por URL.** Serializar el SQL en el hash — solo la consulta, nunca los
  datos.
- **Modo notebook.** Varias celdas SQL independientes encadenadas (alternativa más
  libre al asistente de CTEs).
- **i18n mínimo.** Toggle ES / EN del copy de la interfaz.

## No hacer (por ahora)

- Autenticación o guardado en servidor — rompe el modelo client-side.
- Editor con autocompletado tipo Monaco — peso desproporcionado para el alcance.
- Framework de UI — el vanilla actual entra en un archivo y se mantiene solo.

---

## Bitácora

### 2026-09-08

- Publicado como repo **público** + **GitHub Pages**. `?v=N` en `style.css`/`app.js`
  para saltar el caché de borde de Pages (bumpear en cada cambio de esos archivos).
- **v2:** generador de 4 formas sintéticas (serie mensual · panel diario · registro
  de eventos · métrica con quiebres), perfilado enriquecido (cuantiles, % de ceros,
  desglose por dimensión), 9 plantillas de consulta, asistente de CTEs, 5 tipos de
  gráfico.
- **Glosario** (`glosario.html`), definiciones del perfilado con `?` y tooltips,
  3 presets de CTE, 3 presets de gráfico, re-derivación de ejes según el tipo.
- Estilo **«Grafito»** — IBM Plex Mono para títulos, IBM Plex Sans para el cuerpo,
  acento ámbar, todo plano.

### 2026-09-07

- Creado a partir del Proyecto 3 del `portfolio-scaffold` («Laboratorio de CSV»),
  reescrito de un perfilador en JS puro a un motor SQL real (DuckDB-WASM).
