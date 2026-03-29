const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
const db = new Database(path.join(__dirname, 'queen_burger.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    burger TEXT NOT NULL,
    fries TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- API: Orders ---

// Create order
app.post('/api/orders', (req, res) => {
  const { name, phone, burger, fries, notes } = req.body;

  if (!name || !phone || !burger || !fries) {
    return res.status(400).json({ error: 'Name, phone, burger, and fries are required' });
  }

  const stmt = db.prepare(
    'INSERT INTO orders (name, phone, burger, fries, notes) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name.trim(), phone.trim(), burger, fries, notes || '');

  res.status(201).json({
    success: true,
    order: {
      id: result.lastInsertRowid,
      name: name.trim(),
      burger,
      fries,
      status: 'new'
    }
  });
});

// Get all orders (for admin)
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let orders;

  if (status) {
    orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  }

  res.json({ orders, total: orders.length });
});

// Get single order
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order status
app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: ' + validStatuses.join(', ') });
  }

  const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
  const result = stmt.run(status, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, id: req.params.id, status });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true });
});

// --- API: Newsletter ---
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email.trim().toLowerCase());
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already subscribed' });
    }
    throw err;
  }
});

app.get('/api/subscribers', (req, res) => {
  const subs = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC').all();
  res.json({ subscribers: subs, total: subs.length });
});

// --- API: Dashboard Stats ---
app.get('/api/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const newOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get().count;
  const preparingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'preparing'").get().count;
  const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get().count;
  const totalSubscribers = db.prepare('SELECT COUNT(*) as count FROM subscribers').get().count;

  const popularBurger = db.prepare(
    'SELECT burger, COUNT(*) as count FROM orders GROUP BY burger ORDER BY count DESC LIMIT 1'
  ).get();

  const todayOrders = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')"
  ).get().count;

  res.json({
    totalOrders,
    newOrders,
    preparingOrders,
    completedOrders,
    todayOrders,
    totalSubscribers,
    popularBurger: popularBurger ? popularBurger.burger : 'N/A'
  });
});

// --- Admin page ---
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`\n  Crown Burger Server is running!`);
  console.log(`  Website:    http://localhost:${PORT}`);
  console.log(`  Admin:      http://localhost:${PORT}/admin`);
  console.log(`  API:        http://localhost:${PORT}/api/orders\n`);
});
