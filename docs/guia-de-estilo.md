# Guía de estilo — `consulta`

> Las **decisiones** de identidad visual de `consulta`, ya aplicadas en `style.css`
> (al día con `?v=23`). Es la referencia viva: si algo acá y el código no coinciden,
> gana el código y se corrige este documento. Para el *porqué* y las fuentes de
> investigación, ver [`referencias-estilo.md`](referencias-estilo.md). Para la cola de
> trabajo pendiente y los prompts de generación de imágenes, ver
> [`revision-visual-2026-09.md`](revision-visual-2026-09.md).

---

## 1. Identidad — «técnico cálido / notebook»

`consulta` se lee como un **cuaderno analítico moderno**: papel tibio, sans humanista
para toda la interfaz y los títulos, **monoespaciado reservado a los datos y el
código**. Esquinas de **4 px** (`--r`) y una **sombra apenas perceptible** (`--shadow`)
en las superficies elevadas — no plano-total, pero tampoco «tarjeta con sombra». Un
único acento —**azul pizarra**— usado con disciplina; señala el registro de finanzas /
control de gestión.

Movimiento **medido** (§6): micro-transiciones al hover/foco y un par de fades cortos;
nada disparado por scroll, nada en loop.

Es la base visual reutilizable para los próximos repos del portafolio
(`datos-nomina-sinteticos`, etc.). Ver §9.

> **Historia:** hasta `?v=18` la identidad era «Grafito» — gris frío, mono en todo,
> cero sombras y cero redondeo, acento teal. El dueño la encontró demasiado *fome*; en
> `?v=19` se pivotó a esta dirección y en `?v=23` el acento pasó de teal a azul pizarra.
> `referencias-estilo.md` todavía habla en términos de «Grafito» — es investigación, no
> el estado actual.

---

## 2. Color

### Tokens (claro) — `:root`

```css
:root {
  color-scheme: light;
  --bg: #fbfaf7;          /* papel tibio */
  --surface: #ffffff;     /* paneles, tablas, drop-zone, defs */
  --surface-2: #f3f1ea;   /* código, callouts neutros, thead, chips */
  --border: #e7e3d8;      /* divisores de 1px */
  --border-strong: #cbc4b3; /* borde de inputs, drop-zone, límite de pestañas */
  --text: #23211c;        /* tinta cálida */
  --muted: #6a6357;       /* texto secundario (hints, labels, meta) */
  --faint: #978f7e;       /* terciario (nulos, contadores, kbd) */
  --accent: #33518f;      /* azul pizarra — ver "dónde va el acento" */
  --accent-weak: #e7ebf5; /* fondo de dragover, tinte muy suave */
  --on-accent: #ffffff;   /* texto sobre un fondo de acento (botón primario) */
  --error: #b23c26;       /* rojo semántico — callout danger, .error */
}
```

### Tokens (oscuro) — `:root[data-theme="dark"]`

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #16140f;          /* negro cálido */
  --surface: #1e1b15;
  --surface-2: #26221b;
  --border: #322d24;
  --border-strong: #443e32;
  --text: #ece7db;
  --muted: #a89f8c;
  --faint: #776f5e;
  --accent: #8aa9e6;      /* azul pizarra claro; contra --bg da ~7.6:1 */
  --accent-weak: #1a2338;
  --on-accent: #16140f;   /* el azul claro del modo noche pide tinta oscura encima */
  --error: #e0765c;
  --shadow: 0 1px 2px rgb(0 0 0 / 0.25), 0 2px 8px rgb(0 0 0 / 0.2);
}
```

El modo oscuro se activa **solo** por elección explícita (`data-theme="dark"` estampado
en `<html>`, persistido en `localStorage`). El defecto es **siempre claro**, sin mirar
`prefers-color-scheme`. Ver §5 (interruptor de tema).

### Forma

```css
--r: 4px;                                              /* radio único, sutil */
--shadow: 0 1px 2px rgb(30 25 15 / .05), 0 2px 6px rgb(30 25 15 / .04);
```

Todo lo que es una superficie contenedora lleva `border-radius: var(--r)` (drop-zone,
tablas, editor, callouts, chips, controles, celdas de esquema, panel explicativo). La
sombra va **solo** en las elevadas (drop-zone, `.table-scroll`, `.sc-group`, `.dim`).
En oscuro la sombra casi no registra — la separación la da el borde hairline.

### Contraste

Todos los pares de texto pasan **WCAG AA** (≥ 4.5:1 texto normal). El azul pizarra da
≥ 6.1:1 sobre `--bg` y `--surface-2` en claro, ≥ 7.1:1 en oscuro; texto blanco sobre
el acento (botón) da 6.9:1 en claro. Cualquier ajuste de color se verifica antes de
commitear.

### Dónde va el acento

| Va | No va |
|---|---|
| Pestaña activa (`border-bottom` 2px) | Cuerpo de texto |
| `:hover` de enlaces | Fondos de sección |
| Ring de foco de teclado (`--focus`) | Bordes de tabla |
| Botón primario (`.primary`, `.file-button`) | Todos los callouts a la vez |
| Punto de estado del motor (`.engine-status .dot`) | Bloques de código |
| Siglas del subtítulo enlazadas (`.tagline a`) | Iconos decorativos |
| Borde de rol «medida» en el panel Esquema | |

### Colores de rol (panel Esquema y gráfico)

El panel **Esquema** del perfilado colorea el borde izquierdo de cada grupo por rol.
Hoy están hardcodeados en `style.css` (candidatos a tokens `--role-*` — ver
`revision-visual-2026-09.md`):

| Rol | Color | Nota |
|---|---|---|
| Fecha / temporal | `#0f6d80` (teal) | el acento retirado, reciclado como color de rol |
| Medida | `= --accent` (azul pizarra) | |
| Dimensión | `#7d9a6f` (verde salvia) | |
| Identificador | `= --faint` (gris) | |

Cuatro tonos claramente distintos. La **paleta multi-serie del gráfico** vive como
array en `app.js` (`drawChart`), no en CSS, porque se asigna por índice de serie al
dibujar:

```js
["var(--accent)", "#c9705b", "#b0894f", "#7d9a6f", "#8a7cae", "#5f7f8a", "#a8636f", "#748c5e"]
```

Set categórico apagado. El primer color siempre es el acento.

---

## 3. Tipografía

Dos familias, **auto-alojadas** en `vendor/fonts/` (subset latin) y declaradas con
`@font-face` al inicio de `style.css`, `font-display: swap`. IBM Plex Mono va en 3
instancias estáticas (400/500/600); IBM Plex Sans es una fuente variable (un archivo,
400–600). **Sin fetch externo** — el sitio no hace ninguna petición saliente.

```css
--mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace;
--sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

Los fallback son metricamente cercanos y cubren macOS / Windows / Linux sin bajar nada.

### Reparto por rol

**Sans** para toda la interfaz y los títulos. **Mono** solo para lo que es dato.

| Familia | Peso | Dónde |
|---|---|---|
| **Sans** | 600 | `h1` (2rem, tracking −0.022em), `h2` de panel (1.25rem), `h2` del glosario |
| **Sans** | 500/600 | `h3` de panel (label), botones, pestañas, `summary` del panel explicativo, `b, strong` |
| **Sans** | 400 | cuerpo: párrafos, `.hint`, `.muted`, `dd`, callouts, labels de control, footer, interruptor de tema |
| **Mono** | 600 | `dt` del glosario |
| **Mono** | 500 | nombre de archivo (`.fname`), encabezados de tabla (`thead th`), `.dim-name` |
| **Mono** | 400 | tablas, editor SQL, chips de esquema, `code`, `.kbd`, `.result-meta`, `.defs`, `.explain pre`, rótulos del SVG del gráfico |

Regla: **si el elemento muestra datos o código, es mono; si es interfaz o prosa, es
sans.** El sans solo pasa de 400 en títulos, controles y `b, strong`.

### Escala tipográfica

Ratio ~1.25 sobre una base de **15 px**. Tokens en `:root`:

```css
--fs-xs:  0.75rem;   /* labels, meta, callout-label, h3 de panel, interruptor de tema */
--fs-sm:  0.84rem;   /* .hint, .muted, botones, pestañas, textos secundarios */
--fs-md:  1rem;      /* tagline */
--fs-lg:  1.25rem;   /* h2 de panel, h2 del glosario */
--fs-xl:  1.6rem;    /* (reservado) */
--fs-2xl: 2rem;      /* h1 */
```

`line-height`: 1.6 en el cuerpo (`body`), ~1.3–1.5 en datos densos, `1.1` en `h1`.
Columna de texto acotada a 60–68ch (`.hint`, `.glos dd`, `.tagline`).

> **Pendiente:** quedan ~15–20 `font-size` hardcodeados (0.6rem–0.85rem) que esquivan
> los tokens `--fs-*`. Consolidarlos está en `revision-visual-2026-09.md` §2.

---

## 4. Espaciado y layout

Ritmo de **4 px**. Tokens en `:root`: `--sp-2: 8px` · `--sp-3: 12px` · `--sp-4: 16px`
· `--sp-6: 24px`. Hoy solo los usa `.callout`; la mayoría del espaciado sigue siendo
`rem` hardcodeado (barrido de bajo riesgo pendiente — revisión §4).

- **Contenedor:** `max-width: 960px`, centrado, padding lateral `1.5rem`. Cabecera,
  `main` y pie comparten ese ancho.
- **Columna de texto:** 60–68ch para prosa; las tablas y el gráfico pueden ser más
  anchos y scrollean dentro de su propio contenedor (`.table-scroll`, `.chart-scroll`
  con `overflow-x: auto`, `border-radius: var(--r)`).
- **Márgenes de encabezado:** el margen arriba de un `h2`/`h3` es ~2–2.5× el de abajo.
- **Transición de tokens:** una regla compartida `--t: 130ms ease`.

---

## 5. Componentes

Snippets canónicos. Si se copian a otro repo, van tal cual (solo cambia el acento si
el repo lo pide — ver §9).

### Callout — 3 niveles

```css
.callout {
  border-left: 3px solid var(--border-strong);
  border-radius: 0 var(--r) var(--r) 0;
  background: color-mix(in srgb, var(--muted) 9%, transparent);
  padding: var(--sp-3) var(--sp-4);
  font-size: var(--fs-sm);
}
.callout--warn   { border-left-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.callout--danger { border-left-color: var(--error);  background: color-mix(in srgb, var(--error) 12%, transparent); }
.callout-label {  /* "nota" / "cuidado" / "advertencia" */
  font-family: var(--sans); font-size: var(--fs-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
}
```

Franja de color a la **izquierda**, fondo del mismo tono muy tenue, label en sans
mayúscula. Sin iconos grandes. No apilar varios seguidos.

### Tabla

```css
.table-scroll { overflow-x: auto; border: 1px solid var(--border);
  border-radius: var(--r); background: var(--surface); box-shadow: var(--shadow); }
table { border-collapse: collapse; width: 100%; font-family: var(--mono); font-size: 0.78rem; }
th, td { padding: 0.45rem 0.75rem; border-bottom: 1px solid var(--border); text-align: left; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
thead th { background: var(--surface-2); font-weight: 600; text-transform: uppercase;
  font-size: 0.68rem; letter-spacing: 0.05em; position: sticky; top: 0; }
```

Sin bordes verticales. Solo `border-bottom` por fila. Números a la derecha con
`tabular-nums`. Header en mono mayúscula, pegajoso.

### Botón

```css
select, button, input[type="text"], input[type="number"] {
  font-family: var(--sans); font-size: var(--fs-sm); padding: 0.4rem 0.55rem;
  border: 1px solid var(--border-strong); border-radius: var(--r);
  background: var(--surface); color: var(--text);
  transition: border-color var(--t), background-color var(--t);
}
button.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent);
  font-weight: 500; padding: 0.45rem 1.1rem; transition: filter var(--t); }
button.primary:hover { filter: brightness(1.08); }
button.ghost { color: var(--muted); border-color: var(--border); }
button.ghost:hover { color: var(--text); border-color: var(--border-strong); }
```

`--on-accent` es obligatorio en cualquier fondo de acento (blanco en claro, tinta
oscura en modo noche — el azul claro no tolera blanco encima).

### Select — chevron propio

```css
select {
  appearance: none; -webkit-appearance: none; padding-right: 1.9rem;
  background-image: url("data:image/svg+xml,...chevron en %237a7266...");
  background-repeat: no-repeat; background-position: right 0.65rem center; background-size: 0.62rem;
}
:root[data-theme="dark"] select { background-image: url("...chevron en %23a89f8c..."); }
```

Nunca el widget nativo del SO — se veía crudo contra el resto.

### Chip de esquema

```css
.sc-chip { display: flex; flex-direction: column; gap: 0.1rem; font-family: var(--mono);
  font-size: 0.75rem; padding: 0.3rem 0.55rem; border: 1px solid var(--border);
  border-radius: var(--r); background: var(--bg); cursor: pointer;
  transition: border-color var(--t), color var(--t); }
.sc-chip:hover  { border-color: var(--accent); }
.sc-chip.copied { border-color: var(--accent); color: var(--accent); }  /* flash al copiar */
```

### Código

```css
code { font-family: var(--mono); font-size: 0.88em; }
.callout code, .glos dd code { background: var(--surface-2); padding: 0.05rem 0.3rem; border-radius: 3px; }
```

### Ring de foco

```css
--focus: 2px solid var(--accent);
:focus-visible { outline: var(--focus); outline-offset: 2px; }
```

Cuadrado (el `outline` no hereda `--r`), visible, mismo en todos los elementos
interactivos.

### Interruptor de tema

Botón `#theme-toggle` arriba a la derecha de la cabecera, en `index.html` y
`glosario.html`. Sans, con `border-radius: var(--r)`. Muestra el modo al que cambia:
«◐ noche» en claro, «◐ día» en oscuro.

La lógica va en un `<script>` **inline en el `<head>`** de cada página (el glosario no
carga `app.js`). Corre **antes del primer render** para no parpadear: lee
`localStorage["consulta:theme"]` y, si vale `"dark"`, estampa `data-theme="dark"` en
`<html>` antes de que el navegador pinte. `app.js` escucha el evento
`consulta:themechange` y redibuja el gráfico (por los colores embebidos en el SVG y su
descarga).

---

## 6. Movimiento — presupuesto

Movimiento medido. El registro «cuaderno» tolera un poco de vida, no coreografía.

**Base:**
```css
:root { --t: 130ms ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

**Permitido:**
- Micro-transiciones de **`--t` (130 ms)** sobre `color` / `background-color` /
  `border-color` / `text-decoration-color` / `filter` / `outline` en elementos
  interactivos (enlaces, pestañas, botones, chips, `.history-item`, controles,
  interruptor de tema). **Nunca** propiedades que disparen layout.
- Dos entradas con fade corto, ambas desde un estado visible en reposo:
  - `#workspace:not([hidden]) { animation: fadeUp 200ms ease; }` — al cargar una
    relación.
  - `.panel:not([hidden]) { animation: fadeIn 140ms ease; }` — al cambiar de pestaña.
- El punto del motor parpadea (`@keyframes blink`) **solo** mientras el runtime carga.

**Prohibido:** revelados por scroll, parallax, skeleton loaders, spinners, transición
de página entre `index` y `glosario`, cualquier otro loop.

---

## 7. Texto explicativo — principios

Cómo `consulta` se explica sola. La regla es **capas**: cada quien lee hasta donde
necesita.

1. **Un `.hint` por panel.** Cada panel abre con un párrafo `.hint`
   (`color: var(--muted)`, `font-size: var(--fs-sm)`, `max-width: 68ch`). Uno, corto.
2. **Sigla = tooltip + enlace.** Cada término técnico en la UI es
   `<a href="glosario.html#id"><abbr title="definición corta">SIGLA</abbr></a>`:
   hover para el tooltip, clic para la entrada larga del glosario.
3. **`?` alterna, no navega.** El botón `.qhelp` del perfilado despliega/oculta
   `#prof-defs` (definiciones de las columnas de estadística).
4. **Los presets se explican en lenguaje llano.** Cada botón de preset (SQL, CTE,
   gráfico) lleva `title` con una frase de una línea sin jerga
   («Grafica valor a lo largo de periodo.»).
5. **Sin modales, sin tour, sin `?` en la home.** El generador de relaciones
   sintéticas **es** el onboarding.
6. **El glosario es la referencia larga.** ~40 términos en `<dl>`, cada `<dt>` con
   `id` para que los enlacen los `abbr` de toda la app. La home se mantiene despejada.

Añadidos acotados en evaluación (callout «primera vez», descripción viva del generador)
en `revision-visual-2026-09.md` §6.

---

## 8. Assets / iconografía

Especificaciones. Los **prompts de generación** (nano banana) están en
`revision-visual-2026-09.md` §7. Esta sección se completa con los archivos finales
cuando existan. **Todos usan el acento azul pizarra `#33518f` sobre papel tibio.**

| Asset | Estado | Especificación | Entra al repo como |
|---|---|---|---|
| **Favicon** | ⬜ pendiente | Marca abstracta, azul pizarra, legible a 16px. | `favicon.svg` en la raíz + `<link rel="icon">` y `<meta name="theme-color" content="#33518f">` en los dos `<head>` |
| **Tarjeta social (OG)** | ⬜ pendiente | 1200×630. Wordmark `consulta` en Sans + bajada; a la derecha, UI estilizada estilo notebook. Papel tibio, acento azul, esquinas de 4px. ≤ 1 MB. | `docs/og-consulta.png` + `og:image`/`twitter:card`/`og:title`/`og:description` |
| **Banner de README** | ⬜ pendiente | ~1280×400. Misma familia visual. | `docs/banner.png`, cerca del inicio del README |
| **Ilustraciones de conceptos** | ⬜ a evaluar | 3 diagramas cuadrados: columnar vs filas · en el cliente · cadena de CTEs. Rotulados en Mono. Generar como referencia y redibujar en SVG, o solo en README. | `docs/glosario/*.svg` |
| **GIFs del README** | ⬜ pendiente | 3 recorridos cortos (carga+perfilado · consulta SQL · gráfico), sin overlays, < 3 MB c/u. | `docs/gif/*.gif` + `<img>` en el README |

---

## 9. Checklist para un repo nuevo

Para llevar esta identidad a `datos-nomina-sinteticos` u otro repo del portafolio:

1. **Copiar tal cual:** los bloques `:root` + `:root[data-theme="dark"]` de `style.css`
   (§2), los tokens `--mono` / `--sans` / `--fs-*` / `--sp-*` / `--r` / `--shadow` /
   `--focus` / `--t`, y los `@keyframes` + la regla `prefers-reduced-motion` (§6).
2. **Fuentes:** copiar `vendor/fonts/` (4 woff2) + el bloque `@font-face` del inicio de
   `style.css` + los 2 `<link rel="preload">` del `<head>`. Sin Google Fonts.
3. **Componentes:** copiar callout, tabla, botón, select, chip, ring de foco (§5) y el
   `<script>` inline del interruptor de tema.
4. **Cambiar por repo:** el `<title>`, la `<meta name="description">`, el `og:*`, el
   favicon. **Los neutrales cálidos y la forma (4px + sombra) son compartidos.** El
   acento azul pizarra es el default del portafolio; un repo puede pedir otro, pero se
   decide explícitamente (ver `revision-visual-2026-09.md` §7 para el proceso).
5. **Mantener:** un solo acento, mono solo para datos, el presupuesto de movimiento
   (§6), la regla de capas del texto explicativo (§7).
