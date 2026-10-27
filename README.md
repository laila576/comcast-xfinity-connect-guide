# Connect Guide — Independent Comcast & Xfinity Information Portal

A responsive full-stack starter with an independent public-information frontend, Express API, PostgreSQL/Prisma support-request storage, and optional Telegram notifications for authorized administrators.

> **Important identity and security notice:** This is an independently operated demonstration project, not an official Comcast Corporation or Xfinity website. It is intentionally branded as **Connect Guide** and links to official sites rather than impersonating their login pages. It does not collect Comcast passwords, verification codes, payment details, session cookies, or other account credentials. The Telegram bot is not assumed to be connected.

## Included

- Responsive React/Vite frontend with topic search, service information, official-resource links, request form and request tracking.
- Express backend with input validation, rate limits, Helmet headers, health/configuration status and error handling.
- PostgreSQL persistence via Prisma for support requests, request events and admin audit records.
- Telegram webhook with secret-header validation, administrator numeric-ID allowlist, approval/rejection commands, audit history, and duplicate-state protection.
- Account API routes honestly report that authorized account integration is not connected.
- Render deployment blueprint, Dockerfile, `.env.example`, tests and deployment checklist.

## Stack

- Node.js 22+, TypeScript, React, Vite, Express
- PostgreSQL + Prisma
- Telegram Bot API (optional)
- Render or another HTTPS-capable Node host

## Local setup

1. Install Node.js 22+ and PostgreSQL.
2. Extract this ZIP and open the project directory.
3. Copy `.env.example` to `.env`.
4. Set `DATABASE_URL` to your PostgreSQL connection string. Generate a strong random `SESSION_SECRET` (32+ characters). No real secret should be committed to Git.
5. Install and generate the database client:

   ```bash
   npm install
   npm run prisma:generate
   npx prisma migrate dev --name init
   ```

   The initial PostgreSQL migration is included. For production, use `npm run prisma:migrate`.

6. Start the app with `npm run dev`. The Vite frontend is served on port 5173 and the Express API on port 3000; the Vite config proxies `/api` requests to the backend. For the integrated production app, run `npm run build` then `npm start`.
7. Visit `http://localhost:3000` after building and starting the production server.

## Telegram setup (optional)

1. Manage a bot with Telegram's official BotFather named Xfinity and username  @Xfiniity_Bot and keep the token private.
2. Add `TELEGRAM_BOT_TOKEN=e9e449560ab06b347cd293de79f11ebc581e261d0731e95a8fa14a43ebe8080e` to the server environment.
4. Set `TELEGRAM_WEBHOOK_SECRET= e9e449560ab06b347cd293de79f11ebc581e261d0731e95a8fa14a43ebe8080e` to a random secret token (Telegram accepts 1–256 characters from the documented character set).
5. Set `TELEGRAM_ADMIN_IDS` to a comma-separated list of trusted Telegram **numeric user IDs**. Do not use usernames as authorization.
6. Set `TELEGRAM_NOTIFICATION_CHAT_ID` to a private group/chat where the bot is present and permitted to post. This variable is used for outbound notifications.
7. Deploy to a public HTTPS host, then register the webhook with Telegram's `setWebhook` method using:
   - URL: `https://YOUR_DOMAIN/api/telegram/webhook`
   - `secret_token`: the same value as `TELEGRAM_WEBHOOK_SECRET`
8. Verify `/api/health` reports `telegramConfigured: true`, then send a harmless test support request and confirm delivery.

Authorized administrators can reply in a bot chat using:
- `/approve CG-REFERENCE optional note`
- `/reject CG-REFERENCE optional note`

The command is only accepted if Telegram's numeric user ID is on the server-side allowlist. Commands only update pending **Connect Guide** support requests; they do not approve access to Comcast accounts or create official Comcast tickets. Telegram API connectivity is not verified until a real token, chat ID, webhook and live test are supplied.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | HTTP port; defaults to 3000 |
| `APP_BASE_URL` | Production | Public app origin for CORS and webhook setup |
| `DATABASE_URL` | For persistent requests | PostgreSQL connection string |
| `SESSION_SECRET` | Reserved for future auth | Strong random secret; this project does not implement customer login |
| `TELEGRAM_BOT_TOKEN` | Optional | Token from Telegram BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Optional | Secret for Telegram webhook validation |
| `TELEGRAM_ADMIN_IDS` | Optional | Comma-separated trusted numeric Telegram IDs |
| `TELEGRAM_NOTIFICATION_CHAT_ID` | Telegram notifications | Private chat/group ID for notifications |
| `AUTH_PROVIDER_CLIENT_ID` | Optional | Reserved for a legitimate external identity provider |
| `AUTH_PROVIDER_CLIENT_SECRET` | Optional | Reserved for a legitimate external identity provider |

## Current integration boundaries

- **Comcast/Xfinity customer accounts:** No public authorized customer API credentials or account authorization were supplied. Account API routes return a clear `503` and direct users to `https://www.xfinity.com/`.
- **Live prices, outages, eligibility, payments, Wi-Fi control, appointments:** Not represented as live. Use official provider resources.
- **Corporate facts:** Official resources are linked; content is deliberately conservative rather than inventing details or unverified plan pricing.
- **Telegram:** Backend integration is implemented but is dormant until valid server environment variables are supplied and tested.
- **Authentication/admin web console:** No browser-based administrator sign-in is claimed as implemented. Telegram approval is gated by a server-side numeric-ID allowlist. Add a real identity provider and session/CSRF protections before adding web-admin routes.

## Tests and build

```bash
npm test
npm run prisma:generate
npm run build
```

A real database and Telegram connection test require your environment credentials. Tests in this ZIP validate request schema behavior; they do not claim an external integration is live.

## Deploy to Render

1. Push the extracted project to a private or public Git repository (never include `.env`).
2. In Render, create a PostgreSQL database and a web service from the repo.
3. Set `DATABASE_URL`, `APP_BASE_URL`, and any Telegram variables in the Render dashboard.
4. Review `render.yaml`; ensure production migrations exist before relying on `prisma migrate deploy`.
5. Deploy and verify `https://YOUR_DOMAIN/api/health`.
6. Configure Telegram webhook after deployment, then run a test request.
7. Check mobile layout, keyboard navigation, validation, API logs, and database persistence before publishing.

## Deploy from an iPhone

1. Download and unzip `comcast-xfinity-fullstack.zip` using the Files app.
2. Upload the extracted project to a Git repository using GitHub's mobile website/app. Do not upload `.env`.
3. Open Render in Safari, create a PostgreSQL database and a web service from that repository.
4. Add environment variables in Render's dashboard; use a password manager to generate secrets.
5. Deploy, then open the service URL and `/api/health` in Safari.
6. For database migrations and Telegram webhook registration, use the host's shell/console if available or a trusted computer. Do not paste bot tokens into public chats or repository files.

## Troubleshooting

- **Support request returns 503:** Set `DATABASE_URL`, provision PostgreSQL, generate Prisma client and apply schema/migrations.
- **Telegram is not sending:** Check token, `TELEGRAM_NOTIFICATION_CHAT_ID`, bot permissions and server logs. `TELEGRAM_ADMIN_IDS` is an authorization list and not automatically a group chat ID.
- **Webhook returns 401:** Configure the same secret in `TELEGRAM_WEBHOOK_SECRET` and Telegram's `secret_token`.
- **No tracking result:** Ensure the reference is typed exactly and the database still contains the request.
- **Build fails:** Use Node 22+, run `npm install`, `npm run prisma:generate`, then `npm run build`.
- **Account page unavailable:** Expected until an authorized provider integration is supplied; use official Xfinity for private account tasks.

## Production checklist

- [ ] Replace development origins with the final HTTPS URL.
- [ ] Provision managed PostgreSQL and apply migrations.
- [ ] Configure and rotate secrets using host environment settings.
- [ ] Set an authorized Telegram admin allowlist and private notification chat.
- [ ] Register and test Telegram webhook.
- [ ] Confirm support-request retention and privacy notice comply with applicable law.
- [ ] Add monitoring, backups, alerting, and an incident-response process.
- [ ] Obtain permission and an authorized API contract before implementing any Comcast customer account integration.
- [ ] Do not describe this independent site as official Comcast/Xfinity or claim deployment/integration before verifying it.

## License

Starter project source is provided for modification. Comcast, Xfinity, and related marks belong to their respective owners. Do not imply endorsement or affiliation.
