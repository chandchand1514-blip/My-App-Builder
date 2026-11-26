require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(__dirname));

app.use(session({
  name: 'myappbuilder.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://my-app-builder-82nd.onrender.com/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    // Never put Google's access token in a deep link or browser URL.
    done(null, {
      id: profile.id,
      name: profile.displayName || '',
      email: profile.emails?.[0]?.value || ''
    });
  }));
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/releases', async (req, res) => {
  try {
    if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
      return res.status(503).json({ error: 'Release service is not configured' });
    }
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases`,
      { headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, timeout: 15000 }
    );
    res.set('Cache-Control', 'no-store');
    res.json(response.data);
  } catch (error) {
    console.error('Release list failed:', error.response?.status || error.message);
    res.status(502).json({ error: 'Failed to fetch build releases' });
  }
});

// Deleting published builds is restricted to a server-side admin key.
app.delete('/delete-app/:id', async (req, res) => {
  const expected = process.env.ADMIN_API_KEY || '';
  const supplied = req.get('x-admin-api-key') || '';
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid release ID' });
  try {
    await axios.delete(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases/${req.params.id}`,
      { headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }, timeout: 15000 }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Release delete failed:', error.response?.status || error.message);
    res.status(502).json({ error: 'Failed to delete build release' });
  }
});

const buildAttempts = new Map();
const buildFields = [
  'permCamera','permMicrophone','permLocation','permNotifications','permPhotos','permFiles','permBluetooth',
  'plugCamera','plugGeolocation','plugFilesystem','plugShare','plugDevice','plugNetwork','plugPreferences',
  'plugBrowser','plugLocalNotifications','plugStatusBar','plugSplash','plugHaptics','fullScreen'
];

function validHttps(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !!u.hostname; }
  catch { return false; }
}

function buildHandler(req, res) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (buildAttempts.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 4) return res.status(429).json({ success: false, error: 'Bahut zyada build requests. Ek minute baad try karein.' });
  recent.push(now);
  buildAttempts.set(ip, recent);

  if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
    return res.status(503).json({ success: false, error: 'GitHub build service configured nahi hai' });
  }

  const p = req.body || {};
  const appName = String(p.appName || '').trim();
  const packageName = String(p.packageName || '').trim().toLowerCase();
  const appUrl = String(p.appUrl || '').trim();
  if (!appName || appName.length > 40) return res.status(400).json({ success: false, error: 'App name 1 se 40 characters ka hona chahiye' });
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName)) return res.status(400).json({ success: false, error: 'Package ID sahi format mein nahi hai' });
  if (!validHttps(appUrl)) return res.status(400).json({ success: false, error: 'Website URL valid HTTPS URL hona chahiye' });

  const callbackUrl = String(p.callbackUrl || '').trim();
  if (callbackUrl) {
    try {
      const u = new URL(callbackUrl);
      if (!u.protocol || !(u.hostname || u.pathname) || /\s/.test(callbackUrl)) throw new Error();
    } catch { return res.status(400).json({ success: false, error: 'Callback URL sahi nahi hai. Example: staffpro://auth/callback' }); }
  }
  const appLinkUrl = String(p.appLinkUrl || '').trim();
  if (appLinkUrl && !validHttps(appLinkUrl)) return res.status(400).json({ success: false, error: 'HTTPS App Link valid HTTPS URL hona chahiye' });
  const appIconUrl = String(p.appIconUrl || '').trim();
  if (appIconUrl && !validHttps(appIconUrl)) return res.status(400).json({ success: false, error: 'App icon URL HTTPS hona chahiye' });

  const payload = {
    appName, packageName, appUrl, callbackUrl, appLinkUrl, appIconUrl,
    versionName: String(p.versionName || '1.0.0').slice(0, 30),
    versionCode: Math.max(1, Math.min(2100000000, Number.parseInt(p.versionCode, 10) || 1)),
    orientation: ['default','portrait','landscape'].includes(p.orientation) ? p.orientation : 'default',
    buildType: p.buildType === 'both' ? 'both' : 'apk',
    themeColor: /^#[0-9a-fA-F]{6}$/.test(p.themeColor || '') ? p.themeColor : '#071a33',
    splashColor: /^#[0-9a-fA-F]{6}$/.test(p.splashColor || '') ? p.splashColor : '#071a33',
    splashDuration: [1500,2500,3000,4000].includes(Number(p.splashDuration)) ? Number(p.splashDuration) : 2500,
    statusBar: p.statusBar === 'dark' ? 'dark' : 'light',
    buildId: 'build-' + crypto.randomUUID()
  };
  for (const field of buildFields) payload[field] = p[field] === true;

  axios.post(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
    { event_type: 'build-app', client_payload: payload },
    { headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'My-App-Builder'
    }, timeout: 15000 }
  ).then(() => {
    res.status(202).json({ success: true, message: 'Build request GitHub Actions ko bhej di gayi hai' });
  }).catch(error => {
    console.error('GitHub build dispatch failed:', error.response?.status || error.message);
    res.status(502).json({ success: false, error: 'GitHub par build request nahi ja saki' });
  });
}

app.post(['/build', '/api/build', '/build-app'], buildHandler);

app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).send('Google login is not configured for this Builder.');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return res.redirect('/');
  passport.authenticate('google', { failureRedirect: '/' })(req, res, () => {
    res.redirect('/?login=success');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`My App Builder server listening on port ${PORT}`));
