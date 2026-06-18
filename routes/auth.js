const express = require('express');
const router = express.Router();

// Temporary admin login credentials.
// TODO: Replace with proper database authentication and Vault-managed secrets in the future.
const ADMIN_USERNAME = 'admin';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

  const timestamp = new Date().toISOString();

  if (username === ADMIN_USERNAME && password === adminPassword) {
    req.session.authenticated = true;
    req.session.username = username;

    console.log(JSON.stringify({
      timestamp,
      level: 'info',
      event: 'login_success',
      username: username
    }));

    return res.json({ success: true });
  } else {
    console.log(JSON.stringify({
      timestamp,
      level: 'warn',
      event: 'login_failure',
      username: username || 'unknown'
    }));

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        event: 'logout_error',
        error: err.message
      }));
      return res.status(500).json({ success: false, message: 'Failed to log out' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
