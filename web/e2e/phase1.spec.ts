import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "e2e-screenshots");

test.describe("Phase 1 UI, Accessibility, Auth & API Boundary", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test("Landing page layout, responsiveness, screenshots, links, and axe-core audit", async ({
    page,
    request,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle("Resume match checker | rezoooo.me");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Score your resume against any job.",
    );

    // Accessibility audit on landing page
    const axeLanding = await new AxeBuilder({ page }).analyze();
    expect(axeLanding.violations).toEqual([]);

    // Screenshot 1440px
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "landing-1440.png"),
      fullPage: true,
    });

    // Check 1024px, 768px, 390px screenshots & 360px minimum width for zero horizontal overflow
    for (const vp of [
      { width: 1024, height: 800, save: "landing-1024.png" },
      { width: 768, height: 900, save: "landing-768.png" },
      { width: 390, height: 844, save: "landing-390.png" },
      { width: 360, height: 800, save: null },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `Horizontal overflow detected at ${vp.width}px`).toBe(false);
      if (vp.save) {
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, vp.save),
          fullPage: true,
        });
      }
    }

    // Verify all anchors on / point to existing IDs or non-404 routes
    const hrefs = await page.locator("a[href]").evaluateAll((els) =>
      Array.from(
        new Set(
          els.map((el) => el.getAttribute("href")).filter((h): h is string => Boolean(h)),
        ),
      ),
    );
    expect(hrefs.length).toBeGreaterThan(5);
    for (const href of hrefs) {
      if (href.startsWith("#")) {
        const targetId = href.slice(1);
        const exists = await page.evaluate(
          (id) => Boolean(document.getElementById(id)),
          targetId,
        );
        expect(exists, `Missing in-page anchor target ${href}`).toBe(true);
      } else if (href.startsWith("/")) {
        const res = await request.get(href, { maxRedirects: 5 });
        expect(res.status(), `Broken internal route ${href}`).toBeLessThan(400);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test("Sign-in page axe audit, validation states, session-expired, 404, and OAuth initiation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Protected route redirect check when signed out
    for (const protectedRoute of ["/dashboard", "/analyses/new", "/history", "/settings"]) {
      await page.goto(protectedRoute);
      await expect(page).toHaveURL(/\/sign-in/);
    }

    // Sign-in page a11y + validation
    await page.goto("/sign-in", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle("Sign in | rezoooo.me");
    const axeSignIn = await new AxeBuilder({ page }).analyze();
    expect(axeSignIn.violations).toEqual([]);

    // Empty submit validation
    await page.locator('button[type="submit"]').click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Fix 2 fields to continue." }),
    ).toBeVisible();

    // Forgot password mode switch
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Reset your password");
    await page.getByRole("button", { name: "Back to sign in" }).click();

    // OAuth initiation check (Google & GitHub) without leaving localhost for 3rd-party login UI
    for (const provider of [
      { label: "Continue with Google", expectedHost: "accounts.google.com" },
      { label: "Continue with GitHub", expectedHost: "github.com" },
    ]) {
      const hostRegex = new RegExp(provider.expectedHost.replace(".", "\\."));
      await page.route(hostRegex, async (route) => {
        await route.abort();
      });

      const resPromise = page.waitForResponse(
        (res) => res.url().includes("/api/auth/sign-in/social") && res.request().method() === "POST",
      );
      const navReqPromise = page.waitForRequest((req) => hostRegex.test(req.url()));

      await page.getByRole("button", { name: provider.label }).click();
      const [socialRes, navReq] = await Promise.all([resPromise, navReqPromise]);
      expect(socialRes.status()).toBe(200);
      expect(navReq.url()).toContain(provider.expectedHost);

      await page.unrouteAll();
      await page.goto("/sign-in", { waitUntil: "networkidle" });
    }

    // Session expired & 404 routes
    await page.goto("/session-expired");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your session has expired");

    const res404 = await page.goto("/this-route-does-not-exist-phase1");
    expect(res404?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("We couldn’t find that page");
  });

  test("Desktop auth lifecycle: sign-up, reload, API GET /me, settings, sign-out, guard, sign-in", async ({
    page,
  }) => {
    const email = `phase1-pw-${randomUUID().slice(0, 12)}@example.com`;
    const password = `P1pw!${randomUUID().slice(0, 10)}Aa`;

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sign-in?mode=signup", { waitUntil: "networkidle" });

    await page.getByLabel("First name").fill("Phase1Desktop");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByTestId("api-me-verified")).toBeVisible({ timeout: 15_000 });
    const verifiedText = await page.getByTestId("api-me-verified").innerText();
    expect(verifiedText).toContain("user_id:");

    // Reload persistence
    await page.reload({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("api-me-verified")).toBeVisible({ timeout: 15_000 });

    // Settings reflects real account and connected provider
    await page.goto("/settings", { waitUntil: "networkidle" });
    await expect(page.getByLabel("First name")).toHaveValue("Phase1Desktop");
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await expect(page.getByRole("heading", { name: "Usage (Phase 1 placeholder)" })).toBeVisible();
    await expect(page.getByText("Set", { exact: true })).toBeVisible({ timeout: 10_000 });

    // Sign out via account menu
    await page.getByRole("button", { name: /Account menu for Phase1Desktop/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

    // Protected route redirects after sign-out
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);

    // Sign back in with email + password
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  test("Mobile auth lifecycle (390x844): sign-up, mobile drawer, settings, reload, sign-out, sign-in", async ({
    page,
  }) => {
    const email = `phase1-pw-${randomUUID().slice(0, 12)}@example.com`;
    const password = `P1pw!${randomUUID().slice(0, 10)}Bb`;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sign-in?mode=signup", { waitUntil: "networkidle" });

    await page.getByLabel("First name").fill("Phase1Mobile");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
    await expect(page.getByTestId("api-me-verified")).toBeVisible({ timeout: 15_000 });

    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(mobileOverflow).toBe(false);

    // Open mobile drawer and go to Settings
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByLabel("Email")).toHaveValue(email);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/settings/);

    // Sign out from Settings card
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

    // Verify protected redirect and sign back in
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });
});
