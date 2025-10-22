const express = require('express');
const db = require('../utils/db');
const { TYPES } = db;

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

// GET /api/notifications/agencies-status - Récupérer le statut des données journalières par agence
router.get('/agencies-status', async (req, res) => {
  try {
    const today = new Date();
    // Utiliser la date locale pour éviter les problèmes de timezone
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    
    // Récupérer TOUTES les agences avec leur statut de saisie pour aujourd'hui
    const agenciesStatusQuery = `
      SELECT 
        a.AgenceId,
        a.Nom_Agence,
        a.FK_Centre,
        c.Nom_Centre,
        CASE 
          WHEN k.AgenceId IS NOT NULL THEN 1 
          ELSE 0 
        END as hasDataToday
      FROM dbo.DIM_AGENCE a
      LEFT JOIN dbo.DIM_CENTRE c ON a.FK_Centre = c.CentreId
      LEFT JOIN (
        SELECT DISTINCT AgenceId 
        FROM dbo.FAIT_KPI_ADE 
        WHERE CONVERT(DATE, CreatedAt) = @today
      ) k ON a.AgenceId = k.AgenceId
      ORDER BY a.Nom_Agence
    `;
    
    const agenciesWithStatus = await db.query(agenciesStatusQuery, [
      { name: 'today', type: TYPES.Date, value: todayStr }
    ]);
    
    // Construire la réponse avec toutes les agences et leur statut
    const agenciesStatus = agenciesWithStatus.map(agency => ({
      agenceId: agency.AgenceId,
      nomAgence: agency.Nom_Agence,
      nomCentre: agency.Nom_Centre,
      hasDataToday: Boolean(agency.hasDataToday),
      status: agency.hasDataToday ? 'completed' : 'pending'
    }));
    
    // Calculer les statistiques
    const totalAgencies = agenciesStatus.length;
    const completedAgencies = agenciesStatus.filter(agency => agency.hasDataToday).length;
    const pendingAgencies = totalAgencies - completedAgencies;
    
    res.json({
      date: todayStr,
      agencies: agenciesStatus, // Toutes les agences avec leur statut
      summary: {
        total: totalAgencies,
        completed: completedAgencies,
        pending: pendingAgencies
      }
    });
    
  } catch (err) {
    console.error('Erreur GET /notifications/agencies-status:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du statut des agences', 
      error: err.message 
    });
  }
});

module.exports = router;


