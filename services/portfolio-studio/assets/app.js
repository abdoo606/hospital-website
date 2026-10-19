import { createBackup, parseBackup, MAX_BACKUP_BYTES } from "./backup.js";
import { projects, today } from "./catalog.js";
import {
  currency,
  cents,
  numeric,
  invoiceTotals,
  adjustStock,
  cashFlow,
  streak,
  toggleDate,
  revenue,
  pipeline,
  validateAnswers,
  normalizeRow,
  csv,
  escape as e,
  restore,
} from "./model.js";
const id = document.body.dataset.project,
  project = projects.find((p) => p.id === id),
  base = project ? "../../" : "./",
  root = document.querySelector("#app");
const source =
  "https://github.com/abdoo606/hospital-website/tree/arena/cbc41b37-hospital-website/services/portfolio-studio";
let filter = "All",
  query = "",
  editId = null,
  viewDate = today(),
  region = "All",
  month = today().slice(0, 7),
  state,
  toastTimer;
const fresh = () => ({
  version: 1,
  rows: structuredClone(project.seed),
  extras: structuredClone(project.extras),
});
let cloud;
let storageNotice = "";
if (project) {
  state = fresh();
  try {
    const raw = localStorage.getItem("studio:v1:" + id);
    if (raw) {
      const saved = restore(project, raw);
      if (saved) state = saved;
      else
        storageNotice =
          "Saved data was invalid. Demo data is shown instead; reset to replace it.";
    }
  } catch {
    storageNotice =
      "Browser storage is unavailable. Changes will last only for this page session.";
  }
}
function toast(message, error = false) {
  document.querySelector(".toast")?.remove();
  clearTimeout(toastTimer);
  const t = document.createElement("div");
  t.className = "toast" + (error ? " error" : "");
  t.setAttribute("role", error ? "alert" : "status");
  t.textContent = message;
  document.body.append(t);
  toastTimer = setTimeout(() => t.remove(), 5500);
}
function save() {
  if (cloud?.sync.active) {
    cloud.sync.noteEdit();
    return true;
  }
  try {
    localStorage.setItem("studio:v1:" + id, JSON.stringify(state));
    return true;
  } catch {
    storageNotice =
      "Changes are only in memory: browser storage is unavailable or full.";
    return false;
  }
}
function commit(message) {
  const persisted = save();
  render();
  toast(
    persisted
      ? message +
          (cloud?.sync.active ? " Not synced yet — click Save to cloud." : "")
      : message + " Not saved to browser storage.",
    !persisted,
  );
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function badge(value) {
  return `<span class="badge ${["High", "Lost", "Low stock"].includes(value) ? "bad" : ["Medium", "In progress", "Proposal"].includes(value) ? "warn" : ""}">${e(value)}</span>`;
}
const btn = (label, action, row = "", cls = "secondary") =>
  `<button type="button" class="${cls}" data-action="${action}" data-id="${e(row)}">${label}</button>`;
function header() {
  return `<header class="topbar"><a class="brand" href="${base}"><span class="logo">A</span>Abdulrhman<span class="quiet">/ studio</span></a><nav class="nav" aria-label="Main navigation"><a href="${base}#work">Selected work</a><a href="${base}#about">About</a><a href="${source}" target="_blank" rel="noreferrer">GitHub ↗</a></nav><span class="pill"><i class="dot"></i> Independent portfolio projects</span></header>`;
}
function footer() {
  return `<footer class="footer"><span>© ${new Date().getFullYear()} Abdulrhman · Portfolio studio</span><span>AI-assisted concepts. Demo data. No real transactions or client claims.</span><a href="${source}" target="_blank" rel="noreferrer">Explore the source ↗</a></footer>`;
}
function icon(id) {
  const paths = {
    ledger: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h4",
    stockroom: "M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10",
    momentum: "M4 4h4v16H4z M10 4h4v10h-4z M16 4h4v13h-4z",
    daylight: "M7 3v4 M17 3v4 M3 10h18 M3 5h18v16H3z M7 14h3 M14 14h3",
    gather:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M17 4a4 4 0 0 1 0 8 M18 15a4 4 0 0 1 4 4v2",
    balance: "M3 6h18v14H3z M3 6V4h14 M15 12h6v4h-6z",
    resolve: "M4 4h16v13H8l-4 4z M8 8h8 M8 12h5",
    ritual:
      "M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8",
    fieldwork: "M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5",
    northstar: "M4 20V10h4v10z M10 20V4h4v16z M16 20v-7h4v7z",
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"/></svg>`;
}
function mini(p, index) {
  return `<div class="preview" style="background:${p.color}"><img class="project-shot" src="${base}screenshots/${p.id}.png" alt="${p.name} application screenshot" width="1440" height="1000" loading="lazy"><span class="mini-icon" aria-hidden="true">${icon(p.id)}</span></div>`;
}

function gallery() {
  root.innerHTML = `<div class="wrap">${header()}<main><section class="hero"><div><div class="eyebrow">DIGITAL EXPERIENCES / SELECTED WORK</div><h1>Thoughtful tools.<br><span class="serif">Everyday possibilities.</span></h1><p>A collection of ten interactive web concepts. Practical workflows, considered interfaces, and the little details that make a product feel good to use.</p><div class="hero-actions"><a class="primary" href="#work">Explore the projects <span>↗</span></a><span class="quiet">10 concepts. Ready to explore.</span></div></div><div class="art" aria-hidden="true"><div class="eyebrow">A LITTLE PREVIEW OF WHAT'S INSIDE</div><div class="art-card"><div class="art-top"><span>Northstar / Demo revenue</span><span>↗</span></div><div class="art-title">A clearer picture.</div><div class="mini-bars">${[37, 55, 43, 73, 62, 88, 100].map((n) => `<i style="height:${n}%"></i>`).join("")}</div><div class="art-foot"><span>Meaningful interactions</span><span>Not just screenshots</span></div></div><div class="art-note">✳ &nbsp; Built to be explored.</div></div></section><div class="strip"><div><strong>10</strong><span>Interactive project concepts</span></div><div><strong>3</strong><span>Everyday problem spaces</span></div><div><strong>Local + cloud</strong><span>Guest demo or private synced workspace</span></div><div><strong>Open code</strong><span>Readable source & documented tests</span></div></div><section class="work" id="work"><div class="section-head"><div><div class="eyebrow">THE COLLECTION</div><h2>Small products. Real interactions.</h2><p>Open a project, try the workflow, make it your own.</p></div><span class="quiet">01 — 10 / ${new Date().getFullYear()}</span></div><div class="filters" role="group" aria-label="Filter projects">${["All", "Business", "Productivity", "Lifestyle"].map((f) => `<button class="filter ${f === filter ? "active" : ""}" data-filter="${f}" aria-pressed="${f === filter}">${f === "All" ? "All projects" : f}</button>`).join("")}</div><div class="grid">${projects
    .filter((p) => filter === "All" || p.group === filter)
    .map(
      (p) =>
        `<a class="project" href="projects/${p.id}/">${mini(p, projects.indexOf(p))}<div class="project-info"><div class="project-title"><h3>${p.name}</h3><span class="category">${p.category}</span></div><p>${p.description}</p><div class="chips">${p.features.map((f) => `<span class="chip">${f}</span>`).join("")}</div><div class="card-foot"><span>Explore project</span><span>↗</span></div></div></a>`,
    )
    .join(
      "",
    )}</div></section><section class="about" id="about"><div><div class="eyebrow" style="color:#bed1b7">ABOUT THIS COLLECTION</div><h2>Built with curiosity.<br>Presented with transparency.</h2></div><p>I'm Abdulrhman. This collection was created through an AI-assisted development workflow as independent portfolio work. Every project is a browser-based prototype with optional private cloud saving, not a claim of paid client delivery. Try it with fictional data, inspect the source, and see the documented scope and limitations.</p></section></main>${footer()}</div>`;
}
function field([key, label, type, options], value = "", prefix = "") {
  const attrs = `name="${key}" id="${prefix + key}" required`;
  const input =
    type === "select"
      ? `<select ${attrs}>${options.map((v) => `<option value="${e(v)}" ${String(value) === v ? "selected" : ""}>${e(v)}</option>`).join("")}</select>`
      : `<input ${attrs} type="${type === "integer" ? "number" : type}" value="${e(value)}" ${["number", "integer"].includes(type) ? `min="0" max="1000000" step="${type === "integer" ? "1" : "0.01"}"` : ""} ${type === "text" ? 'maxlength="250"' : ""}>`;
  return `<label for="${prefix + key}">${e(label)}${input}</label>`;
}
function editor() {
  const row = state.rows.find((r) => r.id === editId) || {};
  return `<section class="panel no-print" id="editor"><h2>${editId ? "Edit" : "Add"} ${id === "ledger" ? "line item" : id === "fieldwork" ? "form field" : id === "ritual" ? "habit" : "entry"}</h2><form data-form="entry" class="form-grid">${project.fields.map((f) => field(f, row[f[0]] ?? (f[2] === "date" ? today() : f[0] === "quantity" ? 1 : ""), "entry-")).join("")}<div class="actions"><button class="primary" type="submit">${editId ? "Save changes" : "Add entry"} <span>+</span></button>${editId ? btn("Cancel", "cancel") : ""}</div></form></section>`;
}
function filtered() {
  return state.rows
    .filter(
      (r) =>
        !query ||
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(query.toLowerCase()),
        ),
    )
    .filter((r) => id !== "daylight" || r.date === viewDate)
    .filter((r) => id !== "balance" || !month || r.date.startsWith(month))
    .filter(
      (r) => id !== "northstar" || region === "All" || r.region === region,
    );
}
function metrics() {
  const rows = filtered();
  let values;
  if (id === "ledger") {
    const a = invoiceTotals(
      state.rows,
      state.extras.tax,
      state.extras.discount,
    );
    values = [
      ["Invoice total", currency(a.total), "Tax included"],
      ["Line items", state.rows.length, "Editable scope of work"],
      ["Client", state.extras.client, "Demo invoice"],
    ];
  }
  if (id === "stockroom")
    values = [
      [
        "Inventory value",
        currency(state.rows.reduce((s, r) => s + r.stock * cents(r.price), 0)),
        "At listed unit prices",
      ],
      ["Product lines", state.rows.length, "Unique SKUs"],
      [
        "Needs attention",
        state.rows.filter((r) => r.stock <= r.minimum).length,
        "At or below reorder level",
      ],
    ];
  if (id === "momentum")
    values = [
      ["Total tasks", state.rows.length, "Your project at a glance"],
      [
        "In progress",
        state.rows.filter((r) => r.status === "In progress").length,
        "Keep the focus small",
      ],
      [
        "Completed",
        state.rows.filter((r) => r.status === "Done").length,
        "A little progress every day",
      ],
    ];
  if (id === "daylight")
    values = [
      ["Appointments", rows.length, "For the selected day"],
      [
        "Booked time",
        rows.reduce((s, r) => s + Number(r.duration), 0) + " min",
        "No overlapping appointments",
      ],
      ["Office hours", "09–17", "One shared appointment calendar"],
    ];
  if (id === "gather") {
    const a = pipeline(state.rows);
    values = [
      ["Open pipeline", currency(a.value), "Excludes won and lost deals"],
      ["Open deals", a.open, "New to proposal"],
      ["Won deals", a.won, "Celebrate the progress"],
    ];
  }
  if (id === "balance") {
    const a = cashFlow(rows);
    values = [
      ["Income", currency(a.income), "Selected month"],
      ["Expenses", currency(a.expense), "Selected month"],
      ["Balance", currency(a.balance), "Income minus expenses"],
    ];
  }
  if (id === "resolve")
    values = [
      [
        "Active tickets",
        state.rows.filter((r) => r.status !== "Resolved").length,
        "Open and in progress",
      ],
      [
        "High priority",
        state.rows.filter(
          (r) => r.priority === "High" && r.status !== "Resolved",
        ).length,
        "Needs your attention",
      ],
      [
        "Resolved",
        state.rows.filter((r) => r.status === "Resolved").length,
        "Requests closed locally",
      ],
    ];
  if (id === "ritual") {
    const days = week();
    const total = state.rows.reduce(
      (s, r) => s + r.dates.filter((d) => days.includes(d)).length,
      0,
    );
    values = [
      ["Habits", state.rows.length, "Small commitments"],
      [
        "Today",
        state.rows.filter((r) => r.dates.includes(today())).length +
          "/" +
          state.rows.length,
        "Check-ins completed",
      ],
      [
        "Last 7 days",
        state.rows.length
          ? Math.round((total / (state.rows.length * 7)) * 100) + "%"
          : "0%",
        "Completion across active habits",
      ],
    ];
  }
  if (id === "fieldwork")
    values = [
      ["Form fields", state.rows.length, "Build only what you need"],
      [
        "Required",
        state.rows.filter((r) => r.required === "Yes").length,
        "Validation in preview",
      ],
      [
        "Valid previews",
        state.extras.submissions,
        "Answers are not stored or sent",
      ],
    ];
  if (id === "northstar") {
    const a = revenue(rows);
    values = [
      ["Revenue", currency(a.total), "Fictional order data"],
      ["Orders", a.count, "Selected region"],
      ["Average order", currency(a.average), "Revenue per order"],
    ];
  }
  return `<div class="metrics">${values.map(([label, value, note]) => `<div class="metric"><span>${label}</span><strong>${e(value)}</strong><small>${note}</small></div>`).join("")}</div>`;
}
function controls() {
  if (id === "daylight")
    return `<label class="selected-day">Showing appointments for<input type="date" data-control="day" value="${viewDate}"></label>`;
  if (id === "balance")
    return `<label class="selected-day">Statement month<input type="month" data-control="month" value="${month}"></label>`;
  if (id === "northstar")
    return `<label class="selected-day">Sales region<select data-control="region">${["All", "Europe", "Americas", "Asia"].map((v) => `<option ${v === region ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
  return "";
}
function search() {
  return `<form class="search no-print" data-form="search"><input name="query" value="${e(query)}" placeholder="Search entries…" aria-label="Search entries"><button class="secondary">Search</button></form>`;
}
function table() {
  const rows = id === "ledger" ? state.rows : filtered();
  return `<section class="panel"><div class="panel-header"><h2>${id === "daylight" ? "Daily agenda" : id === "stockroom" ? "Product catalogue" : id === "gather" ? "Contacts & opportunities" : id === "resolve" ? "Support queue" : id === "northstar" ? "Order register" : id === "ledger" ? "Invoice items" : "Activity"}</h2>${id === "ledger" ? "" : search()}</div><div class="table-wrap"><table><thead><tr>${project.fields.map((f) => `<th scope="col">${e(f[1])}</th>`).join("")}${id === "stockroom" ? '<th scope="col">Stock health</th>' : ""}<th class="no-print" scope="col">Actions</th></tr></thead><tbody>${rows.map((r) => `<tr>${project.fields.map(([key, , type], i) => `<td class="${i === 0 ? "cell-title" : ""}">${["stage", "status", "priority"].includes(key) ? badge(r[key]) : ["price", "value", "amount"].includes(key) ? currency(cents(r[key])) : e(r[key])}</td>`).join("")}${id === "stockroom" ? `<td>${badge(r.stock <= r.minimum ? "Low stock" : "Healthy")}</td>` : ""}<td class="no-print">${btn("Edit", "edit", r.id, "text-btn")}${id === "stockroom" ? btn("−1", "stock-down", r.id, "text-btn") + btn("+1", "stock-up", r.id, "text-btn") : ""}${id === "resolve" && r.status !== "Resolved" ? btn("Resolve", "resolve", r.id, "text-btn") : ""}${btn(id === "daylight" ? "Cancel" : "Remove", "remove", r.id, "text-btn danger")}</td></tr>`).join("") || `<tr><td colspan="${project.fields.length + 2}" class="empty">No matching entries. Add one below or adjust the filter.</td></tr>`}</tbody></table></div>${id === "ledger" ? totals() : ""}</section>`;
}
function totals() {
  const a = invoiceTotals(state.rows, state.extras.tax, state.extras.discount);
  return `<div class="totals">${[
    ["Subtotal", a.subtotal],
    ["Discount", -a.discount],
    ["Tax (" + state.extras.tax + "%)", a.tax],
    ["Total due", a.total],
  ]
    .map(
      ([k, v], i) =>
        `<div class="total-row ${i === 3 ? "final" : ""}"><span>${k}</span><span>${currency(v)}</span></div>`,
    )
    .join("")}</div>`;
}
function invoiceSettings() {
  return `<div class="print-only"><h1>Invoice ${e(state.extras.reference)}</h1><p>Prepared for ${e(state.extras.client)}</p><p>Portfolio demonstration — not a payment request.</p></div><section class="panel no-print"><h2>Invoice details</h2><form class="form-grid" data-form="invoice">${field(["client", "Client", "text"], state.extras.client, "inv-")}${field(["reference", "Invoice number", "text"], state.extras.reference, "inv-")}${field(["tax", "Tax rate (%)", "number"], state.extras.tax, "inv-")}${field(["discount", "Discount ($)", "number"], state.extras.discount, "inv-")}<button class="primary">Update invoice</button></form></section>`;
}
function board() {
  return `<div class="board">${["Backlog", "In progress", "Done"]
    .map(
      (status) =>
        `<section class="column"><h2>${status}<span>${filtered().filter((r) => r.status === status).length}</span></h2>${
          filtered()
            .filter((r) => r.status === status)
            .map(
              (r) =>
                `<article class="task">${badge(r.priority)}<h3>${e(r.name)}</h3><div class="task-bottom"><span>${e(r.date)}</span>${btn("Edit", "edit", r.id, "text-btn")}${btn("×", "remove", r.id, "text-btn danger")}</div><label>Move task<select data-task="${e(r.id)}">${["Backlog", "In progress", "Done"].map((v) => `<option ${r.status === v ? "selected" : ""}>${v}</option>`).join("")}</select></label></article>`,
            )
            .join("") || '<p class="quiet">A little breathing room.</p>'
        }</section>`,
    )
    .join("")}</div>`;
}
function week() {
  const t = Date.parse(today() + "T00:00:00Z");
  return Array.from({ length: 7 }, (_, i) =>
    new Date(t - (6 - i) * 86400000).toISOString().slice(0, 10),
  );
}
function habitBoard() {
  const days = week();
  return `<section class="panel"><h2>Your last seven days</h2><div class="table-wrap"><table class="habit-table"><thead><tr><th>Habit</th>${days.map((d) => `<th>${d === today() ? "Today" : new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" })}</th>`).join("")}<th>Streak through today</th><th>Actions</th></tr></thead><tbody>${state.rows.map((r) => `<tr><td class="cell-title">${e(r.name)}</td>${days.map((d) => `<td><button type="button" class="${r.dates.includes(d) ? "checked" : ""}" data-habit="${e(r.id)}" data-date="${d}" aria-label="${e(r.name)} on ${d}" aria-pressed="${r.dates.includes(d)}">${r.dates.includes(d) ? "✓" : "·"}</button></td>`).join("")}<td>${streak(r.dates, today())} days</td><td>${btn("Edit", "edit", r.id, "text-btn")}${btn("Remove", "remove", r.id, "text-btn danger")}</td></tr>`).join("") || '<tr><td colspan="10" class="empty">Add your first habit below.</td></tr>'}</tbody></table></div></section>`;
}
function formBuilder() {
  return `<div class="split"><section class="panel"><h2>Form structure</h2><form class="search" data-form="title"><input name="title" aria-label="Form title" value="${e(state.extras.title)}" required maxlength="100"><button class="secondary">Rename</button></form>${state.rows.map((r, i) => `<div class="field-row"><div><strong>${e(r.label)}</strong><small>${e(r.type)} · ${r.required === "Yes" ? "Required" : "Optional"}</small></div><div>${i > 0 ? btn("↑", "up", r.id, "text-btn") : ""}${btn("Edit", "edit", r.id, "text-btn")}${btn("×", "remove", r.id, "text-btn danger")}</div></div>`).join("") || '<p class="empty">Add a field to begin.</p>'}</section><section class="panel"><h2>${e(state.extras.title)}</h2><p class="quiet">Live preview · answers are not stored or sent</p><form class="form-preview" data-form="preview" novalidate>${state.rows.map((r) => `<label for="preview-${e(r.id)}">${e(r.label)} ${r.required === "Yes" ? "*" : ""}${r.type === "textarea" ? `<textarea name="${e(r.id)}" id="preview-${e(r.id)}"></textarea>` : `<input type="${e(r.type)}" name="${e(r.id)}" id="preview-${e(r.id)}">`}<span class="error-message" data-error="${e(r.id)}"></span></label>`).join("")}<button class="primary" ${state.rows.length ? "" : "disabled"}>Test submission ↗</button><div id="preview-result" role="status"></div></form></section></div>`;
}
function charts() {
  if (id === "northstar") {
    const a = revenue(filtered()),
      values = Object.entries(a.groups).sort(([a], [b]) => a.localeCompare(b)),
      max = Math.max(1, ...values.map((v) => v[1]));
    return `<section class="panel"><h2>Monthly revenue</h2><p class="quiet">Demo orders · USD · ${e(region)} regions</p><div class="bars" role="img" aria-label="Monthly revenue, also available in the order register below">${values.map(([k, v]) => `<div class="bar-group"><b>${currency(v)}</b><i style="height:${(v / max) * 85}%"></i><span>${k.slice(5)}/${k.slice(2, 4)}</span></div>`).join("") || '<p class="empty">No orders in this view.</p>'}</div></section>`;
  }
  if (id === "balance") {
    const rows = filtered().filter((r) => r.type === "Expense"),
      sum = rows.reduce((s, r) => s + cents(r.amount), 0),
      groups = {};
    for (const r of rows)
      groups[r.category] = (groups[r.category] || 0) + cents(r.amount);
    return `<section class="panel"><h2>Spending by category</h2>${
      Object.entries(groups)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([k, v]) =>
            `<div class="category-row"><div><span>${e(k)}</span><span>${currency(v)}</span></div><div class="progress"><i style="width:${sum ? (v / sum) * 100 : 0}%"></i></div></div>`,
        )
        .join("") || '<p class="empty">No expenses for this month.</p>'
    }</section>`;
  }
  return "";
}
function history() {
  if (id !== "stockroom") return "";
  return `<section class="panel"><h2>Recent stock adjustments</h2>${
    state.extras.history.length
      ? `<div class="table-wrap"><table><thead><tr><th>Product</th><th>Change</th><th>Result</th></tr></thead><tbody>${state.extras.history
          .slice(-10)
          .reverse()
          .map(
            (h) =>
              `<tr><td>${e(h.name)}</td><td>${e(h.delta)}</td><td>${e(h.stock)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : '<p class="quiet">Use −1 / +1 on a product to record its first adjustment.</p>'
  }</section>`;
}
function render() {
  if (!project) return gallery();
  const special =
    id === "momentum"
      ? board()
      : id === "ritual"
        ? habitBoard()
        : id === "fieldwork"
          ? formBuilder()
          : table();
  root.innerHTML = `<div class="wrap">${header()}<div class="workspace"><aside class="sidebar"><div class="eyebrow">THE COLLECTION</div>${projects.map((p) => `<a class="side-link ${id === p.id ? "selected" : ""}" ${id === p.id ? 'aria-current="page"' : ""} href="../${p.id}/"><span aria-hidden="true">${icon(p.id)}</span>${p.name}</a>`).join("")}<div class="side-note">LOCAL + PRIVATE CLOUD<br>Try local demo data, or sign in for your own workspace. Cloud changes require Save to cloud. Use fictional data only.</div></aside><main class="content"><div class="app-head"><div><div class="eyebrow">${project.category} / INTERACTIVE PROTOTYPE</div><h1>${project.name}</h1><p>${project.tagline}</p></div><div class="actions">${id === "ledger" ? btn("Print / PDF ↗", "print") : ""}${btn(id === "fieldwork" ? "Export schema ↓" : "Export CSV ↓", "export")}${btn("Backup JSON ↓", "backup")}${btn("Restore JSON ↑", "restore-backup")}<input type="file" id="backup-file" accept="application/json,.json" aria-label="Choose project backup" hidden>${btn("Reset demo", "reset")}</div></div><section id="cloud-panel" class="cloud-panel no-print" aria-label="Cloud account">Cloud controls loading…</section><div id="cloud-workspace">${storageNotice ? `<p class="notice" role="status">${e(storageNotice)}</p>` : ""}${metrics()}${controls()}${id === "daylight" ? '<p class="notice">Appointments in this workspace share one resource. Business hours: 09:00–17:00. No confirmation emails are sent.</p>' : ""}${id === "ledger" ? invoiceSettings() : ""}${charts()}${id === "momentum" ? `<div class="panel-header"><h2>Project workflow</h2>${search()}</div>` : ""}${special}${editor()}${history()}<p class="quiet">${id === "ledger" ? "Sample invoice only; tax rules are simplified. " : ""}Optional Supabase sign-in and private cloud snapshots. No live payments or business notifications. <a href="${source}/projects/${id}" target="_blank" rel="noreferrer">Read scope & source ↗</a></p></div></main></div>${footer()}</div>`;
  cloud?.paint();
}
function ask(title, message, action) {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = `<h2>${e(title)}</h2><p>${e(message)}</p><div class="actions"><button class="secondary" data-dismiss>Keep it</button><button class="primary" data-confirm>Confirm</button></div>`;
  document.body.append(dialog);
  dialog.querySelector("[data-dismiss]").onclick = () => dialog.close();
  dialog.querySelector("[data-confirm]").onclick = () => {
    dialog.close();
    try {
      action();
    } catch (err) {
      toast(err.message, true);
    }
  };
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
  dialog.querySelector("[data-dismiss]").focus();
}
let pendingBackupContext;
function backupContext() {
  return {
    generation: cloud?.sync.generation,
    snapshot: JSON.stringify(state),
  };
}
function assertBackupContext(context) {
  if (cloud?.sync.locked || cloud?.sync.status === "saving")
    throw Error("Wait for a successful cloud load or save before restoring.");
  if (
    context.generation !== cloud?.sync.generation ||
    context.snapshot !== JSON.stringify(state)
  )
    throw Error(
      "Workspace changed while choosing the backup. Please choose it again.",
    );
}
root.addEventListener("change", async (event) => {
  if (event.target.id !== "backup-file") return;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const context = pendingBackupContext || backupContext();
  pendingBackupContext = null;
  try {
    assertBackupContext(context);
    if (file.size > MAX_BACKUP_BYTES)
      throw Error("Backup exceeds the 2 MiB limit.");
    const restored = parseBackup(project, await file.text());
    assertBackupContext(context);
    ask(
      "Replace this workspace?",
      `Restore ${restored.rows.length} entries and project settings? This replaces, not merges, the current data. Keep a backup first. Cloud changes require Save to cloud.`,
      () => {
        assertBackupContext(context);
        state = restored;
        editId = null;
        query = "";
        commit("Backup restored.");
      },
    );
  } catch (error) {
    toast(error.message, true);
  }
});
root.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    filter = filterButton.dataset.filter;
    gallery();
    document.querySelector(`[data-filter="${filter}"]`)?.focus();
    return;
  }
  const habit = event.target.closest("[data-habit]");
  if (habit) {
    const row = state.rows.find((r) => r.id === habit.dataset.habit);
    row.dates = toggleDate(row.dates, habit.dataset.date);
    commit("Check-in updated.");
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action,
    row = state.rows.find((r) => r.id === button.dataset.id);
  try {
    if (action === "backup")
      download(
        `${id}-backup.json`,
        createBackup(project, state),
        "application/json",
      );
    if (action === "restore-backup") {
      assertBackupContext(backupContext());
      pendingBackupContext = backupContext();
      document.querySelector("#backup-file").click();
    }
    if (action === "edit") {
      editId = row.id;
      render();
      document
        .querySelector("#editor")
        .scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector("#editor input")?.focus();
    }
    if (action === "cancel") {
      editId = null;
      render();
    }
    if (action === "remove")
      ask(
        "Remove this entry?",
        "This removes the selected entry from the current workspace. Cloud changes take effect only after Save to cloud.",
        () => {
          const next = state.rows.filter((r) => r.id !== row.id);
          if (id === "ledger")
            invoiceTotals(next, state.extras.tax, state.extras.discount);
          state.rows = next;
          editId = null;
          commit("Entry removed.");
        },
      );
    if (action === "reset")
      ask(
        "Restore demo data?",
        "This replaces the current project with demo data. In cloud mode, click Save to cloud to persist the reset. Other projects are not affected.",
        () => {
          state = fresh();
          editId = null;
          query = "";
          storageNotice = "";
          commit("Demo restored.");
        },
      );
    if (action === "print") window.print();
    if (action === "stock-up" || action === "stock-down") {
      const delta = action === "stock-up" ? 1 : -1;
      row.stock = adjustStock(row.stock, delta);
      state.extras.history.push({ name: row.name, delta, stock: row.stock });
      state.extras.history = state.extras.history.slice(-100);
      commit("Stock updated.");
    }
    if (action === "resolve") {
      if (!row.owner.trim()) throw Error("Assign an owner first.");
      row.status = "Resolved";
      commit("Ticket marked resolved.");
    }
    if (action === "up") {
      const i = state.rows.indexOf(row);
      if (i > 0)
        [state.rows[i - 1], state.rows[i]] = [state.rows[i], state.rows[i - 1]];
      commit("Field moved.");
    }
    if (action === "export") {
      if (id === "fieldwork")
        download(
          "fieldwork-schema.json",
          JSON.stringify(
            { title: state.extras.title, fields: state.rows },
            null,
            2,
          ),
          "application/json",
        );
      else {
        const headers = project.fields.map((f) => f[1]),
          rows = filtered().map((r) => project.fields.map((f) => r[f[0]]));
        if (id === "ritual") {
          headers.push("Check-in dates");
          rows.forEach((r, i) => r.push(filtered()[i].dates.join("; ")));
        }
        if (id === "ledger") {
          const a = invoiceTotals(
            state.rows,
            state.extras.tax,
            state.extras.discount,
          );
          rows.push(
            [],
            ["Client", state.extras.client],
            ["Reference", state.extras.reference],
            ["Subtotal", a.subtotal / 100],
            ["Discount", a.discount / 100],
            ["Tax", a.tax / 100],
            ["Total", a.total / 100],
          );
        }
        download(
          id + ".csv",
          csv([headers, ...rows]),
          "text/csv;charset=utf-8",
        );
      }
      toast("Export prepared.");
    }
  } catch (err) {
    toast(err.message, true);
  }
});
root.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.control === "day") {
    viewDate = target.value;
    render();
  }
  if (target.dataset.control === "month") {
    month = target.value;
    render();
  }
  if (target.dataset.control === "region") {
    region = target.value;
    render();
  }
  if (target.dataset.task) {
    const row = state.rows.find((r) => r.id === target.dataset.task);
    row.status = target.value;
    commit("Task moved.");
  }
});
root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target,
    kind = form.dataset.form,
    data = Object.fromEntries(new FormData(form));
  try {
    if (kind === "search") {
      query = data.query;
      render();
      return;
    }
    if (kind === "entry") {
      if (state.rows.length >= 5000 && !editId)
        throw Error("Demo limit reached. Export or remove entries first.");
      const row = normalizeRow(project, data, state.rows, editId);
      const next = editId
        ? state.rows.map((r) => (r.id === editId ? row : r))
        : [...state.rows, row];
      if (id === "ledger")
        invoiceTotals(next, state.extras.tax, state.extras.discount);
      state.rows = next;
      editId = null;
      commit("Entry saved.");
    }
    if (kind === "invoice") {
      const tax = numeric(data.tax, 0, 100),
        discount = numeric(data.discount);
      invoiceTotals(state.rows, tax, discount);
      state.extras = {
        ...state.extras,
        client: data.client.trim(),
        reference: data.reference.trim(),
        tax,
        discount,
      };
      commit("Invoice updated.");
    }
    if (kind === "title") {
      state.extras.title = data.title.trim();
      commit("Form title updated.");
    }
    if (kind === "preview") {
      const errors = validateAnswers(state.rows, data);
      for (const span of form.querySelectorAll("[data-error]"))
        span.textContent = errors[span.dataset.error] || "";
      for (const input of form.querySelectorAll("input,textarea"))
        input.setAttribute("aria-invalid", String(Boolean(errors[input.name])));
      if (Object.keys(errors).length) {
        form.querySelector('[aria-invalid="true"]')?.focus();
        toast("Please check the highlighted fields.", true);
      } else {
        state.extras.submissions++;
        save();
        root.querySelectorAll(".metric strong")[2].textContent =
          state.extras.submissions;
        document.querySelector("#preview-result").textContent =
          "Validation passed. No answers were saved or sent.";
        toast("Preview passed validation.");
      }
    }
  } catch (err) {
    toast(err.message, true);
  }
});
render();

if (project) {
  import("./cloud-ui.js")
    .then(({ mountCloud }) => {
      cloud = mountCloud(id, {
        read: () => state,
        empty: () => ({
          version: 1,
          rows: [],
          extras: structuredClone(project.extras),
        }),
        validate: (value) => restore(project, JSON.stringify(value)),
        replace: (value) => {
          state = value;
          editId = null;
          query = "";
          render();
        },
        local: () => {
          state = fresh();
          editId = null;
          query = "";
          try {
            const saved = restore(
              project,
              localStorage.getItem("studio:v1:" + id),
            );
            if (saved) state = saved;
          } catch {}
          render();
        },
        confirm: ask,
        notify: toast,
      });
      cloud.paint();
    })
    .catch(() => {
      const panel = document.querySelector("#cloud-panel");
      if (panel)
        panel.textContent =
          "Cloud controls could not load. The local demo remains available.";
    });
}
