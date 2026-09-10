const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) { fs.mkdirSync(publicDir, { recursive: true }); }
app.use(express.static(publicDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// ✅ Cache-Buster API (Ab app list hamesha fresh aayegi)
app.get('/api/releases', async (req, res) => {
    try {
        const response = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_REPO}/releases?timestamp=${Date.now()}`, {
            headers: { 
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'App-Builder',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch apps" });
    }
});

app.delete('/delete-app/:id', async (req, res) => {
    const releaseId = req.params.id;
    try {
        await axios.delete(`https://api.github.com/repos/${process.env.GITHUB_REPO}/releases/${releaseId}`, {
            headers: { 
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'App-Builder'
            }
        });
        res.status(200).json({ message: "App Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete app" });
    }
});

app.post('/build', async (req, res) => {
    const { appName, appUrl, packageName, themeColor, splashColor, appIconUrl, splashLogoUrl, googleLoginEnabled, downloadSystemEnabled } = req.body;
    const buildId = Date.now().toString();
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const serverBaseUrl = req.protocol + '://' + req.get('host');

    let finalIconUrl = "https://via.placeholder.com/512";
    let finalSplashUrl = "https://via.placeholder.com/512";

    if (appIconUrl && appIconUrl.startsWith('data:image')) {
        const base64Data = appIconUrl.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(path.join(publicDir, `icon_${buildId}.png`), base64Data, 'base64');
        finalIconUrl = `${serverBaseUrl}/icon_${buildId}.png`;
    } else if (appIconUrl) { finalIconUrl = appIconUrl; }

    if (splashLogoUrl && splashLogoUrl.startsWith('data:image')) {
        const base64Data = splashLogoUrl.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(path.join(publicDir, `splash_${buildId}.png`), base64Data, 'base64');
        finalSplashUrl = `${serverBaseUrl}/splash_${buildId}.png`;
    } else if (splashLogoUrl) { finalSplashUrl = splashLogoUrl; }

    const githubPayload = {
        event_type: 'build-app',
        client_payload: {
            buildId: buildId, appName: appName, appUrl: appUrl, appIconUrl: finalIconUrl, splashLogoUrl: finalSplashUrl,
            config: { packageName: packageName, themeColor: themeColor, splashColor: splashColor, googleLoginEnabled: googleLoginEnabled, downloadSystemEnabled: downloadSystemEnabled }
        }
    };

    try {
        await axios.post(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, githubPayload, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        res.status(200).json({ message: "Build Started Successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to trigger build" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
