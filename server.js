const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Photo save karne ke liye folder banana
const dir = './public/logos';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Photo ko disk par save karne ki setting
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'public/logos/') },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public')); // Photos ko link ke zariye access karne dena

app.get('/', (req, res) => {
    res.send("<html><body style='font-family: Arial; padding: 20px; text-align: center;'><h2>My App Builder Engine 🚀</h2><form action='/build' method='POST' enctype='multipart/form-data'><input type='text' name='appName' placeholder='App ka Naam' required style='padding:10px; margin:5px;'><br><input type='url' name='appUrl' placeholder='Website ki Link (https://...)' required style='padding:10px; margin:5px; width:300px;'><br><p style='margin:5px; color:#555;'>App ka Logo (Image):</p><input type='file' name='appLogo' accept='image/*' required style='padding:10px; margin:5px;'><br><button type='submit' style='padding:10px 20px; background:blue; color:white; border:none; cursor:pointer;'>Build APK with Logo</button></form></body></html>");
});

app.post('/build', upload.single('appLogo'), async (req, res) => {
    const { appName, appUrl } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';

    // Photo ki link (URL) banana
    let logoUrl = '';
    if (req.file) {
        logoUrl = 'https://' + req.get('host') + '/logos/' + req.file.filename;
    }

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/dispatches", {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': "token " + GITHUB_TOKEN
            },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: {
                    appName: appName,
                    appUrl: appUrl,
                    appLogoUrl: logoUrl // Ab hum sirf Link bhej rahe hain!
                }
            })
        });

        if (response.ok) {
            res.send("<h3>✅ Order Successfully Sent!</h3><p>Apne GitHub 'Actions' tab mein dekhein.</p>");
        } else {
            const errorData = await response.text();
            res.send("<h3>❌ GitHub API Error:</h3><p>" + errorData + "</p>");
        }
    } catch (error) {
        res.send("<h3>❌ Server Error:</h3><p>" + error.message + "</p>");
    }
});

app.listen(port, () => {
    console.log("Server is running on port " + port);
});
