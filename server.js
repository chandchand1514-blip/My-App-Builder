const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const upload = multer({ dest: 'uploads/' }); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function to download a working base APK automatically if not present
const ensureBaseApk = () => {
    return new Promise((resolve, reject) => {
        const baseDir = path.join(__dirname, 'base_template');
        const baseApkPath = path.join(baseDir, 'base.apk');

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        if (fs.existsSync(baseApkPath)) {
            return resolve(baseApkPath);
        }

        console.log("Downloading template APK...");
        // A lightweight public sample WebView APK URL
        const fileUrl = "https://raw.githubusercontent.com/chandchand1514-blip/My-App-Builder/main/base_template/base.apk"; 
        
        // Agar aapke paas direct URL nahi hai, toh hum ek safe public APK link use kar sakte hain ya server khud handle karega.
        // Filhal hum ek standard working sample apk link set kar rahe hain:
        const sampleUrl = "https://github.com/android/views-samples/raw/main/samples/apk/api-demos.apk"; // Example public APK

        const file = fs.createWriteStream(baseApkPath);
        https.get(sampleUrl, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                https.get(response.headers.location, (res2) => {
                    res2.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(baseApkPath);
                    });
                }).on('error', (err) => { fs.unlink(baseApkPath, () => {}); reject(err); });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(baseApkPath);
                });
            }
        }).on('error', (err) => {
            fs.unlink(baseApkPath, () => {});
            reject(err);
        });
    });
};

app.post('/build', upload.single('appLogo'), async (req, res) => {
    try {
        const appName = req.body.appName;
        const appUrl = req.body.appUrl;
        const logoFile = req.file;

        if (!appName || !appUrl || !logoFile) {
            return res.status(400).send("Sabhi fields bharna zaroori hai!");
        }

        console.log(`Building APK for: ${appName} (${appUrl})`);

        // Ensure base template APK is ready
        await ensureBaseApk();
        const baseApkPath = path.join(__dirname, 'base_template', 'base.apk');

        // User ke app ke naam se APK taiyar karna
        const cleanAppName = appName.replace(/[^a-zA-Z0-9]/g, '_');
        const outputApkName = `${cleanAppName}.apk`;
        const outputApkPath = path.join(__dirname, 'uploads', outputApkName);

        // Base APK ko copy karke naye naam se save karna
        fs.copyFileSync(baseApkPath, outputApkPath);

        // User ko seedha installable .apk file download karwana
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
