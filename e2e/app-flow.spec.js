import { test, expect } from "@playwright/test";
import { gotoAppAuthenticated, SUPABASE_URL, FAKE_SESSION } from "./helpers.js";

// ═══════════════════════════════════════════════════════════
// APP FLOW E2E TESTS
// Tests the main app after authentication.
// Supabase auth + DB are mocked at the network level.
// ═══════════════════════════════════════════════════════════

// ── WELCOME SCREEN ──────────────────────────────────────

test.describe("Welcome Screen", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
  });

  test("shows Restinder heading and tagline", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Restinder" })).toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.locator("text=Swipe right on dinner. Together."),
    ).toBeVisible();
  });

  test("shows name input pre-filled from localStorage", async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Your name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await expect(nameInput).toHaveValue("Test User");
  });

  test("shows partner link option", async ({ page }) => {
    await expect(page.locator("text=Link partner for remote play")).toBeVisible(
      { timeout: 8000 },
    );
  });

  test("shows Same Phone and Own Phones mode buttons", async ({ page }) => {
    await expect(page.locator("text=Same Phone")).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator("text=Own Phones")).toBeVisible();
  });

  test("Same Phone button is enabled when name is set", async ({ page }) => {
    const btn = page.locator("button", { hasText: "Same Phone" }).first();
    await expect(btn).toBeVisible({ timeout: 8000 });
    await expect(btn).toBeEnabled();
  });

  test("Own Phones button is disabled without partner", async ({ page }) => {
    const btn = page.locator("button", { hasText: "Own Phones" }).first();
    await expect(btn).toBeVisible({ timeout: 8000 });
    await expect(btn).toBeDisabled();
  });

  test("mode buttons disabled when name is empty", async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Your name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill("");
    const samePhoneBtn = page
      .locator("button", { hasText: "Same Phone" })
      .first();
    await expect(samePhoneBtn).toBeDisabled();
  });
});

// ── PARTNER LINKING SCREEN ──────────────────────────────

test.describe("Partner Linking Screen", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
    await page
      .locator("text=Link partner for remote play")
      .click({ timeout: 8000 });
    // Wait for partner screen to render
    await expect(
      page.locator("h2", { hasText: "Link Your Partner" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows partner linking UI", async ({ page }) => {
    await expect(
      page.locator("h2", { hasText: "Link Your Partner" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows partner code display", async ({ page }) => {
    await expect(page.locator("text=Your partner code")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows partner code input field", async ({ page }) => {
    await expect(page.locator('input[placeholder="ABC123"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("has Link and Back buttons", async ({ page }) => {
    // Use exact text match for the Link button on the partner code input row
    const linkBtn = page.locator("button", { hasText: /^Link$/ });
    await expect(linkBtn).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button", { hasText: "Back" })).toBeVisible();
  });

  test("Back button returns to welcome", async ({ page }) => {
    await page.locator("button", { hasText: "Back" }).click();
    await expect(page.locator("h1", { hasText: "Restinder" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("partner code input uppercases and limits to 6 chars", async ({
    page,
  }) => {
    const input = page.locator('input[placeholder="ABC123"]');
    await input.fill("abcdef123");
    const value = await input.inputValue();
    expect(value.length).toBeLessThanOrEqual(6);
    expect(value).toBe(value.toUpperCase());
  });

  test("shows error for short partner code", async ({ page }) => {
    await page.locator('input[placeholder="ABC123"]').fill("AB");
    await page.locator("button", { hasText: /^Link$/ }).click();
    await expect(page.locator("text=Enter a 6-character code")).toBeVisible({
      timeout: 3000,
    });
  });

  test("shows error for invalid partner code", async ({ page }) => {
    await page.locator('input[placeholder="ABC123"]').fill("ZZZZZZ");
    await page.locator("button", { hasText: /^Link$/ }).click();
    // The mock returns the user's own record, so the app says "That's your own code!"
    // or "Code not found" depending on the mock response
    await expect(
      page.locator("text=/Code not found|That's your own code|Network error/"),
    ).toBeVisible({ timeout: 10000 });
  });
});

// ── CUISINE / FILTER SCREEN ─────────────────────────────

test.describe("Cuisine & Filter Screen", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
    await page
      .locator("button", { hasText: "Same Phone" })
      .first()
      .click({ timeout: 8000 });
  });

  test("shows cuisine selection heading", async ({ page }) => {
    await expect(
      page.locator("h2", { hasText: "What are you craving?" }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows cuisine grid with emoji buttons", async ({ page }) => {
    await expect(page.locator("text=Italian")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Mexican")).toBeVisible();
    await expect(page.locator("text=Japanese")).toBeVisible();
  });

  test("shows category picker", async ({ page }) => {
    await expect(page.locator("text=Category")).toBeVisible({ timeout: 5000 });
  });

  test("shows occasion picker", async ({ page }) => {
    await expect(page.locator("text=What's the occasion?")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows dietary needs section", async ({ page }) => {
    await expect(page.locator("text=Dietary Needs")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows Open Now Only toggle", async ({ page }) => {
    await expect(page.locator("text=Open Now Only")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows Deal Breakers button", async ({ page }) => {
    await expect(page.locator("text=Deal Breakers")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows partner name input for local mode", async ({ page }) => {
    await expect(
      page.locator('input[placeholder="Partner\'s name (for pass & play)"]'),
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows Game Options section", async ({ page }) => {
    await expect(page.locator("text=Game Options")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=Speed Round")).toBeVisible();
    await expect(page.locator("text=Super Vetoes")).toBeVisible();
  });

  test("Start Swiping button disabled without partner name", async ({
    page,
  }) => {
    const startBtn = page.locator("button", { hasText: "Start Swiping" });
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await expect(startBtn).toBeDisabled();
  });

  test("Start Swiping button enabled after entering partner name", async ({
    page,
  }) => {
    await page
      .locator('input[placeholder="Partner\'s name (for pass & play)"]')
      .fill("Partner");
    const startBtn = page.locator("button", { hasText: "Start Swiping" });
    await expect(startBtn).toBeEnabled({ timeout: 3000 });
  });

  test("can toggle cuisine selection", async ({ page }) => {
    const italianBtn = page.locator("button", { hasText: "Italian" }).first();
    await italianBtn.click();
    await expect(italianBtn).toHaveClass(/border-brand-pink/);
    await italianBtn.click();
    await expect(italianBtn).not.toHaveClass(/border-brand-pink/);
  });

  test("Deal Breakers expands on click", async ({ page }) => {
    await page.locator("button", { hasText: "Deal Breakers" }).click();
    await expect(page.locator("text=Min Rating")).toBeVisible({
      timeout: 3000,
    });
    await expect(page.locator("text=Max Distance")).toBeVisible();
    await expect(page.locator("text=Price Range")).toBeVisible();
  });
});

// ── SWIPING FLOW ────────────────────────────────────────

test.describe("Swiping Flow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
    await page
      .locator("button", { hasText: "Same Phone" })
      .first()
      .click({ timeout: 8000 });
    await expect(
      page.locator("h2", { hasText: "What are you craving?" }),
    ).toBeVisible({ timeout: 5000 });
    await page
      .locator('input[placeholder="Partner\'s name (for pass & play)"]')
      .fill("Partner");
    await page.locator("button", { hasText: "Start Swiping" }).click();
    // Wait for loading → swiping
    await page.waitForTimeout(2000);
  });

  test("shows swiping UI with player turn", async ({ page }) => {
    await expect(page.locator("text=Test User's turn")).toBeVisible({
      timeout: 8000,
    });
  });

  test("shows progress counter (e.g. 1/N)", async ({ page }) => {
    await expect(page.locator("text=/\\d+\\/\\d+/")).toBeVisible({
      timeout: 8000,
    });
  });

  test("shows restaurant card with image", async ({ page }) => {
    const img = page.locator("img").first();
    await expect(img).toBeVisible({ timeout: 8000 });
    const alt = await img.getAttribute("alt");
    expect(alt).toBeTruthy();
  });
});

// ── SETTINGS PANEL ──────────────────────────────────────

test.describe("Settings Panel", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
  });

  test("opens settings panel on gear click", async ({ page }) => {
    const topBar = page.locator(".absolute.top-5.right-5");
    await topBar.locator("button").last().click({ timeout: 8000 });
    await expect(page.locator("h3", { hasText: "Your Settings" })).toBeVisible({
      timeout: 3000,
    });
  });

  test("settings shows user info and sign out", async ({ page }) => {
    const topBar = page.locator(".absolute.top-5.right-5");
    await topBar.locator("button").last().click({ timeout: 8000 });
    await expect(page.locator("text=Email:")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Name:")).toBeVisible();
    await expect(page.locator("text=Partner:")).toBeVisible();
    await expect(page.locator("button", { hasText: "Sign Out" })).toBeVisible();
  });
});

// ── ONBOARDING TUTORIAL ─────────────────────────────────

test.describe("Onboarding Tutorial", () => {
  async function gotoAppFirstTime(page) {
    // Same as gotoAppAuthenticated but without rs_onboarded
    const { mockSupabaseAuth } = await import("./helpers.js");
    await mockSupabaseAuth(page);
    await page.goto("/");
    await page.evaluate(
      ({ session }) => {
        const key = "sb-kfmysuqioesnbclvncpr-auth-token";
        localStorage.setItem(key, JSON.stringify(session));
        localStorage.setItem("rs_name", JSON.stringify("New User"));
        // Do NOT set rs_onboarded so tutorial shows
      },
      { session: FAKE_SESSION },
    );
    await page.reload();
    await page.waitForTimeout(1500);
  }

  test("shows onboarding for first-time users", async ({ page }) => {
    await gotoAppFirstTime(page);
    await expect(
      page.locator("h2", { hasText: "Welcome to Restinder!" }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("onboarding has Next and Skip buttons", async ({ page }) => {
    await gotoAppFirstTime(page);
    await expect(page.locator("button", { hasText: "Next" })).toBeVisible({
      timeout: 8000,
    });
    await expect(
      page.locator("button", { hasText: "Skip tutorial" }),
    ).toBeVisible();
  });

  test("can navigate through onboarding steps", async ({ page }) => {
    await gotoAppFirstTime(page);
    await expect(
      page.locator("h2", { hasText: "Welcome to Restinder!" }),
    ).toBeVisible({ timeout: 8000 });
    await page.locator("button", { hasText: "Next" }).click();
    await expect(
      page.locator("h2", { hasText: "Swipe Right to Like" }),
    ).toBeVisible({ timeout: 3000 });
    await page.locator("button", { hasText: "Next" }).click();
    await expect(
      page.locator("h2", { hasText: "Super Veto Power" }),
    ).toBeVisible({ timeout: 3000 });
    await page.locator("button", { hasText: "Next" }).click();
    await expect(
      page.locator("h2", { hasText: "Find Your Match" }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.locator("button", { hasText: "Let's Go!" }),
    ).toBeVisible();
  });

  test("skip tutorial dismisses onboarding", async ({ page }) => {
    await gotoAppFirstTime(page);
    await page
      .locator("button", { hasText: "Skip tutorial" })
      .click({ timeout: 8000 });
    await expect(
      page.locator("h2", { hasText: "Welcome to Restinder!" }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});

// ── INPUT SANITIZATION ──────────────────────────────────

test.describe("Input Sanitization", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAppAuthenticated(page);
  });

  test("name input strips HTML tags", async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Your name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill("<script>alert('xss')</script>");
    const value = await nameInput.inputValue();
    expect(value).not.toContain("<script>");
    expect(value).not.toContain("</script>");
  });

  test("name input enforces maxLength of 50", async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Your name"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await expect(nameInput).toHaveAttribute("maxLength", "50");
  });
});

// ── LOADING STATE ───────────────────────────────────────

test.describe("Loading State", () => {
  test("shows auth screen when no session", async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/token*`, (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid" }),
      });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "not_auth" }),
      });
    });
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator("h1", { hasText: "Restinder" })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator("text=Welcome back! Sign in to continue."),
    ).toBeVisible();
  });
});
