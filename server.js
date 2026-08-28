const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

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

        // 1. Logo save karein
        const logoOutputPath = path.join(__dirname, 'base_template', 'app_logo.png');
        await sharp(logoFile.path)
            .resize(192, 192)
            .toFile(logoOutputPath);

        // 2. URL save karein
        const urlOutputPath = path.join(__dirname, 'base_template', 'url.txt');
        fs.writeFileSync(urlOutputPath, appUrl);

        // 3. Template folder ko ZIP karke user ko download dena
        const zipName = `${appName.replace(/\s+/g, '_')}_App.zip`;
        const zipPath = path.join(__dirname, 'uploads', zipName);
        
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('archiver', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipPath, zipName, (err) => {
                if (err) console.error(err);
            });
        });

        archive.pipe(output);
        archive.directory(path.join(__dirname, 'base_template'), false);
        archive.finalize();

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
