require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();

// 1. Data Middlewares (Website aur Server ke connection ke liye)
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// 2. Session Setup
app.use(session({
    secret: 'my_secret_key_123',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// 3. Google OAuth Setup (White screen bypass)
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

// 4. Website Route (Aapka index.html design dikhane ke liye)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 5. Build App Trigger (GitHub Actions ko button dabate hi start karne ke liye)
const buildHandler = async (req, res) => {
    try {
        if (!process.env.GITHUB_REPO || !process.env.GITHUB_TOKEN) {
            return res.status(500).json({ success: false, error: 'GitHub Keys Missing' });
        }
        await axios.post(
            `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
            {
                event_type: 'build-app',
                client_payload: req.body
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        res.status(200).json({ success: true, message: 'Build started' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: 'Build trigger failed' });
    }
};

// Website kisi bhi link par request bheje, build trigger ho jayega
app.post('/build', buildHandler);
app.post('/api/build', buildHandler);
app.post('/build-app', buildHandler);

// 6. Google Login Routes (App mein directly wapas bhejegi)
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect(`myappauth://callback?token=${req.user.token}`);
  }
);

// 7. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
