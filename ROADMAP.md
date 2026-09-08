# Roadmap — consulta

Estado al **2026-09-08**. El sitio está en vivo
([`h-e-sanchez.github.io/consulta`](https://h-e-sanchez.github.io/consulta/)) y
funcional. Este archivo se edita a mano: marcá las casillas y elegí el camino de
cada sesión.

---

## Mañana — presupuesto: 2–3 h · elegí **un** camino

> Cada camino entra en 2–3 h. Marcá el elegido y, si sobra tiempo, sumá algo del
> «relleno».

### ☐ Camino A — Gráfico (recomendado: es lo más visible)

- [ ] **Zoom en el gráfico** — arrastrar para seleccionar un rango del eje X y
      re-encuadrar; doble clic o botón «reset» para volver.
- [ ] **Etiquetas de datos** — valor sobre cada punto/barra, con toggle
      on/off (encenderlas siempre satura cuando hay muchos puntos).
- [ ] Leyenda para barras y dispersión cuando hay columna de serie.
- [ ] Botón «descargar SVG».

### ☐ Camino B — Offline (cierra el P0)

- [ ] **`vendor/` con los bundles de DuckDB-WASM.** Auto-alojar el `.wasm` + el
      worker; envolver `getJsDelivrBundles()` para que apunte a rutas locales con
      fallback al CDN. Peso: ~11 MB comiteados (o detrás de un `?local=1`).
- [ ] Verificar en red sin acceso a `cdn.jsdelivr.net`.
- [ ] Documentar el modo offline en el README y el glosario.

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

- [ ] **Gráfico: zoom** (arrastrar rango en X) y **etiquetas de datos** (toggle).
- [ ] **Gráfico:** leyenda en barras/dispersión con serie; más marcas de eje;
      descargar SVG; tooltip al pasar por un punto.
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

### 2026-09-08

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
