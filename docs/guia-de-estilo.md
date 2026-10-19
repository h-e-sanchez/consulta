# Guía de estilo — portafolio (`centinela`, `consulta`, `cartilla`, `acervo`, `fiabilidad`, `cuadratura`)

> Las **decisiones** de identidad visual del portafolio, ya aplicadas en `tema.css`
> (copia idéntica en los seis repos publicados) y en el `style.css` de cada sitio. Es la
> referencia viva: si algo acá y el código no coinciden, gana el código y se corrige
> este documento. Para la investigación previa, ver
> [`referencias-estilo.md`](referencias-estilo.md); para la cola visual de septiembre,
> [`revision-visual-2026-09.md`](revision-visual-2026-09.md).

---

## 1. Identidad — «Editorial»

Los seis sitios se leen como **un mismo oficio publicado como documentación**: la
estructura viene de sitios editoriales de herramientas (referencia: rea.tools). Barra
superior común con los seis sitios, portada con una **promesa grande** en el H1, secciones
separadas por **líneas finas a todo el ancho** y mucho aire, y tarjetas con **borde fino
sin relleno**. La jerarquía la marca el **tamaño, no el color**: casi todo en grises, el
**verde bosque** solo en enlaces y en lo activo, y los botones principales en **tinta**.
El color semántico se reserva para lo que pide atención: «ok» va en gris.

Elegido el 2026-10-18 sobre un prototipo en cuadratura: verde como acento (no el azul de
la referencia) y modo noche en **pizarra azulada** (paleta Catppuccin Mocha).

> **Historia:** hasta `?v=18` consulta usaba un primer «Grafito» (mono en todo, cero
> redondeo, acento teal); en `?v=19` pasó a «técnico cálido / notebook» (papel crema,
> IBM Plex, azul pizarra), que luego copiaron los demás sitios. Ese tema se parecía
> demasiado a la estética por defecto de las herramientas de IA, así que el 2026-10-07
> se volvió a una base fría («Grafito»: superficies con relleno, cuatro sitios). El
> 2026-10-18 se pasó a «Editorial» y se sumaron acervo, fiabilidad y cuadratura.

---

## 2. Color

### Tokens — `tema.css`

| Token | Día | Noche | Uso |
|---|---|---|---|
| `--bg` | `#ffffff` | `#1e1e2e` | fondo de página |
| `--surface` | `#ffffff` | `#1e1e2e` | controles, editor, tablas de datos |
| `--surface-2` | `#f4f6f8` | `#181825` | código, thead, pistas de barras (no tarjetas) |
| `--border` | `#e0e5e9` | `#45475a` | divisores, líneas de sección, borde de tarjetas |
| `--border-strong` | `#c5ccd3` | `#585b70` | inputs, botón secundario |
| `--text` | `#20252b` | `#cdd6f4` | texto y relleno del botón principal |
| `--muted` | `#5b6570` | `#a6adc8` | texto secundario, bajada |
| `--faint` | `#8a939c` | `#7f849c` | terciario, nulos |
| `--accent` | `#1d6b47` | `#a6e3a1` | verde: enlaces y lo activo |
| `--accent-weak` | `#e8f1ec` | `#263a2c` | fila seleccionada |
| `--on-accent` | `#ffffff` | `#1e1e2e` | texto sobre acento |
| `--ok` | `= --muted` | `= --muted` | dentro de rango: neutro |
| `--alerta` | `#9a5b00` | `#f9e2af` | ámbar |
| `--critica` | `#b8322c` | `#f38ba8` | rojo |

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
| Enlaces | Cuerpo de texto, eyebrow |
| Sitio actual en la barra (subrayado) | Botón principal (va en tinta) |
| Ring de foco (`--focus`) | Bordes de tarjetas, estado «ok» |
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
| **Public Sans** | 650 | `h1`, `h2`, `h3` (tracking −0.035 / −0.03 / −0.02em, interlínea 1,14) |
| **Public Sans** | 600 | `h3`, titular, botones, `b, strong` |
| **Public Sans** | 400–500 | cuerpo, tablas, KPI, ejes de gráfico |
| **Geist Mono** | 400–500 | solo código: SQL, DAX, Python, `code`, nombres de archivo |

**Cifras:** misma fuente del texto con `font-variant-numeric: tabular-nums lining-nums`
(clases `.num`, `td.num`, `.valor`, `.kpi-valor`, `.cifra`), para que las columnas se
alineen sin cambiar de familia. Sin mayúsculas espaciadas en etiquetas.

Escala: `--fs-xs 0.78rem` · `--fs-sm 0.875rem` · `--fs-md 1rem` · `--fs-lg 1.2rem` ·
`--fs-xl clamp(1.6rem, 2.6vw, 2.2rem)` (h2) · `--fs-2xl clamp(2.4rem, 5.6vw, 4.4rem)` (h1 de
portada). El h1 de las subpáginas (`.site-header h1`) va en `clamp(2rem, 4vw, 3rem)`. Base
16 px, interlínea 1,65.

---

## 4. Espaciado y layout

Escala: `--sp-1 4px` · `--sp-2 8px` · `--sp-3 12px` · `--sp-4 18px` · `--sp-6 24px` ·
`--sp-8 36px`; aire entre secciones `--sp-seccion` (hasta 3,8rem); celdas `--celda: 6px 10px`.

- **Dos anchos:** `--ancho-lectura: 820px` (`main`: cartilla, glosarios) y
  `--ancho-reporte: 1100px` (`main.ancho` y la barra superior, `.contenedor`).
- **Secciones:** cada `main > section` lleva una línea fina a todo el ancho de la ventana y
  aire arriba y abajo. Las páginas o bloques tipo aplicación se excluyen con la clase
  **`app`** (`main.app` en el reporte y los datos de centinela y el módulo de cartilla;
  `section.app` en la zona de carga de consulta).
- Tablas, gráficos y código anchos scrollean dentro de su contenedor.

---

## 5. Componentes compartidos (`tema.css`)

- **Barra superior** `header.barra-sup` > `.contenedor.barra-interior`: `.marca`
  («Control de gestión, construido como software» + «por Hernán Elías Sánchez»),
  `nav.sitios` con los seis sitios (el actual con `aria-current="page"`) y `.barra-iconos`
  con `#theme-toggle.icono-btn` (luna/sol) y el enlace a GitHub del repo.
- **En esta página** `nav.en-pagina` (pegajosa, solo en portadas largas): `tema.js` marca
  con `aria-current="location"` el enlace de la sección visible.
- **Portada** `section.portada#portada`: `.eyebrow` (nombre del producto en negrita + qué
  es), `h1` con la **promesa** (no el nombre del producto), `.lede`, `.acciones` (botón
  principal + `.enlace-texto`) y `.firma`. Opcional: `.portada-grilla` con un `.panel`.
- **Subpáginas:** conservan `.site-header` (migas, h1 y tagline) bajo la barra.
- **Estados** `.estado.ok | .alerta | .critica | .neutro`: chip con punto de 6 px y
  fondo del mismo tono al 12 %.
- **Botones** `.btn`, `.btn.primario`, `.btn-primario`: principal en **tinta** (`--text` de
  fondo, `--bg` de texto); secundario transparente con borde `--border-strong`. Los
  `input[type=file]` usan el mismo estilo.
- **Portafolio** `.portafolio-compartido` > `.sitio`: lista de los seis sitios con línea
  inferior, nombre enlazado, rol a la derecha, descripción y «Código en GitHub». El actual
  (`.sitio.actual`) agrega «· estás aquí» en verde.
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
   `geist-mono.woff2`) desde cualquiera de los seis repos. Si se cambia `tema.css` o
   `tema.js`, se cambia en todos a la vez: deben quedar idénticos.
2. **`<head>`:** favicon de letras, `<link rel="preload">` de `public-sans.woff2`,
   `tema.css` antes de `style.css`, y `<script src="tema.js" data-sitio="<repo>">`.
3. **`style.css`:** solo lo propio del sitio; nunca redefinir tokens.
4. **Barra y Portafolio:** sumar el sitio nuevo a `nav.sitios` y a la lista del Portafolio
   en todos los sitios (un PR por repo, contra `main`).
5. **Mantener:** un solo acento, mono solo para código, cifras con `tabular-nums`, el
   presupuesto de movimiento (§6) y la regla de capas del texto explicativo (§7).
