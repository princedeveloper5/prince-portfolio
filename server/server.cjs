const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret-change-in-production';

// ---- Paths (always relative to THIS file, never to process.cwd()) ----
const DB_PATH = path.join(__dirname, '..', 'portfolio.db');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- File uploads (project images, profile photo) ----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const db = new sqlite3.Database(DB_PATH);

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
  if (!res.headersSent) res.status(500).json({ error: err.message || 'Server error' });
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
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
  return `/uploads/${value}`;
};

const projectToJson = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  technologies: parseTechnologies(row.technologies),
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
  level: Number(row.level) || 50,
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
      }
    : null;

const aboutToJson = (row) =>
  row
    ? {
        id: row.id,
        name: row.name || '',
        title: row.title || '',
        description: row.description || '',
        email: row.email || '',
        phone: row.phone || '',
        location: row.location || '',
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
});

const findUploadedFile = (req) => {
  if (!req.files || !req.files.length) return null;
  return req.files[0];
};

const removeUploadedFile = (fileName) => {
  if (!fileName || /^(https?:)?\/\//.test(fileName) || fileName.startsWith('/')) return;
  const target = path.join(UPLOAD_DIR, path.basename(fileName));
  fs.unlink(target, () => {});
};

// ---------- auth ----------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

// ---------- schema + seed ----------
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'admin'
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
    status TEXT DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    level INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS home_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    greeting TEXT,
    name TEXT,
    title TEXT,
    description TEXT,
    profile_image TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS about_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    title TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    location TEXT
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
  await seedIfEmpty(
    'users',
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [['admin@mugishaprince.com', bcrypt.hashSync('Admin123!', 10), 'Mugisha Prince', 'admin']],
  );

  await seedIfEmpty(
    'projects',
    `INSERT INTO projects (title, description, technologies, live_demo_url, github_url, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      ['School Management System', 'A complete system to manage students, teachers, classes, and subjects.', JSON.stringify(['React', 'Node.js', 'MySQL']), '', '', 'Web Apps', 'Published'],
      ['Timetable Management System', 'Manage class schedules, subjects and teachers with an interactive system.', JSON.stringify(['React', 'Node.js', 'MySQL']), '', '', 'Web Apps', 'Published'],
      ['Portfolio Website', 'Personal portfolio website with admin panel.', JSON.stringify(['React', 'Express', 'MongoDB']), '', '', 'Full Stack', 'Published'],
      ['Task Management App', 'A simple task manager with real-time updates.', JSON.stringify(['React', 'Firebase']), '', '', 'Web Apps', 'Published'],
    ],
  );

  await seedIfEmpty(
    'skills',
    'INSERT INTO skills (name, category, level) VALUES (?, ?, ?)',
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
    'INSERT INTO home_content (greeting, name, title, description, profile_image) VALUES (?, ?, ?, ?, ?)',
    [[
      "Hello, I'm",
      'Mugisha Prince',
      'Software Developer',
      'I build modern web applications and solve real problems with clean, efficient code. Passionate about learning, creating and growing in the tech industry.',
      '/mugisha-prince.png',
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

seedData().catch((err) => console.error('[seed] failed:', err));

// ---------- auth routes ----------
app.post('/api/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await get('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase().trim()]);
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
  res.json({ token, user: userToJson(user) });
}));

// ---------- projects ----------
app.get('/api/projects', asyncRoute(async (req, res) => {
  const rows = await all('SELECT * FROM projects ORDER BY created_at DESC, id DESC');
  res.json(rows.map(projectToJson));
}));

app.post('/api/projects', requireAuth, upload.any(), asyncRoute(async (req, res) => {
  const file = findUploadedFile(req);
  const { title, description, technologies, liveDemoUrl, githubUrl, category, status } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Project title is required' });

  const info = await run(
    `INSERT INTO projects (title, description, technologies, image_path, live_demo_url, github_url, category, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      String(title).trim(),
      description || '',
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

app.put('/api/projects/:id', requireAuth, upload.any(), asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const file = findUploadedFile(req);
  const b = req.body || {};
  const imagePath = file ? file.filename : (b.image !== undefined ? b.image : existing.image_path);
  if (file && existing.image_path) removeUploadedFile(existing.image_path);

  await run(
    `UPDATE projects SET title = ?, description = ?, technologies = ?, image_path = ?,
     live_demo_url = ?, github_url = ?, category = ?, status = ? WHERE id = ?`,
    [
      b.title !== undefined ? String(b.title).trim() : existing.title,
      b.description !== undefined ? b.description : existing.description,
      b.technologies !== undefined ? JSON.stringify(parseTechnologies(b.technologies)) : existing.technologies,
      imagePath,
      b.liveDemoUrl !== undefined ? b.liveDemoUrl : existing.live_demo_url,
      b.githubUrl !== undefined ? b.githubUrl : existing.github_url,
      b.category !== undefined ? b.category : existing.category,
      b.status !== undefined ? (b.status === 'Published' ? 'Published' : 'Draft') : existing.status,
      existing.id,
    ],
  );
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
app.get('/api/skills', asyncRoute(async (req, res) => {
  const rows = await all('SELECT * FROM skills ORDER BY id ASC');
  res.json(rows.map(skillToJson));
}));

app.post('/api/skills', requireAuth, asyncRoute(async (req, res) => {
  const { name, category, level } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Skill name is required' });
  const info = await run('INSERT INTO skills (name, category, level) VALUES (?, ?, ?)', [
    String(name).trim(),
    category || 'Tools',
    Number.isFinite(Number(level)) ? Math.max(0, Math.min(100, Number(level))) : 50,
  ]);
  const row = await get('SELECT * FROM skills WHERE id = ?', [info.lastID]);
  res.status(201).json(skillToJson(row));
}));

app.put('/api/skills/:id', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM skills WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Skill not found' });
  const b = req.body || {};
  await run('UPDATE skills SET name = ?, category = ?, level = ? WHERE id = ?', [
    b.name !== undefined && String(b.name).trim() ? String(b.name).trim() : existing.name,
    b.category !== undefined ? b.category : existing.category,
    b.level !== undefined ? Math.max(0, Math.min(100, Number(b.level) || 0)) : existing.level,
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

app.put('/api/home', requireAuth, upload.any(), asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM home_content ORDER BY id ASC LIMIT 1');
  const file = findUploadedFile(req);
  const b = req.body || {};
  const profileImage = file ? file.filename : (b.profileImage !== undefined ? b.profileImage : (existing ? existing.profile_image : ''));

  if (existing) {
    if (file && existing.profile_image) removeUploadedFile(existing.profile_image);
    await run(
      'UPDATE home_content SET greeting = ?, name = ?, title = ?, description = ?, profile_image = ? WHERE id = ?',
      [
        b.greeting !== undefined ? b.greeting : existing.greeting,
        b.name !== undefined ? b.name : existing.name,
        b.title !== undefined ? b.title : existing.title,
        b.description !== undefined ? b.description : existing.description,
        profileImage,
        existing.id,
      ],
    );
    const row = await get('SELECT * FROM home_content WHERE id = ?', [existing.id]);
    return res.json(homeToJson(row));
  }

  const info = await run(
    'INSERT INTO home_content (greeting, name, title, description, profile_image) VALUES (?, ?, ?, ?, ?)',
    [b.greeting || '', b.name || '', b.title || '', b.description || '', profileImage],
  );
  const row = await get('SELECT * FROM home_content WHERE id = ?', [info.lastID]);
  res.status(201).json(homeToJson(row));
}));

// ---------- about content ----------
app.get('/api/about', asyncRoute(async (req, res) => {
  const row = await get('SELECT * FROM about_content ORDER BY id ASC LIMIT 1');
  res.json(aboutToJson(row));
}));

app.put('/api/about', requireAuth, asyncRoute(async (req, res) => {
  const existing = await get('SELECT * FROM about_content ORDER BY id ASC LIMIT 1');
  const b = req.body || {};

  if (existing) {
    await run(
      'UPDATE about_content SET name = ?, title = ?, description = ?, email = ?, phone = ?, location = ? WHERE id = ?',
      [
        b.name !== undefined ? b.name : existing.name,
        b.title !== undefined ? b.title : existing.title,
        b.description !== undefined ? b.description : existing.description,
        b.email !== undefined ? b.email : existing.email,
        b.phone !== undefined ? b.phone : existing.phone,
        b.location !== undefined ? b.location : existing.location,
        existing.id,
      ],
    );
    const row = await get('SELECT * FROM about_content WHERE id = ?', [existing.id]);
    return res.json(aboutToJson(row));
  }

  const info = await run(
    'INSERT INTO about_content (name, title, description, email, phone, location) VALUES (?, ?, ?, ?, ?, ?)',
    [b.name || '', b.title || '', b.description || '', b.email || '', b.phone || '', b.location || ''],
  );
  const row = await get('SELECT * FROM about_content WHERE id = ?', [info.lastID]);
  res.status(201).json(aboutToJson(row));
}));

// ---------- messages (POST is public — it's the contact form) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/messages', asyncRoute(async (req, res) => {
  const { name, email, message, subject } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(String(email).trim())) return res.status(400).json({ error: 'A valid email is required' });
  if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message is required' });

  const info = await run(
    'INSERT INTO messages (name, email, subject, message, read) VALUES (?, ?, ?, ?, 0)',
    [String(name).trim(), String(email).trim(), subject ? String(subject).trim() : null, String(message).trim()],
  );
  const row = await get('SELECT * FROM messages WHERE id = ?', [info.lastID]);
  res.status(201).json(messageToJson(row));
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

// ---------- users ----------
app.get('/api/users', requireAuth, asyncRoute(async (req, res) => {
  const rows = await all('SELECT id, name, email, role FROM users ORDER BY id ASC');
  res.json(rows.map(userToJson));
}));

app.post('/api/users', requireAuth, asyncRoute(async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !EMAIL_RE.test(String(email).trim())) return res.status(400).json({ error: 'A valid email is required' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

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

app.delete('/api/users/:id', requireAuth, asyncRoute(async (req, res) => {
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
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
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
  const [projects, published, skills, messages, unread, users, visits, categories] = await Promise.all([
    get('SELECT COUNT(*) AS n FROM projects'),
    get("SELECT COUNT(*) AS n FROM projects WHERE status = 'Published'"),
    get('SELECT COUNT(*) AS n FROM skills'),
    get('SELECT COUNT(*) AS n FROM messages'),
    get('SELECT COUNT(*) AS n FROM messages WHERE read = 0'),
    get('SELECT COUNT(*) AS n FROM users'),
    get("SELECT value FROM counters WHERE key = 'visits'"),
    all("SELECT category, COUNT(*) AS value FROM projects WHERE status = 'Published' GROUP BY category"),
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
  const row = await get("SELECT value FROM counters WHERE key = 'visits'");
  res.json({ visits: row ? row.value : 1 });
}));

// ---------- health ----------
app.get('/api/health', (req, res) => res.json({ ok: true, db: DB_PATH }));

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`);
  console.log(`[server] uploads -> ${UPLOAD_DIR}`);
});
