const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Photo save folder
const dir = './public/logos';
if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'public/logos/') },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(`
    <html><body style='font-family: Arial; padding: 20px; text-align: center; background: #f4f7f6;'>
        <h2>🚀 Professional App Builder</h2>
        <form action='/build' method='POST' enctype='multipart/form-data' style='background: white; padding: 20px; border-radius: 10px; display: inline-block; box-shadow: 0px 4px 6px rgba(0,0,0,0.1);'>
            <input type='text' name='appName' placeholder='App ka Naam' required style='padding:10px; margin:10px; width: 80%;'><br>
            <input type='url' name='appUrl' placeholder='Website Link (https://...)' required style='padding:10px; margin:10px; width: 80%;'><br>
            <p style='color:#555; font-weight: bold;'>App ka Logo (Image):</p>
            <input type='file' name='appLogo' accept='image/*' required style='margin:10px;'><br><br>
            <button type='submit' style='padding:12px 25px; background: #28a745; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold;'>🔨 App Banao</button>
        </form>
    </body></html>
    `);
});

app.post('/build', upload.single('appLogo'), async (req, res) => {
    const { appName, appUrl } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    
    // Har app order ke liye ek unique ID
    const buildId = Date.now().toString(); 
    
    let logoUrl = '';
    if (req.file) { logoUrl = 'https://' + req.get('host') + '/logos/' + req.file.filename; }

    const downloadUrl = "https://github.com/" + githubUser + "/" + repoName + "/releases/download/build-" + buildId + "/app-debug.apk";

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/dispatches", {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': "token " + GITHUB_TOKEN
            },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: { appName: appName, appUrl: appUrl, appLogoUrl: logoUrl, buildId: buildId }
            })
        });

        if (response.ok) {
            res.send(`
            <html><body style="font-family: Arial; text-align: center; padding: 50px; background: #f4f7f6;">
                <h2 id="statusText" style="color: #d35400;">⏳ Aapka App Ban Raha Hai...</h2>
                <p id="subText" style="color: #555; font-size: 18px;">Kripya 1 se 2 minute intezaar karein. Is page ko band na karein.</p>
                
                <div id="loader" style="margin: 30px auto; border: 8px solid #ddd; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
                
                <a id="downloadBtn" href="` + downloadUrl + `" style="display: none; padding: 15px 40px; background: #28a745; color: white; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px; box-shadow: 0px 4px 6px rgba(0,0,0,0.2);">⬇️ Download APK</a>
                
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                
                <script>
                    const checkInterval = setInterval(async () => {
                        try {
                            const res = await fetch("/check-status/` + buildId + `");
                            const data = await res.json();
                            if (data.ready) {
                                clearInterval(checkInterval);
                                document.getElementById("statusText").innerText = "🎉 Aapka App Taiyar Hai!";
                                document.getElementById("statusText").style.color = "green";
                                document.getElementById("subText").innerText = "Niche button par click karke turant install karein.";
                                document.getElementById("loader").style.display = "none";
                                document.getElementById("downloadBtn").style.display = "inline-block";
                            }
                        } catch (e) { }
                    }, 10000); // Har 10 second mein background mein check karega
                </script>
            </body></html>
            `);
        } else {
            res.send("<h3>❌ API Error.</h3>");
        }
    } catch (error) {
        res.send("<h3>❌ Error: " + error.message + "</h3>");
    }
});

// Background link checker
app.get('/check-status/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    const url = "https://github.com/chandchand1514-blip/My-App-Builder/releases/download/build-" + buildId + "/app-debug.apk";
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok || response.status === 302) {
            res.json({ ready: true });
        } else {
            res.json({ ready: false });
        }
    } catch (e) { res.json({ ready: false }); }
});

app.listen(port, () => { console.log("Server running on port " + port); });
