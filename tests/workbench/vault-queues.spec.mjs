import { readFile } from "node:fs/promises";
import { expect, test as base } from "@playwright/test";

const test = base.extend({
  diagnostics: [async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (["error", "warning"].includes(message.type())) errors.push(message.text()); });
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }],
});

async function preview(page, slug, engine) {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/vault/preview/" + slug + "/?engine=" + engine + "&dir=rtl&theme=dark");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("main section").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
}

for (const engine of ["alpine", "react"]) {
  test(engine + " priority queue sorts, searches, selects and assigns", async ({ page }) => {
    await preview(page, "sla-priority-queue", engine);
    const rows = page.getByRole("listitem");
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toContainText("#1042");
    await expect(rows.first().locator("i")).toHaveAttribute("style", /width:\s*2%/);
    await expect(rows.nth(1)).toContainText("#1043");
    await page.getByLabel("Select request 1043").check();
    await page.getByLabel("Select request 1044").check();
    await expect(page.getByText("2 selected")).toBeVisible();
    await page.getByRole("button", { name: "Assign to me" }).click();
    await expect(page.getByRole("status")).toHaveText("Assigned 2 requests to Alex Rivera.");
    await page.getByRole("searchbox").fill("printer");
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("Alex Rivera");
    await page.getByRole("searchbox").fill("unmatched term");
    await expect(page.getByText("No matching requests.")).toBeVisible();
  });

  test(engine + " slice tiles filter scoped counts and keep zero breaches neutral", async ({ page }) => {
    await preview(page, "slice-kpi-tiles", engine);
    const breach = page.getByRole("button", { name: /^Breached,/ });
    await expect(breach).toHaveAttribute("aria-label", "Breached, 1 requests");
    await expect(breach).toHaveClass(/text-crit/);
    await breach.click();
    await expect(breach).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("listitem")).toContainText("#1042");
    await breach.click();
    await expect(breach).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("listitem")).toHaveCount(5);
    await page.getByRole("combobox", { name: "Branch" }).selectOption("Central Campus");
    await expect(breach).toHaveAttribute("aria-label", "Breached, 0 requests");
    await expect(breach).not.toHaveClass(/text-crit/);
    await breach.click();
    await expect(page.getByRole("status")).toHaveText("0 matching requests");
  });

  test(engine + " register creates, sanitizes, audits, filters and exports the visible rows", async ({ page }) => {
    await preview(page, "config-driven-register", engine);
    await page.getByRole("button", { name: "Create record" }).click();
    const editor = page.getByRole("dialog", { name: "Record editor" });
    await editor.getByLabel("Endpoint").fill("Site unit, 9");
    await editor.getByLabel("Branch").fill("North Hub");
    await editor.getByLabel("Type").fill("Laptop");
    await editor.getByRole("button", { name: "Save record" }).click();
    await expect(editor).not.toBeVisible();
    await page.getByRole("button", { name: "Edit Site unit, 9" }).click();
    await editor.getByLabel("Branch").fill("   ");
    await editor.getByRole("button", { name: "Save record" }).click();
    const row = page.getByRole("row").filter({ hasText: "Site unit, 9" });
    await expect(row.getByRole("cell").nth(1)).toHaveText("—");
    await page.getByRole("button", { name: "History for Site unit, 9" }).click();
    const history = page.getByRole("dialog", { name: "Field history" });
    const last = history.locator("section").first();
    await expect(last).toContainText("Revision 2");
    await expect(last.locator("del")).toHaveText("North Hub");
    await expect(last.locator("ins")).toHaveText("null");
    await history.getByRole("button", { name: "Close history" }).click();
    await page.getByRole("searchbox").fill("Site unit, 9");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe("endpoint-register.csv");
    const csv = (await readFile(await download.path(), "utf8")).replace(/^\uFEFF/, "");
    expect(csv.split("\r\n")).toEqual(['"Endpoint","Branch","Type"', '"Site unit, 9","","Laptop"']);
  });
}
