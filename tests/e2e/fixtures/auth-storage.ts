/** Email used by login/register e2e flows (must satisfy `<input type="email">`). */
export const E2E_LOGIN_EMAIL = 'e2e@example.test'

/** Minimal user JSON for localStorage so BudgetVisualizer skips login redirect. */
export const E2E_AUTH_USER = JSON.stringify({
  id: 1,
  username: 'e2e',
  firstName: 'E2E',
  lastName: 'User',
  email: E2E_LOGIN_EMAIL,
  role: 'user',
})

export const E2E_AUTH_TOKEN = 'e2e-playwright-token'
