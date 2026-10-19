// Transport-independent sync state machine. No credentials or browser globals.
export class WorkspaceSync {
  constructor(appId, api, hooks) {
    this.appId = appId;
    this.api = api;
    this.hooks = hooks;
    this.user = null;
    this.status = "local";
    this.dirty = false;
    this.revision = 0;
    this.generation = 0;
    this.editSequence = 0;
    this.error = "";
  }
  get active() {
    return this.user !== null;
  }
  get locked() {
    return (
      this.active && !["ready", "saving", "save-error"].includes(this.status)
    );
  }
  emit() {
    this.hooks.changed?.(this);
  }
  async open(user) {
    const generation = ++this.generation;
    this.user = user;
    this.revision = 0;
    this.dirty = false;
    this.editSequence = 0;
    this.error = "";
    if (!user) {
      this.status = "local";
      this.hooks.local();
      this.emit();
      return;
    }
    this.status = "loading";
    this.hooks.replace(this.hooks.empty());
    this.emit();
    try {
      const remote = await this.api.load(this.appId, user.id);
      if (generation !== this.generation) return;
      if (remote) {
        const parsed = this.hooks.validate(remote.state);
        if (
          !parsed ||
          !Number.isSafeInteger(remote.revision) ||
          remote.revision < 1
        )
          throw Error("Invalid remote workspace.");
        this.hooks.replace(parsed);
        this.revision = remote.revision;
      }
      this.status = "ready";
      this.emit();
    } catch (error) {
      if (generation !== this.generation) return;
      this.status = "load-error";
      this.error =
        "Cloud data could not be loaded. Retry; no local data was uploaded.";
      this.emit();
    }
  }
  noteEdit() {
    if (!this.active) return;
    if (this.locked) throw Error("Load your workspace before editing.");
    this.editSequence++;
    this.dirty = true;
    this.emit();
  }
  async save() {
    if (!this.active || this.locked || this.status === "saving" || !this.dirty)
      return;
    const generation = this.generation,
      editSequence = this.editSequence,
      owner = this.user.id;
    const snapshot = structuredClone(this.hooks.read());
    if (!this.hooks.validate(snapshot))
      throw Error("Workspace validation failed.");
    this.status = "saving";
    this.error = "";
    this.emit();
    try {
      const remote = await this.api.save(
        this.appId,
        snapshot,
        this.revision,
        owner,
      );
      if (generation !== this.generation) return;
      if (
        !Number.isSafeInteger(remote.revision) ||
        remote.revision <= this.revision
      )
        throw Error("Invalid save response.");
      this.revision = remote.revision;
      this.dirty = this.editSequence !== editSequence;
      this.status = "ready";
      this.emit();
    } catch (error) {
      if (generation !== this.generation) return;
      this.status = error.code === "40001" ? "conflict" : "save-error";
      this.error =
        this.status === "conflict"
          ? "Another device saved a newer version. Export your edits, then reload cloud data."
          : "Save not confirmed. Your edits remain in memory; retry or export before leaving.";
      this.emit();
    }
  }
}
