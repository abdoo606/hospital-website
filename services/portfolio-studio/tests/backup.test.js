import test from "node:test";
import assert from "node:assert/strict";
import { projects } from "../assets/catalog.js";
import {
  createBackup,
  parseBackup,
  MAX_BACKUP_BYTES,
} from "../assets/backup.js";
for (const project of projects) {
  test(`${project.id}: complete backup round-trip including extras`, () => {
    const state = {
      version: 1,
      rows: structuredClone(project.seed),
      extras: structuredClone(project.extras),
    };
    assert.deepEqual(parseBackup(project, createBackup(project, state)), state);
  });
}
const project = projects[0];
const state = {
  version: 1,
  rows: structuredClone(project.seed),
  extras: structuredClone(project.extras),
};
const document = () => JSON.parse(createBackup(project, state));
test("reject invalid JSON and unsupported envelopes", () => {
  for (const value of ["{", "null", "[]", "{}", JSON.stringify(state)])
    assert.throws(() => parseBackup(project, value));
  const value = document();
  value.version = 2;
  assert.throws(() => parseBackup(project, JSON.stringify(value)), /version/);
});
test("reject cross-project backup", () => {
  assert.throws(
    () => parseBackup(projects[1], createBackup(project, state)),
    /different project/,
  );
});
test("reject corrupt project rows without repairing or merging", () => {
  const value = document();
  value.state.rows = [{ id: "invalid" }];
  assert.throws(
    () => parseBackup(project, JSON.stringify(value)),
    /validation/,
  );
});
test("UTF-8 byte size limit, not character count", () => {
  assert.throws(
    () => parseBackup(project, "é".repeat(MAX_BACKUP_BYTES / 2 + 1)),
    /limit/,
  );
});
test("backup envelope contains no account or session fields", () => {
  assert.deepEqual(Object.keys(document()).sort(), [
    "app",
    "exportedAt",
    "format",
    "state",
    "version",
  ]);
});
