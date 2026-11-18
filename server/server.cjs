// Load .env (project root) before any env vars are read. Node >=20.12 ships
// process.loadEnvFile(), so no dotenv dependency is needed. Fails soft: a
// missing file simply means SMTP stays unconfigured.
try { process.loadEnvFile(require('path').join(__dirname, '..', '.env')); } catch { /* no .env yet */ }

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dns = require('node:dns').promises;
const { domainToASCII } = require('node:url');
const nodemailer = require('nodemailer');
const db = require('./database.cjs');
const cloudStorage = require('./cloud-storage.cjs');

if (process.env.NODE_ENV === 'production' && (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN || !cloudStorage.enabled)) {
  throw new Error('Production requires TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, SUPABASE_URL and SUPABASE_SECRET_KEY.');
}

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;
let JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production.');
}
if (!JWT_SECRET) {
  const secretPath = path.join(__dirname, '.dev-jwt-secret');
  try {
    JWT_SECRET = fs.readFileSync(secretPath, 'utf8').trim();
  } catch {
    const generated = crypto.randomBytes(48).toString('hex');
    try { fs.writeFileSync(secretPath, generated, { encoding: 'utf8', flag: 'wx', mode: 0o600 }); } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    JWT_SECRET = fs.readFileSync(secretPath, 'utf8').trim();
  }
}

const mailer = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// ---- Paths (always relative to THIS file, never to process.cwd()) ----
const DB_PATH = process.env.TURSO_DATABASE_URL ? 'Turso/libSQL' : path.resolve(process.env.DATABASE_PATH || path.join(__dirname, '..', 'portfolio.db'));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'));
if (!process.env.TURSO_DATABASE_URL) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (!cloudStorage.enabled) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const allowedOrigins = new Set((process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
  .split(',').map((origin) => origin.trim()).filter(Boolean));
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) return callback(null, true);
  return callback(null, false);
} }));
app.use(express.json({ limit: '50kb' }));
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  if (process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
if (!cloudStorage.enabled) app.use('/uploads', express.static(UPLOAD_DIR));

const requestBuckets = new Map();
function limitRequests({ windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    const bucket = requestBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of requestBuckets) if (bucket.resetAt <= now) requestBuckets.delete(key);
}, 60_000).unref();

// ---- File uploads (project images, profile photo) ----
const storage = cloudStorage.enabled ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeExt = ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' })[file.mimetype] || '.img';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Use a PNG, JPEG, GIF, or WebP image. SVG files are not accepted.'));
    }
    cb(null, true);
  },
});
const handleUploads = (req, res, next) => upload.any()(req, res, async (error) => {
  if (error) return next(error);
  try {
    for (const file of req.files || []) await cloudStorage.save(file);
    next();
  } catch (uploadError) { next(uploadError); }
});
const uploadCv = multer({
  storage: cloudStorage.enabled ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `cv-${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Upload a PDF file for your CV.')),
});

// ---------- helpers ----------
const run = (sql, params = []) =>
  new Promise((resolve, reject) => db.run(sql, params, function (err) {
    err ? reject(err) : resolve(this);
  }));
const get = (sql, params = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const all = (sql, params = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

const asyncRoute = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
  console.error('[api]', req.method, req.originalUrl, err.message);
  const status = Number(err.status || err.statusCode) || 500;
  if (!res.headersSent) res.status(status).json({ error: err.publicMessage || (status >= 500 ? 'Server error. Please try again later.' : err.message || 'Invalid request.') });
});

const parseTechnologies = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through to comma splitting */ }
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
};

const uploadPath = (value) => {
  if (!value) return '';
  if (cloudStorage.enabled && !/^(https?:)?\/\//.test(value)) {
    if (value.startsWith('/uploads/')) return cloudStorage.publicUrl(path.basename(value));
    if (!value.startsWith('/')) return cloudStorage.publicUrl(value);
  }
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
  return `/uploads/${value}`;
};

const projectToJson = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  technologies: parseTechnologies(row.technologies),
  problem: row.problem || '',
  features: row.features || '',
  liveDemoUrl: row.live_demo_url || '',
  githubUrl: row.github_url || '',
  category: row.category || 'Web Apps',
  status: row.status || 'Draft',
  image: uploadPath(row.image_path),
  createdAt: row.created_at,
});

const skillToJson = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category || 'Tools',
  // Proficiency 0-100. Exposed so the public Skills page can render level
  // bars and the admin slider can round-trip the stored value.
  level: Number.isFinite(Number(row.level)) ? Math.max(0, Math.min(100, Number(row.level))) : 0,
  isPublic: Boolean(row.is_public),
});

const homeToJson = (row) =>
  row
    ? {
        id: row.id,
        greeting: row.greeting || '',
        name: row.name || '',
        title: row.title || '',
        description: row.description || '',
        profileImage: uploadPath(row.profile_image),
        aboutPreviewTitle: row.about_preview_title || '',
        aboutPreviewText: row.about_preview_text || '',
        contactCtaTitle: row.contact_cta_title || '',
        contactCtaText: row.contact_cta_text || '',
        metaTitle: row.meta_title || '',
        metaDescription: row.meta_description || '',
      }
    : null;

const aboutToJson = (row) =>
  row
    ? {
        id: row.id,
        name: row.name || '',
        title: row.title || '',
        experience: row.experience || '',
        interests: row.interests || '',
        careerGoals: row.career_goals || '',
        description: row.description || '',
        email: row.email || '',
        phone: row.phone || '',
        location: row.location || '',
        portraitImage: uploadPath(row.portrait_image),
        cvUrl: row.cv_url || '',
        githubUrl: row.github_url || '',
        linkedinUrl: row.linkedin_url || '',
        twitterUrl: row.twitter_url || '',
        instagramUrl: row.instagram_url || '',
        facebookUrl: row.facebook_url || '',
      }
    : null;

const messageToJson = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  subject: row.subject || 'Contact form message',
  message: row.message,
  read: row.read === 1 || row.read === true,
  createdAt: row.created_at,
});

const userToJson = (row) => ({
  id: row.id,
  name: row.name || '',
  email: row.email,
  role: row.role || 'admin',
  // Real activity timestamp instead of a hardcoded "Active" badge.
  lastLogin: row.last_login || null,
});

const findUploadedFile = (req) => {
  if (!req.files || !req.files.length) return null;
  return req.files[0];
};

const removeUploadedFile = (fileName) => {
  if (!fileName || /^(https?:)?\/\//.test(fileName) || fileName.startsWith('/')) return;
  if (cloudStorage.enabled) return cloudStorage.remove(fileName);
  const target = path.join(UPLOAD_DIR, path.basename(fileName));
  fs.unlink(target, () => {});
};

function hasValidImageSignature(file) {
  if (!file) return true;
  const bytes = file.buffer || fs.readFileSync(file.path);
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const gif = bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'));
  const webp = bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return png || jpeg || gif || webp;
}

function hasValidPdfSignature(file) {
  if (!file) return false;
  const bytes = file.buffer || fs.readFileSync(file.path);
  return bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-';
}

// ---------- auth ----------
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, email, name, role, session_version FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(401).json({ error: 'This account is no longer active. Please sign in again.' });
    if ((decoded.sessionVersion || 0) !== user.session_version) return res.status(401).json({ error: 'Your security settings changed. Please sign in again.' });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Session expired, please log in again' });
    }
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}

// ---------- schema + seed ----------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'admin',
    session_version INTEGER NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    user_id INTEGER PRIMARY KEY,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS two_factor_challenges (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    technologies TEXT,
    image_path TEXT,
    live_demo_url TEXT,
    github_url TEXT,
    category TEXT,
    problem TEXT DEFAULT '',
    features TEXT DEFAULT '',
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    level INTEGER,
    is_public INTEGER NOT NULL DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS home_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    greeting TEXT,
    name TEXT,
    title TEXT,
    description TEXT,
    profile_image TEXT,
    about_preview_title TEXT DEFAULT '',
    about_preview_text TEXT DEFAULT '',
    contact_cta_title TEXT DEFAULT '',
    contact_cta_text TEXT DEFAULT '',
    meta_title TEXT DEFAULT '',
    meta_description TEXT DEFAULT ''
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS about_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    title TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    cv_url TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    twitter_url TEXT DEFAULT '',
    instagram_url TEXT DEFAULT '',
    facebook_url TEXT DEFAULT '',
    experience TEXT DEFAULT '',
    interests TEXT DEFAULT '',
    career_goals TEXT DEFAULT '',
    portrait_image TEXT DEFAULT ''
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS visit_days (
    day TEXT PRIMARY KEY,
    visits INTEGER NOT NULL DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS counters (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
  )`);
});

const seedIfEmpty = async (table, sql, rows) => {
  const row = await get(`SELECT COUNT(*) AS n FROM ${table}`);
  if (row && row.n === 0) {
    for (const params of rows) await run(sql, params);
    console.log(`[seed] ${table}: ${rows.length} rows`);
  }
};

const seedData = async () => {
  // Track when each account last signed in (drives the real "last active"
  // column in the admin Users table).
  const userColumns = await all('PRAGMA table_info(users)');
  if (!userColumns.some((column) => column.name === 'last_login')) {
    await run('ALTER TABLE users ADD COLUMN last_login TEXT');
  }
  if (!userColumns.some((column) => column.name === 'mfa_enabled')) {
    await run('ALTER TABLE users ADD COLUMN mfa_enabled INTEGER NOT NULL DEFAULT 0');
  }
  if (!userColumns.some((column) => column.name === 'session_version')) {
    await run('ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0');
  }

  const projectColumns = await all('PRAGMA table_info(projects)');
  const existingProjectColumns = new Set(projectColumns.map((column) => column.name));
  for (const [column, definition] of [['problem', "TEXT DEFAULT ''"], ['features', "TEXT DEFAULT ''"]]) {
    if (!existingProjectColumns.has(column)) await run(`ALTER TABLE projects ADD COLUMN ${column} ${definition}`);
  }

  const skillColumns = await all('PRAGMA table_info(skills)');
  if (!skillColumns.some((column) => column.name === 'is_public')) {
    await run('ALTER TABLE skills ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1');
  }
  await run('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)');
  const skillVisibilityMigration = await get('SELECT name FROM app_migrations WHERE name = ?', ['skills_publication_v1']);
  if (!skillVisibilityMigration) {
    await run('UPDATE skills SET is_public = 1 WHERE is_public = 0');
    await run('INSERT INTO app_migrations (name) VALUES (?)', ['skills_publication_v1']);
  }

  const homeColumns = await all('PRAGMA table_info(home_content)');
  const existingHomeColumns = new Set(homeColumns.map((column) => column.name));
  for (const [column, definition] of [
    ['about_preview_title', "TEXT DEFAULT ''"],
    ['about_preview_text', "TEXT DEFAULT ''"],
    ['contact_cta_title', "TEXT DEFAULT ''"],
    ['contact_cta_text', "TEXT DEFAULT ''"],
    ['meta_title', "TEXT DEFAULT ''"],
    ['meta_description', "TEXT DEFAULT ''"],
  ]) {
    if (!existingHomeColumns.has(column)) await run(`ALTER TABLE home_content ADD COLUMN ${column} ${definition}`);
  }

  const aboutColumns = await all('PRAGMA table_info(about_content)');
  const existingAboutColumns = new Set(aboutColumns.map((column) => column.name));
  for (const [column, definition] of [
    ['cv_url', "TEXT DEFAULT ''"],
    ['github_url', "TEXT DEFAULT ''"],
    ['linkedin_url', "TEXT DEFAULT ''"],
    ['twitter_url', "TEXT DEFAULT ''"],
    ['instagram_url', "TEXT DEFAULT ''"],
    ['facebook_url', "TEXT DEFAULT ''"],
    ['experience', "TEXT DEFAULT ''"],
    ['interests', "TEXT DEFAULT ''"],
    ['career_goals', "TEXT DEFAULT ''"],
    ['portrait_image', "TEXT DEFAULT ''"],
  ]) {
    if (!existingAboutColumns.has(column)) {
      await run(`ALTER TABLE about_content ADD COLUMN ${column} ${definition}`);
    }
  }

  // Remove only the legacy, publicly documented demo account if its password
  // is still unchanged. Never create a known default administrator.
  const legacyAdmin = await get('SELECT id, password FROM users WHERE email = ?', ['admin@mugishaprince.com']);
  if (legacyAdmin && await bcrypt.compare('Admin123!', legacyAdmin.password)) {
    await run('DELETE FROM users WHERE id = ?', [legacyAdmin.id]);
    console.warn('[auth] removed the insecure legacy demo admin; configure ADMIN_EMAIL and ADMIN_PASSWORD');
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
    if (!EMAIL_RE.test(adminEmail)) throw new Error('ADMIN_EMAIL must be a valid email address');
    if (process.env.ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    const existingAdmin = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      await run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
        adminEmail,
        bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
        process.env.ADMIN_NAME || 'Portfolio Admin',
        'admin',
      ]);
      console.log('[auth] configured administrator created from environment');
    } else if (process.env.ADMIN_RESET_PASSWORD === 'true') {
      await run('UPDATE users SET password = ?, name = ?, role = ? WHERE id = ?', [
        bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
        process.env.ADMIN_NAME || 'Portfolio Admin',
        'admin',
        existingAdmin.id,
      ]);
      console.log('[auth] administrator password reset from environment');
    }
  }

  await seedIfEmpty(
    'skills',
    'INSERT INTO skills (name, category, level, is_public) VALUES (?, ?, ?, 1)',
    [
      ['React', 'Frontend', 90],
      ['JavaScript', 'Frontend', 95],
      ['HTML', 'Frontend', 90],
      ['CSS', 'Frontend', 88],
      ['Node.js', 'Backend', 85],
      ['Express.js', 'Backend', 80],
      ['MySQL', 'Database', 80],
      ['MongoDB', 'Database', 70],
      ['Git', 'Tools', 82],
      ['GitHub', 'Tools', 85],
      ['VS Code', 'Tools', 92],
      ['Figma', 'Tools', 65],
    ],
  );

  await seedIfEmpty(
    'home_content',
    'INSERT INTO home_content (greeting, name, title, description, profile_image, about_preview_title, about_preview_text, contact_cta_title, contact_cta_text, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [[
      "Hello, I'm",
      'Mugisha Prince',
      'Software Developer',
      'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
      '/mugisha-prince.png',
      'Driven by Curiosity. Built Through Code.',
      'I enjoy turning ideas into useful, user-friendly software and continue to grow by learning and building real projects.',
      "Have an idea? Let's build something useful.",
      "I'm open to discussing projects, creative ideas, and opportunities to collaborate.",
      'Mugisha Prince | Software Developer',
      'Mugisha Prince is a software developer building modern web applications and useful digital products.',
    ]],
  );

  await seedIfEmpty(
    'about_content',
    'INSERT INTO about_content (name, title, description, email, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
    [[
      'Mugisha Prince',
      'Software Developer',
      "I'm Mugisha Prince, a passionate software developer from Rwanda. I enjoy building web applications that solve real problems and make life easier.\n\nI'm currently learning and improving my skills in modern web technologies. I love turning ideas into real products and I'm always eager to learn something new.",
      'mugishaprince@gmail.com',
      '+250 788 123 456',
      'Kigali, Rwanda',
    ]],
  );

  console.log(`[db] ready at ${DB_PATH}`);
};

const startupReady = seedData();

// ---------- auth routes ----------
const hashEmailCode = (userId, purpose, code) => crypto
  .createHmac('sha256', JWT_SECRET)
  .update(`${userId}:${purpose}:${code}`)
  .digest('hex');

async function sendEmailCode(user, purpose) {
  if (!mailer) {
    const error = new Error('Email verification is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS, then restart the server.');
    error.status = 503;
    throw error;
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const id = crypto.randomBytes(24).toString('hex');
  await run('DELETE FROM two_factor_challenges WHERE user_id = ? AND purpose = ?', [user.id, purpose]);
  await run('INSERT INTO two_factor_challenges (id, user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, ?)', [
    id, user.id, purpose, hashEmailCode(user.id, purpose, code), Date.now() + 10 * 60 * 1000,
  ]);
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: purpose === 'login' ? 'Your portfolio admin sign-in code' : 'Verify two-factor authentication',
      text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    });
  } catch (error) {
    await run('DELETE FROM two_factor_challenges WHERE id = ?', [id]);
    error.status = 502;
    error.publicMessage = 'The verification email could not be sent. Check your email settings and try again.';
    throw error;
  }
  return id;
}

async function verifyEmailCode(id, userId, purpose, value) {
  const challenge = await get('SELECT * FROM two_factor_challenges WHERE id = ? AND user_id = ? AND purpose = ?', [id, userId, purpose]);
  if (!challenge || challenge.expires_at <= Date.now()) {
    if (challenge) await run('DELETE FROM two_factor_challenges WHERE id = ?', [id]);
    return { valid: false, error: 'That code has expired. Request a new one.' };
  }
  if (challenge.attempts >= 5) {
    await run('DELETE FROM two_factor_challenges WHERE id = ?', [id]);
    return { valid: false, error: 'Too many incorrect codes. Request a new one.' };
  }
  const code = String(value || '').trim();
  const expected = Buffer.from(challenge.code_hash, 'hex');
  const supplied = Buffer.from(hashEmailCode(userId, purpose, code), 'hex');
  if (!/^\d{6}$/.test(code) || expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    const attempts = challenge.attempts + 1;
    if (attempts >= 5) await run('DELETE FROM two_factor_challenges WHERE id = ?', [id]);
    else await run('UPDATE two_factor_challenges SET attempts = ? WHERE id = ?', [attempts, id]);
    return { valid: false, error: attempts >= 5 ? 'Too many incorrect codes. Request a new one.' : `That code is incorrect. ${5 - attempts} attempts remaining.` };
  }
  await run('DELETE FROM two_factor_challenges WHERE id = ?', [id]);
  return { valid: true };
}

async function createAuthSession(user, recordLogin = true) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, sessionVersion: user.session_version || 0 },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
  if (recordLogin) {
    await run('UPDATE users SET last_login = ? WHERE id = ?', [
      new Date().toISOString().slice(0, 19).replace('T', ' '), user.id,
    ]);
  }
  const fresh = await get('SELECT id, name, email, role, last_login FROM users WHERE id = ?', [user.id]);
  return { token, user: userToJson(fresh) };
}

app.post('/api/login', limitRequests({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Try again in 15 minutes.' }), asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await get('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (user.mfa_enabled) {
    const challengeId = await sendEmailCode(user, 'login');
    const [, domain = ''] = user.email.split('@');
    const mailbox = user.email.split('@')[0];
    const maskedEmail = `${mailbox.slice(0, 1)}${'*'.repeat(Math.max(2, mailbox.length - 1))}@${domain}`;
    return res.json({ requiresTwoFactor: true, challengeId, maskedEmail });
  }
  res.json(await createAuthSession(user));
}));

app.post('/api/login/verify', limitRequests({ windowMs: 15 * 60 * 1000, max: 12, message: 'Too many verification attempts. Try again later.' }), asyncRoute(async (req, res) => {
  const { challengeId, code } = req.body || {};
  const challenge = await get("SELECT user_id FROM two_factor_challenges WHERE id = ? AND purpose = 'login'", [String(challengeId || '')]);
  if (!challenge) return res.status(400).json({ error: 'That sign-in request is invalid or expired. Start again.' });
  const verification = await verifyEmailCode(challengeId, challenge.user_id, 'login', code);
  if (!verification.valid) return res.status(400).json({ error: verification.error });
  const user = await get('SELECT id, email, name, role, session_version FROM users WHERE id = ?', [challenge.user_id]);
  if (!user) return res.status(401).json({ error: 'This account is no longer available.' });
  res.json(await createAuthSession(user));
}));

app.get('/api/security/2fa', requireAuth, asyncRoute(async (req, res) => {
  const user = await get('SELECT email, mfa_enabled FROM users WHERE id = ?', [req.user.id]);
  res.json({ enabled: Boolean(user?.mfa_enabled), emailConfigured: Boolean(mailer), email: user?.email || '' });
}));

app.post('/api/security/2fa/setup', requireAuth, limitRequests({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many verification codes requested. Try again later.' }), asyncRoute(async (req, res) => {
  const user = await get('SELECT id, email FROM users WHERE id = ?', [req.user.id]);
  const challengeId = await sendEmailCode(user, 'enable');
  res.json({ challengeId, message: `A verification code was sent to ${user.email}. It expires in 10 minutes.` });
}));

app.post('/api/security/2fa/enable', requireAuth, asyncRoute(async (req, res) => {
  const { challengeId, code } = req.body || {};
  const verification = await verifyEmailCode(String(challengeId || ''), req.user.id, 'enable', code);
  if (!verification.valid) return res.status(400).json({ error: verification.error });
  await run('UPDATE users SET mfa_enabled = 1, session_version = session_version + 1 WHERE id = ?', [req.user.id]);
  const user = await get('SELECT id, email, name, role, session_version FROM users WHERE id = ?', [req.user.id]);
  res.json({ ...(await createAuthSession(user, false)), enabled: true });
}));

app.post('/api/security/2fa/disable', requireAuth, asyncRoute(async (req, res) => {
  const password = String(req.body?.password || '');
  const user = await get('SELECT password FROM users WHERE id = ?', [req.user.id]);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Current password is incorrect.' });
  await run('UPDATE users SET mfa_enabled = 0, session_version = session_version + 1 WHERE id = ?', [req.user.id]);
  await run('DELETE FROM two_factor_challenges WHERE user_id = ?', [req.user.id]);
  const freshUser = await get('SELECT id, email, name, role, session_version FROM users WHERE id = ?', [req.user.id]);
  res.json({ ...(await createAuthSession(freshUser, false)), enabled: false });
}));

app.post('/api/password-reset/request', limitRequests({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many reset requests. Try again later.' }), asyncRoute(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (!mailer) return res.status(503).json({ error: 'Password reset email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS on the server.' });

  const user = await get('SELECT id, email FROM users WHERE email = ?', [email]);
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000;
    await run('INSERT OR REPLACE INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, tokenHash, expiresAt]);
    const resetUrl = `${APP_URL.replace(/\/$/, '')}/#/admin/reset-password?token=${token}`;
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your portfolio admin password',
        text: `Use this link within 30 minutes to reset your password: ${resetUrl}`,
        html: `<p>Use this link within 30 minutes to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
      });
    } catch (error) {
      await run('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
      throw error;
    }
  }
  res.json({ success: true, message: 'If the account exists, a password reset link has been sent.' });
}));

app.post('/api/password-reset/complete', limitRequests({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many reset attempts. Try again later.' }), asyncRoute(async (req, res) => {
  const token = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });
  if (!/^[a-f0-9]{64}$/i.test(token)) return res.status(400).json({ error: 'This reset link is invalid or expired' });
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await get('SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?', [tokenHash, Date.now()]);
  if (!reset) return res.status(400).json({ error: 'This reset link is invalid or expired' });
  await run('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(password, 12), reset.user_id]);
  await run('DELETE FROM password_reset_tokens WHERE user_id = ?', [reset.user_id]);
  res.json({ success: true });
}));

// ---------- projects ----------
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.user = await get('SELECT id, email, name, role, session_version FROM users WHERE id = ?', [decoded.id]);
    if (!req.user) return res.status(401).json({ error: 'Session expired, please log in again' });
    if ((decoded.sessionVersion || 0) !== req.user.session_version) return res.status(401).json({ error: 'Your security settings changed. Please sign in again.' });
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

app.get('/api/projects', optionalAuth, asyncRoute(async (req, res) => {
  const rows = req.user
    ? await all('SELECT * FROM projects ORDER BY created_at DESC, id DESC')
    : await all("SELECT * FROM projects WHERE status = 'Published' ORDER BY created_at DESC, id DESC");
  res.json(rows.map(projectToJson));
}));

app.get('/api/public/stats', asyncRoute(async (req, res) => {
  const [projects, skills, visits] = await Promise.all([
    get("SELECT COUNT(*) AS n FROM projects WHERE status = 'Published'"),
    get('SELECT COUNT(*) AS n FROM skills WHERE is_public = 1'),
    get("SELECT value FROM counters WHERE key = 'visits'"),
  ]);
  res.json({ publishedProjects: projects.n, totalSkills: skills.n, totalVisits: visits?.value || 0 });
}));

app.post('/api/projects', requireAuth, handleUploads, asyncRoute(async (req, res) => {
  const file = findUploadedFile(req);
  if (!hasValidImageSignature(file)) { removeUploadedFile(file.filename); return res.status(400).json({ error: 'The uploaded file is not a valid supported image.' }); }
  const { title, description, problem, features, technologies, liveDemoUrl, githubUrl, category, status } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Project title is required' });
  if (String(title).length > 180 || String(description || '').length > 10000 || String(problem || '').length > 10000 || String(features || '').length > 10000) return res.status(400).json({ error: 'Project content is too long.' });
  if (!isHttpUrl(liveDemoUrl) || !isHttpUrl(githubUrl)) return res.status(400).json({ error: 'Project links must use a valid HTTP or HTTPS URL.' });

  const info = await run(
    `INSERT INTO projects (title, description, problem, features, technologies, image_path, live_demo_url, github_url, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(title).trim(),
      description || '',
      problem || '',
      features || '',
      JSON.stringify(parseTechnologies(technologies)),
      file ? file.filename : '',
      liveDemoUrl || '',
      githubUrl || '',
      category || 'Web Apps',
      status === 'Published' ? 'Published' : 'Draft',
    ],
  );
  const row = await get('SELECT * FROM projects WHERE id = ?', [info.lastID]);
  res.status(201).json(projectToJson(row));
}));

app.put('/api/projects/:id', requireAuth, handleUploads, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  const file = findUploadedFile(req);
  if (!existing) { if (file) removeUploadedFile(file.filename); return res.status(404).json({ error: 'Project not found' }); }

  if (!hasValidImageSignature(file)) { removeUploadedFile(file.filename); return res.status(400).json({ error: 'The uploaded file is not a valid supported image.' }); }
  const b = req.body || {};
  if (String(b.title ?? existing.title).length > 180 || String(b.description ?? existing.description).length > 10000 || String(b.problem ?? existing.problem ?? '').length > 10000 || String(b.features ?? existing.features ?? '').length > 10000) return res.status(400).json({ error: 'Project content is too long.' });
  if (!isHttpUrl(b.liveDemoUrl ?? existing.live_demo_url) || !isHttpUrl(b.githubUrl ?? existing.github_url)) return res.status(400).json({ error: 'Project links must use a valid HTTP or HTTPS URL.' });
  const imagePath = file ? file.filename : (b.image !== undefined ? b.image : existing.image_path);
  await run(
    `UPDATE projects SET title = ?, description = ?, problem = ?, features = ?, technologies = ?, image_path = ?,
     live_demo_url = ?, github_url = ?, category = ?, status = ? WHERE id = ?`,
    [
      b.title !== undefined ? String(b.title).trim() : existing.title,
      b.description !== undefined ? b.description : existing.description,
      b.problem !== undefined ? b.problem : existing.problem,
      b.features !== undefined ? b.features : existing.features,
      b.technologies !== undefined ? JSON.stringify(parseTechnologies(b.technologies)) : existing.technologies,
      imagePath,
      b.liveDemoUrl !== undefined ? b.liveDemoUrl : existing.live_demo_url,
      b.githubUrl !== undefined ? b.githubUrl : existing.github_url,
      b.category !== undefined ? b.category : existing.category,
      b.status !== undefined ? (b.status === 'Published' ? 'Published' : 'Draft') : existing.status,
      existing.id,
    ],
  );
  if (file && existing.image_path) removeUploadedFile(existing.image_path);
  const row = await get('SELECT * FROM projects WHERE id = ?', [existing.id]);
  res.json(projectToJson(row));
}));

app.delete('/api/projects/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  await run('DELETE FROM projects WHERE id = ?', [existing.id]);
  removeUploadedFile(existing.image_path);
  res.json({ success: true, id: existing.id });
}));

// ---------- skills ----------
app.get('/api/skills', optionalAuth, asyncRoute(async (req, res) => {
  const rows = await all(req.user ? 'SELECT * FROM skills ORDER BY id ASC' : 'SELECT * FROM skills WHERE is_public = 1 ORDER BY id ASC');
  res.json(rows.map(skillToJson));
}));

app.post('/api/skills', requireAuth, asyncRoute(async (req, res) => {
  const { name, category, level, isPublic } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Skill name is required' });
  if (String(name).length > 80 || String(category || '').length > 80) return res.status(400).json({ error: 'Skill name or category is too long.' });
  const info = await run('INSERT INTO skills (name, category, level, is_public) VALUES (?, ?, ?, ?)', [
    String(name).trim(),
    category || 'Tools',
    Number.isFinite(Number(level)) ? Math.max(0, Math.min(100, Number(level))) : 50,
    isPublic === false ? 0 : 1,
  ]);
  const row = await get('SELECT * FROM skills WHERE id = ?', [info.lastID]);
  res.status(201).json(skillToJson(row));
}));

app.put('/api/skills/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM skills WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Skill not found' });
  const b = req.body || {};
  if (String(b.name ?? existing.name).length > 80 || String(b.category ?? existing.category).length > 80) return res.status(400).json({ error: 'Skill name or category is too long.' });
  await run('UPDATE skills SET name = ?, category = ?, level = ?, is_public = ? WHERE id = ?', [
    b.name !== undefined && String(b.name).trim() ? String(b.name).trim() : existing.name,
    b.category !== undefined ? b.category : existing.category,
    b.level !== undefined ? Math.max(0, Math.min(100, Number(b.level) || 0)) : existing.level,
    b.isPublic !== undefined ? (b.isPublic ? 1 : 0) : existing.is_public,
    existing.id,
  ]);
  const row = await get('SELECT * FROM skills WHERE id = ?', [existing.id]);
  res.json(skillToJson(row));
}));

app.delete('/api/skills/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM skills WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Skill not found' });
  await run('DELETE FROM skills WHERE id = ?', [existing.id]);
  res.json({ success: true, id: existing.id });
}));

// ---------- home content ----------
app.get('/api/home', asyncRoute(async (req, res) => {
  const row = await get('SELECT * FROM home_content ORDER BY id ASC LIMIT 1');
  res.json(homeToJson(row));
}));

app.put('/api/home', requireAuth, handleUploads, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM home_content ORDER BY id ASC LIMIT 1');
  const file = findUploadedFile(req);
  if (!hasValidImageSignature(file)) { removeUploadedFile(file.filename); return res.status(400).json({ error: 'The uploaded file is not a valid supported image.' }); }
  const b = req.body || {};
  const profileImage = file ? file.filename : (b.profileImage !== undefined ? b.profileImage : (existing ? existing.profile_image : ''));

  if (existing) {
    await run(
      `UPDATE home_content SET greeting = ?, name = ?, title = ?, description = ?, profile_image = ?,
       about_preview_title = ?, about_preview_text = ?, contact_cta_title = ?, contact_cta_text = ?,
       meta_title = ?, meta_description = ? WHERE id = ?`,
      [
        b.greeting !== undefined ? b.greeting : existing.greeting,
        b.name !== undefined ? b.name : existing.name,
        b.title !== undefined ? b.title : existing.title,
        b.description !== undefined ? b.description : existing.description,
        profileImage,
        b.aboutPreviewTitle !== undefined ? b.aboutPreviewTitle : existing.about_preview_title,
        b.aboutPreviewText !== undefined ? b.aboutPreviewText : existing.about_preview_text,
        b.contactCtaTitle !== undefined ? b.contactCtaTitle : existing.contact_cta_title,
        b.contactCtaText !== undefined ? b.contactCtaText : existing.contact_cta_text,
        b.metaTitle !== undefined ? b.metaTitle : existing.meta_title,
        b.metaDescription !== undefined ? b.metaDescription : existing.meta_description,
        existing.id,
      ],
    );
    if (file && existing.profile_image) removeUploadedFile(existing.profile_image);
    const row = await get('SELECT * FROM home_content WHERE id = ?', [existing.id]);
    return res.json(homeToJson(row));
  }

  const info = await run(
    `INSERT INTO home_content (greeting, name, title, description, profile_image, about_preview_title, about_preview_text, contact_cta_title, contact_cta_text, meta_title, meta_description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.greeting || '', b.name || '', b.title || '', b.description || '', profileImage, b.aboutPreviewTitle || '', b.aboutPreviewText || '', b.contactCtaTitle || '', b.contactCtaText || '', b.metaTitle || '', b.metaDescription || ''],
  );
  const row = await get('SELECT * FROM home_content WHERE id = ?', [info.lastID]);
  res.status(201).json(homeToJson(row));
}));

// ---------- about content ----------
app.get('/api/about', asyncRoute(async (req, res) => {
  const row = await get('SELECT * FROM about_content ORDER BY id ASC LIMIT 1');
  res.json(aboutToJson(row));
}));

app.post('/api/about/cv', requireAuth, (req, res, next) => uploadCv.single('cv')(req, res, async (error) => {
  if (error) return next(error);
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Choose a PDF file to upload.' });
  try {
    if (!hasValidPdfSignature(file)) {
      removeUploadedFile(file.filename);
      return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
    }
    await cloudStorage.save(file);
    const cvUrl = uploadPath(file.filename);
    const existing = await get('SELECT id FROM about_content ORDER BY id ASC LIMIT 1');
    if (existing) await run('UPDATE about_content SET cv_url = ? WHERE id = ?', [cvUrl, existing.id]);
    else await run('INSERT INTO about_content (cv_url) VALUES (?)', [cvUrl]);
    res.json({ cvUrl });
  } catch (uploadError) {
    removeUploadedFile(file.filename);
    next(uploadError);
  }
}));

app.put('/api/about', requireAuth, handleUploads, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM about_content ORDER BY id ASC LIMIT 1');
  const b = req.body || {};
  const file = findUploadedFile(req);
  if (!hasValidImageSignature(file)) { removeUploadedFile(file.filename); return res.status(400).json({ error: 'The uploaded file is not a valid supported image.' }); }
  for (const field of ['cvUrl', 'githubUrl', 'linkedinUrl', 'twitterUrl', 'instagramUrl', 'facebookUrl']) {
    if (b[field] !== undefined && (!isHttpUrl(b[field]) || String(b[field]).length > 2048)) return res.status(400).json({ error: `${field} must be a valid HTTP or HTTPS URL.` });
  }
  if (String(b.name ?? '').length > 120 || String(b.title ?? '').length > 160 || String(b.experience ?? '').length > 120 || String(b.description ?? '').length > 12000) return res.status(400).json({ error: 'About content is too long.' });

  if (existing) {
    await run(
      `UPDATE about_content SET name = ?, title = ?, experience = ?, description = ?, email = ?, phone = ?, location = ?,
       cv_url = ?, github_url = ?, linkedin_url = ?, twitter_url = ?, instagram_url = ?, facebook_url = ?, portrait_image = ? WHERE id = ?`,
      [
        b.name !== undefined ? b.name : existing.name,
        b.title !== undefined ? b.title : existing.title,
        b.experience !== undefined ? b.experience : existing.experience,
        b.description !== undefined ? b.description : existing.description,
        b.email !== undefined ? b.email : existing.email,
        b.phone !== undefined ? b.phone : existing.phone,
        b.location !== undefined ? b.location : existing.location,
        b.cvUrl !== undefined ? b.cvUrl : existing.cv_url,
        b.githubUrl !== undefined ? b.githubUrl : existing.github_url,
        b.linkedinUrl !== undefined ? b.linkedinUrl : existing.linkedin_url,
        b.twitterUrl !== undefined ? b.twitterUrl : existing.twitter_url,
        b.instagramUrl !== undefined ? b.instagramUrl : existing.instagram_url,
        b.facebookUrl !== undefined ? b.facebookUrl : existing.facebook_url,
        file ? file.filename : (b.portraitImage !== undefined ? b.portraitImage : existing.portrait_image),
        existing.id,
      ],
    );
    if (file && existing.portrait_image) removeUploadedFile(existing.portrait_image);
    const row = await get('SELECT * FROM about_content WHERE id = ?', [existing.id]);
    return res.json(aboutToJson(row));
  }

  const info = await run(
    `INSERT INTO about_content (name, title, experience, description, email, phone, location, cv_url, github_url, linkedin_url, twitter_url, instagram_url, facebook_url, portrait_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.name || '', b.title || '', b.experience || '', b.description || '', b.email || '', b.phone || '', b.location || '', b.cvUrl || '', b.githubUrl || '', b.linkedinUrl || '', b.twitterUrl || '', b.instagramUrl || '', b.facebookUrl || '', file ? file.filename : (b.portraitImage || '')],
  );
  const row = await get('SELECT * FROM about_content WHERE id = ?', [info.lastID]);
  res.status(201).json(aboutToJson(row));
}));

// ---------- messages (POST is public — it's the contact form) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailDomainAcceptsMail = async (email) => {
  const domain = domainToASCII(String(email).trim().split('@').pop().toLowerCase());
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records.some((record) => record.exchange && record.exchange !== '.');
  } catch (error) {
    if (error.code === 'ENODATA') {
      // A domain without MX records can still receive mail via its A/AAAA record.
      try { return (await dns.lookup(domain, { all: true })).length > 0; }
      catch (lookupError) {
        if (lookupError.code === 'ENOTFOUND') return false;
        throw lookupError;
      }
    }
    if (error.code === 'ENOTFOUND') return false;
    throw error;
  }
};
const isHttpUrl = (value) => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(String(value)).protocol); } catch { return false; }
};

app.post('/api/messages', limitRequests({ windowMs: 15 * 60 * 1000, max: 6, message: 'Too many messages from this connection. Please try again later.' }), asyncRoute(async (req, res) => {
  const { name, email, message, subject } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail || cleanEmail.length > 254 || !EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required' });
  if (String(name).length > 120 || String(message).length > 10000 || String(subject || '').length > 200) {
    return res.status(400).json({ error: 'One or more message fields are too long.' });
  }

  let emailDomainIsReachable;
  try {
    emailDomainIsReachable = await emailDomainAcceptsMail(cleanEmail);
  } catch (error) {
    console.warn('[mail] sender domain verification unavailable:', error.code || error.message);
    return res.status(503).json({ error: 'We could not verify this email domain right now. Please try again shortly.' });
  }
  if (!emailDomainIsReachable) return res.status(400).json({ error: 'This email domain cannot receive mail. Please check the address and try again.' });

  const info = await run(
    'INSERT INTO messages (name, email, subject, message, read) VALUES (?, ?, ?, ?, 0)',
    [String(name).trim(), cleanEmail, subject ? String(subject).trim() : null, String(message).trim()],
  );
  const row = await get('SELECT * FROM messages WHERE id = ?', [info.lastID]);
  let emailNotificationSent = false;
  if (mailer && process.env.CONTACT_TO) {
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.CONTACT_TO,
        replyTo: cleanEmail,
        subject: `Portfolio message: ${String(subject || 'New inquiry').trim()}`,
        text: `From: ${String(name).trim()} <${cleanEmail}>\n\n${String(message).trim()}`,
      });
      emailNotificationSent = true;
    } catch (error) {
      console.error('[mail] message notification failed:', error.message);
    }
  }
  res.status(201).json({ ...messageToJson(row), emailNotificationSent });
}));

app.get('/api/messages', requireAuth, asyncRoute(async (req, res) => {
  const rows = await all('SELECT * FROM messages ORDER BY created_at DESC, id DESC');
  res.json(rows.map(messageToJson));
}));

app.put('/api/messages/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  const read = req.body && req.body.read !== undefined ? (req.body.read ? 1 : 0) : existing.read;
  await run('UPDATE messages SET read = ? WHERE id = ?', [read, existing.id]);
  const row = await get('SELECT * FROM messages WHERE id = ?', [existing.id]);
  res.json(messageToJson(row));
}));

app.delete('/api/messages/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM messages WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  await run('DELETE FROM messages WHERE id = ?', [existing.id]);
  res.json({ success: true, id: existing.id });
}));

// ---- Email notification status / test (never exposes credentials) ----
app.get('/api/email/status', requireAuth, asyncRoute(async (req, res) => {
  const configured = Boolean(mailer && process.env.CONTACT_TO);
  res.json({
    configured,
    contactTo: process.env.CONTACT_TO || null,
    host: process.env.SMTP_HOST || null,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  });
}));

app.post('/api/email/test', requireAuth, asyncRoute(async (req, res) => {
  if (!mailer) {
    return res.status(503).json({ error: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env, then restart the server.' });
  }
  if (!process.env.CONTACT_TO) {
    return res.status(503).json({ error: 'CONTACT_TO is not set in .env, so there is no address to notify.' });
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO,
      subject: 'Portfolio: test notification',
      text: `This is a test email from your portfolio server.\n\nIf you are reading it, email notifications are working.\nSent at ${new Date().toISOString()}`,
    });
    res.json({ success: true, to: process.env.CONTACT_TO });
  } catch (error) {
    console.error('[mail] test email failed:', error.message);
    res.status(502).json({ error: `Test email failed: ${error.message}` });
  }
}));

// ---------- users ----------
app.get('/api/users', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const rows = await all('SELECT id, name, email, role, last_login FROM users ORDER BY id ASC');
  res.json(rows.map(userToJson));
}));

app.post('/api/users', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(String(email).trim())) return res.status(400).json({ error: 'A valid email is required' });
  if (!password || String(password).length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters' });

  const cleanEmail = String(email).toLowerCase().trim();
  const clash = await get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (clash) return res.status(409).json({ error: 'A user with this email already exists' });

  const info = await run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [
    cleanEmail,
    bcrypt.hashSync(String(password), 10),
    String(name).trim(),
    role === 'editor' ? 'editor' : 'admin',
  ]);
  const row = await get('SELECT id, name, email, role FROM users WHERE id = ?', [info.lastID]);
  res.status(201).json(userToJson(row));
}));

app.put('/api/users/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const targetId = Number(req.params.id);
  const existing = await get('SELECT * FROM users WHERE id = ?', [targetId]);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const b = req.body || {};
  const name = b.name !== undefined ? String(b.name).trim() : existing.name;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (name.length > 120) return res.status(400).json({ error: 'Name is too long.' });

  const role = b.role !== undefined ? (b.role === 'editor' ? 'editor' : 'admin') : existing.role;

  // Changing your own role away from admin would lock you out of the
  // admin-only screens, so it is refused here (same rule as deletion).
  if (targetId === req.user.id && role !== 'admin') {
    return res.status(400).json({ error: 'You cannot remove your own admin role' });
  }
  // Never allow the last remaining admin to be demoted.
  if (role !== 'admin' && existing.role === 'admin') {
    const admins = await get("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
    if (admins.n <= 1) return res.status(400).json({ error: 'Cannot demote the last admin account' });
  }

  let email = existing.email;
  if (b.email !== undefined) {
    const clean = String(b.email).toLowerCase().trim();
    if (!EMAIL_RE.test(clean)) return res.status(400).json({ error: 'A valid email is required' });
    const clash = await get('SELECT id FROM users WHERE email = ? AND id != ?', [clean, targetId]);
    if (clash) return res.status(409).json({ error: 'A user with this email already exists' });
    email = clean;
  }

  // Password is optional on edit; when supplied it must meet the same
  // 12-character rule as account creation.
  let password = existing.password;
  if (b.password !== undefined && b.password !== '') {
    if (String(b.password).length < 12) {
      return res.status(400).json({ error: 'Password must be at least 12 characters' });
    }
    password = bcrypt.hashSync(String(b.password), 10);
  }

  await run('UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?', [
    name, email, role, password, targetId,
  ]);
  const row = await get('SELECT id, name, email, role, last_login FROM users WHERE id = ?', [targetId]);
  res.json(userToJson(row));
}));

app.delete('/api/users/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });

  const existing = await get('SELECT * FROM users WHERE id = ?', [targetId]);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  if (existing.role === 'admin') {
    const admins = await get("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
    if (admins.n <= 1) return res.status(400).json({ error: 'Cannot delete the last admin account' });
  }
  await run('DELETE FROM users WHERE id = ?', [targetId]);
  res.json({ success: true, id: targetId });
}));

app.post('/api/change-password', requireAuth, asyncRoute(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 12) {
    return res.status(400).json({ error: 'New password must be at least 12 characters' });
  }
  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!(await bcrypt.compare(String(currentPassword || ''), user.password))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  await run('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(String(newPassword), 10), user.id]);
  res.json({ success: true });
}));

// ---------- dashboard stats ----------
app.get('/api/stats', requireAuth, asyncRoute(async (req, res) => {
  const [projects, published, skills, messages, unread, users, visits, categories, visitorTrend] = await Promise.all([
    get('SELECT COUNT(*) AS n FROM projects'),
    get("SELECT COUNT(*) AS n FROM projects WHERE status = 'Published'"),
    get('SELECT COUNT(*) AS n FROM skills'),
    get('SELECT COUNT(*) AS n FROM messages'),
    get('SELECT COUNT(*) AS n FROM messages WHERE read = 0'),
    get('SELECT COUNT(*) AS n FROM users'),
    get("SELECT value FROM counters WHERE key = 'visits'"),
    all("SELECT category, COUNT(*) AS value FROM projects WHERE status = 'Published' GROUP BY category"),
    all("SELECT day, visits FROM visit_days WHERE day >= date('now', '-6 days') ORDER BY day ASC"),
  ]);
  res.json({
    totalProjects: projects.n,
    publishedProjects: published.n,
    totalSkills: skills.n,
    totalMessages: messages.n,
    unreadMessages: unread.n,
    totalUsers: users.n,
    totalVisits: visits ? visits.value : 0,
    categories: categories.map((c) => ({ name: c.category || 'Other', value: c.value })),
    visitorTrend,
  });
}));

app.get('/api/activities', requireAuth, asyncRoute(async (req, res) => {
  const recentProjects = await all('SELECT title, status, created_at FROM projects ORDER BY created_at DESC, id DESC LIMIT 3');
  const recentMessages = await all('SELECT name, created_at FROM messages ORDER BY created_at DESC, id DESC LIMIT 2');
  const recentSkills = await all('SELECT name FROM skills ORDER BY id DESC LIMIT 1');

  const items = [
    ...recentProjects.map((p) => ({
      action: p.status === 'Published' ? 'Project published' : 'Project saved as draft',
      item: p.title,
      time: p.created_at,
      color: p.status === 'Published' ? '#22C55E' : '#8B5CF6',
    })),
    ...recentMessages.map((m) => ({
      action: 'New message received',
      item: m.name,
      time: m.created_at,
      color: '#38BDF8',
    })),
    ...recentSkills.map((s) => ({
      action: 'Skill added',
      item: s.name,
      time: null,
      color: '#2563EB',
    })),
  ];

  if (!items.length) {
    items.push({ action: 'Portfolio ready', item: 'Add your first project from the Projects page', time: null, color: '#22C55E' });
  }
  res.json(items.slice(0, 6));
}));

// ---------- public visit counter ----------
app.post('/api/visit', asyncRoute(async (req, res) => {
  await run('INSERT INTO counters (key, value) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET value = value + 1', ['visits']);
  await run("INSERT INTO visit_days (day, visits) VALUES (date('now'), 1) ON CONFLICT(day) DO UPDATE SET visits = visits + 1");
  const row = await get("SELECT value FROM counters WHERE key = 'visits'");
  res.json({ visits: row ? row.value : 1 });
}));

// ---------- health ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  const status = Number(err.status || err.statusCode) || (err instanceof multer.MulterError ? 400 : 500);
  res.status(status).json({ error: status >= 500 ? 'Server error. Please try again later.' : err.message || 'Invalid request.' });
});

startupReady
  .then(() => {
    return cloudStorage.prepareBucket();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] API listening on http://localhost:${PORT}`);
      console.log(`[server] uploads -> ${UPLOAD_DIR}`);
    });
  })
  .catch((err) => {
    console.error('[server] startup failed:', err);
    process.exitCode = 1;
  });
