import express from "express";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { database } from "./db.js";
import { application } from "./app.js";
const production = process.env.NODE_ENV === "production";
if (production && (!process.env.DATABASE_URL || !process.env.APP_ORIGIN))
  throw new Error("Production requires DATABASE_URL and APP_ORIGIN (HTTPS)");
if (production && !process.env.APP_ORIGIN!.startsWith("https://"))
  throw new Error("Production requires HTTPS origin");
await mkdir(".data", { recursive: true });
const db = await database(
  process.env.DATABASE_URL,
  process.env.DATABASE_URL ? undefined : ".data/postgres",
);
const app = application(db, {
  origin: process.env.APP_ORIGIN,
  secure: production || process.env.APP_ORIGIN?.startsWith("https://"),
});
app.use(express.static(resolve("dist")));
app.get("/{*path}", (_q, r) => r.sendFile(resolve("dist/index.html")));
const server = app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log(
    "Full Stack milestone listening on " + (process.env.PORT || 3001),
  ),
);
process.on("SIGTERM", () =>
  server.close(() => void db.close().then(() => process.exit(0))),
);
