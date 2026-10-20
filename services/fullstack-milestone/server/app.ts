import express from "express";
import rateLimit from "express-rate-limit";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as rawScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import type { DB } from "./db.js";
const scrypt = promisify(rawScrypt);
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
const task = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().max(5000).default(""),
    status: z.enum(["todo", "doing", "done"]).default("todo"),
  })
  .strict();
const uuid = z.uuid();
export function application(
  db: DB,
  options: { origin?: string; secure?: boolean } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_q, r, next) => {
    r.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "Cache-Control": "no-store",
    });
    next();
  });
  app.use("/api", express.json({ limit: "16kb" }));
  app.use("/api", (q, r, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(q.method)) {
      if (q.method !== "DELETE" && !q.is("application/json")) {
        r.status(415).json({ error: "JSON required" });
        return;
      }
      const origin = q.get("origin");
      if (
        origin &&
        (options.origin
          ? origin !== options.origin
          : new URL(origin).host !== q.get("host"))
      ) {
        r.status(403).json({ error: "Origin rejected" });
        return;
      }
    }
    next();
  });
  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 40,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  const cookie = (token: string) =>
    `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${options.secure ? "; Secure" : ""}`;
  const tokenOf = (q: express.Request) =>
    (q.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("sid="))
      ?.slice(4) || "";
  async function session(userId: string, r: express.Response) {
    const token = randomBytes(32).toString("hex");
    await db.query(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
      [hash(token), userId, new Date(Date.now() + 7 * 86400000)],
    );
    r.setHeader("Set-Cookie", cookie(token));
  }
  app.post("/api/auth/signup", async (q, r) => {
    const parsed = credentials.safeParse(q.body);
    if (!parsed.success) {
      r.status(400).json({
        error: "Valid email and password of 12–128 characters required",
      });
      return;
    }
    const { email, password } = parsed.data,
      salt = randomBytes(16).toString("hex"),
      key = (await scrypt(password, salt, 64)) as Buffer,
      id = randomUUID();
    try {
      await db.query(
        "INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)",
        [id, email, `${salt}:${key.toString("hex")}`],
      );
    } catch (e: any) {
      if (e.code === "23505") {
        r.status(409).json({ error: "Unable to create this account" });
        return;
      }
      throw e;
    }
    await session(id, r);
    r.status(201).json({ id, email });
  });
  app.post("/api/auth/login", async (q, r) => {
    const parsed = credentials.safeParse(q.body);
    if (!parsed.success) {
      r.status(400).json({ error: "Invalid credentials format" });
      return;
    }
    const { email, password } = parsed.data;
    const user = (await db.query("SELECT * FROM users WHERE email=$1", [email]))
      .rows[0];
    const [salt, expected] = (
      user?.password_hash || "dummy:" + "0".repeat(128)
    ).split(":");
    const key = (await scrypt(password, salt, 64)) as Buffer;
    if (!timingSafeEqual(key, Buffer.from(expected, "hex")) || !user) {
      r.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const old = tokenOf(q);
    if (old)
      await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(old)]);
    await session(user.id, r);
    r.json({ id: user.id, email: user.email });
  });
  app.use("/api", async (q, r, next) => {
    const token = tokenOf(q);
    if (!/^[a-f0-9]{64}$/.test(token)) {
      r.status(401).json({ error: "Sign in required" });
      return;
    }
    const user = (
      await db.query(
        "SELECT u.id,u.email FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>NOW()",
        [hash(token)],
      )
    ).rows[0];
    if (!user) {
      r.status(401).json({ error: "Session expired; sign in again" });
      return;
    }
    r.locals.user = user;
    next();
  });
  app.get("/api/me", (_q, r) => r.json(r.locals.user));
  app.post("/api/auth/logout", async (q, r) => {
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [
      hash(tokenOf(q)),
    ]);
    r.setHeader(
      "Set-Cookie",
      cookie("").replace("Max-Age=604800", "Max-Age=0"),
    );
    r.status(204).end();
  });
  app.get("/api/tasks", async (_q, r) =>
    r.json(
      (
        await db.query(
          "SELECT * FROM tasks WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 200",
          [r.locals.user.id],
        )
      ).rows,
    ),
  );
  app.post("/api/tasks", async (q, r) => {
    const data = task.safeParse(q.body);
    if (!data.success) {
      r.status(400).json({
        error:
          "Title required (max 160); description max 5000; valid status required",
      });
      return;
    }
    const { title, description, status } = data.data;
    r.status(201).json(
      (
        await db.query(
          "INSERT INTO tasks(id,owner_id,title,description,status) VALUES($1,$2,$3,$4,$5) RETURNING *",
          [randomUUID(), r.locals.user.id, title, description, status],
        )
      ).rows[0],
    );
  });
  app.use("/api/tasks/:id", (q, r, next) => {
    if (!uuid.safeParse(q.params.id).success) {
      r.status(400).json({ error: "Invalid task id" });
      return;
    }
    next();
  });
  app.get("/api/tasks/:id", async (q, r) => {
    const row = (
      await db.query("SELECT * FROM tasks WHERE id=$1 AND owner_id=$2", [
        q.params.id,
        r.locals.user.id,
      ])
    ).rows[0];
    if (!row) {
      r.status(404).json({ error: "Task not found" });
      return;
    }
    r.json(row);
  });
  app.put("/api/tasks/:id", async (q, r) => {
    const data = task.safeParse(q.body);
    if (!data.success) {
      r.status(400).json({ error: "Invalid task fields" });
      return;
    }
    const { title, description, status } = data.data;
    const row = (
      await db.query(
        "UPDATE tasks SET title=$1,description=$2,status=$3,updated_at=NOW() WHERE id=$4 AND owner_id=$5 RETURNING *",
        [title, description, status, q.params.id, r.locals.user.id],
      )
    ).rows[0];
    if (!row) {
      r.status(404).json({ error: "Task not found" });
      return;
    }
    r.json(row);
  });
  app.delete("/api/tasks/:id", async (q, r) => {
    const row = (
      await db.query(
        "DELETE FROM tasks WHERE id=$1 AND owner_id=$2 RETURNING id",
        [q.params.id, r.locals.user.id],
      )
    ).rows[0];
    if (!row) {
      r.status(404).json({ error: "Task not found" });
      return;
    }
    r.status(204).end();
  });
  app.use("/api", (_q, r) =>
    r.status(404).json({ error: "Endpoint not found" }),
  );
  app.use(
    (
      e: any,
      _q: express.Request,
      r: express.Response,
      _next: express.NextFunction,
    ) => {
      const status =
        e.type === "entity.too.large"
          ? 413
          : e.type === "entity.parse.failed"
            ? 400
            : 500;
      r.status(status).json({
        error:
          status === 500 ? "Internal server error" : "Invalid request body",
      });
    },
  );
  return app;
}
