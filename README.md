# Mugisha Prince Portfolio

React + Vite portfolio with an Express/SQLite API and protected admin dashboard.

## Local development

Install dependencies, then run the frontend and API in two terminals from this folder:

```powershell
npm install
npm run server
```

In a second terminal:

```powershell
npm run dev
```

Open the local URL printed by Vite (normally <http://localhost:5173>). The API listens on port 5000, and Vite proxies `/api` and `/uploads` to it.

## Admin account

The server no longer creates or accepts a public demo login. Set a private administrator and signing secret in the server terminal before starting it:

```powershell
$env:ADMIN_EMAIL = 'you@example.com'
$env:ADMIN_PASSWORD = 'choose-a-private-password-of-12-or-more-characters'
$env:ADMIN_NAME = 'Portfolio Admin'
$env:JWT_SECRET = 'use-a-long-random-secret-and-keep-it-private'
$env:CORS_ORIGINS = 'https://your-portfolio.example.com'
npm run server
```

For an existing database, the server creates the configured user if that email is not already present. The legacy public demo account is automatically removed if it still has its original password. Keep these environment values private; use your hosting provider's secret manager in production.

For local development, if `JWT_SECRET` is omitted, the API creates and reuses an ignored `server/.dev-jwt-secret` file so restarting the server does not invalidate your login. Production startup requires `JWT_SECRET` to be supplied explicitly.

To reset the password for an existing admin, stop the API server and start it once with `ADMIN_EMAIL` set to that account, a new private `ADMIN_PASSWORD` (at least 12 characters), and `ADMIN_RESET_PASSWORD=true`. The server stores a fresh password hash; the login email stays the same.

## Password reset email

Password reset links are single-use and expire after 30 minutes. Configure SMTP on the API server to enable delivery:

```powershell
$env:SMTP_HOST = 'smtp.example.com'
$env:SMTP_PORT = '587'
$env:SMTP_SECURE = 'false'
$env:SMTP_USER = 'your-smtp-user'
$env:SMTP_PASS = 'your-smtp-password'
$env:SMTP_FROM = 'Portfolio Admin <you@example.com>'
$env:APP_URL = 'https://your-portfolio.example.com'
npm run server
```

`SMTP_FROM` defaults to `SMTP_USER`. Set `APP_URL` to the public site origin before sending reset links from a deployed site. Without SMTP values, the reset form reports that email delivery is not configured.

To email new contact form submissions, also set `$env:CONTACT_TO` to the inbox that should receive them. Messages are saved to the admin inbox even if SMTP is not configured or the notification email fails. Never commit SMTP credentials or JWT secrets.

## Managing portfolio content

Sign in at `/admin/login`. The dashboard links to each manager:

- **Home page** edits the hero text and profile photo, About preview and contact callout, and browser/search title and description.
- **Projects** creates, edits, publishes, drafts, and deletes portfolio projects.
- **Skills** manages the public skills list.
- **About** edits your biography, contact details, CV URL, and social profile URLs. Its contact and social links appear on the public About and Contact pages and in the footer.
- **Messages** shows contact form submissions and their read status.
- **Settings** changes the admin password. Notification switches are local preferences only; email delivery and push notifications need separate configuration.

Content is stored in `portfolio.db`. The public pages load it from the API without browser caching and refresh when revisited or focused. Only Published projects are returned to visitors; admin requests can also see drafts. Homepage stats and skill/project sections are based on database content. The dashboard visitor chart records one visit per browser session when the homepage is visited and groups visits by day.

## Production build

```bash
npm run build
npm run preview
```

Local development stores data in `portfolio.db` and uploaded images in `server/uploads`. The hosted setup below uses Turso and Supabase so data survives restarts on a free API host.

## Free hosted backend

Vercel serves the frontend and forwards `/api/*` and `/uploads/*` to the Express service on Render. Render's free web service has an ephemeral filesystem and sleeps after inactivity, so the API stores its database in Turso and its uploaded images in Supabase Storage. Both services have free plans; free tiers have usage limits, and Render may take up to a minute to wake after it has been idle. See [Render's free service limits](https://render.com/docs/free) and [Supabase's free plan](https://supabase.com/pricing).

1. Create a Turso database and an authentication token. Keep `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` handy.
2. Create a Supabase project. Keep its root project URL (for example, `https://your-project.supabase.co`, without `/rest/v1`) and server-only Secret API key (`sb_secret_...`) handy. Never put this key in frontend code or commit it. The API creates a public `portfolio-uploads` bucket automatically for portfolio images.
3. In Render, create a Blueprint from this GitHub repository and apply `render.yaml`. Enter the Turso and Supabase values when Render prompts for the service's environment, then set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters). Render generates `JWT_SECRET`.
4. Confirm the Render URL is `https://prince-portfolio-api.onrender.com`. If it differs, update the API and uploads destinations in `vercel.json`.
5. Deploy these changes through GitHub so Vercel picks up `vercel.json`.
6. After Render has started and `/api/health` responds, copy `.env.example` to `.env`, fill in the same Turso and Supabase values, then run `npm run db:migrate:turso` once to copy the current `portfolio.db` and files in `server/uploads` to the hosted services. Run it from the project root; do not commit `.env`.
7. Check `https://prince-portfolio-panta6.vercel.app/api/health`, then sign in at `/admin/login`.

The migration preserves the existing SQLite content and uploads. For an existing administrator, use that account's current email and password to sign in after migration. Free hosted services can pause or sleep after inactivity, and their quotas and terms can change.
