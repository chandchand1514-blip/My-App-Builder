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

        const logoOutputPath = path.join(__dirname, 'base_template', 'app_logo.png');
        await sharp(logoFile.path)
            .resize(192, 192)
            .toFile(logoOutputPath);

        const urlOutputPath = path.join(__dirname, 'base_template', 'url.txt');
        fs.writeFileSync(urlOutputPath, appUrl);

        res.send(`Badhai ho! ${appName} ka URL aur Logo template ke andar successfully inject ho gaye hain.`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
