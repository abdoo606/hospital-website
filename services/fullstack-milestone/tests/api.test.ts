import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { database, type DB } from "../server/db.js";
import { application } from "../server/app.js";
let db: DB, app: ReturnType<typeof application>, a: any, b: any, id: string;
before(async () => {
  db = await database();
  app = application(db);
  a = request.agent(app);
  b = request.agent(app);
});
after(async () => {
  await db.close();
});
test("protected routes reject anonymous requests", async () => {
  await request(app).get("/api/tasks").expect(401);
});
test("signup validates password and creates a hashed account with HttpOnly cookie", async () => {
  await a
    .post("/api/auth/signup")
    .send({ email: "bad", password: "short" })
    .expect(400);
  const response = await a
    .post("/api/auth/signup")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(201);
  assert.match(String(response.headers["set-cookie"]), /HttpOnly/);
  assert.match(String(response.headers["set-cookie"]), /SameSite=Lax/);
  const row = (await db.query("SELECT password_hash FROM users")).rows[0];
  assert.notEqual(row.password_hash, "test-password-123");
  await a.get("/api/me").expect(200);
});
test("duplicate accounts and wrong passwords rejected", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(409);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "wrong-password-123" })
    .expect(401);
});
test("CRUD list, create, detail, edit persist in database", async () => {
  assert.deepEqual((await a.get("/api/tasks").expect(200)).body, []);
  const row = (
    await a
      .post("/api/tasks")
      .send({ title: "First task", description: "Review API", status: "todo" })
      .expect(201)
  ).body;
  id = row.id;
  assert.equal(
    (await a.get("/api/tasks/" + id).expect(200)).body.title,
    "First task",
  );
  await a
    .put("/api/tasks/" + id)
    .send({ title: "Updated", description: "Done review", status: "done" })
    .expect(200);
  assert.equal((await a.get("/api/tasks").expect(200)).body[0].status, "done");
  assert.equal(
    (await db.query("SELECT title FROM tasks WHERE id=$1", [id])).rows[0].title,
    "Updated",
  );
});
test("write validation and malformed identifiers are enforced", async () => {
  await a.post("/api/tasks").send({ title: "  " }).expect(400);
  await a
    .post("/api/tasks")
    .send({ title: "ok", status: "unknown" })
    .expect(400);
  await a
    .put("/api/tasks/" + id)
    .send({ title: "ok", owner_id: "injected" })
    .expect(400);
  await a.get("/api/tasks/not-a-uuid").expect(400);
});
test("ownership isolation on list, read, edit and delete", async () => {
  await b
    .post("/api/auth/signup")
    .send({ email: "bob@example.test", password: "test-password-456" })
    .expect(201);
  assert.deepEqual((await b.get("/api/tasks").expect(200)).body, []);
  await b.get("/api/tasks/" + id).expect(404);
  await b
    .put("/api/tasks/" + id)
    .send({ title: "stolen" })
    .expect(404);
  await b.delete("/api/tasks/" + id).expect(404);
});
test("cross-origin JSON and non-JSON writes are blocked", async () => {
  await a
    .post("/api/tasks")
    .set("Origin", "https://evil.example")
    .send({ title: "csrf" })
    .expect(403);
  await a.post("/api/tasks").type("form").send({ title: "csrf" }).expect(415);
});
test("delete, logout revocation, and fresh login", async () => {
  await a.delete("/api/tasks/" + id).expect(204);
  await a.get("/api/tasks/" + id).expect(404);
  await a.post("/api/auth/logout").send({}).expect(204);
  await a.get("/api/me").expect(401);
  await a
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(200);
  await a.get("/api/me").expect(200);
});
test("expired sessions rejected", async () => {
  await db.query("UPDATE sessions SET expires_at=NOW()-INTERVAL '1 day'");
  await a.get("/api/me").expect(401);
});
test("SQL metacharacters remain literal task data", async () => {
  await a
    .post("/api/auth/login")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(200);
  const title = "Robert'); DROP TABLE tasks;--";
  await a.post("/api/tasks").send({ title }).expect(201);
  assert.equal((await a.get("/api/tasks").expect(200)).body[0].title, title);
});

test("readiness checks database without leaking infrastructure details", async () => {
  const healthy = await request(app).get("/healthz").expect(200);
  assert.deepEqual(healthy.body, { status: "ok" });
  const broken = application({
    query: async () => {
      throw new Error("secret database hostname");
    },
    close: async () => {},
  });
  const response = await request(broken).get("/healthz").expect(503);
  assert.deepEqual(response.body, { status: "unavailable" });
});
test("explicit production origin and Secure cookie are enforced", async () => {
  const secureApp = application(db, {
    origin: "https://app.example",
    secure: true,
  });
  await request(secureApp)
    .post("/api/auth/login")
    .set("Origin", "https://other.example")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(403);
  const response = await request(secureApp)
    .post("/api/auth/login")
    .set("Origin", "https://app.example")
    .send({ email: "alice@example.test", password: "test-password-123" })
    .expect(200);
  assert.match(String(response.headers["set-cookie"]), /; Secure/);
});
