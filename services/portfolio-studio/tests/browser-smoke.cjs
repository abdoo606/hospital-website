const { chromium: pw } = require("playwright-core");
const path = require("node:path");
const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const OUT = path.resolve(__dirname, "../test-results");
const fs = require("fs");
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    args: JSON.parse(process.env.CHROMIUM_ARGS || "[]"),
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + "/");
  await page.locator(".project").first().waitFor();
  if ((await page.locator(".project").count()) !== 10)
    throw Error("Expected ten cards");
  await page.screenshot({
    path: path.join(OUT, "gallery.png"),
    fullPage: true,
  });
  await page.locator('[data-filter="Lifestyle"]').click();
  if ((await page.locator(".project").count()) !== 2)
    throw Error("Filter failed");
  const ids = [
    "ledger",
    "stockroom",
    "momentum",
    "daylight",
    "gather",
    "balance",
    "resolve",
    "ritual",
    "fieldwork",
    "northstar",
  ];
  for (const id of ids) {
    await page.goto(BASE + "/projects/" + id + "/");
    await page.locator(".metric").first().waitFor();
    await page.locator('[data-cloud="account"]').waitFor();
    if ((await page.locator(".metric").count()) !== 3)
      throw Error(id + " metrics");
    await page.screenshot({
      path: path.join(OUT, id + ".png"),
      fullPage: false,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      )
    )
      throw Error(id + " mobile overflow");
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto(BASE + "/projects/ledger/");
  await page.locator("#entry-description").fill("QA line");
  await page.locator("#entry-quantity").fill("2");
  await page.locator("#entry-price").fill("12.50");
  await page.locator('form[data-form="entry"] button[type="submit"]').click();
  await page.locator("td", { hasText: "QA line" }).waitFor();
  await page.reload();
  await page.locator("td", { hasText: "QA line" }).waitFor();
  await page.goto(BASE + "/projects/stockroom/");
  await page.locator('[data-action="stock-up"]').first().click();
  await page.locator("text=Recent stock adjustments").waitFor();
  await page.goto(BASE + "/projects/momentum/");
  await page.locator('[data-task="a"]').selectOption("Done");
  if ((await page.locator(".column").last().locator(".task").count()) !== 2)
    throw Error("Task movement failed");
  await page.goto(BASE + "/projects/daylight/");
  await page.locator("#entry-name").fill("Conflict Test");
  await page.locator("#entry-time").fill("10:30");
  await page.locator("#entry-duration").selectOption("60");
  await page.locator('form[data-form="entry"] button[type="submit"]').click();
  await page.locator(".toast.error").filter({ hasText: "overlaps" }).waitFor();
  await page.goto(BASE + "/projects/ritual/");
  await page.locator('[data-habit="a"]').last().click();
  if (
    (await page
      .locator('[data-habit="a"]')
      .last()
      .getAttribute("aria-pressed")) !== "true"
  )
    throw Error("Checkin failed");
  await page.goto(BASE + "/projects/fieldwork/");
  await page.locator('[data-form="preview"] button').click();
  await page.locator('[aria-invalid="true"]').first().waitFor();
  await page.locator("#preview-a").fill("QA");
  await page.locator("#preview-b").fill("qa@example.com");
  await page.locator('[data-form="preview"] button').click();
  await page
    .locator("#preview-result")
    .filter({ hasText: "Validation passed" })
    .waitFor();
  await page.goto(BASE + "/projects/northstar/");
  await page.locator('[data-control="region"]').selectOption("Europe");
  if ((await page.locator("tbody tr").count()) !== 6)
    throw Error("Region filter failed");
  const download = page.waitForEvent("download");
  await page.locator('[data-action="export"]').click();
  await download;
  await page.locator('[data-action="reset"]').click();
  await page.locator("dialog [data-dismiss]").click();
  await page.locator("dialog").waitFor({ state: "detached" });

  await page.goto(BASE + "/projects/gather/");
  await page.locator("#entry-name").fill("QA contact");
  await page.locator("#entry-company").fill("Example");
  await page.locator("#entry-email").fill("qa@example.com");
  await page.locator("#entry-value").fill("150");
  await page.locator('form[data-form="entry"] button[type="submit"]').click();
  await page.locator("td", { hasText: "QA contact" }).waitFor();
  await page.goto(BASE + "/projects/balance/");
  await page.locator("#entry-name").fill("QA expense");
  await page.locator("#entry-amount").fill("25");
  await page.locator('form[data-form="entry"] button[type="submit"]').click();
  await page.locator("td", { hasText: "QA expense" }).waitFor();
  await page.goto(BASE + "/projects/resolve/");
  await page.locator('[data-action="resolve"][data-id="a"]').click();
  if (
    (await page
      .locator("tbody tr")
      .first()
      .locator(".badge")
      .last()
      .innerText()) !== "Resolved"
  )
    throw Error("Ticket resolution failed");
  await page.goto(BASE + "/projects/ledger/");
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: path.join(OUT, "invoice.pdf"), format: "A4" });
  await page.emulateMedia({ media: "screen" });
  await page.locator('[data-action="reset"]').click();
  await page.locator("dialog [data-confirm]").click();
  await page.locator("dialog").waitFor({ state: "detached" });
  if ((await page.locator("tbody tr").count()) !== 2)
    throw Error("Reset failed");
  await page.goto(BASE + "/");
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    )
  )
    throw Error("Gallery mobile overflow");
  await page.screenshot({ path: path.join(OUT, "mobile.png"), fullPage: true });
  if (errors.length) throw Error(errors.join("\n"));
  fs.writeFileSync(
    path.join(OUT, "smoke.json"),
    JSON.stringify(
      {
        routes: 10,
        mobileOverflow: false,
        consoleErrors: errors,
        flows: [
          "gallery-filter",
          "invoice-create-persist",
          "stock-adjustment",
          "kanban-move",
          "booking-conflict",
          "habit-checkin",
          "form-validation",
          "region-filter",
          "CSV-download",
          "reset-cancel",
          "CRM-create",
          "budget-expense",
          "ticket-resolution",
          "invoice-PDF",
          "reset-confirm",
        ],
        status: "PASS",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: 10 routes, responsive layout, 15 browser workflows, 0 page errors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
