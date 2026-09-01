const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

const dir = './public/logos';
if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'public/logos/') },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(`
    <html><body style='font-family: Arial; padding: 20px; text-align: center; background: #eef2f3;'>
        <h2 style='color: #2c3e50;'>🚀 Professional App Builder (Developer Console)</h2>
        <form action='/build' method='POST' enctype='multipart/form-data' style='background: white; padding: 25px; border-radius: 12px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); text-align: left; width: 400px; max-width: 90%;'>
            
            <h3 style='margin-top: 0; color: #2980b9;'>📱 Basic Info</h3>
            <label style='font-weight: bold; color: #333;'>App ka Naam:</label><br>
            <input type='text' name='appName' placeholder='Ex: DesiStore' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #333;'>Website Link:</label><br>
            <input type='url' name='appUrl' placeholder='https://...' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #d35400;'>1. App Icon (Bahar ka photo):</label><br>
            <input type='file' name='appIcon' accept='image/*' required style='margin:8px 0 15px 0; width: 100%;'><br>

            <label style='font-weight: bold; color: #d35400;'>2. Splash Screen Logo (Andar ka photo):</label><br>
            <input type='file' name='splashLogo' accept='image/*' required style='margin:8px 0 15px 0; width: 100%;'><br>
            
            <hr style='border: 1px solid #eee; margin: 20px 0;'>
            <h3 style='margin-top: 0; color: #2980b9;'>⚙️ Advanced Settings</h3>
            
            <label style='font-weight: bold; color: #555; display: flex; align-items: center; justify-content: space-between;'>
                Splash Screen Color:
                <input type="color" name="splashColor" value="#FFFFFF" style="width: 50px; height: 35px; border: none; cursor: pointer;">
            </label>
            
            <label style='font-weight: bold; color: #555; display: flex; align-items: center; justify-content: space-between; margin-top: 10px;'>
                App Background Color:
                <input type="color" name="themeColor" value="#FFFFFF" style="width: 50px; height: 35px; border: none; cursor: pointer;">
            </label><br>

            <label style='font-weight: bold; color: #d35400; font-size: 14px;'>Package Name (Zaroori Hai):</label><br>
            <input type='text' name='packageName' placeholder='com.aapka.app' required style='padding:8px; margin:5px 0 10px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>AdMob App ID (Optional):</label><br>
            <input type='text' name='admobAppId' placeholder='ca-app-pub-...' style='padding:8px; margin:5px 0 10px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>AdMob Banner ID (Optional):</label><br>
            <input type='text' name='admobBannerId' placeholder='ca-app-pub-...' style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>OneSignal App ID (Notifications):</label><br>
            <input type='text' name='onesignalAppId' placeholder='UUID format...' style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <button type='submit' style='margin-top: 10px; padding:15px; background: #27ae60; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold; width: 100%; box-shadow: 0px 4px 6px rgba(39,174,96,0.3);'>🚀 Build Master App</button>
        </form>
    </body></html>
    `);
});

const cpUpload = upload.fields([{ name: 'appIcon', maxCount: 1 }, { name: 'splashLogo', maxCount: 1 }]);

app.post('/build', cpUpload, async (req, res) => {
    const { appName, appUrl, splashColor, themeColor, packageName, onesignalAppId, admobAppId, admobBannerId } = req.body;
    
    const finalAdAppId = admobAppId || 'ca-app-pub-3940256099942544~3347511713';
    const finalAdBannerId = admobBannerId || 'ca-app-pub-3940256099942544/6300978111';
    const finalPackageName = packageName; // Ab yeh required ho gaya hai
    const finalOneSignalId = onesignalAppId || '00000000-0000-0000-0000-000000000000';

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    const buildId = Date.now().toString(); 
    
    let iconUrl = '';
    let splashUrl = '';
    if (req.files['appIcon']) { iconUrl = 'https://' + req.get('host') + '/logos/' + req.files['appIcon'][0].filename; }
    if (req.files['splashLogo']) { splashUrl = 'https://' + req.get('host') + '/logos/' + req.files['splashLogo'][0].filename; }

    const downloadUrl = "https://github.com/" + githubUser + "/" + repoName + "/releases/download/build-" + buildId + "/app-debug.apk";

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/dispatches", {
            method: 'POST',
            headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': "token " + GITHUB_TOKEN },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: { 
                    appName: appName, 
                    appUrl: appUrl, 
                    appIconUrl: iconUrl, 
                    splashLogoUrl: splashUrl, 
                    buildId: buildId,
                    config: {
                        splashColor: splashColor || '#FFFFFF', 
                        themeColor: themeColor || '#FFFFFF', 
                        admobAppId: finalAdAppId, 
                        admobBannerId: finalAdBannerId,
                        packageName: finalPackageName, 
                        onesignalAppId: finalOneSignalId
                    }
                }
            })
        });

        if (response.ok) {
            res.send(`
            <html><body style="font-family: Arial; text-align: center; padding: 50px; background: #eef2f3;">
                <h2 id="statusText" style="color: #e67e22;">⏳ Aapka Master App Ban Raha Hai...</h2>
                <div id="loader" style="margin: 30px auto; border: 8px solid #ddd; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
                <a id="downloadBtn" href="` + downloadUrl + `" style="display: none; padding: 15px 40px; background: #27ae60; color: white; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px;">⬇️ Download APK</a>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
                <script>
                    const checkInterval = setInterval(async () => {
                        try {
                            const res = await fetch("/check-status/` + buildId + `");
                            const data = await res.json();
                            if (data.ready) {
                                clearInterval(checkInterval);
                                document.getElementById("statusText").innerText = "🎉 Aapka App Taiyar Hai!";
                                document.getElementById("statusText").style.color = "#27ae60";
                                document.getElementById("loader").style.display = "none";
                                document.getElementById("downloadBtn").style.display = "inline-block";
                            }
                        } catch (e) { }
                    }, 10000);
                </script>
            </body></html>
            `);
        } else { res.send("<h3>❌ API Error. GitHub Limit Cross Ho Gayi.</h3>"); }
    } catch (error) { res.send("<h3>❌ Error: " + error.message + "</h3>"); }
});

app.get('/check-status/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    const url = "https://github.com/chandchand1514-blip/My-App-Builder/releases/download/build-" + buildId + "/app-debug.apk";
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok || response.status === 302) { res.json({ ready: true }); } 
        else { res.json({ ready: false }); }
    } catch (e) { res.json({ ready: false }); }
});

app.listen(port, () => { console.log("Server running on port " + port); });
