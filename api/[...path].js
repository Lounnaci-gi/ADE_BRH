/**
 * Vercel Serverless Proxy — ADE_BRH
 * Intercepte toutes les requêtes /api/* et les transmet au backend local via le tunnel (ngrok/cloudflare).
 * Le navigateur ne contacte jamais ngrok directement → plus de problème CORS.
 *
 * Variable d'environnement requise sur Vercel :
 *   BACKEND_URL = URL de base du tunnel (ex: https://xxxx.ngrok-free.app)
 *                 SANS slash final, SANS "/api"
 */

module.exports = async (req, res) => {
  const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/$/, '');

  // === Répondre directement aux pré-requêtes CORS (OPTIONS) ===
  // Le navigateur envoie OPTIONS avant chaque vrai appel cross-origin.
  // On répond ici sans contacter ngrok pour éviter l'interstitiel.
  const origin = req.headers['origin'] || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Role, X-User-Agence, X-User-Id, ' +
    'ngrok-skip-browser-warning, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === Vérification de la configuration ===
  if (!BACKEND_URL) {
    return res.status(500).json({
      error: 'Backend non configuré',
      message: 'La variable d\'environnement BACKEND_URL n\'est pas définie sur Vercel.',
    });
  }

  // === Construction de l'URL cible ===
  // req.url = /api/login?foo=bar  → targetUrl = BACKEND_URL/api/login?foo=bar
  const targetUrl = `${BACKEND_URL}${req.url}`;

  // === Transmission des headers ===
  const forwardHeaders = { ...req.headers };
  // Supprimer les headers qui ne doivent pas être transmis
  delete forwardHeaders['host'];
  delete forwardHeaders['connection'];
  delete forwardHeaders['transfer-encoding'];
  // Forcer le bypass de l'interstitiel ngrok (requête serveur→serveur)
  forwardHeaders['ngrok-skip-browser-warning'] = 'true';
  // Forcer JSON pour le content-type si body présent
  const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes((req.method || '').toUpperCase());
  if (hasBody && req.body !== undefined) {
    forwardHeaders['content-type'] = 'application/json';
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    if (hasBody && req.body !== undefined) {
      fetchOptions.body = typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
    }

    const backendResponse = await fetch(targetUrl, fetchOptions);

    // === Transmission des headers de réponse ===
    backendResponse.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      // Ignorer les headers de connexion et les headers CORS (déjà définis ci-dessus)
      if (['transfer-encoding', 'connection', 'keep-alive',
           'access-control-allow-origin', 'access-control-allow-methods',
           'access-control-allow-headers', 'access-control-allow-credentials'].includes(lk)) {
        return;
      }
      res.setHeader(key, value);
    });

    res.status(backendResponse.status);
    const body = await backendResponse.text();
    res.send(body);

  } catch (error) {
    console.error('[Proxy] Erreur de connexion au backend:', error.message, '→', targetUrl);
    res.status(502).json({
      error: 'Backend inaccessible',
      message: error.message,
      target: targetUrl,
      hint: 'Vérifiez que le backend Node.js tourne et que le tunnel (ngrok/cloudflare) est actif.',
    });
  }
};
