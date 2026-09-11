require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

app.use(session({
    secret: 'my_secret_key_123',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://my-app-builder-82nd.onrender.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        token: accessToken
    };
    return cb(null, user);
  }
));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// App List Load karne ke liye Releases API
app.get('/api/releases', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch releases' });
    }
});

// App Delete karne ke liye route
app.delete('/delete-app/:id', async (req, res) => {
    try {
        const releaseId = req.params.id;
        await axios.delete(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/releases/${releaseId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete release' });
    }
});

// Build Trigger Handler (With Debug Logs)
const buildHandler = async (req, res) => {
    console.log("🔥 Build API Hit Ho Gayi Hai!");
    console.log("📦 Received Data:", req.body);
    
    try {
        if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
            console.log("❌ Error: GITHUB_REPO ya GITHUB_TOKEN missing hai Render mein!");
            return res.status(500).json({ success: false, error: 'GitHub Keys Missing' });
        }

        const githubResponse = await axios.post(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
            {
                event_type: 'build-app',
                client_payload: req.body
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'Node.js-Server'
                }
            }
        );

        console.log("✅ GitHub Trigger Success:", githubResponse.status);
        res.status(200).json({ success: true, message: 'Build started' });
    } catch (error) {
        console.error("❌ GitHub Trigger Failed Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

app.post('/build', buildHandler);
app.post('/api/build', buildHandler);
app.post('/build-app', buildHandler);

// Google Login Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect(`myappauth://callback?token=${req.user.token}`);
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
