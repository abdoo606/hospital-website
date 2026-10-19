// Browser contract tests use mocked HTTP, NOT a claim of live Auth/email E2E.
const { chromium } = require("playwright-core");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const OUT = path.resolve(__dirname, "../test-results");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: JSON.parse(process.env.CHROMIUM_ARGS || "[]"),
    headless: true,
  });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const uid = "11111111-2222-4333-8444-555555555555"; // isolated mock fixture, never sent to live Supabase
    const user = {
      id: uid,
      aud: "authenticated",
      role: "authenticated",
      email: "fixture@example.invalid",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-10-19T00:00:00Z",
    };
    const payload = {
      sub: uid,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      aud: "authenticated",
      role: "authenticated",
    };
    const token =
      Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url") +
      "." +
      Buffer.from(JSON.stringify(payload)).toString("base64url") +
      ".fixture";
    const session = {
      access_token: token,
      refresh_token: "mock-refresh-never-live",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: payload.exp,
      user,
    };
    let stored = null,
      saveCalls = 0,
      loadFails = false;
    await context.route(
      "https://bgacqgzzqjdhubeqzeoq.supabase.co/**",
      async (route) => {
        const request = route.request(),
          url = new URL(request.url());
        const respond = (body, status = 200) =>
          route.fulfill({
            status,
            contentType: "application/json",
            headers: { "access-control-allow-origin": "*" },
            body: JSON.stringify(body),
          });
        if (url.pathname === "/auth/v1/token") return respond(session);
        if (url.pathname === "/auth/v1/user") return respond(user);
        if (url.pathname === "/auth/v1/logout") return respond({});
        if (url.pathname === "/auth/v1/signup")
          return respond({ user, session: null });
        if (url.pathname === "/rest/v1/portfolio_app_states")
          return loadFails
            ? respond({ message: "offline" }, 503)
            : respond(stored ? [stored] : []);
        if (url.pathname === "/rest/v1/rpc/portfolio_save_state") {
          saveCalls++;
          const body = request.postDataJSON();
          if (body.p_expected_revision !== (stored?.revision || 0))
            return respond({ code: "40001" }, 409);
          stored = {
            state: body.p_state,
            revision: (stored?.revision || 0) + 1,
          };
          return respond(stored);
        }
        throw Error("Unexpected mocked endpoint " + url.pathname);
      },
    );
    await page.goto(BASE + "/projects/ledger/");
    await page.locator('[data-cloud="account"]').waitFor();
    // Create a local-only fixture first. Cloud sign-in must not auto-import it.
    await page.locator("#entry-description").fill("Guest only");
    await page.locator("#entry-quantity").fill("1");
    await page.locator("#entry-price").fill("10");
    await page.locator('[data-form="entry"] button[type="submit"]').click();
    const backupDownload = page.waitForEvent("download");
    await page.locator('[data-action="backup"]').click();
    const backup = await backupDownload;
    const backupText = fs.readFileSync(await backup.path(), "utf8");
    const backupDocument = JSON.parse(backupText);
    assert.equal(backupDocument.app, "ledger");
    assert.ok(backupText.includes("Guest only"));
    const upload = async (text) =>
      page.locator("#backup-file").setInputFiles({
        name: "backup.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await upload(JSON.stringify({ ...backupDocument, app: "stockroom" }));
    await page
      .locator(".toast.error")
      .filter({ hasText: "different project" })
      .waitFor();
    assert.equal(await page.locator("dialog").count(), 0);
    await page.locator('[data-cloud="account"]').click();
    await page.locator('.cloud-dialog [name="email"]').fill(user.email);
    await page
      .locator('.cloud-dialog [name="password"]')
      .fill("fixture-password");
    await page.locator('.cloud-dialog button[value="login"]').click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "Empty cloud workspace" })
      .waitFor();
    assert.equal(
      await page.getByText("Guest only", { exact: true }).count(),
      0,
    );
    assert.equal(saveCalls, 0);
    // Explicit import only: cancel leaves the cloud workspace empty.
    await upload(backupText);
    await page.locator("dialog [data-dismiss]").click();
    assert.equal(
      await page.getByText("Guest only", { exact: true }).count(),
      0,
    );
    await upload(backupText);
    await page.locator("dialog [data-confirm]").click();
    await page.getByText("Guest only", { exact: true }).waitFor();
    assert.equal(saveCalls, 0);
    assert.match(
      await page.locator("#cloud-panel").innerText(),
      /Unsaved cloud edits/,
    );
    // Restore an empty backup so the original regression suite stays independent.
    await upload(
      JSON.stringify({
        ...backupDocument,
        state: { ...backupDocument.state, rows: [] },
      }),
    );
    await page.locator("dialog [data-confirm]").click();
    assert.equal(saveCalls, 0);
    await page.locator("#entry-description").fill("Private cloud item");
    await page.locator("#entry-quantity").fill("2");
    await page.locator("#entry-price").fill("50");
    await page.locator('[data-form="entry"] button[type="submit"]').click();
    assert.equal(saveCalls, 0);
    await page.locator('[data-cloud="save"]').click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "revision 1" })
      .waitFor();
    assert.equal(saveCalls, 1);
    const guest = await page.evaluate(() =>
      localStorage.getItem("studio:v1:ledger"),
    );
    assert.ok(guest.includes("Guest only"));
    assert.ok(!guest.includes("Private cloud item"));
    await page.reload();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "revision 1" })
      .waitFor();
    await page.getByText("Private cloud item", { exact: true }).waitFor();
    // A competing device saves first; the current draft must not overwrite it.
    stored = { ...stored, revision: 2 };
    await page.locator("#entry-description").fill("Stale draft");
    await page.locator("#entry-quantity").fill("1");
    await page.locator("#entry-price").fill("2");
    await page.locator('[data-form="entry"] button[type="submit"]').click();
    await page.locator('[data-cloud="save"]').click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "Another device" })
      .waitFor();
    assert.equal(
      await page.locator("#cloud-workspace").evaluate((el) => el.inert),
      true,
    );
    await page.locator('[data-cloud="reload"]').click();
    await page.locator("dialog [data-confirm]").click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "revision 2" })
      .waitFor();
    assert.equal(
      await page.getByText("Stale draft", { exact: true }).count(),
      0,
    );
    // An offline load must lock the cloud area, not silently expose guest data.
    loadFails = true;
    await page.locator('[data-cloud="reload"]').click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "could not be loaded" })
      .waitFor();
    assert.equal(
      await page.locator("#cloud-workspace").evaluate((el) => el.inert),
      true,
    );
    loadFails = false;
    await page.locator('[data-cloud="reload"]').click();
    await page
      .locator("#cloud-panel")
      .filter({ hasText: "revision 2" })
      .waitFor();
    await page.locator('[data-cloud="logout"]').click();
    await page.locator('[data-cloud="account"]').waitFor();
    await page.getByText("Guest only", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("Private cloud item", { exact: true }).count(),
      0,
    );
    await page.locator('[data-cloud="account"]').click();
    await page.locator('.cloud-dialog [name="email"]').fill(user.email);
    await page
      .locator('.cloud-dialog [name="password"]')
      .fill("long-fixture-password");
    await page.locator('.cloud-dialog button[value="signup"]').click();
    await page
      .locator("[data-auth-result]")
      .filter({ hasText: "Check your email" })
      .waitFor();
    await page.locator(".cloud-dialog [data-close]").click();
    assert.deepEqual(errors, []);
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, "cloud-contract.json"),
      JSON.stringify(
        {
          status: "PASS",
          network: "Mocked Supabase Auth and REST, no live emails",
          flows: [
            "backup-download",
            "wrong-project-backup-rejected",
            "restore-cancel",
            "explicit-cloud-restore-unsaved",
            "sign-in",
            "no-guest-auto-import",
            "explicit-save",
            "no-cloud-state-local-cache",
            "session-reload",
            "revision-conflict",
            "confirmed-reload",
            "offline-load-lock",
            "load-retry",
            "signout-isolation",
            "signup-confirmation-message",
          ],
          pageErrors: errors,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: 15 mocked cloud/backup browser flows; no live Auth/email claim.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
