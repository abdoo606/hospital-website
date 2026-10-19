import { client, api } from "./cloud-client.js";
import { WorkspaceSync } from "./cloud-sync.js";
import { escape as e } from "./model.js";
export function mountCloud(appId, hooks) {
  let sync;
  function paint() {
    const panel = document.querySelector("#cloud-panel");
    if (!panel || !sync) return;
    const work = document.querySelector("#cloud-workspace");
    if (work) work.inert = sync.locked;
    const reset = document.querySelector('[data-action="reset"]');
    if (reset) reset.disabled = sync.locked;
    const restoreBackup = document.querySelector(
      '[data-action="restore-backup"]',
    );
    if (restoreBackup)
      restoreBackup.disabled = sync.locked || sync.status === "saving";
    let message =
      sync.error ||
      {
        local: "Local demo · sign in for a separate private cloud workspace.",
        loading: "Loading your private workspace…",
        ready: sync.dirty
          ? "Unsaved cloud edits — click Save to cloud."
          : sync.revision
            ? "Cloud copy loaded · revision " + sync.revision
            : "Empty cloud workspace · add entries, then save.",
        saving: "Saving a snapshot…",
        "save-error": "Save not confirmed.",
      }[sync.status] ||
      "Cloud needs attention.";
    panel.innerHTML = `<div class="cloud-status"><strong>${sync.active ? "Private cloud workspace" : "Supabase cloud"}</strong><span role="status">${e(message)}</span>${sync.active ? `<small>${e(sync.user.email || "Signed in")} · ${e(appId)}</small>` : ""}</div><div class="actions">${sync.active ? `<button class="primary" data-cloud="save" ${sync.locked || !sync.dirty || sync.status === "saving" ? "disabled" : ""}>Save to cloud</button><button class="secondary" data-cloud="reload" ${sync.status === "saving" ? "disabled" : ""}>Reload cloud</button><button class="secondary" data-cloud="logout" ${sync.status === "saving" ? "disabled" : ""}>Sign out</button>` : '<button class="primary" data-cloud="account">Sign in / Create account</button>'}</div>`;
  }
  sync = new WorkspaceSync(appId, api, { ...hooks, changed: paint });
  function account() {
    const dialog = document.createElement("dialog");
    dialog.className = "cloud-dialog";
    dialog.innerHTML = `<h2>Your private workspace</h2><p>Sign in to save across devices. Local demo data is not uploaded automatically. New cloud workspaces start empty.</p><form class="form-preview"><label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" required></label><p class="quiet">New accounts: use at least 12 characters. Email confirmation is required. The default email service may restrict delivery until custom SMTP is configured.</p><div class="actions"><button class="primary" value="login">Sign in</button><button class="secondary" value="signup">Create account</button><button class="secondary" type="button" data-close>Cancel</button></div><p class="error-message" role="status" data-auth-result></p></form>`;
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector("input").focus();
    dialog.querySelector("[data-close]").onclick = () => dialog.close();
    dialog.addEventListener("close", () => dialog.remove());
    dialog.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target)),
        signup = event.submitter.value === "signup";
      const message = dialog.querySelector("[data-auth-result]");
      if (signup && values.password.length < 12) {
        message.textContent = "Use at least 12 characters for a new account.";
        return;
      }
      for (const b of dialog.querySelectorAll("button")) b.disabled = true;
      message.textContent = "Connecting securely…";
      try {
        const result = signup
          ? await client.auth.signUp({
              email: values.email,
              password: values.password,
              options: { emailRedirectTo: location.origin + location.pathname },
            })
          : await client.auth.signInWithPassword(values);
        if (result.error) throw result.error;
        dialog.querySelector('[name="password"]').value = "";
        if (result.data.session) dialog.close();
        else
          message.textContent =
            "Check your email to confirm your account, then return here to sign in. Delivery is subject to the email provider and rate limits.";
      } catch (error) {
        message.textContent =
          error.message || "Unable to connect. Please try again.";
      } finally {
        for (const b of dialog.querySelectorAll("button")) b.disabled = false;
      }
    });
  }
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cloud]");
    if (!button) return;
    try {
      if (button.dataset.cloud === "account") account();
      if (button.dataset.cloud === "save") await sync.save();
      if (button.dataset.cloud === "reload") {
        if (sync.dirty)
          hooks.confirm(
            "Reload cloud data?",
            "Unsaved edits will be discarded. Export them first if you need a copy.",
            () => sync.open(sync.user),
          );
        else await sync.open(sync.user);
      }
      if (button.dataset.cloud === "logout") {
        const out = async () => {
          const { error } = await client.auth.signOut({ scope: "local" });
          if (error) {
            hooks.notify("Sign-out failed. Please retry.", true);
            return;
          }
          await sync.open(null);
        };
        if (sync.dirty)
          hooks.confirm(
            "Sign out with unsaved edits?",
            "These edits are held only in this page. Export or save before signing out.",
            () => out(),
          );
        else await out();
      }
    } catch (error) {
      hooks.notify(error.message || "Cloud action failed.", true);
    }
  });
  let lastIdentity = "uninitialized";
  function identity(session) {
    const key = session?.user?.id ?? null;
    if (key === lastIdentity) return;
    lastIdentity = key;
    setTimeout(() => sync.open(session?.user || null), 0);
  }
  client.auth.onAuthStateChange((_event, session) => identity(session));
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      hooks.notify(
        "Cloud session could not be restored. The local demo is still available.",
        true,
      );
      return;
    }
    identity(data.session);
  });
  window.addEventListener("beforeunload", (event) => {
    if (sync.active && sync.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  paint();
  return { sync, paint };
}
