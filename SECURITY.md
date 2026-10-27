# Security Notes

- Never request or transmit Comcast/Xfinity passwords, OTPs, recovery codes, payment credentials, cookies, or access tokens.
- Keep Telegram token, webhook secret, database URL, and identity-provider secrets on the server only.
- Telegram approval requires a numeric user ID in `TELEGRAM_ADMIN_IDS`; Telegram usernames are not authorization.
- The webhook checks Telegram's `X-Telegram-Bot-Api-Secret-Token` header with a timing-safe comparison.
- Request fields are validated with Zod and rate-limited.
- Support requests contain personal contact information. Restrict database access, establish a retention policy, and disclose how messages are handled before production.
- This starter does not implement a customer login or a browser-based admin console. Do not add these with frontend-only role checks.
- Before production, add a real authentication provider, secure session cookies, CSRF protection for cookie-authenticated state-changing requests, email verification, password reset flows owned by the identity provider, and role-based server-side authorization.
- Report security issues privately to the project owner.
