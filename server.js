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
        <h2 style='color: #2c3e50;'>🚀 Professional App Builder</h2>
        
        <div style='background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; width: 400px; max-width: 90%; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); display: inline-block; text-align: left;'>
            <h3 style='margin-top: 0; color: #8e44ad;'>🔄 Aapke Purane Apps (Auto-Fill)</h3>
            <p style='font-size: 13px; color: #555; margin-bottom: 10px;'>App update karne ke liye niche click karein.</p>
            <div id='savedAppsList'></div>
        </div>
        <br>

        <form action='/build' method='POST' enctype='multipart/form-data' onsubmit='saveApp()' style='background: white; padding: 25px; border-radius: 12px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); text-align: left; width: 400px; max-width: 90%;'>
            
            <h3 style='margin-top: 0; color: #2980b9;'>📱 Basic Info</h3>
            <label style='font-weight: bold; color: #333;'>App ka Naam:</label><br>
            <input type='text' id='appName' name='appName' placeholder='Ex: DesiStore' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #333;'>Website Link:</label><br>
            <input type='url' id='appUrl' name='appUrl' placeholder='https://...' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #d35400;'>1. App Icon (Bahar ka photo):</label><br>
            <input type='file' name='appIcon' accept='image/*' required style='margin:8px 0 15px 0; width: 100%;'><br>

            <label style='font-weight: bold; color: #d35400;'>2. Splash Screen Logo (Andar ka photo):</label><br>
            <input type='file' name='splashLogo' accept='image/*' required style='margin:8px 0 15px 0; width: 100%;'><br>
            
            <hr style='border: 1px solid #eee; margin: 20px 0;'>
            <h3 style='margin-top: 0; color: #2980b9;'>⚙️ Advanced Settings</h3>
            
            <label style='font-weight: bold; color: #555; display: flex; align-items: center; justify-content: space-between;'>
                Splash Screen Color:
                <input type="color" id='splashColor' name="splashColor" value="#FFFFFF" style="width: 50px; height: 35px; border: none; cursor: pointer;">
            </label>
            
            <label style='font-weight: bold; color: #555; display: flex; align-items: center; justify-content: space-between; margin-top: 10px;'>
                App Background Color:
                <input type="color" id='themeColor' name="themeColor" value="#FFFFFF" style="width: 50px; height: 35px; border: none; cursor: pointer;">
            </label><br>

            <label style='font-weight: bold; color: #d35400; font-size: 14px;'>Package Name (Zaroori Hai):</label><br>
            <input type='text' id='packageName' name='packageName' placeholder='com.aapka.app' required style='padding:8px; margin:5px 0 10px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>AdMob App ID (Optional):</label><br>
            <input type='text' id='admobAppId' name='admobAppId' placeholder='ca-app-pub-...' style='padding:8px; margin:5px 0 10px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>AdMob Banner ID (Optional):</label><br>
            <input type='text' id='admobBannerId' name='admobBannerId' placeholder='ca-app-pub-...' style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>OneSignal App ID (Notifications):</label><br>
            <input type='text' id='onesignalAppId' name='onesignalAppId' placeholder='UUID format...' style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <button type='submit' style='margin-top: 10px; padding:15px; background: #27ae60; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold; width: 100%; box-shadow: 0px 4px 6px rgba(39,174,96,0.3);'>🚀 Build Master App</button>
        </form>

        <script>
            function saveApp() {
                var app = {
                    appName: document.getElementById('appName').value,
                    appUrl: document.getElementById('appUrl').value,
                    packageName: document.getElementById('packageName').value,
                    splashColor: document.getElementById('splashColor').value,
                    themeColor: document.getElementById('themeColor').value,
                    admobAppId: document.getElementById('admobAppId').value,
                    admobBannerId: document.getElementById('admobBannerId').value,
                    onesignalAppId: document.getElementById('onesignalAppId').value
                };
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var existingIndex = apps.findIndex(a => a.packageName === app.packageName);
                if(existingIndex >= 0) { apps[existingIndex] = app; } else { apps.push(app); }
                localStorage.setItem('myBuilderApps', JSON.stringify(apps));
            }

            function loadApps() {
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var container = document.getElementById('savedAppsList');
                if(apps.length === 0) {
                    container.innerHTML = '<p style="color:#e74c3c; font-size:14px; font-weight:bold;">Abhi tak koi app save nahi hai.</p>';
                    return;
                }
                container.innerHTML = '';
                apps.forEach(function(app) {
                    var btn = document.createElement('div');
                    btn.innerHTML = '<b>📱 ' + app.appName + '</b><br><small style="color:#ddd;">' + app.packageName + '</small>';
                    btn.style = 'background: #34495e; color: white; padding: 10px; margin: 5px; border-radius: 6px; cursor: pointer; display: inline-block; text-align: center;';
                    btn.onclick = function() {
                        document.getElementById('appName').value = app.appName;
                        document.getElementById('appUrl').value = app.appUrl;
                        document.getElementById('packageName').value = app.packageName;
                        document.getElementById('splashColor').value = app.splashColor || '#FFFFFF';
                        document.getElementById('themeColor').value = app.themeColor || '#FFFFFF';
                        document.getElementById('admobAppId').value = app.admobAppId || '';
                        document.getElementById('admobBannerId').value = app.admobBannerId || '';
                        document.getElementById('onesignalAppId').value = app.onesignalAppId || '';
                        alert('Details auto-fill ho gayi hain!');
                    };
                    container.appendChild(btn);
                });
            }
            window.onload = loadApps;
        </script>
    </body></html>
    `);
});

const cpUpload = upload.fields([{ name: 'appIcon', maxCount: 1 }, { name: 'splashLogo', maxCount: 1 }]);

app.post('/build', cpUpload, async (req, res) => {
    const { appName, appUrl, splashColor, themeColor, packageName, onesignalAppId, admobAppId, admobBannerId } = req.body;
    
    const finalAdAppId = admobAppId || 'ca-app-pub-3940256099942544~3347511713';
    const finalAdBannerId = admobBannerId || 'ca-app-pub-3940256099942544/6300978111';
    const finalPackageName = packageName;
    const finalOneSignalId = onesignalAppId || '00000000-0000-0000-0000-000000000000';

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    const buildId = Date.now().toString(); 
    
    let iconUrl = ''; let splashUrl = '';
    if (req.files['appIcon']) { iconUrl = 'https://' + req.get('host') + '/logos/' + req.files['appIcon'][0].filename; }
    if (req.files['splashLogo']) { splashUrl = 'https://' + req.get('host') + '/logos/' + req.files['splashLogo'][0].filename; }

    const downloadUrl = "https://github.com/" + githubUser + "/" + repoName + "/releases/download/build-" + buildId + "/app-release.apk";

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/dispatches", {
            method: 'POST',
            headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': "token " + GITHUB_TOKEN },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: { 
                    appName: appName, appUrl: appUrl, appIconUrl: iconUrl, splashLogoUrl: splashUrl, buildId: buildId,
                    config: { splashColor: splashColor || '#FFFFFF', themeColor: themeColor || '#FFFFFF', admobAppId: finalAdAppId, admobBannerId: finalAdBannerId, packageName: finalPackageName, onesignalAppId: finalOneSignalId }
                }
            })
        });

        if (response.ok) {
            res.send(`
            <html><body style="font-family: Arial; text-align: center; padding: 50px; background: #eef2f3;">
                <h2 id="statusText" style="color: #e67e22;">⏳ Aapka Master App Ban Raha Hai...</h2>
                <div id="loader" style="margin: 30px auto; border: 8px solid #ddd; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
                <div id="errorBox" style="display:none; background: #ffdddd; color: #d32f2f; padding: 15px; border-radius: 8px; margin: 20px auto; width: 80%; max-width: 500px; font-weight: bold; border: 1px solid #d32f2f;"></div>
                <a id="downloadBtn" href="` + downloadUrl + `" style="display: none; padding: 15px 40px; background: #27ae60; color: white; text-decoration: none; font-size: 20px; font-weight: bold; border-radius: 8px;">⬇️ Download APK</a>
                <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
                
                <script>
                    let attempts = 0;
                    const checkInterval = setInterval(async () => {
                        attempts++;
                        if (attempts > 35) { // ~6 min timeout
                            clearInterval(checkInterval);
                            document.getElementById("statusText").innerText = "⚠️ Timeout Error!";
                            document.getElementById("statusText").style.color = "#d32f2f";
                            document.getElementById("loader").style.display = "none";
                            document.getElementById("errorBox").style.display = "block";
                            document.getElementById("errorBox").innerText = "Server bohot slow hai ya hang ho gaya hai. Kripya page refresh karke dobara try karein.";
                            return;
                        }
                        
                        try {
                            const res = await fetch("/check-status/` + buildId + `");
                            const data = await res.json();
                            
                            if (data.ready) {
                                clearInterval(checkInterval);
                                document.getElementById("statusText").innerText = "🎉 Aapka App Taiyar Hai!";
                                document.getElementById("statusText").style.color = "#27ae60";
                                document.getElementById("loader").style.display = "none";
                                document.getElementById("downloadBtn").style.display = "inline-block";
                            } else if (data.failed) {
                                clearInterval(checkInterval);
                                document.getElementById("statusText").innerText = "❌ Build Fail Ho Gayi!";
                                document.getElementById("statusText").style.color = "#d32f2f";
                                document.getElementById("loader").style.display = "none";
                                document.getElementById("errorBox").style.display = "block";
                                document.getElementById("errorBox").innerText = data.reason;
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
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    const urlRelease = "https://github.com/" + githubUser + "/" + repoName + "/releases/download/build-" + buildId + "/app-release.apk";
    
    try {
        // 1. Pehle check karo ki APK ban gaya ya nahi (Success Check)
        const response = await fetch(urlRelease, { method: 'HEAD' });
        if (response.ok || response.status === 302) { 
            return res.json({ ready: true, failed: false }); 
        }

        // 2. Agar nahi bana, toh GitHub API se pucho ki kya Build Fail hui hai? (Error Check)
        if (GITHUB_TOKEN) {
            const runsUrl = "https://api.github.com/repos/" + githubUser + "/" + repoName + "/actions/runs?event=repository_dispatch&per_page=3";
            const runsRes = await fetch(runsUrl, {
                headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': "token " + GITHUB_TOKEN, 'User-Agent': 'AppBuilder-Node' }
            });
            
            if (runsRes.ok) {
                const runsData = await runsRes.json();
                if (runsData.workflow_runs && runsData.workflow_runs.length > 0) {
                    const latestRun = runsData.workflow_runs[0]; // Sabse latest build
                    if (latestRun.status === 'completed' && latestRun.conclusion === 'failure') {
                        return res.json({ 
                            ready: false, 
                            failed: true, 
                            reason: "Karan (Reason): GitHub engine photo ko process nahi kar paaya ya settings galat hain. Kripya doosri photo ke sath dobara try karein." 
                        });
                    }
                }
            }
        }
        
        // 3. Agar fail nahi hui aur bani bhi nahi hai, toh abhi process chal raha hai
        res.json({ ready: false, failed: false });
    } catch (e) { 
        res.json({ ready: false, failed: false }); 
    }
});

app.listen(port, () => { console.log("Server running on port " + port); });
