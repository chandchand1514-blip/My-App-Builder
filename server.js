const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Aapki HTML file serve karne ke liye
app.use(express.static(path.join(__dirname, 'public'))); // Agar index.html public folder mein hai

// ==========================================
// 1. DATABASE SETUP (MONGODB)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "YAHAN_APNA_MONGODB_URL_DALEIN";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Database Schema
const appSchema = new mongoose.Schema({
    appName: String,
    appUrl: String,
    packageName: String,
    themeColor: String,
    splashColor: String,
    downloadUrl: String,
    createdAt: { type: Date, default: Date.now }
});
const AppModel = mongoose.model('AppRecord', appSchema);

// ==========================================
// 2. API ROUTES (GET, POST, DELETE)
// ==========================================

// Frontend HTML serve karna
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// A. Purane Apps Fetch Karne Ka Route
app.get('/api/apps', async (req, res) => {
    try {
        const apps = await AppModel.find().sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch apps" });
    }
});

// B. App Delete Karne Ka Route (NAYA FEATURE)
app.delete('/api/apps/:id', async (req, res) => {
    try {
        await AppModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "App deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete app" });
    }
});

// C. GitHub Actions Par Build Bhejne Ka Route
app.post('/build', async (req, res) => {
    const { 
        appName, appUrl, packageName, themeColor, splashColor, 
        appIconUrl, splashLogoUrl, googleLoginEnabled, downloadSystemEnabled 
    } = req.body;

    const buildId = Date.now().toString();
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YAHAN_APNA_GITHUB_TOKEN_DALEIN";
    const GITHUB_REPO = process.env.GITHUB_REPO || "YAHAN_APNA_GITHUB_USERNAME/REPO_NAME_DALEIN";

    // GitHub ko bhejne wala data
    const githubPayload = {
        event_type: 'build-app',
        client_payload: {
            buildId: buildId,
            appName: appName,
            appUrl: appUrl,
            appIconUrl: appIconUrl,
            splashLogoUrl: splashLogoUrl,
            config: {
                packageName: packageName,
                themeColor: themeColor,
                splashColor: splashColor,
                googleLoginEnabled: googleLoginEnabled,
                downloadSystemEnabled: downloadSystemEnabled
            }
        }
    };

    try {
        // GitHub Actions API Call
        const githubResponse = await axios.post(
            `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
            githubPayload,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Database mein save karna
        const newAppRecord = new AppModel({
            appName,
            appUrl,
            packageName,
            themeColor,
            splashColor,
            downloadUrl: `https://github.com/${GITHUB_REPO}/releases/download/build-${buildId}/app-release.apk`
        });
        await newAppRecord.save();

        res.status(200).json({ message: "✅ Build Started Successfully!", data: githubResponse.data });

    } catch (error) {
        console.error("❌ GitHub API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to trigger build on GitHub" });
    }
});

// ==========================================
// 3. SERVER START
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
