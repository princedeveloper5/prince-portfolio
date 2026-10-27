# Admin Login Credentials (Demo)

For testing purposes:
- Email: admin@mugishaprince.com
- Password: Admin123!

**Note:** In production, use proper backend authentication with secure password hashing, session management, and database storage. The current implementation uses client-side demo credentials for UI demonstration. Replace with your actual authentication system.

## Environment Variables (if using real backend)

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_database_url
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=portfolio_db

# Session
SESSION_SECRET=your_session_secret_key

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@mugishaprince.com

# JWT (if using token-based auth)
JWT_SECRET=your_jwt_secret
```
