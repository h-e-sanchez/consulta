# Guía de estilo — portafolio (`consulta`, `centinela`, `cartilla`, `conciliador`)

> Las **decisiones** de identidad visual del portafolio, ya aplicadas en `tema.css`
> (copia idéntica en los cuatro repos) y en el `style.css` de cada sitio. Es la
> referencia viva: si algo acá y el código no coinciden, gana el código y se corrige
> este documento. Para la investigación previa, ver
> [`referencias-estilo.md`](referencias-estilo.md); para la cola visual de septiembre,
> [`revision-visual-2026-09.md`](revision-visual-2026-09.md).

---

## 1. Identidad — «Grafito»

Los cuatro sitios se leen como **una misma familia de herramientas de control de
gestión**: neutros fríos, una sola sans para todo (cifras incluidas), un único acento
**verde bosque** usado con disciplina, superficies con **fondo sutil y sin borde**,
esquinas de **6 px**, **sin sombras** y **sin rieles laterales de color**. El color
semántico se reserva para lo que pide atención: «ok» va en gris, solo alerta y crítica
llevan color.

Elegido el 2026-10-07 en un configurador con 13 apartados (tipografía, números,
disposición, espaciado, acento, esquinas, superficies, estados, botones, etiqueta,
modo, favicon y ancho). Disposición «Columna» en los cuatro sitios y espaciado compacto.

> **Historia:** hasta `?v=18` consulta usaba un primer «Grafito» (mono en todo, cero
> redondeo, acento teal); en `?v=19` pasó a «técnico cálido / notebook» (papel crema,
> IBM Plex, azul pizarra), que luego copiaron centinela, cartilla y conciliador. Ese
> tema se parecía demasiado a la estética por defecto de las herramientas de IA, así
> que en octubre de 2026 se volvió a una base fría y se homologaron los cuatro sitios.

---

## 2. Color

### Tokens — `tema.css`

| Token | Día | Noche | Uso |
|---|---|---|---|
| `--bg` | `#f7f8fa` | `#0d0f12` | fondo de página |
| `--surface` | `#ffffff` | `#14171c` | controles, editor, tablas de datos |
| `--surface-2` | `#f0f2f5` | `#1b1f25` | tarjetas, KPI, callouts, código, thead |
| `--border` | `#e3e6eb` | `#262b33` | divisores de 1 px |
| `--border-strong` | `#c9ced6` | `#3a414c` | inputs, botón secundario |
| `--text` | `#111418` | `#e8eaed` | texto, borde de la tarjeta actual |
| `--muted` | `#5b636e` | `#9aa2ad` | texto secundario |
| `--faint` | `#8a929c` | `#6b737e` | terciario, nulos |
| `--accent` | `#1d6b47` | `#5cc995` | verde bosque |
| `--accent-weak` | `#e6f0eb` | `#13261d` | callout, fila seleccionada |
| `--on-accent` | `#ffffff` | `#0d0f12` | texto sobre acento |
| `--ok` | `= --muted` | `= --muted` | dentro de rango: neutro |
| `--alerta` | `#a35f00` | `#e0a33d` | ámbar |
| `--critica` | `#c2312b` | `#f0716b` | rojo (antes `--error` en consulta) |

### Modo día / noche

Sin elección guardada, **manda el sistema** (`prefers-color-scheme`). Los tokens oscuros
se declaran dos veces: en `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`
y en `:root[data-theme="dark"]`. El botón `#theme-toggle` guarda una elección
explícita (`"light"` o `"dark"`) y la estampa en `data-theme`, así gana en ambos
sentidos. Cualquier regla que dependa del modo oscuro se escribe en los dos bloques
(ver el chevron del `select` en `consulta/style.css`).

### Dónde va el acento

| Va | No va |
|---|---|
| Enlaces, etiqueta sobre el H1 | Cuerpo de texto |
| Botón primario, `.sitio-boton` | Bordes de tarjetas |
| Ring de foco (`--focus`) | Estado «ok» |
| Pestaña activa, serie «Real» de un gráfico | Fondos de sección |

### Colores de rol y paleta de gráfico

Panel **Esquema** de consulta: el rol de la columna es un punto junto al rótulo
(`--kind`), no un riel. Temporal `#3b6fb6`, medida `= --accent`, dimensión `#8a64c0`,
identificador `= --faint`.

Paleta multi-serie del gráfico (`app.js`, `drawChart`), el primero siempre el acento:

```js
["var(--accent)", "#3b6fb6", "#c07a1f", "#8a64c0", "#2a9aa8", "#c2507a", "#6b7a8f", "#9a8a2e"]
```

En centinela, cada reporte trae su color (`--acento`, desde `reportes/catalogo.json`);
se usa solo como un punto de 8 px junto a la etiqueta del reporte.

### Contraste

Pares de texto en **WCAG AA**. Cualquier ajuste de color se verifica antes de commitear.

---

## 3. Tipografía

Dos familias **auto-alojadas** en `vendor/fonts/` de cada repo (subset latin, OFL 1.1),
declaradas en `tema.css`. **Sin peticiones a Google Fonts** en ninguno de los cuatro sitios.

```css
--sans: "Public Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace;
```

| Familia | Peso | Dónde |
|---|---|---|
| **Public Sans** | 700 | `h1`, `h2` (tracking −0.025 / −0.015em) |
| **Public Sans** | 600 | `h3`, titular, botones, `b, strong` |
| **Public Sans** | 400–500 | cuerpo, tablas, KPI, ejes de gráfico |
| **Geist Mono** | 400–500 | solo código: SQL, DAX, Python, `code`, nombres de archivo |

**Cifras:** misma fuente del texto con `font-variant-numeric: tabular-nums lining-nums`
(clases `.num`, `td.num`, `.valor`, `.kpi-valor`, `.cifra`), para que las columnas se
alineen sin cambiar de familia. Sin mayúsculas espaciadas en etiquetas.

Escala: `--fs-xs 0.75rem` · `--fs-sm 0.84rem` · `--fs-md 1rem` · `--fs-lg 1.2rem` ·
`--fs-xl 1.5rem` · `--fs-2xl 2rem`. Base 15 px.

---

## 4. Espaciado y layout

Compacto: `--sp-1 4px` · `--sp-2 8px` · `--sp-3 12px` · `--sp-4 18px` (margen de
página) · `--sp-6 24px` · `--sp-8 36px`; celdas de tabla `--celda: 4px 8px`.

- **Dos anchos:** `--ancho-lectura: 820px` (`main`: cartilla, glosarios) y
  `--ancho-reporte: 1100px` (`main.ancho`: portadas de centinela, consulta y
  conciliador; reporte y datos de centinela).
- **Disposición «Columna»:** encabezado, contenido y bloque Portafolio uno bajo otro.
- Tablas, gráficos y código anchos scrollean dentro de su contenedor.

---

## 5. Componentes compartidos (`tema.css`)

- **Encabezado** `.site-header`: `.etiqueta-sitio` (acento, texto normal), `h1` con el
  nombre del producto, `.titular`, `.firma`, `.tagline` y `#theme-toggle` arriba a la derecha.
- **Estados** `.estado.ok | .alerta | .critica | .neutro`: chip con punto de 6 px y
  fondo del mismo tono al 12 %.
- **Botones** `.btn`, `.btn.primario`, `.btn-primario`: relleno de acento con
  `--on-accent`; secundario con borde `--border-strong`.
- **Portafolio** `.portafolio-compartido` > `.sitio` (fondo `--surface-2`), `.sitio.actual`
  (borde `--text` + `.estas-aqui`), `.sitio.proximo` (borde discontinuo). Acciones:
  `.sitio-boton` (relleno) + `.sitio-github` (marca de GitHub + «GitHub»).
- **Favicon:** SVG de letras en el acento: `ce`, `co`, `ca`, `cn`.
- **Tema** `tema.js` (copia idéntica): `<script src="tema.js" data-sitio="consulta">` en
  el `<head>`, sin `defer`. Emite `tema:cambio` y `<sitio>:themechange`; `app.js` de
  consulta escucha `consulta:themechange` para redibujar el gráfico.

---

## 6. Movimiento — presupuesto

Movimiento medido.

**Base:** `--t: 130ms ease`, `@keyframes fadeUp` / `fadeIn` en consulta, y
`prefers-reduced-motion` que anula transiciones y animaciones.

**Permitido:**
- Micro-transiciones de **`--t` (130 ms)** sobre `color` / `background-color` /
  `border-color` / `filter` en elementos interactivos. **Nunca** propiedades que
  disparen layout.
- Dos entradas con fade corto en consulta, ambas desde un estado visible en reposo:
  `#workspace` al cargar una relación y `.panel` al cambiar de pestaña.
- El punto del motor parpadea **solo** mientras el runtime carga.

**Prohibido:** revelados por scroll, parallax, skeleton loaders, spinners, transición
de página, cualquier otro loop.

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

---

## 8. Assets / iconografía

Los prompts de generación están en `revision-visual-2026-09.md` §7 (escritos para el
tema anterior: actualizar colores a Grafito antes de usarlos). Todo asset nuevo usa
el acento verde bosque `#1d6b47` sobre `--bg`.

| Asset | Estado | Entra al repo como |
|---|---|---|
| **Favicon** | ✅ SVG de letras inline en cada `<head>` | — |
| **Tarjeta social (OG)** | ⬜ pendiente | `docs/og-<sitio>.png` + `og:image` |
| **Banner de README** | ⬜ pendiente | `docs/banner.png` |
| **GIFs del README** | ⬜ pendiente | `docs/gif/*.gif` |

---

## 9. Checklist para un repo nuevo del portafolio

1. **Copiar tal cual** `tema.css`, `tema.js` y `vendor/fonts/` (`public-sans.woff2`,
   `geist-mono.woff2`) desde cualquiera de los cuatro repos. Si se cambia `tema.css` o
   `tema.js`, se cambia en los cinco a la vez: deben quedar idénticos.
2. **`<head>`:** favicon de letras, `<link rel="preload">` de `public-sans.woff2`,
   `tema.css` antes de `style.css`, y `<script src="tema.js" data-sitio="<repo>">`.
3. **`style.css`:** solo lo propio del sitio; nunca redefinir tokens.
4. **Bloque Portafolio:** sumar la tarjeta del repo nuevo en los demás sitios (un PR por
   repo, contra `main`).
5. **Mantener:** un solo acento, mono solo para código, cifras con `tabular-nums`, el
   presupuesto de movimiento (§6) y la regla de capas del texto explicativo (§7).
