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

// Frontend HTML file serve karne ka code (White Screen fix)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

app.get('/api/apps', (req, res) => {
    res.status(200).json([]); 
});

app.delete('/api/apps/:id', (req, res) => {
    res.status(200).json({ message: "App deleted" });
});

app.post('/build', async (req, res) => {
    const { 
        appName, appUrl, packageName, themeColor, splashColor, 
        appIconUrl, splashLogoUrl, googleLoginEnabled, downloadSystemEnabled 
    } = req.body;

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
            buildId: buildId,
            appName: appName,
            appUrl: appUrl,
            appIconUrl: finalIconUrl,
            splashLogoUrl: finalSplashUrl,
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
        res.status(200).json({ message: "✅ Build Started Successfully!", data: githubResponse.data });
    } catch (error) {
        console.error("❌ GitHub API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to trigger build on GitHub" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
