const express = require('express');

const router = express.Router();

// In-memory demo store for unread count. Replace with real SQL later.
let unreadByIp = new Map();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  let ip = (Array.isArray(fwd) ? fwd[0] : (fwd || '')).split(',')[0].trim()
    || (typeof real === 'string' ? real.trim() : '')
    || (req.ip || '')
    || (req.connection?.remoteAddress || '')
    || (req.socket?.remoteAddress || '')
    || 'unknown';
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

router.get('/unread-count', (req, res) => {
  const ip = getClientIp(req);
  const count = unreadByIp.get(ip) || 0;
  res.json({ count });
});

router.get('/', (req, res) => {
  // demo: static list
  res.json([
    { id: 1, title: 'Bienvenue', createdAt: new Date().toISOString() },
  ]);
});

router.post('/mark-all-read', (req, res) => {
  const ip = getClientIp(req);
  unreadByIp.set(ip, 0);
  res.json({ ok: true });
});

module.exports = router;


