import test from "node:test";
import assert from "node:assert/strict";
import { projects } from "../assets/catalog.js";
import {
  numeric,
  validDate,
  minutes,
  invoiceTotals,
  isAvailable,
  adjustStock,
  cashFlow,
  streak,
  toggleDate,
  revenue,
  pipeline,
  validateAnswers,
  normalizeRow,
  csv,
  escape,
  restore,
} from "../assets/model.js";
const project = (id) => projects.find((p) => p.id === id);
test("all ten projects have unique routes", () =>
  assert.equal(new Set(projects.map((p) => p.id)).size, 10));
for (const p of projects)
  test(p.id + ": demo state passes schema validation", () =>
    assert.ok(
      restore(
        p,
        JSON.stringify({ version: 1, rows: p.seed, extras: p.extras }),
      ),
    ),
  );
test("money uses per-line cent rounding", () =>
  assert.deepEqual(invoiceTotals([{ price: 0.1, quantity: 3 }], 10, 0), {
    subtotal: 30,
    discount: 0,
    tax: 3,
    total: 33,
  }));
test("discount applied before percentage tax", () =>
  assert.equal(
    invoiceTotals([{ price: 100, quantity: 2 }], 10, 20).total,
    19800,
  ));
test("discount cannot exceed total", () =>
  assert.throws(() => invoiceTotals([{ price: 1, quantity: 1 }], 0, 2)));
test("invalid numeric input rejected", () => {
  for (const n of ["", NaN, Infinity, -1]) assert.throws(() => numeric(n));
});
test("valid dates and leap years", () => {
  assert.ok(validDate("2024-02-29"));
  assert.equal(validDate("2025-02-29"), false);
  assert.equal(validDate("2026-13-01"), false);
});
test("time ranges validated", () => {
  assert.equal(minutes("09:30"), 570);
  assert.throws(() => minutes("24:01"));
});
const booking = {
  name: "Test",
  service: "Design consultation",
  date: "2026-10-19",
  time: "10:00",
  duration: 60,
};
test("overlapping appointments rejected", () =>
  assert.equal(
    isAvailable([{ ...booking, id: "1" }], { ...booking, time: "10:30" }),
    false,
  ));
test("adjacent appointments allowed", () =>
  assert.equal(
    isAvailable([{ ...booking, id: "1" }], { ...booking, time: "11:00" }),
    true,
  ));
test("same appointment can be edited", () =>
  assert.equal(isAvailable([{ ...booking, id: "1" }], booking, "1"), true));
test("office hours enforced", () => {
  assert.throws(() => isAvailable([], { ...booking, time: "08:30" }));
  assert.throws(() => isAvailable([], { ...booking, time: "16:30" }));
});
test("inventory cannot go negative or fractional", () => {
  assert.equal(adjustStock(4, -1), 3);
  assert.throws(() => adjustStock(0, -1));
  assert.throws(() => adjustStock(2, 0.5));
});
test("SKU uniqueness is case insensitive", () =>
  assert.throws(() =>
    normalizeRow(
      project("stockroom"),
      { name: "Test", sku: "cm-001", stock: 1, minimum: 1, price: 2 },
      project("stockroom").seed,
    ),
  ));
test("SKU owner can be edited", () =>
  assert.ok(
    normalizeRow(
      project("stockroom"),
      project("stockroom").seed[0],
      project("stockroom").seed,
      "a",
    ),
  ));
test("income and expenses remain separate", () =>
  assert.deepEqual(
    cashFlow([
      { type: "Income", amount: 100 },
      { type: "Expense", amount: 30 },
    ]),
    { income: 10000, expense: 3000, balance: 7000 },
  ));
test("negative balance supported", () =>
  assert.equal(cashFlow([{ type: "Expense", amount: 30 }]).balance, -3000));
test("closed deals excluded from pipeline", () =>
  assert.deepEqual(
    pipeline([
      { stage: "New", value: 10 },
      { stage: "Won", value: 20 },
      { stage: "Lost", value: 50 },
    ]),
    { won: 1, open: 1, value: 1000 },
  ));
test("streak is consecutive through selected date", () =>
  assert.equal(
    streak(["2026-10-17", "2026-10-18", "2026-10-19"], "2026-10-19"),
    3,
  ));
test("streak resets when today is missing", () =>
  assert.equal(streak(["2026-10-18"], "2026-10-19"), 0));
test("habit toggle is reversible", () =>
  assert.deepEqual(toggleDate(toggleDate([], "2026-10-19"), "2026-10-19"), []));
test("schema catches required, email and number errors", () =>
  assert.equal(
    Object.keys(
      validateAnswers(
        [
          { id: "a", type: "text", required: "Yes" },
          { id: "b", type: "email", required: "Yes" },
          { id: "c", type: "number", required: "No" },
        ],
        { a: "", b: "bad", c: -2 },
      ),
    ).length,
    3,
  ));
test("optional blank field accepted", () =>
  assert.deepEqual(
    validateAnswers([{ id: "a", type: "email", required: "No" }], {}),
    {},
  ));
test("sales groups months and calculates averages", () =>
  assert.deepEqual(
    revenue([
      { date: "2026-01-01", amount: 10 },
      { date: "2026-01-20", amount: 30 },
    ]),
    { groups: { "2026-01": 4000 }, total: 4000, average: 2000, count: 2 },
  ));
test("empty analytics has no NaN", () =>
  assert.deepEqual(revenue([]), {
    groups: {},
    total: 0,
    average: 0,
    count: 0,
  }));
test("CSV escapes quotes and formula prefixes", () =>
  assert.equal(csv([["=1+1", 'a"b', "a,b"]]), '"\'=1+1","a""b","a,b"'));
test("HTML content escaped", () =>
  assert.equal(escape('<script>"&'), "&lt;script&gt;&quot;&amp;"));
test("corrupt storage falls back safely", () => {
  assert.equal(restore(project("gather"), "oops"), null);
  assert.equal(
    restore(project("gather"), '{"version":1,"rows":[],"extras":null}'),
    null,
  );
});
test("unknown enum rejected", () =>
  assert.throws(() =>
    normalizeRow(project("momentum"), {
      name: "Test",
      status: "Hacked",
      priority: "Low",
      date: "2026-10-19",
    }),
  ));
test("invoice quantity cannot be zero or fractional", () => {
  for (const quantity of [0, 1.5])
    assert.throws(() =>
      normalizeRow(project("ledger"), {
        description: "test",
        quantity,
        price: 1,
      }),
    );
});
test("duplicate stored IDs rejected", () => {
  const p = project("momentum");
  assert.equal(
    restore(
      p,
      JSON.stringify({ version: 1, rows: [p.seed[0], p.seed[0]], extras: {} }),
    ),
    null,
  );
});
test("blank titles rejected", () =>
  assert.throws(() => normalizeRow(project("ritual"), { name: "  " })));

test("malformed stock history is rejected", () => {
  const p = project("stockroom");
  assert.equal(
    restore(
      p,
      JSON.stringify({ version: 1, rows: p.seed, extras: { history: [null] } }),
    ),
    null,
  );
});
test("negative preview counter is rejected", () => {
  const p = project("fieldwork");
  assert.equal(
    restore(
      p,
      JSON.stringify({
        version: 1,
        rows: p.seed,
        extras: { ...p.extras, submissions: -1 },
      }),
    ),
    null,
  );
});
