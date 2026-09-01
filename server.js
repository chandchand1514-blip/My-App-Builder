const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style='font-family: Arial; padding: 20px; text-align: center;'>
                <h2>My App Builder Engine 🚀</h2>
                <form action='/build' method='POST' enctype='multipart/form-data'>
                    <input type='text' name='appName' placeholder='App ka Naam' required style='padding:10px; margin:5px;'><br>
                    <input type='url' name='appUrl' placeholder='Website ki Link (https://...)' required style='padding:10px; margin:5px; width:300px;'><br>
                    <p style='margin:5px; color:#555;'>App ka Logo (PNG/JPG image):</p>
                    <input type='file' name='appLogo' accept='image/*' required style='padding:10px; margin:5px;'><br>
                    <button type='submit' style='padding:10px 20px; background:blue; color:white; border:none; cursor:pointer;'>Build APK with Logo</button>
                </form>
            </body>
        </html>
    `);
});

app.post('/build', upload.single('appLogo'), async (req, res) => {
    const { appName, appUrl } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';

    // Logo ko Base64 mein convert karna taaki GitHub tak bhej sakein
    const logoBase64 = req.file ? req.file.buffer.toString('base64') : '';

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
                    appLogo: logoBase64
                }
            })
        });

        if (response.ok) {
            res.send("<h3>✅ Logo ke sath App banne ka order GitHub ko chala gaya hai!</h3><p>Apne GitHub 'Actions' tab mein dekhein.</p>");
        } else {
            const errorData = await response.text();
            res.send("<h3>❌ Kuch galti hui:</h3><p>" + errorData + "</p>");
        }
    } catch (error) {
        res.send("<h3>❌ Server Error:</h3><p>" + error.message + "</p>");
    }
});

app.listen(port, () => {
    console.log("Server is running on port " + port);
});
