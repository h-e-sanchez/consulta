# Guía de estilo — `consulta`

> Las **decisiones** de identidad visual de `consulta`, ya aplicadas en `style.css`.
> Es la referencia viva: si algo acá y el código no coinciden, gana el código y se
> corrige este documento. Para el *porqué* y las fuentes de investigación, ver
> [`referencias-estilo.md`](referencias-estilo.md). Para la cola de trabajo pendiente
> y los prompts de generación de imágenes, ver
> [`revision-visual-2026-09.md`](revision-visual-2026-09.md).

---

## 1. Identidad «Grafito»

`consulta` se lee como una **ficha técnica**: monoespaciado en los títulos y los
datos, sans en el cuerpo, todo plano. **Cero sombras, cero esquinas redondeadas**
(`border-radius: 0` explícito en controles). Un único acento —teal— y se usa con
disciplina. Neutrales fríos alineados a la spec de documentación de Google (fondo casi
blanco, gris secundario `#5f6368`, divisores de 1 px).

La **quietud es una decisión**: casi no hay movimiento (ver §6). En el espectro de
`referencias-estilo.md`, `consulta` vive en la zona **DuckDB / Linear / Vercel** —
plano, hairline en vez de sombra, denso pero legible.

Reutilizable: estos tokens, fuentes y componentes son la base visual para los próximos
repos del portafolio (`datos-nomina-sinteticos`, etc.). Ver §9.

---

## 2. Color

### Tokens (claro) — `:root`

```css
:root {
  color-scheme: light;
  --bg: #f7f8f8;          /* fondo de página */
  --surface: #ffffff;     /* paneles, tablas, drop-zone, defs */
  --surface-2: #f1f3f4;   /* código, callouts neutros, thead, chips de esquema */
  --border: #e3e3e6;      /* divisores de 1px */
  --border-strong: #c4c7cc; /* borde de inputs, drop-zone, límite de pestañas */
  --text: #1f1f22;        /* texto principal */
  --muted: #5f6368;       /* texto secundario (hints, labels, meta) */
  --faint: #8a8d93;       /* terciario (nulos, contadores, kbd) */
  --accent: #0f6d80;      /* teal — ver "dónde va el acento" */
  --accent-weak: #e1eef1; /* fondo de dragover, tinte muy suave */
  --on-accent: #ffffff;   /* texto sobre un fondo de acento (botón primario) */
  --error: #a83c2b;       /* rojo semántico — callout danger, .error */
}
```

### Tokens (oscuro) — `:root[data-theme="dark"]`

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0e0e10;
  --surface: #161619;
  --surface-2: #1e1e22;
  --border: #2a2a30;
  --border-strong: #3a3a42;
  --text: #e8e8ea;
  --muted: #9a9da3;
  --faint: #6b6e74;
  --accent: #3fbcd4;      /* teal más claro; contra `--bg` da ~8:1 */
  --accent-weak: #122a30;
  --on-accent: #0e0e10;   /* el teal claro del modo noche pide tinta oscura encima */
  --error: #e0725c;
}
```

El modo oscuro se activa **solo** por elección explícita (`data-theme="dark"` estampado
en `<html>`, persistido en `localStorage`). El defecto es **siempre claro**, sin mirar
`prefers-color-scheme`. Ver §5 (interruptor de tema).

### Contraste

Todos los pares de texto pasan **WCAG AA** (≥ 4.5:1 texto normal). El acento sobre
`--bg` y sobre `--surface-2` da ≥ 5.5:1 en claro y ≥ 6.5:1 en oscuro; texto blanco
sobre el acento (botón) da ≥ 6:1 en claro. Cualquier ajuste de color se verifica antes
de commitear.

### Dónde va el acento

| Va | No va |
|---|---|
| Ítem de nav / pestaña activa (`border-bottom` 2px) | Cuerpo de texto |
| `:hover` de enlaces | Fondos de sección |
| Ring de foco de teclado (`--focus`) | Bordes de tabla |
| Botón primario (`.primary`, `.file-button`) | Todos los callouts a la vez |
| Punto de estado del motor (`.engine-status .dot`) | Bloques de código |
| Siglas del subtítulo enlazadas (`.tagline a`) | Iconos decorativos |

### Colores de rol (esquema de columnas y gráfico)

El panel **Esquema** del perfilado colorea el borde izquierdo de cada grupo por rol.
Hoy están hardcodeados en `style.css`; el objetivo (ver `revision-visual-2026-09.md`)
es promoverlos a tokens:

| Rol | Color (claro) | Token propuesto | Nota |
|---|---|---|---|
| Fecha / temporal | `#8a7cae` (violeta) | `--role-time` | separado del teal a propósito |
| Medida | `= --accent` | `--role-measure` | |
| Dimensión | `#7d9a6f` (verde salvia) | `--role-dim` | |
| Identificador | `= --faint` | `--role-id` | |

La **paleta multi-serie del gráfico** vive como array en `app.js` (`drawChart`), no en
CSS, porque se asigna por índice de serie en tiempo de dibujo:

```js
["var(--accent)", "#c9705b", "#b0894f", "#7d9a6f", "#8a7cae", "#5f7f8a", "#a8636f", "#748c5e"]
```

Set categórico apagado que arma con el teal (coral, oro, salvia, violeta, pizarra…).
El primer color siempre es el acento.

---

## 3. Tipografía

Dos familias, cargadas desde Google Fonts con `display=swap` (auto-alojarlas es
pendiente — ver `revision-visual-2026-09.md`):

```css
--mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace;
--sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

Los fallback son metricamente cercanos y cubren macOS / Windows / Linux sin bajar nada.

### Reparto

| Familia | Peso | Dónde |
|---|---|---|
| **Mono** | 600 | `h1`, `h2`/`h3` de panel, `h2`/`dt` del glosario |
| **Mono** | 500 | nombre de archivo (`.fname`), encabezados de tabla (`thead th`), `.dim-name` |
| **Mono** | 400 | cuerpo monoespaciado: tablas, editor SQL, chips, labels, `.kbd`, `.result-meta`, botón de tema, presets |
| **Sans** | 600 | **solo** `b, strong` (regla explícita — evita la negrita 700 sintética) |
| **Sans** | 400 | todo el cuerpo: párrafos, `.hint`, `.muted`, `dd`, callouts |

Regla: **el texto con peso es monoespaciado**; el sans nunca pasa de 400 salvo énfasis
puntual. Si aparece la necesidad de un sans 500/600 fuera de `strong`, es señal de que
el elemento debería ser mono.

### Escala tipográfica

Ratio ~1.2 sobre una base de 14 px. Tokens en `:root`:

```css
--fs-xs: 0.72rem;   /* labels, meta, callout-label */
--fs-sm: 0.82rem;   /* .hint, .panel h3, textos secundarios */
--fs-md: 0.95rem;   /* h2 de panel, h2 del glosario */
--fs-lg: 1.15rem;   /* (hoy sin uso — ver revisión) */
--fs-xl: 1.5rem;    /* h1 */
```

**Estado actual:** hay ~20 `font-size` hardcodeados en `style.css` (0.6rem–0.85rem)
que esquivan estos tokens. La consolidación —fijar la escala canónica, mapear cada rol
a un token, decidir `--fs-lg`— está en `revision-visual-2026-09.md` §2. Esta guía fija
**el objetivo**: todo tamaño de texto sale de un token.

`line-height`: 1.55 en el cuerpo (`body`), ~1.3 en datos densos, headings ajustados.
Columna de texto acotada a 46–68ch (`max-width` en `.hint`, `.glos dd`, `.tagline`).

---

## 4. Espaciado y layout

Ritmo de **4 px**. Tokens en `:root`:

```css
--sp-2: 8px;  --sp-3: 12px;  --sp-4: 16px;  --sp-6: 24px;
```

**Estado actual:** infrautilizados; casi todo el espaciado es `rem` hardcodeado. El
barrido para aplicarlos (sin cambio visual) está en la revisión, §4 (P2).

- **Contenedor:** `max-width: 960px`, centrado, padding lateral `1.5rem`. Cabecera,
  `main` y pie comparten ese ancho.
- **Columna de texto:** 46–68ch para prosa; las tablas y el gráfico pueden ser más
  anchos y scrollean dentro de su propio contenedor (`.table-scroll`, `.chart-scroll`
  con `overflow-x: auto`).
- **Márgenes de encabezado:** el margen arriba de un `h2`/`h3` es ~2–2.5× el de abajo,
  para que el título pertenezca visualmente a lo que sigue.

---

## 5. Componentes

Snippets canónicos. Si se copian a otro repo, van tal cual.

### Callout — 3 niveles

```css
.callout {
  border-left: 3px solid var(--border-strong);
  background: color-mix(in srgb, var(--muted) 9%, transparent);
  padding: var(--sp-3) var(--sp-4);
  font-size: 0.86rem;
}
.callout--warn   { border-left-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
.callout--danger { border-left-color: var(--error);  background: color-mix(in srgb, var(--error) 12%, transparent); }
.callout-label {  /* "nota" / "cuidado" / "advertencia" */
  font-family: var(--mono); font-size: var(--fs-xs);
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
}
```

Regla (de `referencias-estilo.md`, patrón Google `style/notices`): franja de color a
la **izquierda**, fondo del mismo tono muy tenue, label en mono minúscula. Sin iconos
grandes. No apilar varios seguidos.

### Tabla

```css
table { border-collapse: collapse; width: 100%; font-family: var(--mono); font-size: 0.78rem; }
th, td { padding: 0.4rem 0.7rem; border-bottom: 1px solid var(--border); text-align: left; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
thead th { background: var(--surface-2); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em; position: sticky; top: 0; }
```

Sin bordes verticales. Solo `border-bottom` por fila. Números a la derecha con
`tabular-nums`. Header en mono minúscula, pegajoso.

### Botón

```css
button.primary { background: var(--accent); color: var(--on-accent); border-color: var(--accent); padding: 0.4rem 1rem; }
button.ghost   { color: var(--muted); }        /* fondo transparente, sin borde visible */
button.ghost:hover { color: var(--text); }
```

`--on-accent` es obligatorio en cualquier fondo de acento (blanco en claro, tinta
oscura en modo noche porque el teal claro no tolera blanco encima).

### Chip de esquema

```css
.sc-chip { display: flex; flex-direction: column; gap: 0.1rem; font-family: var(--mono);
  font-size: 0.74rem; padding: 0.25rem 0.5rem; border: 1px solid var(--border); background: var(--bg); cursor: pointer; }
.sc-chip:hover  { border-color: var(--accent); }
.sc-chip.copied { border-color: var(--accent); color: var(--accent); }  /* flash al copiar el nombre */
```

### Código

```css
code { font-family: var(--mono); font-size: 0.9em; }
.callout code { background: color-mix(in srgb, var(--text) 8%, transparent); padding: 0.05rem 0.3rem; }
```

Fondo gris muy claro (`--surface-2` en bloques), sin borde o 1px, sin redondeo real.

### Ring de foco

```css
--focus: 2px solid var(--accent);
:focus-visible { outline: var(--focus); outline-offset: 2px; }
```

Cuadrado, visible, mismo en todos los elementos interactivos. Coherente con «sin
redondeo».

### Interruptor de tema

Botón `#theme-toggle` arriba a la derecha de la cabecera, en `index.html` y
`glosario.html`. Muestra el modo al que cambia: «◐ noche» en claro, «◐ día» en oscuro.

```css
.theme-toggle { position: absolute; top: 1.9rem; right: 1.5rem; padding: 0.3rem 0.6rem;
  font-family: var(--mono); font-size: 0.7rem; text-transform: lowercase;
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--muted); cursor: pointer; }
.theme-toggle::before { content: "◐ "; }
```

La lógica va en un `<script>` **inline en el `<head>`** de cada página (el glosario no
carga `app.js`). Corre **antes del primer render** para no parpadear: lee
`localStorage["consulta:theme"]` y, si vale `"dark"`, estampa `data-theme="dark"` en
`<html>` antes de que el navegador pinte. `app.js` escucha el evento
`consulta:themechange` y redibuja el gráfico (por los colores embebidos en el SVG y su
descarga).

---

## 6. Movimiento — presupuesto

La quietud es parte de la identidad «ficha técnica». El movimiento se raciona.

**Permitido:**
- Transiciones **≤ 150 ms**, curva `ease` / `ease-out`.
- Solo estas propiedades: `color`, `background-color`, `border-color`, `opacity`,
  `outline`. **Nunca** propiedades que disparen layout (`width`, `height`, `top`,
  `margin`…).
- Hasta **3 momentos deliberados** de fade corto (revelado del workspace, cambio de
  pestaña, entrada de callouts dinámicos) — la lista exacta y su estado en
  `revision-visual-2026-09.md` §5.
- Un `@media (prefers-reduced-motion: reduce)` **global** que anula todo lo anterior.

**Prohibido:**
- Revelados disparados por scroll, parallax.
- Skeleton loaders (el punto del motor ya comunica «cargando»), spinners.
- Transición de página entre `index` y `glosario`.
- Cualquier animación en loop salvo el punto del motor mientras el runtime carga.

Estado hoy: una sola animación (`@keyframes blink` del punto del motor, ya con su
`prefers-reduced-motion`). El resto de los `:hover` son instantáneos.

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
   `#prof-defs` (14 definiciones de las columnas de estadística). No lleva a otra
   página.
4. **Los presets se explican en lenguaje llano.** Cada botón de preset (SQL, CTE,
   gráfico) lleva `title` con una frase de una línea sin jerga
   («Un resumen y luego te quedas con lo más grande.»).
5. **Sin modales, sin tour, sin `?` en la home.** El generador de relaciones
   sintéticas **es** el onboarding: probar la herramienta sin traer un archivo, a un
   clic.
6. **El glosario es la referencia larga.** ~40 términos en `<dl>`, cada `<dt>` con
   `id` para que los enlacen los `abbr` de toda la app. La home se mantiene despejada.

Añadidos acotados en evaluación (callout «primera vez», descripción viva del generador)
en `revision-visual-2026-09.md` §6.

---

## 8. Assets / iconografía

Especificaciones. Los **prompts de generación** (nano banana) están en
`revision-visual-2026-09.md` §7. Esta sección se completa con los archivos finales
cuando existan.

| Asset | Estado | Especificación | Entra al repo como |
|---|---|---|---|
| **Favicon** | ⬜ pendiente | Marca abstracta, teal sobre transparente, legible a 16px. Plano. | `favicon.svg` en la raíz + `<link rel="icon">` y `<meta name="theme-color" content="#0f6d80">` en los dos `<head>` |
| **Tarjeta social (OG)** | ⬜ pendiente | 1200×630. Wordmark `consulta` en Mono + bajada; a la derecha, UI plana estilizada. Fondo casi blanco, acento teal, filetes de 1px. ≤ 1 MB. | `docs/og-consulta.png` + `og:image`/`twitter:card`/`og:title`/`og:description` |
| **Banner de README** | ⬜ pendiente | ~1280×400. Misma familia visual, algo más atmosférico. | `docs/banner.png`, en la línea 7 del README (junto a `docs/captura.jpg`, que sigue siendo la captura real) |
| **Ilustraciones de conceptos** | ⬜ pendiente / a evaluar | 3 diagramas cuadrados: columnar vs filas · en el cliente · cadena de CTEs. Plano, rotulado en Mono. **Riesgo de chocar con el estilo plano-preciso** → generar como referencia y redibujar en SVG, o usar solo en README. | `docs/glosario/*.svg` |
| **Captura de producto** | ✅ existe | Captura real del editor SQL + perfilado sobre una relación sintética. | `docs/captura.jpg` |

---

## 9. Checklist para un repo nuevo

Para llevar la identidad «Grafito» a `datos-nomina-sinteticos` u otro repo del
portafolio:

1. **Copiar tal cual:** el bloque `:root` + `:root[data-theme="dark"]` de `style.css`
   (§2), los tokens `--mono`/`--sans`/`--fs-*`/`--sp-*`/`--focus`.
2. **Fuentes:** el mismo `<link>` de Google Fonts (`IBM+Plex+Mono:wght@400;500;600` +
   `IBM+Plex+Sans:wght@400;600`), o el `@font-face` auto-alojado cuando exista.
3. **Componentes:** copiar callout, tabla, botón, chip, ring de foco (§5) y el
   `<script>` inline del interruptor de tema.
4. **Cambiar por repo:** el `<title>`, la `<meta name="description">`, el `og:*`, el
   favicon. **Nada del acento ni de los neutrales** — son compartidos.
5. **Mantener:** cero sombras, cero redondeo, un solo acento, el presupuesto de
   movimiento (§6), la regla de capas del texto explicativo (§7).
