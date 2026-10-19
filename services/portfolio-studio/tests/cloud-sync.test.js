import test from "node:test";
import assert from "node:assert/strict";
import { WorkspaceSync } from "../assets/cloud-sync.js";
const user = { id: "test-owner", email: "test@example.invalid" };
const snapshot = (name = "") => ({
  version: 1,
  rows: name ? [{ name }] : [],
  extras: {},
});
function fixture(api = {}) {
  let state = snapshot("guest");
  let localCalls = 0;
  const sync = new WorkspaceSync(
    "ledger",
    { load: async () => null, save: async () => ({ revision: 1 }), ...api },
    {
      read: () => state,
      replace: (v) => {
        state = v;
      },
      empty: () => snapshot(),
      validate: (v) => (v?.version === 1 ? v : null),
      local: () => {
        state = snapshot("guest");
        localCalls++;
      },
    },
  );
  return {
    sync,
    get state() {
      return state;
    },
    set(v) {
      state = v;
    },
    get localCalls() {
      return localCalls;
    },
  };
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
test("signed out stays local", async () => {
  const f = fixture();
  await f.sync.open(null);
  assert.equal(f.sync.active, false);
  assert.equal(f.localCalls, 1);
});
test("sign-in starts a separate empty cloud workspace", async () => {
  const f = fixture();
  await f.sync.open(user);
  assert.deepEqual(f.state, snapshot());
  assert.equal(f.sync.revision, 0);
  assert.equal(f.sync.dirty, false);
});
test("loads a known cloud version", async () => {
  const f = fixture({
    load: async () => ({ state: snapshot("remote"), revision: 3 }),
  });
  await f.sync.open(user);
  assert.equal(f.state.rows[0].name, "remote");
  assert.equal(f.sync.revision, 3);
});
test("load error locks workspace instead of exposing old data", async () => {
  const f = fixture({
    load: async () => {
      throw Error("offline");
    },
  });
  await f.sync.open(user);
  assert.equal(f.sync.locked, true);
  assert.deepEqual(f.state, snapshot());
});
test("invalid remote payload rejected", async () => {
  const f = fixture({
    load: async () => ({ state: { version: 2 }, revision: 1 }),
  });
  await f.sync.open(user);
  assert.equal(f.sync.status, "load-error");
});
test("read-only workspace does not save implicitly", async () => {
  let saves = 0;
  const f = fixture({
    save: async () => {
      saves++;
      return { revision: 1 };
    },
  });
  await f.sync.open(user);
  await f.sync.save();
  assert.equal(saves, 0);
});
test("explicit save passes expected revision and owner", async () => {
  let args;
  const f = fixture({
    save: async (...values) => {
      args = values;
      return { revision: 1 };
    },
  });
  await f.sync.open(user);
  f.set(snapshot("draft"));
  f.sync.noteEdit();
  await f.sync.save();
  assert.equal(args[2], 0);
  assert.equal(args[3], user.id);
  assert.equal(f.sync.dirty, false);
  assert.equal(f.sync.revision, 1);
});
test("late save cannot replace a new account workspace", async () => {
  const done = deferred();
  const f = fixture({ save: () => done.promise });
  await f.sync.open(user);
  f.sync.noteEdit();
  const saved = f.sync.save();
  await f.sync.open({ id: "another-test-owner" });
  done.resolve({ revision: 5 });
  await saved;
  assert.equal(f.sync.revision, 0);
  assert.deepEqual(f.state, snapshot());
});
test("late load after signout is discarded", async () => {
  const done = deferred();
  const f = fixture({ load: () => done.promise });
  const loading = f.sync.open(user);
  await f.sync.open(null);
  done.resolve({ state: snapshot("private"), revision: 1 });
  await loading;
  assert.equal(f.state.rows[0].name, "guest");
  assert.equal(f.sync.active, false);
});
test("edits made during save remain dirty", async () => {
  const done = deferred();
  const f = fixture({ save: () => done.promise });
  await f.sync.open(user);
  f.sync.noteEdit();
  const saving = f.sync.save();
  f.set(snapshot("newer draft"));
  f.sync.noteEdit();
  done.resolve({ revision: 1 });
  await saving;
  assert.equal(f.sync.dirty, true);
  assert.equal(f.state.rows[0].name, "newer draft");
});
test("stale revision reports conflict and locks editing", async () => {
  const f = fixture({
    save: async () => {
      throw Object.assign(Error("stale"), { code: "40001" });
    },
  });
  await f.sync.open(user);
  f.sync.noteEdit();
  await f.sync.save();
  assert.equal(f.sync.status, "conflict");
  assert.equal(f.sync.locked, true);
  assert.equal(f.sync.dirty, true);
});
test("network failure preserves draft and permits explicit retry", async () => {
  let fail = true;
  const f = fixture({
    save: async () => {
      if (fail) throw Error("offline");
      return { revision: 1 };
    },
  });
  await f.sync.open(user);
  f.set(snapshot("draft"));
  f.sync.noteEdit();
  await f.sync.save();
  assert.equal(f.sync.status, "save-error");
  assert.equal(f.sync.dirty, true);
  assert.equal(f.state.rows[0].name, "draft");
  fail = false;
  await f.sync.save();
  assert.equal(f.sync.status, "ready");
  assert.equal(f.sync.dirty, false);
});
test("editing while loading is rejected", async () => {
  const done = deferred();
  const f = fixture({ load: () => done.promise });
  const pending = f.sync.open(user);
  assert.throws(() => f.sync.noteEdit());
  done.resolve(null);
  await pending;
});
test("repeated save clicks do not duplicate writes", async () => {
  const done = deferred();
  let saves = 0;
  const f = fixture({
    save: () => {
      saves++;
      return done.promise;
    },
  });
  await f.sync.open(user);
  f.sync.noteEdit();
  const pending = f.sync.save();
  await f.sync.save();
  assert.equal(saves, 1);
  done.resolve({ revision: 1 });
  await pending;
});
