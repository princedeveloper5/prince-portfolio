const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const db = new sqlite3.Database('./portfolio.db');

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

  db.get("SELECT * FROM users WHERE email = 'admin@mugishaprince.com'", (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('Admin123!', 10);
      db.run("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)",
        ['admin@mugishaprince.com', hashedPassword, 'Mugisha Prince', 'admin']);
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.get('/api/projects', (req, res) => {
  db.all("SELECT * FROM projects ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

app.post('/api/projects', authenticateToken, upload.single('image'), (req, res) => {
  const { title, description, technologies, live_demo_url, github_url, category, status } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const techString = Array.isArray(technologies) ? JSON.stringify(technologies) : technologies;
  
  db.run("INSERT INTO projects (title, description, technologies, image_path, live_demo_url, github_url, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [title, description, techString, image_path, live_demo_url, github_url, category, status || 'Draft'],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID, message: 'Project created' });
    });
});

app.get('/api/skills', (req, res) => {
  db.all("SELECT * FROM skills", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(rows);
  });
});

app.post('/api/skills', authenticateToken, (req, res) => {
  const { name, category, level } = req.body;
  db.run("INSERT INTO skills (name, category, level) VALUES (?, ?, ?)",
    [name, category, level],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ id: this.lastID, message: 'Skill created' });
    });
});

app.put('/api/skills/:id', authenticateToken, (req, res) => {
  const { name, category, level } = req.body;
  db.run("UPDATE skills SET name = ?, category = ?, level = ? WHERE id = ?",
    [name, category, level, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Skill updated' });
    });
});

app.delete('/api/skills/:id', authenticateToken, (req, res) => {
  db.run("DELETE FROM skills WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ message: 'Skill deleted' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
