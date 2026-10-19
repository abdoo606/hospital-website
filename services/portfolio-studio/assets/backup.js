import { restore } from "./model.js";
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const bytes = (text) => new TextEncoder().encode(text).length;
export function createBackup(project, state) {
  const text = JSON.stringify(
    {
      format: "portfolio-studio-backup",
      version: 1,
      app: project.id,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2,
  );
  // Export only restorable documents, never session tokens or account metadata.
  parseBackup(project, text);
  return text;
}
export function parseBackup(project, text) {
  if (typeof text !== "string" || bytes(text) > MAX_BACKUP_BYTES)
    throw Error("Backup exceeds the 2 MiB limit.");
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw Error("Invalid JSON backup.");
  }
  if (
    !document ||
    document.format !== "portfolio-studio-backup" ||
    document.version !== 1
  )
    throw Error("Unsupported backup format or version.");
  if (document.app !== project.id)
    throw Error("This backup belongs to a different project.");
  const state = restore(project, JSON.stringify(document.state));
  if (!state || Array.isArray(state.extras))
    throw Error("Backup data failed project validation.");
  return state;
}
