// consulta — SQL sobre CSV y Parquet, 100% en el navegador.
//
// El motor es DuckDB-WASM: se descarga una sola vez desde jsDelivr (~11 MB, luego
// queda en caché del navegador) y corre en un Web Worker. El archivo del usuario se
// registra como un buffer en memoria y nunca sale del equipo.

// jsDelivr's `+esm` reescribe los import bare de dependencias (apache-arrow) que un
// navegador sin bundler no resuelve; por eso no se usa el .mjs crudo del paquete.
import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";

// ---------------------------------------------------------------- estado global
const state = {
  db: null,
  conn: null,
  initPromise: null,   // evita doble inicialización
  table: "datos",
  schema: [],          // [{ name, type, numeric, temporal }]
  rowCount: 0,
  lastResult: null,    // { columns, rows } del último SELECT
};

// ---------------------------------------------------------------- referencias DOM
const $ = (sel) => document.querySelector(sel);
const dropZone = $("#drop-zone");
const fileInput = $("#file-input");
const fileError = $("#file-error");
const engineStatus = $("#engine-status");
const engineStatusText = $("#engine-status-text");
const workspace = $("#workspace");

// ---------------------------------------------------------------- motor DuckDB
function setEngine(stateName, text) {
  engineStatus.dataset.state = stateName;
  if (text) engineStatusText.textContent = text;
}

async function initEngine() {
  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    setEngine("loading", "Motor SQL: descargando runtime de DuckDB (~11 MB, se cachea)…");
    const bundles = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(bundles);

    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
    );
    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);

    state.db = db;
    state.conn = await db.connect();
    setEngine("ready", "Motor SQL: listo (DuckDB-WASM)");
  })().catch((err) => {
    setEngine("error", "Motor SQL: no se pudo iniciar — revisa la conexión y recarga.");
    state.initPromise = null;
    throw err;
  });

  return state.initPromise;
}

// ---------------------------------------------------------------- carga de archivos
const NUMERIC_RE = /(INT|DECIMAL|DOUBLE|FLOAT|REAL|NUMERIC|HUGEINT)/i;
const TEMPORAL_RE = /(DATE|TIMESTAMP|TIME)/i;

function extensionOf(name) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

async function loadBuffer(name, buffer) {
  fileError.hidden = true;
  const ext = extensionOf(name);
  if (!["csv", "tsv", "parquet"].includes(ext)) {
    showError(`Extensión no soportada: .${ext}. Usa .csv, .tsv o .parquet.`);
    return;
  }

  try {
    await initEngine();
  } catch {
    showError("El motor SQL no está disponible (sin conexión a jsDelivr en esta carga). Recarga cuando tengas red.");
    return;
  }

  const virtualName = `input.${ext}`;
  const sizeBytes = buffer.byteLength; // registerFileBuffer transfiere el buffer al worker y lo detacha
  try {
    await state.db.registerFileBuffer(virtualName, new Uint8Array(buffer));
    const reader =
      ext === "parquet"
        ? `read_parquet('${virtualName}')`
        : `read_csv_auto('${virtualName}', SAMPLE_SIZE=-1)`;
    await state.conn.query(`CREATE OR REPLACE TABLE ${state.table} AS SELECT * FROM ${reader}`);
  } catch (err) {
    showError(`No se pudo leer el archivo: ${cleanErr(err)}`);
    return;
  }

  await refreshSchema();
  const [{ n }] = await queryRows(`SELECT count(*)::BIGINT AS n FROM ${state.table}`);
  state.rowCount = Number(n);
  updateFileBar(name, sizeBytes, state.rowCount, ext);

  await renderPreview();
  await renderProfile();
  buildTemplates();
  resetQueryPanel();
  $("#sql-editor").value = defaultQuery();
  selectTab("tab-preview");
  workspace.hidden = false;
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function refreshSchema() {
  const rows = await queryRows(`DESCRIBE ${state.table}`);
  state.schema = rows.map((r) => ({
    name: r.column_name,
    type: r.column_type,
    numeric: NUMERIC_RE.test(r.column_type),
    temporal: TEMPORAL_RE.test(r.column_type),
  }));
}

function updateFileBar(name, bytes, rows, ext) {
  $("#wb-name").textContent = name;
  $("#wb-meta").textContent =
    `${ext.toUpperCase()} · ${rows.toLocaleString("es-CL")} filas · ` +
    `${state.schema.length} columnas · ${formatBytes(bytes)}`;
}

const qid = (name) => `"${String(name).replace(/"/g, '""')}"`;
const firstOf = (pred) => state.schema.find(pred)?.name;

// ---------------------------------------------------------------- consultas
async function queryRows(sql) {
  const table = await state.conn.query(sql);
  return table.toArray().map((row) => row.toJSON());
}

// { columns, rows } — rows como array de arrays; DATE/TIMESTAMP de Arrow → Date.
async function queryGrid(sql) {
  const table = await state.conn.query(sql);
  const fields = table.schema.fields;
  const columns = fields.map((f) => f.name);
  const temporal = fields.map((f) => /date|timestamp/i.test(String(f.type)));
  const rows = table.toArray().map((row) => {
    const j = row.toJSON();
    return columns.map((c, i) => {
      let v = j[c];
      if (temporal[i] && v != null && !(v instanceof Date)) {
        const nv = typeof v === "bigint" ? Number(v) : v;
        if (typeof nv === "number") v = new Date(Math.abs(nv) < 1e8 ? nv * 86400000 : nv);
      }
      return v;
    });
  });
  return { columns, rows };
}

// ---------------------------------------------------------------- formato de celda
const NUM_STRING_RE = /^-?\d+(\.\d+)?$/;
const fmtNumber = (n, d) => n.toLocaleString("es-CL", { maximumFractionDigits: d });
const groupInt = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function numericText(v) {
  if (typeof v === "number") return Number.isFinite(v) ? { n: v, s: null } : null;
  const s = typeof v === "bigint" ? v.toString() : String(v);
  if (!NUM_STRING_RE.test(s) || /^-?0\d/.test(s)) return null;
  return { n: Number(s), s };
}

function fmtCell(v) {
  if (v === null || v === undefined) return { text: "∅", cls: "null" };
  if (v instanceof Date) {
    const iso = v.toISOString();
    return { text: iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.slice(0, 19).replace("T", " "), cls: "" };
  }
  const num = numericText(v);
  if (num) {
    if (num.s && !num.s.includes(".") && num.s.replace("-", "").length > 15) {
      return { text: groupInt(num.s), cls: "num" };
    }
    const dec = num.s && num.s.includes(".")
      ? Math.min(4, num.s.split(".")[1].replace(/0+$/, "").length || 1)
      : Number.isInteger(num.n) ? 0 : 4;
    return { text: fmtNumber(num.n, dec), cls: "num" };
  }
  return { text: String(v), cls: "" };
}

function detectNumeric(columns, rows) {
  return columns.map((c, i) => {
    const known = state.schema.find((s) => s.name === c)?.numeric;
    if (known !== undefined) return known;
    const sample = rows.find((r) => r[i] !== null && r[i] !== undefined)?.[i];
    return sample !== undefined && numericText(sample) !== null;
  });
}

function renderTable(el, columns, rows, { numericCols = null } = {}) {
  const numeric = numericCols || columns.map(() => false);
  const head =
    "<thead><tr>" +
    columns.map((c, i) => `<th class="${numeric[i] ? "num" : ""}">${escapeHtml(c)}</th>`).join("") +
    "</tr></thead>";
  const body =
    "<tbody>" +
    rows
      .map(
        (r) =>
          "<tr>" +
          r
            .map((v) => {
              const { text, cls } = fmtCell(v);
              return `<td class="${cls}">${escapeHtml(text)}</td>`;
            })
            .join("") +
          "</tr>"
      )
      .join("") +
    "</tbody>";
  el.innerHTML = head + body;
}

// ---------------------------------------------------------------- vista previa
async function renderPreview() {
  const { columns, rows } = await queryGrid(`SELECT * FROM ${state.table} LIMIT 10`);
  renderTable($("#preview-table"), columns, rows, { numericCols: detectNumeric(columns, rows) });
  $("#preview-count").textContent = `(10 de ${state.rowCount.toLocaleString("es-CL")})`;
}

// ---------------------------------------------------------------- perfilado
async function renderProfile() {
  const total = state.rowCount || 1;

  const stats = await queryRows(
    `SELECT column_name, column_type, approx_unique, min, max,
            round(avg::DOUBLE, 2) AS avg, round(std::DOUBLE, 2) AS std
     FROM (SUMMARIZE ${state.table})`
  );

  // Nulos, ceros, percentiles y moda por columna, en una sola consulta.
  const parts = [`${total} AS __total`];
  for (const c of state.schema) {
    const q = qid(c.name);
    const a = c.name.replace(/[^A-Za-z0-9]/g, "_");
    parts.push(`${total} - count(${q}) AS "n_${a}"`);
    if (c.numeric) {
      parts.push(`count(*) FILTER (WHERE ${q} = 0) AS "z_${a}"`);
      parts.push(`round(quantile_cont(${q}, 0.05)::DOUBLE, 2) AS "p05_${a}"`);
      parts.push(`round(quantile_cont(${q}, 0.50)::DOUBLE, 2) AS "p50_${a}"`);
      parts.push(`round(quantile_cont(${q}, 0.95)::DOUBLE, 2) AS "p95_${a}"`);
    }
  }
  const [agg] = await queryRows(`SELECT ${parts.join(", ")} FROM ${state.table}`);

  const columns = ["columna", "tipo", "nulos", "%nulos", "distintos", "%ceros", "min", "p05", "mediana", "p95", "max", "media", "desv"];
  const rows = stats.map((r) => {
    const a = r.column_name.replace(/[^A-Za-z0-9]/g, "_");
    const nulls = Number(agg[`n_${a}`] ?? 0);
    const num = NUMERIC_RE.test(r.column_type);
    const zeros = num ? Number(agg[`z_${a}`] ?? 0) : null;
    return [
      r.column_name,
      r.column_type,
      nulls,
      Math.round((1000 * nulls) / total) / 10,
      r.approx_unique,
      zeros == null ? null : Math.round((1000 * zeros) / total) / 10,
      r.min,
      num ? agg[`p05_${a}`] : null,
      num ? agg[`p50_${a}`] : null,
      num ? agg[`p95_${a}`] : null,
      r.max,
      r.avg,
      r.std,
    ];
  });
  renderTable($("#profile-table"), columns, rows, { numericCols: detectNumeric(columns, rows) });

  await renderDimensions();
}

// Desglose de las columnas categóricas de baja cardinalidad: valores + frecuencia.
async function renderDimensions() {
  const host = $("#dim-breakdown");
  host.innerHTML = "";
  const dims = state.schema.filter((s) => !s.numeric && !s.temporal);
  if (dims.length === 0) {
    host.innerHTML = `<p class="hint">Sin columnas categóricas para desglosar.</p>`;
    return;
  }
  for (const d of dims) {
    const q = qid(d.name);
    const rows = await queryRows(
      `SELECT ${q} AS v, count(*) AS n FROM ${state.table}
       GROUP BY 1 ORDER BY n DESC LIMIT 12`
    );
    const totalShown = rows.reduce((s, r) => s + Number(r.n), 0);
    const distinct = (await queryRows(`SELECT count(DISTINCT ${q}) AS d FROM ${state.table}`))[0].d;
    const block = document.createElement("div");
    block.className = "dim";
    block.innerHTML =
      `<div class="dim-head"><span class="dim-name">${escapeHtml(d.name)}</span>` +
      `<span class="dim-meta">${Number(distinct).toLocaleString("es-CL")} distintos</span></div>` +
      rows
        .map((r) => {
          const pct = state.rowCount ? (100 * Number(r.n)) / state.rowCount : 0;
          const label = r.v == null ? "∅" : String(r.v);
          return (
            `<div class="dim-row"><span class="dim-val">${escapeHtml(label)}</span>` +
            `<span class="dim-bar"><span style="width:${pct.toFixed(1)}%"></span></span>` +
            `<span class="dim-n">${Number(r.n).toLocaleString("es-CL")} · ${pct.toFixed(1)}%</span></div>`
          );
        })
        .join("") +
      (Number(distinct) > rows.length ? `<div class="dim-more">+${Number(distinct) - rows.length} más</div>` : "");
    host.appendChild(block);
  }
}

// ---------------------------------------------------------------- plantillas
// Progresión exploración → tiempo → avanzado, 3 variaciones cada una.
function templateGroups() {
  const t = state.table;
  const dim = firstOf((s) => !s.numeric && !s.temporal) || "*";
  const num = firstOf((s) => s.numeric) || "1";
  const ts = firstOf((s) => s.temporal);
  const per = ts ? `date_trunc('month', ${qid(ts)})` : `'sin_fecha'`;

  return [
    {
      titulo: "Exploración",
      items: [
        { n: "perfilar", sql: `SUMMARIZE ${t};` },
        {
          n: "filtrar + ordenar",
          sql: `SELECT *\nFROM ${t}\nWHERE ${qid(num)} IS NOT NULL\nORDER BY ${qid(num)} DESC\nLIMIT 50;`,
        },
        {
          n: "top-N por dimensión",
          sql: `SELECT ${qid(dim)}, count(*) AS n, round(avg(${qid(num)}), 2) AS media\nFROM ${t}\nGROUP BY 1\nORDER BY n DESC\nLIMIT 10;`,
        },
      ],
    },
    {
      titulo: "Tiempo",
      items: [
        {
          n: "agregación por mes",
          sql: `SELECT ${per} AS mes, count(*) AS n, sum(${qid(num)}) AS total\nFROM ${t}\nGROUP BY mes\nORDER BY mes;`,
        },
        {
          n: "media móvil 3 periodos",
          sql: `WITH m AS (\n  SELECT ${per} AS mes, sum(${qid(num)}) AS total\n  FROM ${t} GROUP BY mes\n)\nSELECT mes, total,\n       round(avg(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_movil_3\nFROM m ORDER BY mes;`,
        },
        {
          n: "participación (%) sobre el total",
          sql: `SELECT ${qid(dim)},\n       sum(${qid(num)}) AS total,\n       round(100.0 * sum(${qid(num)}) / sum(sum(${qid(num)})) OVER (), 1) AS pct\nFROM ${t}\nGROUP BY 1\nORDER BY total DESC;`,
        },
      ],
    },
    {
      titulo: "Avanzado",
      items: [
        {
          n: "CTEs encadenadas",
          sql: `WITH base AS (\n  SELECT ${per} AS mes, ${qid(dim)} AS dim, sum(${qid(num)}) AS total\n  FROM ${t} GROUP BY 1, 2\n),\nranked AS (\n  SELECT *, row_number() OVER (PARTITION BY mes ORDER BY total DESC) AS pos\n  FROM base\n)\nSELECT * FROM ranked WHERE pos <= 3 ORDER BY mes, pos;`,
        },
        {
          n: "ranking por ventana",
          sql: `SELECT ${qid(dim)}, sum(${qid(num)}) AS total,\n       rank() OVER (ORDER BY sum(${qid(num)}) DESC) AS rk,\n       round(100.0 * sum(${qid(num)}) / sum(sum(${qid(num)})) OVER (), 1) AS pct\nFROM ${t}\nGROUP BY 1\nORDER BY rk;`,
        },
        {
          n: "pivote por dimensión",
          sql: `PIVOT (\n  SELECT ${per} AS mes, ${qid(dim)} AS dim, ${qid(num)} AS v FROM ${t}\n)\nON dim USING sum(v)\nORDER BY mes;`,
        },
      ],
    },
  ];
}

function buildTemplates() {
  const host = $("#templates");
  host.innerHTML = "";
  for (const g of templateGroups()) {
    const wrap = document.createElement("div");
    wrap.className = "tpl-group";
    wrap.innerHTML = `<span class="tpl-title">${g.titulo}</span>`;
    for (const it of g.items) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = it.n;
      b.title = it.sql;
      b.addEventListener("click", () => {
        $("#sql-editor").value = it.sql;
        runQuery();
      });
      wrap.appendChild(b);
    }
    host.appendChild(wrap);
  }
}

function defaultQuery() {
  const num = firstOf((s) => s.numeric);
  const ts = firstOf((s) => s.temporal);
  if (ts && num) return `SELECT date_trunc('month', ${qid(ts)}) AS mes, sum(${qid(num)}) AS total\nFROM ${state.table}\nGROUP BY mes\nORDER BY mes;`;
  return `SELECT * FROM ${state.table} LIMIT 100;`;
}

// ---------------------------------------------------------------- asistente de CTEs
const cteState = [];

function renderCteList() {
  const host = $("#cte-list");
  host.innerHTML = "";
  cteState.forEach((c, i) => {
    const row = document.createElement("div");
    row.className = "cte-item";
    row.innerHTML =
      `<input class="cte-name" value="${escapeHtml(c.name)}" aria-label="nombre del CTE">` +
      `<textarea class="cte-body" rows="2" aria-label="subconsulta">${escapeHtml(c.body)}</textarea>` +
      `<button type="button" class="ghost cte-del" title="quitar">✕</button>`;
    row.querySelector(".cte-name").addEventListener("input", (e) => (c.name = e.target.value));
    row.querySelector(".cte-body").addEventListener("input", (e) => (c.body = e.target.value));
    row.querySelector(".cte-del").addEventListener("click", () => {
      cteState.splice(i, 1);
      renderCteList();
    });
    host.appendChild(row);
  });
}

function addCte() {
  const n = cteState.length + 1;
  const prev = cteState[cteState.length - 1]?.name || state.table;
  cteState.push({ name: `paso_${n}`, body: `SELECT * FROM ${prev}` });
  renderCteList();
}

function composeCte() {
  const valid = cteState.filter((c) => c.name.trim() && c.body.trim());
  if (valid.length === 0) return;
  const withClause = valid
    .map((c) => `${c.name.trim()} AS (\n  ${c.body.trim().replace(/;\s*$/, "")}\n)`)
    .join(",\n");
  const last = valid[valid.length - 1].name.trim();
  $("#sql-editor").value = `WITH ${withClause}\nSELECT * FROM ${last};`;
  selectTab("tab-query");
  runQuery();
}

// ---------------------------------------------------------------- panel SQL
function resetQueryPanel() {
  $("#result-meta").textContent = "";
  $("#result-meta").classList.remove("err");
  $("#result-table").innerHTML = "";
  $("#export-btn").hidden = true;
  $("#copy-headers").hidden = true;
  $("#explain-panel").hidden = true;
  state.lastResult = null;
}

async function runQuery() {
  const sql = $("#sql-editor").value.trim();
  if (!sql) return;
  const meta = $("#result-meta");
  meta.classList.remove("err");
  meta.textContent = "Ejecutando…";

  const t0 = performance.now();
  let grid;
  try {
    grid = await queryGrid(sql);
  } catch (err) {
    meta.classList.add("err");
    meta.textContent = cleanErr(err);
    $("#result-table").innerHTML = "";
    $("#export-btn").hidden = true;
    $("#copy-headers").hidden = true;
    return;
  }
  const ms = Math.max(1, Math.round(performance.now() - t0));

  renderTable($("#result-table"), grid.columns, grid.rows, {
    numericCols: detectNumeric(grid.columns, grid.rows),
  });
  meta.textContent = `${grid.rows.length.toLocaleString("es-CL")} filas · ${ms} ms`;

  state.lastResult = grid;
  $("#export-btn").hidden = grid.rows.length === 0;
  $("#copy-headers").hidden = grid.columns.length === 0;
  $("#explain-sql").textContent = sql;
  $("#explain-panel").hidden = false;

  syncChartControls();
}

// ---------------------------------------------------------------- exportar / portapapeles
function exportCSV() {
  if (!state.lastResult) return;
  const { columns, rows } = state.lastResult;
  const esc = (v) => {
    let s = v === null || v === undefined ? "" : v instanceof Date ? fmtCell(v).text : typeof v === "bigint" ? v.toString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "consulta-resultado.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) {
      const l = btn.textContent;
      btn.textContent = "copiado ✓";
      setTimeout(() => (btn.textContent = l), 1200);
    }
  } catch {
    /* portapapeles bloqueado por el navegador */
  }
}

function pasteHeaders() {
  const raw = $("#headers-in").value.trim();
  if (!raw) return;
  const cols = raw.split(/[\t,;|]+/).map((s) => s.trim()).filter(Boolean);
  if (!cols.length) return;
  $("#sql-editor").value = `SELECT ${cols.map(qid).join(", ")}\nFROM ${state.table};`;
  $("#headers-in").value = "";
  selectTab("tab-query");
  runQuery();
}

// ---------------------------------------------------------------- gráfico
const CHART_TYPES = ["barras", "linea", "multi", "area", "scatter"];

function syncChartControls() {
  const grid = state.lastResult;
  const xSel = $("#chart-x");
  const ySel = $("#chart-y");
  const sSel = $("#chart-series");
  [xSel, ySel, sSel].forEach((s) => (s.innerHTML = ""));
  if (!grid) return;

  sSel.add(new Option("— ninguna —", "-1"));
  grid.columns.forEach((c, i) => {
    xSel.add(new Option(c, i));
    ySel.add(new Option(c, i));
    sSel.add(new Option(c, i));
  });

  const numericByIdx = detectNumeric(grid.columns, grid.rows);
  const temporalByIdx = grid.columns.map((c) =>
    state.schema.find((s) => s.name === c)?.temporal || grid.rows.some((r) => r[grid.columns.indexOf(c)] instanceof Date)
  );
  const xi = temporalByIdx.findIndex(Boolean) >= 0 ? temporalByIdx.findIndex(Boolean) : numericByIdx.findIndex((n) => !n);
  const yi = numericByIdx.findIndex((n) => n);
  xSel.value = String(xi >= 0 ? xi : 0);
  ySel.value = String(yi >= 0 ? yi : Math.min(1, grid.columns.length - 1));
  sSel.value = "-1";
  updateChartUiState();
  drawChart();
}

function updateChartUiState() {
  const type = $("#chart-type").value;
  const needsSeries = type === "multi" || type === "area";
  $("#chart-series-wrap").hidden = !needsSeries;
  // Al pasar a multi/área sin serie elegida, tomar la primera columna categórica.
  if (needsSeries && $("#chart-series").value === "-1" && state.lastResult) {
    const cand = state.lastResult.columns.findIndex(
      (c, i) => i !== Number($("#chart-x").value) && i !== Number($("#chart-y").value)
    );
    if (cand >= 0) $("#chart-series").value = String(cand);
  }
}

function drawChart() {
  const svg = $("#result-chart");
  const grid = state.lastResult;
  svg.innerHTML = "";
  if (!grid || grid.rows.length === 0) return;

  const type = $("#chart-type").value;
  const xi = Number($("#chart-x").value);
  const yi = Number($("#chart-y").value);
  const si = Number($("#chart-series").value);

  const W = 720;
  const H = 320;
  const pad = { top: 18, right: 18, bottom: 66, left: 66 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const ns = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const add = (tag, attrs, text, parent) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    (parent || svg).appendChild(e);
    return e;
  };
  const asNum = (v) => (v instanceof Date ? v.getTime() : Number(v));

  if (type === "scatter") {
    const pts = grid.rows
      .slice(0, 4000)
      .map((r) => ({ x: asNum(r[xi]), y: asNum(r[yi]) }))
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (!pts.length) return;
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const xmin = Math.min(...xs), xmax = Math.max(...xs) || 1;
    const ymin = Math.min(0, ...ys), ymax = Math.max(...ys) || 1;
    const sx = (v) => pad.left + ((v - xmin) / (xmax - xmin || 1)) * iW;
    const sy = (v) => pad.top + iH - ((v - ymin) / (ymax - ymin || 1)) * iH;
    add("line", { x1: pad.left, y1: sy(ymin), x2: W - pad.right, y2: sy(ymin), stroke: "currentColor", "stroke-opacity": 0.3 });
    add("text", { x: 8, y: sy(ymax) + 4, class: "axis-label muted" }, formatCompact(ymax));
    add("text", { x: 8, y: sy(ymin) + 4, class: "axis-label muted" }, formatCompact(ymin));
    add("text", { x: pad.left, y: H - 8, class: "axis-label muted" }, formatCompact(xmin));
    add("text", { x: W - pad.right, y: H - 8, "text-anchor": "end", class: "axis-label muted" }, formatCompact(xmax));
    pts.forEach((p) => add("circle", { cx: sx(p.x), cy: sy(p.y), r: 2.5, fill: "var(--accent)", "fill-opacity": 0.65 }));
    return;
  }

  // Series categóricas para barras/línea/multi/área. Barras se limita para no
  // volverse ilegible; línea/multi/área admiten miles de puntos (series de tiempo).
  const rowsUsed = grid.rows.slice(0, type === "barras" ? 60 : 20000);
  const cats = [];
  const catIndex = new Map();
  for (const r of rowsUsed) {
    const k = fmtCell(r[xi]).text;
    if (!catIndex.has(k)) {
      catIndex.set(k, cats.length);
      cats.push(k);
    }
  }
  const useSeries = (type === "multi" || type === "area") && si >= 0;
  const seriesKeys = useSeries ? [...new Set(rowsUsed.map((r) => fmtCell(r[si]).text))].slice(0, 8) : ["_"];
  const matrix = seriesKeys.map(() => new Array(cats.length).fill(0));
  for (const r of rowsUsed) {
    const ci = catIndex.get(fmtCell(r[xi]).text);
    const sk = useSeries ? seriesKeys.indexOf(fmtCell(r[si]).text) : 0;
    if (ci == null || sk < 0) continue;
    const v = asNum(r[yi]);
    if (Number.isFinite(v)) matrix[sk][ci] += v;
  }

  const stacked = type === "area";
  const colTotals = cats.map((_, ci) => matrix.reduce((s, row) => s + row[ci], 0));
  const maxV = stacked
    ? Math.max(1, ...colTotals)
    : Math.max(1, ...matrix.flat());
  const minV = stacked ? 0 : Math.min(0, ...matrix.flat());
  const span = maxV - minV || 1;
  const y = (v) => pad.top + iH - ((v - minV) / span) * iH;
  const x = (ci) => pad.left + (cats.length <= 1 ? iW / 2 : (ci / (cats.length - 1)) * iW);
  const bw = iW / Math.max(1, cats.length);

  add("line", { x1: pad.left, y1: y(Math.max(0, minV)), x2: W - pad.right, y2: y(Math.max(0, minV)), stroke: "currentColor", "stroke-opacity": 0.3 });
  add("text", { x: 8, y: y(maxV) + 4, class: "axis-label muted" }, formatCompact(maxV));
  add("text", { x: 8, y: y(Math.max(0, minV)) + 4, class: "axis-label muted" }, formatCompact(Math.max(0, minV)));

  const palette = ["var(--accent)", "#6c8ea4", "#a88b56", "#7d9a6f", "#9a6f8e", "#5f7f8a", "#b0894f", "#748c5e"];

  if (type === "barras") {
    matrix[0].forEach((v, ci) => {
      const xx = pad.left + ci * bw + bw * 0.15;
      const top = Math.min(y(0), y(v));
      add("rect", { x: xx, y: top, width: bw * 0.7, height: Math.abs(y(v) - y(0)), fill: "var(--accent)" });
    });
  } else if (type === "area") {
    const acc = new Array(cats.length).fill(0);
    seriesKeys.forEach((sk, sidx) => {
      const pts = [];
      for (let ci = 0; ci < cats.length; ci++) {
        const base = acc[ci];
        acc[ci] += matrix[sidx][ci];
        pts.push([x(ci), y(acc[ci]), base]);
      }
      let d = `M ${pts[0][0]} ${y(pts[0][2])}`;
      pts.forEach((p) => (d += ` L ${p[0]} ${p[1]}`));
      for (let k = pts.length - 1; k >= 0; k--) d += ` L ${pts[k][0]} ${y(pts[k][2])}`;
      d += " Z";
      add("path", { d, fill: palette[sidx % palette.length], "fill-opacity": 0.75 });
    });
  } else {
    // linea / multi
    const dots = cats.length <= 40;
    matrix.forEach((row, sidx) => {
      const d = row.map((v, ci) => `${ci === 0 ? "M" : "L"} ${x(ci)} ${y(v)}`).join(" ");
      add("path", { d, fill: "none", stroke: palette[sidx % palette.length], "stroke-width": 1.8 });
      if (dots) row.forEach((v, ci) => add("circle", { cx: x(ci), cy: y(v), r: 2, fill: palette[sidx % palette.length] }));
    });
  }

  // etiquetas del eje X (submuestreadas si son muchas)
  const step = Math.ceil(cats.length / 12);
  cats.forEach((c, ci) => {
    if (ci % step !== 0) return;
    const cx = type === "barras" ? pad.left + ci * bw + bw / 2 : x(ci);
    const lbl = c.length > 12 ? c.slice(0, 11) + "…" : c;
    add("text", { x: cx, y: H - pad.bottom + 16, "text-anchor": "end", transform: `rotate(-40 ${cx} ${H - pad.bottom + 16})`, class: "bar-label" }, lbl);
  });

  // leyenda
  if (useSeries) {
    seriesKeys.forEach((sk, i) => {
      add("rect", { x: pad.left + i * 90, y: 2, width: 9, height: 9, fill: palette[i % palette.length] });
      add("text", { x: pad.left + i * 90 + 13, y: 10, class: "axis-label" }, sk.length > 10 ? sk.slice(0, 9) + "…" : sk);
    });
  }
}

// ---------------------------------------------------------------- pestañas
const TABS = ["tab-preview", "tab-profile", "tab-query", "tab-combinar", "tab-chart"];
function selectTab(id) {
  TABS.forEach((t) => {
    const btn = document.getElementById(t);
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    const on = t === id;
    btn.setAttribute("aria-selected", String(on));
    panel.hidden = !on;
  });
  if (id === "tab-query") $("#sql-editor").focus();
}

// ---------------------------------------------------------------- utilidades
function showError(msg) {
  fileError.textContent = msg;
  fileError.hidden = false;
}
function cleanErr(err) {
  return String(err?.message || err).replace(/^Error:\s*/, "").trim();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
function formatCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return String(Math.round(n));
}

// ---------------------------------------------------------------- generador sintético
// PRNG determinista (mulberry32): una semilla reproduce la relación exacta.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86400000;

// 1 — serie agregada mensual: periodo × segmento × serie, con tendencia + estacionalidad
function synthSerie(nRows, seed) {
  const rng = mulberry32(seed);
  const seg = ["A", "B", "C", "D", "E"];
  const ser = ["principal", "secundaria"];
  const months = Math.min(180, Math.max(6, Math.round(nRows / (seg.length * ser.length))));
  const base = {};
  for (const s of seg) for (const k of ser) base[s + k] = 5000 + rng() * 20000;
  const out = ["periodo,segmento,serie,valor,unidades"];
  for (let m = 0; m < months; m++) {
    const d = new Date(Date.UTC(2018, 0, 1));
    d.setUTCMonth(d.getUTCMonth() + m);
    const periodo = d.toISOString().slice(0, 10);
    const trend = 1 + m * 0.006;
    const season = 1 + 0.15 * Math.sin((2 * Math.PI * (m % 12)) / 12);
    for (const s of seg)
      for (const k of ser) {
        const mult = k === "secundaria" ? 0.4 : 1;
        const valor = rng() < 0.02 ? "" : (base[s + k] * trend * season * (0.85 + rng() * 0.3) * mult).toFixed(2);
        const unidades = 20 + ((rng() * 180) | 0);
        out.push(`${periodo},${s},${k},${valor},${unidades}`);
      }
  }
  return out.join("\n") + "\n";
}

// 2 — panel diario multi-entidad: entidad × fecha × 3 medidas, estacionalidad semanal
function synthPanel(nRows, seed) {
  const rng = mulberry32(seed);
  const E = Math.min(80, Math.max(3, Math.round(Math.sqrt(nRows / 3))));
  const D = Math.min(1461, Math.max(14, Math.round(nRows / E)));
  const start = Date.UTC(2023, 0, 1);
  const ent = [];
  for (let e = 0; e < E; e++) ent.push({ id: `E-${String(e + 1).padStart(3, "0")}`, b1: 50 + rng() * 200, b3: 1 + rng() * 40 });
  const out = ["entidad,fecha,m1,m2,m3"];
  for (let day = 0; day < D; day++) {
    const dt = new Date(start + day * DAY);
    const fecha = dt.toISOString().slice(0, 10);
    const wk = dt.getUTCDay() === 0 || dt.getUTCDay() === 6 ? 0.6 : 1;
    const drift = 1 + day * 0.0008;
    for (const en of ent) {
      const m1 = (en.b1 * wk * drift * (0.9 + rng() * 0.2)).toFixed(2);
      const m2 = rng() < 0.04 ? "" : (en.b1 * 0.3 * (0.5 + rng())).toFixed(2);
      const m3 = Math.max(0, Math.round(en.b3 * wk * (0.7 + rng() * 0.6)));
      out.push(`${en.id},${fecha},${m1},${m2},${m3}`);
    }
  }
  return out.join("\n") + "\n";
}

// 3 — registro de eventos: timestamp preciso, entidad, tipo de evento, valor
function synthEventos(nRows, seed) {
  const rng = mulberry32(seed);
  const tipos = ["inicio", "avance", "pausa", "fin"];
  const E = Math.min(2000, Math.max(5, Math.round(nRows / 15)));
  const start = Date.UTC(2025, 0, 1);
  const range = 330 * DAY;
  const rows = [];
  for (let i = 0; i < nRows; i++) {
    const t = start + rng() * range;
    rows.push({
      k: t,
      ts: new Date(t).toISOString().slice(0, 19).replace("T", " "),
      entidad: `E-${String(1 + ((rng() * E) | 0)).padStart(4, "0")}`,
      evento: tipos[(rng() * tipos.length) | 0],
      valor: rng() < 0.05 ? "" : (rng() * 1000).toFixed(2),
    });
  }
  rows.sort((a, b) => a.k - b.k);
  const out = ["ts,entidad,evento,valor"];
  for (const r of rows) out.push(`${r.ts},${r.entidad},${r.evento},${r.valor}`);
  return out.join("\n") + "\n";
}

// 4 — métrica con quiebres: serie diaria única, cambios de nivel y outliers marcados
function synthQuiebres(nRows, seed) {
  const rng = mulberry32(seed);
  const D = Math.min(4000, Math.max(60, nRows));
  const start = Date.UTC(2021, 0, 1);
  const out = ["fecha,valor,es_outlier,regimen"];
  let nivel = 100 + rng() * 50;
  let regimen = 1;
  let next = 40 + ((rng() * 120) | 0);
  for (let day = 0; day < D; day++) {
    if (day === next) {
      nivel *= 0.6 + rng() * 0.9;
      regimen++;
      next += 40 + ((rng() * 160) | 0);
    }
    const fecha = isoDay(start + day * DAY);
    const season = 1 + 0.08 * Math.sin((2 * Math.PI * day) / 365);
    let v = nivel * season * (0.96 + rng() * 0.08);
    const outlier = rng() < 0.012;
    if (outlier) v *= 1.8 + rng() * 2;
    out.push(`${fecha},${v.toFixed(2)},${outlier},${regimen}`);
  }
  return out.join("\n") + "\n";
}

const SHAPES = { serie: synthSerie, panel: synthPanel, eventos: synthEventos, quiebres: synthQuiebres };

async function loadSynthetic(shape, nRows, seed, format) {
  const csv = new TextEncoder().encode((SHAPES[shape] || synthSerie)(nRows, seed));
  const stem = `sintetico_${shape}_${nRows}_s${seed}`;
  if (format === "csv") {
    await loadBuffer(`${stem}.csv`, csv);
    return;
  }
  try {
    await initEngine();
  } catch {
    showError("El motor SQL no está disponible para materializar el Parquet.");
    return;
  }
  await state.db.registerFileBuffer("synthsrc.csv", csv);
  await state.conn.query(
    `COPY (SELECT * FROM read_csv_auto('synthsrc.csv', SAMPLE_SIZE=-1))
     TO 'synth.parquet' (FORMAT PARQUET, COMPRESSION 'zstd')`
  );
  const pq = await state.db.copyFileToBuffer("synth.parquet");
  await loadBuffer(`${stem}.parquet`, pq);
}

// ---------------------------------------------------------------- eventos
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) loadBuffer(file.name, await file.arrayBuffer());
});
["dragenter", "dragover"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  })
);
dropZone.addEventListener("drop", async (e) => {
  const file = e.dataTransfer.files[0];
  if (file) loadBuffer(file.name, await file.arrayBuffer());
});

$("#wb-reset").addEventListener("click", () => {
  workspace.hidden = true;
  fileInput.value = "";
  dropZone.scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#copy-cols").addEventListener("click", (e) => copyText(state.schema.map((s) => s.name).join(", "), e.currentTarget));

TABS.forEach((t) => document.getElementById(t).addEventListener("click", () => selectTab(t)));

$("#run-btn").addEventListener("click", runQuery);
$("#sql-editor").addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runQuery();
  }
});
$("#export-btn").addEventListener("click", exportCSV);
$("#copy-headers").addEventListener("click", (e) => state.lastResult && copyText(state.lastResult.columns.join(", "), e.currentTarget));
$("#headers-in").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    pasteHeaders();
  }
});

$("#chart-type").addEventListener("change", () => {
  updateChartUiState();
  drawChart();
});
["#chart-x", "#chart-y", "#chart-series"].forEach((s) => $(s).addEventListener("change", drawChart));

$("#cte-add").addEventListener("click", addCte);
$("#cte-compose").addEventListener("click", composeCte);

$("#synth-btn").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const shape = $("#synth-shape").value;
  const nRows = Number($("#synth-rows").value);
  const seed = Number($("#synth-seed").value) || 0;
  const format = $("#synth-format").value;
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Generando…";
  try {
    await loadSynthetic(shape, nRows, seed, format);
  } catch (err) {
    showError(`No se pudo generar la relación: ${cleanErr(err)}`);
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});
