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
  schema: [],          // [{ name, type, numeric }]
  lastResult: null,    // { columns, rows } del último SELECT — insumo del gráfico y el export
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

    // El worker vive en jsDelivr (otro origen); se envuelve en un blob para poder instanciarlo.
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
    // Re-registrar sobrescribe el buffer anterior.
    await state.db.registerFileBuffer(virtualName, new Uint8Array(buffer));

    const reader =
      ext === "parquet"
        ? `read_parquet('${virtualName}')`
        : `read_csv_auto('${virtualName}', SAMPLE_SIZE=-1)`; // -1 = escanear todo para inferir tipos

    await state.conn.query(`CREATE OR REPLACE TABLE ${state.table} AS SELECT * FROM ${reader}`);
  } catch (err) {
    showError(`No se pudo leer el archivo: ${cleanErr(err)}`);
    return;
  }

  await refreshSchema();
  const [{ n }] = await queryRows(`SELECT count(*)::BIGINT AS n FROM ${state.table}`);
  updateFileBar(name, sizeBytes, Number(n), ext);

  await renderPreview();
  await renderProfile();
  buildChips();
  resetQueryPanel();
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
  }));
}

function updateFileBar(name, bytes, rows, ext) {
  $("#wb-name").textContent = name;
  $("#wb-meta").textContent =
    `${ext.toUpperCase()} · ${rows.toLocaleString("es-CL")} filas · ` +
    `${state.schema.length} columnas · ${formatBytes(bytes)}`;
}

// ---------------------------------------------------------------- consultas
// Devuelve las filas como array de objetos planos, normalizando BigInt para lectura.
async function queryRows(sql) {
  const table = await state.conn.query(sql);
  return table.toArray().map((row) => row.toJSON());
}

// Devuelve { columns, rows } — rows es array de arrays, valores crudos (para gráfico/export).
async function queryGrid(sql) {
  const table = await state.conn.query(sql);
  const columns = table.schema.fields.map((f) => f.name);
  const rows = table.toArray().map((row) => {
    const j = row.toJSON();
    return columns.map((c) => j[c]);
  });
  return { columns, rows };
}

// ---------------------------------------------------------------- render: tablas
// DuckDB/Arrow devuelve los tipos numéricos de forma dispar: BIGINT como BigInt,
// HUGEINT y DECIMAL como string o como objeto Arrow. Se normaliza todo vía String()
// y se decide por la forma del texto, no por el typeof.
const NUM_STRING_RE = /^-?\d+(\.\d+)?$/;

function fmtNumber(n, fractionDigits) {
  return n.toLocaleString("es-CL", { maximumFractionDigits: fractionDigits });
}

// Agrupa de a miles un string entero sin pasar por Number (preserva int128).
function groupInt(s) {
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function numericText(v) {
  if (typeof v === "number") return Number.isFinite(v) ? { n: v, s: null } : null;
  const s = typeof v === "bigint" ? v.toString() : String(v);
  if (!NUM_STRING_RE.test(s) || /^-?0\d/.test(s)) return null; // "07430", "2026-01" → no
  return { n: Number(s), s };
}

function fmtCell(v) {
  if (v === null || v === undefined) return { text: "∅", cls: "null" };
  if (v instanceof Date) return { text: v.toISOString().slice(0, 10), cls: "" };

  const num = numericText(v);
  if (num) {
    if (num.s && !num.s.includes(".") && num.s.replace("-", "").length > 15) {
      return { text: groupInt(num.s), cls: "num" }; // entero enorme: agrupar sin perder precisión
    }
    const dec = num.s && num.s.includes(".")
      ? Math.min(4, num.s.split(".")[1].replace(/0+$/, "").length || 1)
      : Number.isInteger(num.n) ? 0 : 4;
    return { text: fmtNumber(num.n, dec), cls: "num" };
  }
  return { text: String(v), cls: "" };
}

// ¿la columna i es numérica? Mira el esquema conocido y, si no, una muestra real.
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
      .map((r) => {
        return (
          "<tr>" +
          r
            .map((v) => {
              const { text, cls } = fmtCell(v);
              return `<td class="${cls}">${escapeHtml(text)}</td>`;
            })
            .join("") +
          "</tr>"
        );
      })
      .join("") +
    "</tbody>";
  el.innerHTML = head + body;
}

async function renderPreview() {
  const { columns, rows } = await queryGrid(`SELECT * FROM ${state.table} LIMIT 50`);
  renderTable($("#preview-table"), columns, rows, { numericCols: detectNumeric(columns, rows) });
  $("#preview-count").textContent = `(mostrando ${rows.length})`;
}

async function renderProfile() {
  const { columns, rows } = await queryGrid(
    `SELECT column_name, column_type, count, round(null_percentage, 1) AS null_pct,
            approx_unique, min, max, round(avg::DOUBLE, 2) AS avg, round(std::DOUBLE, 2) AS std
     FROM (SUMMARIZE ${state.table})`
  );
  renderTable($("#profile-table"), columns, rows, { numericCols: detectNumeric(columns, rows) });
}

// ---------------------------------------------------------------- panel SQL
function buildChips() {
  const chips = $("#sql-chips");
  const t = state.table;
  const textCol = state.schema.find((s) => !s.numeric)?.name;
  const numCol = state.schema.find((s) => s.numeric)?.name;

  const suggestions = [
    { label: "todo", sql: `SELECT * FROM ${t} LIMIT 100` },
    { label: "conteo", sql: `SELECT count(*) AS filas FROM ${t}` },
  ];
  if (textCol && numCol) {
    suggestions.push({
      label: `suma por ${textCol}`,
      sql: `SELECT ${textCol}, sum(${numCol}) AS total\nFROM ${t}\nGROUP BY ${textCol}\nORDER BY total DESC`,
    });
  }
  suggestions.push({ label: "perfil (SUMMARIZE)", sql: `SUMMARIZE ${t}` });

  chips.innerHTML = "";
  suggestions.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s.label;
    b.addEventListener("click", () => {
      $("#sql-editor").value = s.sql;
      runQuery();
    });
    chips.appendChild(b);
  });

  // Consulta inicial por defecto
  $("#sql-editor").value = suggestions[0].sql;
}

function resetQueryPanel() {
  $("#result-meta").textContent = "";
  $("#result-meta").classList.remove("err");
  $("#result-table").innerHTML = "";
  $("#export-btn").hidden = true;
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
    return;
  }
  const ms = Math.max(1, Math.round(performance.now() - t0));

  renderTable($("#result-table"), grid.columns, grid.rows, {
    numericCols: detectNumeric(grid.columns, grid.rows),
  });
  meta.textContent = `${grid.rows.length.toLocaleString("es-CL")} filas · ${ms} ms`;

  state.lastResult = grid;
  $("#export-btn").hidden = grid.rows.length === 0;
  $("#explain-sql").textContent = sql;
  $("#explain-panel").hidden = false;

  syncChartControls();
}

// ---------------------------------------------------------------- exportar
function exportCSV() {
  if (!state.lastResult) return;
  const { columns, rows } = state.lastResult;
  const esc = (v) => {
    let s = v === null || v === undefined ? "" : typeof v === "bigint" ? v.toString() : String(v);
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

// ---------------------------------------------------------------- gráfico
function syncChartControls() {
  const grid = state.lastResult;
  const xSel = $("#chart-x");
  const ySel = $("#chart-y");
  xSel.innerHTML = "";
  ySel.innerHTML = "";
  if (!grid) return;

  grid.columns.forEach((c, i) => {
    xSel.add(new Option(c, i));
    ySel.add(new Option(c, i));
  });

  // Defaults razonables: primera no-numérica en X, primera numérica en Y.
  const numericByIdx = grid.columns.map((c, i) => {
    const s = grid.rows.find((r) => r[i] !== null && r[i] !== undefined)?.[i];
    return typeof s === "number" || typeof s === "bigint";
  });
  const xi = numericByIdx.findIndex((n) => !n);
  const yi = numericByIdx.findIndex((n) => n);
  xSel.value = String(xi >= 0 ? xi : 0);
  ySel.value = String(yi >= 0 ? yi : Math.min(1, grid.columns.length - 1));
  drawChart();
}

function drawChart() {
  const svg = $("#result-chart");
  const grid = state.lastResult;
  svg.innerHTML = "";
  if (!grid || grid.rows.length === 0) return;

  const xi = Number($("#chart-x").value);
  const yi = Number($("#chart-y").value);
  const data = grid.rows
    .map((r) => ({ label: String(r[xi] ?? "∅"), value: Number(r[yi]) }))
    .filter((d) => Number.isFinite(d.value))
    .slice(0, 40);
  if (data.length === 0) return;

  const W = Math.max(640, data.length * 46);
  const H = 300;
  const pad = { top: 16, right: 16, bottom: 64, left: 64 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxV = Math.max(0, ...data.map((d) => d.value));
  const minV = Math.min(0, ...data.map((d) => d.value));
  const span = maxV - minV || 1;
  const y = (v) => pad.top + innerH - ((v - minV) / span) * innerH;
  const bw = innerW / data.length;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const ns = "http://www.w3.org/2000/svg";
  const add = (tag, attrs, text) => {
    const e = document.createElementNS(ns, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    svg.appendChild(e);
    return e;
  };

  // eje base (y = 0)
  add("line", { x1: pad.left, y1: y(0), x2: W - pad.right, y2: y(0), stroke: "currentColor", "stroke-opacity": 0.35 });
  add("text", { x: 8, y: y(maxV) + 4, class: "axis-label muted" }, formatCompact(maxV));
  add("text", { x: 8, y: y(0) + 4, class: "axis-label muted" }, "0");

  data.forEach((d, i) => {
    const x = pad.left + i * bw + bw * 0.15;
    const w = bw * 0.7;
    const top = Math.min(y(0), y(d.value));
    const h = Math.abs(y(d.value) - y(0));
    add("rect", { x, y: top, width: w, height: h, fill: "var(--accent)", rx: 2 });
    const lbl = d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label;
    add(
      "text",
      {
        x: pad.left + i * bw + bw / 2,
        y: H - pad.bottom + 16,
        "text-anchor": "end",
        transform: `rotate(-40 ${pad.left + i * bw + bw / 2} ${H - pad.bottom + 16})`,
        class: "bar-label",
      },
      lbl
    );
  });
}

// ---------------------------------------------------------------- pestañas
const TABS = ["tab-preview", "tab-profile", "tab-query", "tab-chart"];
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

document.querySelectorAll("[data-sample]").forEach((a) =>
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    const path = a.dataset.sample;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.statusText);
      await loadBuffer(path.split("/").pop(), await res.arrayBuffer());
    } catch (err) {
      showError(`No se pudo cargar el ejemplo (${cleanErr(err)}). Sírvelo por HTTP, no abras index.html con file://.`);
    }
  })
);

$("#wb-reset").addEventListener("click", () => {
  workspace.hidden = true;
  fileInput.value = "";
  dropZone.scrollIntoView({ behavior: "smooth", block: "start" });
});

TABS.forEach((t) => document.getElementById(t).addEventListener("click", () => selectTab(t)));

$("#run-btn").addEventListener("click", runQuery);
$("#sql-editor").addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runQuery();
  }
});
$("#export-btn").addEventListener("click", exportCSV);
$("#chart-x").addEventListener("change", drawChart);
$("#chart-y").addEventListener("change", drawChart);
