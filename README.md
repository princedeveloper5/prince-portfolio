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
npm run server
```

For an existing database, the server creates the configured user if that email is not already present. The legacy public demo account is automatically removed if it still has its original password. Keep these environment values private; use your hosting provider's secret manager in production.

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

## Managing portfolio content

Sign in at `/admin/login`. The dashboard links to each manager:

- **Home page** edits the hero text and profile photo.
- **Projects** creates, edits, publishes, drafts, and deletes portfolio projects.
- **Skills** manages the public skills list.
- **About** edits your biography, contact details, CV URL, and social profile URLs. Its contact and social links appear on the public About and Contact pages and in the footer.
- **Messages** shows contact form submissions and their read status.
- **Settings** changes the admin password. Notification switches are local preferences only; email delivery and push notifications need separate configuration.

Content is stored in `portfolio.db`. The public pages load it from the API without browser caching and refresh when revisited or focused. Projects marked Published appear on the public Projects page. The dashboard visitor chart records one visit per browser session and groups visits by day.

## Production build

```bash
npm run build
npm run preview
```

The SQLite database is `portfolio.db`; uploaded images are stored in `server/uploads`.
