export const currency = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const cents = (value) => Math.round(Number(value) * 100);
export function numeric(value, min = 0, max = 1000000) {
  if (String(value).trim() === "") throw Error("Enter a number.");
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max)
    throw Error(`Number must be between ${min} and ${max}.`);
  return n;
}
export function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const n = new Date(date + "T00:00:00Z");
  return Number.isFinite(n.getTime()) && n.toISOString().slice(0, 10) === date;
}
export function minutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) throw Error("Invalid time.");
  const [h, m] = time.split(":").map(Number);
  if (h > 23 || m > 59) throw Error("Invalid time.");
  return h * 60 + m;
}
export function invoiceTotals(rows, tax = 0, discount = 0) {
  const subtotal = rows.reduce(
    (s, r) => s + cents(numeric(r.price)) * numeric(r.quantity, 1, 10000),
    0,
  );
  const reduction = cents(numeric(discount));
  if (reduction > subtotal) throw Error("Discount cannot exceed subtotal.");
  const taxAmount = Math.round(
    ((subtotal - reduction) * numeric(tax, 0, 100)) / 100,
  );
  return {
    subtotal,
    discount: reduction,
    tax: taxAmount,
    total: subtotal - reduction + taxAmount,
  };
}
export function isAvailable(rows, booking, ignoreId = null) {
  if (!validDate(booking.date)) throw Error("Invalid appointment date.");
  const start = minutes(booking.time),
    duration = numeric(booking.duration, 15, 240);
  if (start < 540 || start + duration > 1020)
    throw Error("Appointments must fit within 09:00–17:00.");
  return !rows.some(
    (r) =>
      r.id !== ignoreId &&
      r.date === booking.date &&
      start < minutes(r.time) + Number(r.duration) &&
      start + duration > minutes(r.time),
  );
}
export function adjustStock(stock, delta) {
  const n = numeric(stock) + numeric(delta, -1000000);
  if (!Number.isInteger(n) || n < 0)
    throw Error("Stock must be a non-negative whole number.");
  return n;
}
export function cashFlow(rows) {
  const income = rows
      .filter((r) => r.type === "Income")
      .reduce((s, r) => s + cents(r.amount), 0),
    expense = rows
      .filter((r) => r.type === "Expense")
      .reduce((s, r) => s + cents(r.amount), 0);
  return { income, expense, balance: income - expense };
}
export function streak(dates, today) {
  if (!validDate(today)) throw Error("Invalid date.");
  let n = 0,
    day = Date.parse(today + "T00:00:00Z");
  const set = new Set(dates);
  while (set.has(new Date(day).toISOString().slice(0, 10))) {
    n++;
    day -= 86400000;
  }
  return n;
}
export function toggleDate(dates, date) {
  if (!validDate(date)) throw Error("Invalid date.");
  return dates.includes(date)
    ? dates.filter((d) => d !== date)
    : [...dates, date].sort();
}
export function revenue(rows) {
  const groups = {};
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    groups[month] = (groups[month] || 0) + cents(r.amount);
  }
  const total = Object.values(groups).reduce((s, n) => s + n, 0);
  return {
    groups,
    total,
    average: rows.length ? Math.round(total / rows.length) : 0,
    count: rows.length,
  };
}
export function pipeline(rows) {
  return {
    won: rows.filter((r) => r.stage === "Won").length,
    open: rows.filter((r) => !["Won", "Lost"].includes(r.stage)).length,
    value: rows
      .filter((r) => !["Won", "Lost"].includes(r.stage))
      .reduce((s, r) => s + cents(r.value), 0),
  };
}
export function validateAnswers(fields, answers) {
  const errors = {};
  for (const f of fields) {
    const value = String(answers[f.id] ?? "").trim();
    if (f.required === "Yes" && !value)
      errors[f.id] = "This field is required.";
    else if (
      value &&
      f.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      errors[f.id] = "Enter a valid email.";
    else if (
      value &&
      f.type === "number" &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    )
      errors[f.id] = "Enter a non-negative number.";
  }
  return errors;
}
export function normalizeRow(project, input, rows = [], id = null) {
  const out = {};
  for (const [key, label, type, options] of project.fields) {
    let v = String(input[key] ?? "").trim();
    if (!v) throw Error(`${label} is required.`);
    if (v.length > 250) throw Error(`${label} must be 250 characters or less.`);
    if (type === "number" || type === "integer") {
      v = numeric(v);
      if (type === "integer" && !Number.isInteger(v))
        throw Error(`${label} must be a whole number.`);
    }
    if (type === "select" && !options.includes(String(v)))
      throw Error(`Invalid ${label}.`);
    if (type === "date" && !validDate(v)) throw Error("Choose a valid date.");
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      throw Error("Enter a valid email.");
    out[key] = v;
  }
  if (project.id === "ledger") {
    out.quantity = numeric(out.quantity, 1, 10000);
    if (!Number.isInteger(out.quantity))
      throw Error("Quantity must be a whole number.");
  }
  if (
    project.id === "stockroom" &&
    rows.some(
      (r) => r.id !== id && r.sku.toLowerCase() === out.sku.toLowerCase(),
    )
  )
    throw Error("This SKU already exists.");
  if (project.id === "daylight") {
    out.duration = Number(out.duration);
    if (!isAvailable(rows, out, id))
      throw Error("This appointment overlaps an existing booking.");
  }
  if (project.id === "ritual")
    out.dates = rows.find((r) => r.id === id)?.dates || [];
  return { ...out, id: id || globalThis.crypto.randomUUID() };
}
export function csv(rows) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s = String(v ?? "");
          if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
export function escape(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function restore(project, raw) {
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Array.isArray(s.rows) ||
      s.rows.length > 5000 ||
      !s.extras ||
      typeof s.extras !== "object"
    )
      return null;
    const ids = new Set();
    for (const r of s.rows) {
      if (
        typeof r.id !== "string" ||
        !r.id ||
        r.id.length > 150 ||
        ids.has(r.id)
      )
        return null;
      ids.add(r.id);
      normalizeRow(
        project,
        r,
        s.rows.filter((x) => x.id !== r.id),
        r.id,
      );
      if (
        project.id === "ritual" &&
        (!Array.isArray(r.dates) || !r.dates.every(validDate))
      )
        return null;
    }
    for (const [k, v] of Object.entries(project.extras)) {
      if (
        typeof s.extras[k] !== typeof v ||
        (Array.isArray(v) && !Array.isArray(s.extras[k]))
      )
        return null;
    }
    if (
      project.id === "stockroom" &&
      (s.extras.history.length > 100 ||
        !s.extras.history.every(
          (h) =>
            h &&
            typeof h.name === "string" &&
            Number.isFinite(h.delta) &&
            Number.isInteger(h.stock) &&
            h.stock >= 0,
        ))
    )
      return null;
    if (
      project.id === "fieldwork" &&
      (!Number.isInteger(s.extras.submissions) || s.extras.submissions < 0)
    )
      return null;
    if (project.id === "ledger")
      invoiceTotals(s.rows, s.extras.tax, s.extras.discount);
    return s;
  } catch {
    return null;
  }
}
