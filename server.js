const express = require('express');
const multer = require('multer');
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
        if (!appName) return res.status(400).send("App name zaroori hai!");

        const baseApkPath = path.join(__dirname, 'base_template', 'base.apk');

        // Check if base APK exists
        if (!fs.existsSync(baseApkPath)) {
            return res.status(500).send("Error: GitHub par base.apk nahi mili!");
        }

        // Check if it is a real APK (size check)
        const stats = fs.statSync(baseApkPath);
        if (stats.size < 50000) { 
             return res.status(500).send("Error: Upload ki gayi base.apk asli nahi hai (Size bahut kam hai). Kripya MBs wali asli APK upload karein.");
        }

        const cleanAppName = appName.replace(/[^a-zA-Z0-9]/g, '_');
        const outputApkName = `${cleanAppName}.apk`;
        const outputApkPath = path.join(__dirname, 'uploads', outputApkName);

        // Asli APK copy karna
        fs.copyFileSync(baseApkPath, outputApkPath);

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
