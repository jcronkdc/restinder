/**
 * Shared helpers for E2E tests.
 *
 * We intercept Supabase auth endpoints at the network level so the app
 * thinks it has a valid session, without needing real Supabase credentials.
 */

const SUPABASE_URL = "https://kfmysuqioesnbclvncpr.supabase.co";

const FAKE_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "testuser@restinder.test",
  user_metadata: { name: "Test User" },
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
};

const FAKE_SESSION = {
  access_token: "fake-access-token-for-e2e",
  refresh_token: "fake-refresh-token-for-e2e",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: FAKE_USER,
};

/**
 * Mock Supabase auth and DB endpoints so the app renders the main App
 * component instead of the auth screen.
 */
export async function mockSupabaseAuth(page) {
  // Mock getSession → returns a valid session
  await page.route(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_SESSION),
    });
  });

  // Mock GET user endpoint
  await page.route(`${SUPABASE_URL}/auth/v1/user`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(FAKE_USER),
    });
  });

  // Mock rs_users select (user init)
  await page.route(`${SUPABASE_URL}/rest/v1/rs_users*`, (route) => {
    const method = route.request().method();
    if (method === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "user-db-id-1",
            auth_id: FAKE_USER.id,
            device_id: "test-device",
            name: "Test User",
            partner_code: "ABC123",
            partner_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
    } else if (method === "PATCH" || method === "POST") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    } else {
      route.continue();
    }
  });

  // Mock rs_sessions, rs_swipes — return empty arrays
  await page.route(`${SUPABASE_URL}/rest/v1/rs_sessions*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(`${SUPABASE_URL}/rest/v1/rs_swipes*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Mock realtime websocket (just let it fail silently)
  await page.route(`${SUPABASE_URL}/realtime/**`, (route) => {
    route.abort();
  });
}

/**
 * Navigate to the app with a mocked authenticated session.
 * The page will show the main App (welcome screen) instead of AuthScreen.
 */
export async function gotoAppAuthenticated(page) {
  await mockSupabaseAuth(page);

  // Set the Supabase auth token in localStorage before navigation
  // so getSession() finds it immediately
  await page.goto("/");
  await page.evaluate(
    ({ session, supabaseUrl }) => {
      // Supabase stores auth state under sb-<project-ref>-auth-token
      const ref = new URL(supabaseUrl).hostname.split(".")[0];
      const key = `sb-${ref}-auth-token`;
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem("rs_name", JSON.stringify("Test User"));
      localStorage.setItem("rs_onboarded", JSON.stringify(true));
    },
    { session: FAKE_SESSION, supabaseUrl: SUPABASE_URL }
  );

  await page.reload();
  // Wait for the app to render past loading state
  await page.waitForTimeout(1500);
}

export { SUPABASE_URL, FAKE_USER, FAKE_SESSION };
