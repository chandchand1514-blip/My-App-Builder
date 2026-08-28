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

        console.log(`Processing App: ${appName} for URL: ${appUrl}`);

        // Logo ko process karne ka basic logic
        const resizedLogoPath =path.join(__dirname, 'uploads', `processed-${Date.now()}.png`);
        await sharp(logoFile.path)
            .resize(192, 192)
            .toFile(resizedLogoPath);

        res.send(`Success! ${appName} ka logo resize ho gaya hai aur URL (${appUrl}) register ho gaya hai. Ab hum isme Gradle build command jodenge.`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
