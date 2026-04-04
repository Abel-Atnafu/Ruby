const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'queen_burger.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL,
    burger      TEXT    NOT NULL,
    fries       TEXT    NOT NULL,
    notes       TEXT    DEFAULT '',
    status      TEXT    DEFAULT 'new',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // allow CDN fonts & Unsplash images
  crossOriginEmbedderPolicy: false,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 min
  max: 5,
  message: { error: 'Too many order attempts. Please wait a moment.' },
});

const subscribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many subscription attempts.' },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use('/api', generalLimiter);
app.use(express.static(__dirname));

// ─── Menu Data ────────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  {
    id: 1, name: 'The Royal Cheese Burger', price: 770,
    description: 'House sauce, ketchup, provolone cheese, pickle',
    tag: 'Popular', spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  },
  {
    id: 2, name: 'Majestic Cheese Burger', price: 820,
    description: 'Special house sauce, pickle, ketchup, provolone cheese',
    tag: null, spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
  },
  {
    id: 3, name: "Queen's Spicy Cheese Burger", price: 790,
    description: 'Spicy sauce, pickle, provolone cheese',
    tag: 'Spicy', spicy: true, signature: false,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
  },
  {
    id: 4, name: 'The Fried Onion Delight', price: 790,
    description: 'House sauce, provolone cheese, crispy fried onion rings',
    tag: null, spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',
  },
  {
    id: 5, name: 'Crowned Beef Bacon Cheese Burger', price: 840,
    description: 'House sauce, provolone cheese, beef bacon, fried onion ring',
    tag: "Chef's Pick", spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',
  },
  {
    id: 6, name: 'The Queen Smashed Patty Burger', price: 770,
    description: 'House sauce, provolone cheese, smashed crispy patty',
    tag: 'Fan Favorite', spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
  },
  {
    id: 7, name: 'Her Majesty', price: 880,
    description: 'Premium house sauce, provolone cheese, fried onion ring',
    tag: 'Royalty', spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',
  },
  {
    id: 8, name: 'The Double Queen', price: 1350,
    description: 'Double patty, house sauce, provolone cheese, fried onion ring',
    tag: 'Double Stack', spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',
  },
  {
    id: 9, name: 'Philly Cheese Steak Sandwich', price: 900,
    description: 'Shaved beef, provolone cheese, sautéed peppers & onions',
    tag: null, spicy: false, signature: false,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
  },
  {
    id: 10, name: 'Queen Lava Burger', price: 2000,
    description: 'Molten cheese core, premium beef, secret house sauce — the crown jewel',
    tag: 'Signature', spicy: false, signature: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(val) {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/<[^>]*>/g, '').substring(0, 500);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── API: Menu ────────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const regular = MENU_ITEMS.filter(i => !i.signature);
  const signature = MENU_ITEMS.filter(i => i.signature);
  res.json({ items: MENU_ITEMS, regular, signature, total: MENU_ITEMS.length });
});

// ─── API: Orders ──────────────────────────────────────────────────────────────
app.post('/api/orders', orderLimiter, (req, res) => {
  const name   = sanitize(req.body.name);
  const phone  = sanitize(req.body.phone);
  const burger = sanitize(req.body.burger);
  const fries  = sanitize(req.body.fries);
  const notes  = sanitize(req.body.notes || '');

  if (!name || !phone || !burger || !fries) {
    return res.status(400).json({ error: 'Name, phone, burger, and fries are required.' });
  }
  if (name.length < 2)  return res.status(400).json({ error: 'Name is too short.' });
  if (phone.length < 7) return res.status(400).json({ error: 'Phone number is too short.' });

  const result = db.prepare(
    'INSERT INTO orders (name, phone, burger, fries, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(name, phone, burger, fries, notes);

  res.status(201).json({
    success: true,
    order: { id: result.lastInsertRowid, name, burger, fries, status: 'new' },
  });
});

app.get('/api/orders', (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (Math.max(parseInt(page) || 1, 1) - 1) * (parseInt(limit) || 50);
  const cap    = Math.min(parseInt(limit) || 50, 200);
  const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

  let orders, total;
  if (status && validStatuses.includes(status)) {
    orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(status, cap, offset);
    total  = db.prepare('SELECT COUNT(*) as c FROM orders WHERE status = ?').get(status).c;
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(cap, offset);
    total  = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  }

  res.json({ orders, total, page: parseInt(page) || 1 });
});

app.get('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID.' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order)  return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID.' });

  const { status } = req.body;
  const valid = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Use: ${valid.join(', ')}` });
  }

  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found.' });
  res.json({ success: true, id, status });
});

app.delete('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid order ID.' });
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found.' });
  res.json({ success: true });
});

// ─── API: Newsletter ──────────────────────────────────────────────────────────
app.post('/api/subscribe', subscribeLimiter, (req, res) => {
  const email = sanitize(req.body.email || '').toLowerCase();
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  try {
    db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already subscribed.' });
    }
    throw err;
  }
});

app.get('/api/subscribers', (req, res) => {
  const subs = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all();
  res.json({ subscribers: subs, total: subs.length });
});

// ─── API: Dashboard Stats ─────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const q = (sql, ...p) => db.prepare(sql).get(...p);
  res.json({
    totalOrders:      q('SELECT COUNT(*) as c FROM orders').c,
    newOrders:        q("SELECT COUNT(*) as c FROM orders WHERE status='new'").c,
    preparingOrders:  q("SELECT COUNT(*) as c FROM orders WHERE status='preparing'").c,
    readyOrders:      q("SELECT COUNT(*) as c FROM orders WHERE status='ready'").c,
    completedOrders:  q("SELECT COUNT(*) as c FROM orders WHERE status='completed'").c,
    cancelledOrders:  q("SELECT COUNT(*) as c FROM orders WHERE status='cancelled'").c,
    todayOrders:      q("SELECT COUNT(*) as c FROM orders WHERE date(created_at)=date('now')").c,
    totalSubscribers: q('SELECT COUNT(*) as c FROM subscribers').c,
    popularBurger:    (db.prepare('SELECT burger, COUNT(*) as c FROM orders GROUP BY burger ORDER BY c DESC LIMIT 1').get() || {}).burger || 'N/A',
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ─── Admin Page ───────────────────────────────────────────────────────────────
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n  \u{1F451}  Queen Burger Server');
  console.log(`  Website : http://localhost:${PORT}`);
  console.log(`  Admin   : http://localhost:${PORT}/admin`);
  console.log(`  API     : http://localhost:${PORT}/api/orders`);
  console.log(`  Health  : http://localhost:${PORT}/health\n`);
});
