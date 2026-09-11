require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

// Session setup
app.use(session({
    secret: 'my_secret_key_123',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google OAuth Configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://my-app-builder-82nd.onrender.com/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // Yahan aap MongoDB mein user save kar sakte hain agar zaroorat ho
    const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        token: accessToken
    };
    return cb(null, user);
  }
));

// Default Route
app.get('/', (req, res) => {
    res.send('App Builder Backend is Live!');
});

// 1. Login Route (User is url par jayega Google login ke liye)
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Callback Route (Google login ke baad yahan aayega)
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    // YEH LINE WHITE SCREEN HATAYEGI AUR SEEDHA APP MEIN LE JAYEGI
    // req.user.token ko hum app mein bhej rahe hain taaki login verify ho sake
    res.redirect(`myappauth://callback?token=${req.user.token}`);
  }
);

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
