const express = require('express');
const { Connection, Request, TYPES } = require('tedious');

const router = express.Router();

const getConfig = () => ({
  server: process.env.DB_SERVER || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    database: process.env.DB_DATABASE,
    trustServerCertificate: true,
    encrypt: false,
    instanceName: 'SQLEXPRESS',
    enableArithAbort: true
  }
});

// Demo: fetch current user by a header or return admin as placeholder
router.get('/', (req, res) => {
  // If frontend stores user in localStorage only, no auth header is present.
  // Return a basic object so UI can render profile.
  res.json({ username: 'admin', email: 'admin@ade.dz', role: 'Administrateur' });
});

router.put('/', (req, res) => {
  // No-op demo endpoint
  res.json({ ok: true });
});

router.post('/password', (req, res) => {
  // No-op demo endpoint
  res.json({ ok: true });
});

module.exports = router;


