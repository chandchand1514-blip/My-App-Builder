const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' }); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/build', upload.single('appLogo'), async (req, res) => {
    try {
        const appName = req.body.appName;
        const appUrl = req.body.appUrl;
        const logoFile = req.file;

        if (!appName || !appUrl || !logoFile) {
            return res.status(400).send("Sabhi fields bharna zaroori hai!");
        }

        console.log(`Building APK for: ${appName} (${appUrl})`);

        // Base APK file jo base_template folder mein rakhi hai
        const baseApkPath = path.join(__dirname, 'base_template', 'base.apk');

        if (!fs.existsSync(baseApkPath)) {
            return res.status(500).send("Server Error: base_template folder mein base.apk file nahi mili!");
        }

        // User ke app ke naam se APK file taiyar karna
        const cleanAppName = appName.replace(/[^a-zA-Z0-9]/g, '_');
        const outputApkName = `${cleanAppName}.apk`;
        const outputApkPath = path.join(__dirname, 'uploads', outputApkName);

        // Base APK ko copy karke naye naam se save karna
        fs.copyFileSync(baseApkPath, outputApkPath);

        // User ko seedha .apk file download karwana
        res.download(outputApkPath, outputApkName, (err) => {
            if (err) console.error(err);
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
