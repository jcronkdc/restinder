import { test, expect } from "@playwright/test";
import { SUPABASE_URL } from "./helpers.js";

// ═══════════════════════════════════════════════════════════
// AUTH SCREEN E2E TESTS
// Tests the login, signup, and forgot-password UI flows.
// Supabase auth API is mocked at the network level.
// ═══════════════════════════════════════════════════════════

test.describe("Auth Screen", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no existing session
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    // Mock the token refresh so getSession returns null (no session)
    await page.route(`${SUPABASE_URL}/auth/v1/token*`, (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant" }),
      });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "not_authenticated" }),
      });
    });
    await page.reload();
    // Wait for auth screen to render
    await expect(page.locator("h1", { hasText: "Restinder" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("renders login screen by default", async ({ page }) => {
    await expect(
      page.locator("text=Welcome back! Sign in to continue."),
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="Email address"]'),
    ).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(page.locator("button", { hasText: "Sign In" })).toBeVisible();
    await expect(page.locator("text=Forgot password?")).toBeVisible();
    await expect(page.locator("text=Sign up")).toBeVisible();
  });

  test("can switch to signup mode", async ({ page }) => {
    await page.locator("button", { hasText: "Sign up" }).click();
    await expect(
      page.locator("text=Create your account to get started."),
    ).toBeVisible({ timeout: 3000 });
    await expect(page.locator('input[placeholder="Your name"]')).toBeVisible();
    await expect(
      page.locator('input[placeholder="Email address"]'),
    ).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Create Account" }),
    ).toBeVisible();
    await expect(page.locator("text=Already have an account?")).toBeVisible();
  });

  test("can switch to forgot password mode", async ({ page }) => {
    await page.locator("button", { hasText: "Forgot password?" }).click();
    await expect(page.locator("text=We'll send you a reset link.")).toBeVisible(
      { timeout: 3000 },
    );
    await expect(
      page.locator('input[placeholder="Email address"]'),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Send Reset Link" }),
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder="Password"]'),
    ).not.toBeVisible();
  });

  test("can navigate forgot → login", async ({ page }) => {
    await page.locator("button", { hasText: "Forgot password?" }).click();
    await expect(page.locator("text=We'll send you a reset link.")).toBeVisible(
      { timeout: 3000 },
    );
    await page.locator("button", { hasText: "Back to sign in" }).click();
    await expect(
      page.locator("text=Welcome back! Sign in to continue."),
    ).toBeVisible({ timeout: 3000 });
  });

  test("can navigate signup → login", async ({ page }) => {
    await page.locator("button", { hasText: "Sign up" }).click();
    await expect(
      page.locator("text=Create your account to get started."),
    ).toBeVisible({ timeout: 3000 });
    await page.locator("button", { hasText: "Sign in" }).click();
    await expect(
      page.locator("text=Welcome back! Sign in to continue."),
    ).toBeVisible({ timeout: 3000 });
  });

  test("shows password toggle", async ({ page }) => {
    const passwordInput = page.locator('input[placeholder="Password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");
    // Click the eye toggle
    await page
      .locator('input[placeholder="Password"]')
      .locator("..")
      .locator("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await page
      .locator('input[placeholder="Password"]')
      .locator("..")
      .locator("button")
      .click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("shows error for invalid login credentials", async ({ page }) => {
    // Mock login endpoint to return error
    await page.route(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      (route) => {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "invalid_grant",
            error_description: "Invalid login credentials",
          }),
        });
      },
    );
    await page
      .locator('input[placeholder="Email address"]')
      .fill("fake@test.com");
    await page.locator('input[placeholder="Password"]').fill("wrongpassword");
    await page.locator("button", { hasText: "Sign In" }).click();
    await expect(page.locator("text=Invalid login credentials")).toBeVisible({
      timeout: 10000,
    });
  });

  test("prevents signup with short password via HTML validation", async ({
    page,
  }) => {
    await page.locator("button", { hasText: "Sign up" }).click();
    await expect(
      page.locator("text=Create your account to get started."),
    ).toBeVisible({ timeout: 3000 });
    await page.locator('input[placeholder="Your name"]').fill("Test");
    await page
      .locator('input[placeholder="Email address"]')
      .fill("test@test.com");
    await page.locator('input[placeholder="Password"]').fill("123");
    await page.locator("button", { hasText: "Create Account" }).click();
    // The password input has minLength=6, so browser validation blocks submission
    const passwordInput = page.locator('input[placeholder="Password"]');
    const isInvalid = await passwordInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);
    await expect(passwordInput).toHaveAttribute("minLength", "6");
  });

  test("shows error for signup without name", async ({ page }) => {
    await page.locator("button", { hasText: "Sign up" }).click();
    await expect(
      page.locator("text=Create your account to get started."),
    ).toBeVisible({ timeout: 3000 });
    await page
      .locator('input[placeholder="Email address"]')
      .fill("test@test.com");
    await page.locator('input[placeholder="Password"]').fill("testpassword123");
    await page.locator("button", { hasText: "Create Account" }).click();
    await expect(page.locator("text=Please enter your name")).toBeVisible({
      timeout: 5000,
    });
  });

  test("login form requires email (HTML validation)", async ({ page }) => {
    await page.locator('input[placeholder="Password"]').fill("somepassword");
    await page.locator("button", { hasText: "Sign In" }).click();
    const emailInput = page.locator('input[placeholder="Email address"]');
    const isInvalid = await emailInput.evaluate((el) => !el.checkValidity());
    expect(isInvalid).toBe(true);
  });
});
