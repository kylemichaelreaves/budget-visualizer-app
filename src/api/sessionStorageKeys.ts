/**
 * localStorage keys for the session. Shared by `authStore` (which writes them)
 * and `httpClient` (which reads the token) so the two can't drift apart.
 */
export const SESSION_TOKEN_KEY = 'token'
export const SESSION_USER_KEY = 'user'
