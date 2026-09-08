const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Frontend HTML serve karna
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// Dummy route taaki frontend par error na aaye
app.get('/api/apps', (req, res) => {
    res.status(200).json([]); 
});

app.delete('/api/apps/:id', (req, res) => {
    res.status(200).json({ message: "App deleted" });
});

// GitHub Actions Par Build Bhejne Ka Route
app.post('/build', async (req, res) => {
    const { 
        appName, appUrl, packageName, themeColor, splashColor, 
        appIconUrl, splashLogoUrl, googleLoginEnabled, downloadSystemEnabled 
    } = req.body;

    const buildId = Date.now().toString();
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "YAHAN_APNA_GITHUB_TOKEN_DALEIN";
    const GITHUB_REPO = process.env.GITHUB_REPO || "YAHAN_APNA_GITHUB_USERNAME/REPO_NAME_DALEIN";

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
        console.error("❌ GitHub API Error:", error.message);
        res.status(500).json({ error: "Failed to trigger build on GitHub" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT} without Database`);
});
