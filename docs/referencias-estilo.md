# Referencias de estilo — notas para `consulta`

> Investigación de diseño para documentación técnica, con foco en cómo Google
> estiliza su documentación. Estado actual de `consulta`: estilo **«Grafito»** — IBM
> Plex Mono para títulos, IBM Plex Sans para el cuerpo, paleta grafito plana, un solo
> acento ámbar, sin sombras, sin esquinas redondeadas.
>
> **Nada de esto está aplicado todavía** — es material de referencia.

## 1. Cómo lo hace Google

**Sistema.** La mayoría de la documentación de Google (`developers.google.com`,
Google Cloud, Android, Chrome, `web.dev`) corre sobre **DevSite**, su plataforma
interna. Todas comparten el mismo esqueleto: barra superior fina, **nav izquierdo
persistente y colapsable**, columna de contenido central de ancho acotado (~640–720px
de texto, ~960–1000px con código), y **TOC derecho «On this page»** que resalta la
sección activa al hacer scroll. Encabezado con **breadcrumb** sobre el H1.
`m3.material.io` es un caso aparte (más editorial, mucho aire, imágenes grandes),
pero la doc de producto real es DevSite.

**Tipografía.** Google Sans / Product Sans **no tienen licencia libre**. El patrón
real: **Google Sans para títulos y nav**, **Roboto para cuerpo y UI**, **Roboto Mono
para código**. Escala tipo Material 3 (Roboto, peso 400 salvo títulos a 500):

| Rol | px | line-height | weight |
|---|---|---|---|
| Headline (H1/H2) | 32 / 28 | 40 / 36 | 400 |
| Title (H3) | 22 | 28 | 400–500 |
| Body large (cuerpo) | 16 | 24 | 400 |
| Body medium (secundario) | 14 | 20 | 400 |
| Label / código inline | 14 | — | 500 / 400 |

Letter-spacing casi nulo en cuerpo (0–0.15px), ligeramente positivo en labels
pequeñas.

**Color.** Fondo blanco `#ffffff`, texto `#202124` (casi-negro Google Grey 900),
texto secundario `#5f6368`. **Un solo acento**: azul `#1a73e8` para enlaces y
acciones (Cloud usa el mismo azul; nunca meten un segundo acento). Enlaces **sin
subrayado permanente**, subrayado al hover; azul sólido, sin bold. **Divisores
`1px #dadce0` en vez de cajas**; las secciones se separan con línea y espacio, no con
borde+sombra+fondo.

**Callouts.** Solo cuatro tipos y con moderación
([style/notices](https://developers.google.com/style/notices)): **Note** (útil, no
crítico), **Caution** (proceder con cuidado), **Warning** (pérdida de datos /
irreversible), **Success** (solo en contenido dinámico). Formato:
`<aside class="note">` — franja de color a la **izquierda** (`border-left 4px`),
fondo tenue del mismo hue, etiqueta en bold (`Note:`) inline con el texto. Nada de
iconos grandes ni bordes completos. No agrupar varios seguidos.

**Código.** Bloques con fondo gris muy claro (`#f1f3f4`), sin borde o borde 1px,
**sin esquinas redondeadas marcadas** (2–4px máx), **botón copiar** arriba a la
derecha que aparece al hover. **Pestañas de lenguaje** (curl / Python / Java) sobre
el bloque. Syntax highlight sobrio, pocos colores.

**Qué lo hace «sentir Google»:** mucho blanco, 2–3 colores en total, jerarquía fuerte
por tamaño/peso (no por color), sans-serif en todo, **divisores sutiles en vez de
tarjetas**, densidad media-baja, cero sombras.

## 2. Otros referentes

- **DuckDB docs** (`duckdb.org/docs`) — **el más cercano a Grafito**. Plano, mono en
  código, acento amarillo-DuckDB único, tablas densas tipo ficha técnica, casi sin
  sombras, nav izquierdo + TOC derecho. Robar: el tono «hoja de datos» y cómo
  integran SQL con resultados en el mismo bloque.
- **Tailwind docs** — **lado blando**: sombras suaves, radios 8–12px, mucho color en
  los ejemplos. No copiar el look, sí **la escala tipográfica y el ritmo de
  espaciado** y los **bloques de código con pestañas + resaltado de líneas**.
- **Stripe docs** — sans variable (Söhne), fondo blanco, headings navy `#061b31`,
  **un acento morado `#533afd`** para enlaces/interacción, pesos 300–400, layout
  aireado de 3 columnas. Robar: **disciplina de un solo acento** y contraste alto en
  headings, densidad baja.
- **Linear** / **Vercel–Next.js docs** — muy plano, casi monocromo, **dark-first**,
  bordes `1px` hairline en vez de sombra, radios pequeños (6px), tipografía Inter
  apretada. Robar: **pairing claro/oscuro** basado en un token de borde y dos de
  fondo, sin sombras.

Espectro: DuckDB / Linear / Vercel = *spec sheet plano* (nuestra zona). Stripe =
intermedio. Tailwind = *blando/redondeado*.

## 3. Tácticas transferibles (sin framework)

- **Ritmo de espaciado**: escala de 4px (`4 8 12 16 24 32 48 64`). Espacio entre
  párrafos = 1 line-height. Margen sobre H2 = 2–2.5× el de abajo; sobre H3 = 1.5×.
- **Escala tipográfica**: ratio ~1.2 (Minor Third). Con cuerpo 16/24:
  `14 · 16 · 20 · 25 · 31`. **line-height 1.5 en cuerpo, 1.25 en headings**. Longitud
  de línea **65–75 caracteres** → `max-width: 42rem` en la columna de texto, más
  ancha solo para código y tablas.
- **Callouts al estilo Google**: `border-left: 3px solid <color>`,
  `background: color-mix(in srgb, <color> 8%, transparent)`, padding `12px 16px`,
  label en `IBM Plex Mono` bold minúscula (`NOTA` / `CUIDADO` / `ADVERTENCIA`). Tres
  niveles: neutro (grafito), ámbar (caution), rojo (warning). Sin icono o un glifo
  mono pequeño (`i`, `!`).
- **Bloques de código**: fondo `#1c1c1e` / `#f6f6f4` según tema,
  `border: 1px solid var(--border)`, `border-radius: 3px`, padding `16px`, `IBM Plex
  Mono` 13–14px / 1.6. Botón copiar: texto `copiar`, esquina sup-der, `opacity 0` →
  `1` al hover del bloque. Para SQL+resultado, encadenar dos bloques pegados con un
  divisor de 1px.
- **Enlaces**: color = acento ámbar solo si el fondo lo tolera; si el ámbar sobre
  blanco falla contraste (suele fallar), usar **grafito + subrayado
  `text-decoration-thickness: 1px; text-underline-offset: 2px`** y reservar el ámbar
  para el `:hover` y el borde-izq del elemento activo en el nav. **Focus**:
  `outline: 2px solid <ámbar>; outline-offset: 2px` — visible, cuadrado, coherente
  con «sin redondeo».
- **Tablas**: sin bordes verticales, solo `border-bottom: 1px var(--border)` por
  fila, header con `border-bottom: 2px`, celdas `padding: 8px 12px`, números
  tabulares (`font-variant-numeric: tabular-nums`), header en mono minúscula.
- **Claro/oscuro con 5 tokens**: `--bg`, `--bg-subtle` (código/callout), `--text`,
  `--text-muted`, `--border`. El **ámbar es el único valor que no cambia** entre
  temas (ajustarlo ~10% más claro en oscuro). Nada de sombras en ninguno de los dos.
- **Dónde va el acento**: item activo del nav (border-left), hover de enlaces, foco
  de teclado, quizás el `<h1>` de la home. **Dónde NO**: cuerpo de texto, fondos de
  sección, bordes de tabla, todos los callouts a la vez, código.

## 4. Valores citables

- **Google/Material**: Roboto 400/500; Roboto Mono. Texto `#202124`, secundario
  `#5f6368`, divisor `#dadce0`, código-bg `#f1f3f4`, enlace `#1a73e8`. Escala
  (px/lh): 32/40, 28/36, 22/28, 16/24, 14/20, 12/16. Letter-spacing cuerpo ~0.15px.
- **Stripe**: bg `#ffffff`, heading `#061b31`, acento `#533afd`, mono Source Code
  Pro, pesos 300/400.
- **Fuentes libres equivalentes**: cuerpo → **Inter** o **Public Sans** (casi
  métricamente compatible con Roboto). **IBM Plex Sans/Mono ya en uso** — mantenerlo
  es lo más barato y ya «spec sheet». Mono display alternativo: **JetBrains Mono**,
  **Commit Mono**. Títulos con más carácter sin romper el look: **Space Grotesk** o
  **IBM Plex Sans Condensed**.
- **Type scale lista para pegar** (cuerpo 16, ratio 1.2):
  `--fs-xs:0.75rem; --fs-sm:0.875rem; --fs-base:1rem; --fs-lg:1.25rem;
  --fs-xl:1.5rem; --fs-2xl:1.875rem; --fs-3xl:2.25rem;`

## Links

- <https://developers.google.com/style/> — guía de estilo de documentación de Google
- <https://developers.google.com/style/notices> — tipos de callout (Note/Caution/Warning/Success) y formato
- <https://m3.material.io/styles/typography/type-scale-tokens> — escala tipográfica Material 3
- <https://m3.material.io/styles/color/roles> — roles de color (un acento + neutrales)
- <https://design.google/library/google-sans-flex-font> — Google Sans vs Roboto, cuándo usar cada uno
- <https://en.wikipedia.org/wiki/Roboto> — Roboto / Roboto Mono (licencia Apache, libre)
- <https://duckdb.org/docs/> — referente plano «ficha técnica», el más cercano a Grafito
- <https://docs.stripe.com> — disciplina de un solo acento, headings de alto contraste, layout aireado
- <https://tailwindcss.com/docs> — escala tipográfica y bloques de código con pestañas (lado blando)
- <https://linear.app> · <https://nextjs.org/docs> — pairing claro/oscuro plano, hairline borders sin sombra
- <https://idratherbewriting.com/files/doc-navigation-wtd/design-principles-for-doc-navigation/> — principios de navegación de docs (nav izq + TOC der)
