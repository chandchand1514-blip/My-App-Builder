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
app.use(express.json({ limit: '7mb' }));
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

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    service: 'My App Builder',
    githubConfigured: Boolean(process.env.GITHUB_REPO && process.env.GITHUB_TOKEN),
    googleLoginConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    node: process.version
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


app.post('/api/upload-image', async (req, res) => {
  if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) return res.status(503).json({success:false,error:'GitHub image storage configured nahi hai'});
  const {fileName,mimeType,data}=req.body||{};
  const types={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
  if(!types[mimeType]||typeof data!=='string'||!data) return res.status(400).json({success:false,error:'PNG, JPG ya WebP image chunein'});
  const bytes=Buffer.from(data,'base64');
  if(!bytes.length||bytes.length>4*1024*1024) return res.status(413).json({success:false,error:'Image 4 MB se chhoti honi chahiye'});
  const name=String(fileName||'image').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,30)||'image';
  const assetPath='builder-assets/'+crypto.randomUUID()+'-'+name+'.'+types[mimeType];
  try{
    const response=await axios.put('https://api.github.com/repos/'+process.env.GITHUB_REPO+'/contents/'+assetPath,
      {message:'Upload app builder image asset',content:bytes.toString('base64')},
      {headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'My-App-Builder'},timeout:30000});
    res.status(201).json({success:true,url:response.data.content.download_url});
  }catch(error){console.error('Builder image upload failed:',error.response?.status||error.message);res.status(502).json({success:false,error:'Image GitHub storage mein save nahi ho saki'});}
});

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


app.get('/api/build-status/:buildId', async (req, res) => {
  const buildId = String(req.params.buildId || '');
  if (!/^build-[a-zA-Z0-9-]{8,80}$/.test(buildId)) {
    return res.status(400).json({ success: false, error: 'Invalid build ID' });
  }
  if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
    return res.status(503).json({ success: false, error: 'GitHub build service configured nahi hai' });
  }
  const headers = {
    Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'My-App-Builder'
  };
  try {
    const runsResponse = await axios.get(
      'https://api.github.com/repos/' + process.env.GITHUB_REPO + '/actions/runs',
      { headers, params: { event: 'repository_dispatch', per_page: 100 }, timeout: 15000 }
    );
    const runs = runsResponse.data.workflow_runs || [];
    const run = runs.find(item => String(item.display_title || item.name || '').includes(buildId));
    res.set('Cache-Control', 'no-store');
    if (!run) {
      return res.json({ success: true, buildId, status: 'queued', progress: 3, message: 'GitHub Actions queue mein build request dhoondh rahe hain…', steps: [] });
    }

    let jobs = [];
    try {
      const jobsResponse = await axios.get(
        'https://api.github.com/repos/' + process.env.GITHUB_REPO + '/actions/runs/' + run.id + '/jobs',
        { headers, params: { per_page: 100 }, timeout: 15000 }
      );
      jobs = jobsResponse.data.jobs || [];
    } catch (jobError) {
      console.error('Build job status lookup failed:', jobError.response?.status || jobError.message);
    }
    const steps = jobs.flatMap(job => (job.steps || []).map(step => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion
    })));
    const activeStep = steps.find(step => step.status === 'in_progress') ||
      steps.find(step => step.status === 'queued');
    const failedStep = steps.find(step => step.conclusion === 'failure');
    const finished = run.status === 'completed';
    const successful = finished && run.conclusion === 'success';
    const failed = finished && !successful;
    let release = null;
    if (successful) {
      try {
        const rel = await axios.get(
          'https://api.github.com/repos/' + process.env.GITHUB_REPO + '/releases/tags/capacitor-' + buildId,
          { headers, timeout: 12000 }
        );
        const apk = (rel.data.assets || []).find(asset => asset.name.toLowerCase().endsWith('.apk'));
        const aab = (rel.data.assets || []).find(asset => asset.name.toLowerCase().endsWith('.aab'));
        release = {
          url: rel.data.html_url,
          apkUrl: apk ? apk.browser_download_url : null,
          apkName: apk ? apk.name : null,
          aabUrl: aab ? aab.browser_download_url : null,
          aabName: aab ? aab.name : null
        };
      } catch (releaseError) {
        console.error('Build release lookup failed:', releaseError.response?.status || releaseError.message);
      }
    }
    const totalSteps = Math.max(steps.length, 1);
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progress = successful ? 100 : failed ? 100 : Math.min(95, Math.round((completedSteps / totalSteps) * 90) + (activeStep ? 5 : 0));
    res.json({
      success: true,
      buildId,
      runId: run.id,
      status: successful ? 'success' : failed ? 'failure' : run.status === 'queued' ? 'queued' : 'running',
      conclusion: run.conclusion,
      progress,
      message: successful
        ? (release?.apkUrl ? 'APK taiyar hai. Download kar sakte hain.' : 'Build successful hai; APK release link load ho raha hai.')
        : failed
          ? 'Build fail hua: ' + (failedStep?.name || run.conclusion || 'GitHub Actions error')
          : activeStep ? activeStep.name + ' chal raha hai…' : 'Android build queue mein hai…',
      currentStep: activeStep?.name || (successful ? 'Build complete' : failed ? 'Build failed' : 'Waiting for runner'),
      failedStep: failedStep?.name || null,
      steps,
      actionsUrl: run.html_url,
      release
    });
  } catch (error) {
    console.error('Build status lookup failed:', error.response?.status || error.message);
    res.status(502).json({ success: false, error: 'GitHub se build status nahi mil saka. Thodi der baad refresh karein.' });
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
  const splashImageUrl = String(p.splashImageUrl || '').trim();
  if (appIconUrl && !validHttps(appIconUrl)) return res.status(400).json({ success: false, error: 'App icon image upload sahi nahi hai' });
  if (splashImageUrl && !validHttps(splashImageUrl)) return res.status(400).json({ success: false, error: 'Splash image upload sahi nahi hai' });

  const payload = {
    appName, packageName, appUrl, callbackUrl, appLinkUrl, appIconUrl, splashImageUrl,
    versionName: String(p.versionName || '1.0.0').slice(0, 30),
    versionCode: Math.max(1, Math.min(2100000000, Number.parseInt(p.versionCode, 10) || 1)),
    orientation: ['default','portrait','landscape'].includes(p.orientation) ? p.orientation : 'default',
    buildType: p.buildType === 'both' ? 'both' : 'apk',
    themeColor: /^#[0-9a-fA-F]{6}$/.test(p.themeColor || '') ? p.themeColor : '#071a33',
    splashColor: /^#[0-9a-fA-F]{6}$/.test(p.splashColor || '') ? p.splashColor : '#071a33',
    splashDuration: [1500,2500,3000,4000].includes(Number(p.splashDuration)) ? Number(p.splashDuration) : 2500,
    statusBar: p.statusBar === 'dark' ? 'dark' : 'light',
    buildId: /^build-[a-zA-Z0-9-]{8,80}$/.test(String(p.buildId || '')) ? String(p.buildId) : 'build-' + crypto.randomUUID()
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
    res.status(202).json({ success: true, buildId: payload.buildId, message: 'Build request GitHub Actions ko bhej di gayi hai' });
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
