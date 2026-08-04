const express = require('express');

const router = express.Router();

// Demo: fetch current user by a header or return admin as placeholder
router.get('/', (req, res) => {
  res.json({ username: 'admin', email: 'admin@ade.dz', role: 'Administrateur' });
});

router.put('/', (req, res) => {
  res.json({ ok: true });
});

router.post('/password', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
