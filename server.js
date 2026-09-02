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
    <html><head>
    <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
        #toast { visibility: hidden; min-width: 280px; background-color: #333; color: #fff; text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 1000; left: 50%; bottom: 30px; transform: translateX(-50%); box-shadow: 0px 5px 15px rgba(0,0,0,0.3); font-size: 16px; font-weight: bold; }
        #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
        @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
        @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
        
        .app-card { background: #2c3e50; color: white; padding: 12px 15px; margin: 6px; border-radius: 8px; cursor: pointer; display: inline-block; text-align: left; position: relative; min-width: 160px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .app-card:hover { transform: scale(1.02); }
        .del-btn { position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.3s; }
        .del-btn:hover { background: #c0392b; }
        
        .modal { display: none; position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(3px); }
        .modal-content { background-color: white; margin: 10vh auto; padding: 25px; border-radius: 12px; width: 400px; max-width: 90%; text-align: left; position: relative; animation: slideDown 0.3s ease-out; box-shadow: 0px 10px 30px rgba(0,0,0,0.3); }
        .close-btn { position: absolute; right: 20px; top: 15px; font-size: 28px; font-weight: bold; cursor: pointer; color: #7f8c8d; transition: 0.2s; }
        .close-btn:hover { color: #e74c3c; }
        @keyframes slideDown { from {transform: translateY(-50px); opacity: 0;} to {transform: translateY(0); opacity: 1;} }
    </style>
    </head>
    <body style='font-family: Arial; padding: 20px; text-align: center; background: #eef2f3; margin:0;'>
        <h2 style='color: #2c3e50;'>🚀 Professional App Builder</h2>
        
        <button type="button" onclick="document.getElementById('notifModal').style.display='block'" style="background: #e67e22; color: white; border: none; padding: 12px 25px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(230,126,34,0.3); transition: 0.2s;">🔔 Open Notification Panel</button>
        <br>

        <div style='background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; width: 400px; max-width: 90%; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); display: inline-block; text-align: left;'>
            <h3 style='margin-top: 0; color: #8e44ad;'>🔄 Aapke Purane Apps</h3>
            <div id='savedAppsList'></div>
        </div>
        <br>

        <form action='/build' method='POST' enctype='multipart/form-data' onsubmit='saveApp()' style='background: white; padding: 25px; border-radius: 12px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); text-align: left; width: 400px; max-width: 90%; margin: 0 auto;'>
            <h3 style='margin-top: 0; color: #2980b9;'>📱 Build New App</h3>
            
            <label style='font-weight: bold; color: #333;'>App ka Naam:</label><br>
            <input type='text' id='appName' name='appName' placeholder='Ex: DesiStore' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #333;'>Website Link:</label><br>
            <input type='url' id='appUrl' name='appUrl' placeholder='https://...' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>
            
            <label style='font-weight: bold; color: #d35400;'>1. App Icon:</label><br>
            <div style='display: flex; align-items: center; gap: 15px; margin: 8px 0 15px 0;'>
                <input type='file' name='appIcon' accept='image/*' required style='width: 100%;' onchange='previewImage(event, "iconPreview")'>
                <img id='iconPreview' style='display:none; width: 50px; height: 50px; border-radius: 8px; border: 1px solid #ccc; object-fit: cover;'/>
            </div>

            <label style='font-weight: bold; color: #d35400;'>2. Splash Logo:</label><br>
            <div style='display: flex; align-items: center; gap: 15px; margin: 8px 0 15px 0;'>
                <input type='file' name='splashLogo' accept='image/*' required style='width: 100%;' onchange='previewImage(event, "splashPreview")'>
                <img id='splashPreview' style='display:none; width: 50px; height: 50px; border-radius: 8px; border: 1px solid #ccc; object-fit: cover;'/>
            </div>
            
            <label style='font-weight: bold; color: #d35400; font-size: 14px;'>Package Name (Zaroori Hai):</label><br>
            <input type='text' id='packageName' name='packageName' placeholder='com.aapka.app' required style='padding:8px; margin:5px 0 10px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <label style='font-weight: bold; color: #555; font-size: 14px;'>OneSignal App ID:</label><br>
            <input type='text' id='onesignalAppId' name='onesignalAppId' placeholder='UUID format...' style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

            <button type='submit' style='padding:15px; background: #27ae60; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold; width: 100%;'>🚀 Build Master App</button>
        </form>

        <div id="notifModal" class="modal">
            <div class="modal-content">
                <span class="close-btn" onclick="document.getElementById('notifModal').style.display='none'">&times;</span>
                <h3 style='margin-top: 0; color: #c0392b;'>🔔 Send Live Notification</h3>
                <p style='font-size: 12px; color: #555;'>Sirf App ID aur Message daalein. System khud bhej dega.</p>
                
                <label style='font-weight: bold; color: #333; font-size: 14px;'>OneSignal App ID (Kisko bhejna hai):</label><br>
                <input type='text' id='notifAppId' placeholder='App ID yahan daalein...' style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

                <label style='font-weight: bold; color: #333; font-size: 14px;'>Title (Heading):</label><br>
                <input type='text' id='notifTitle' placeholder='Ex: Naya Update Aaya Hai!' style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

                <label style='font-weight: bold; color: #333; font-size: 14px;'>Message (Details):</label><br>
                <textarea id='notifMessage' placeholder='Type your message here...' rows="3" style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'></textarea><br>
                
                <label style='font-weight: bold; color: #333; font-size: 14px;'>Image URL (Photo link - Optional):</label><br>
                <input type='url' id='notifImage' placeholder='https://website.com/photo.jpg' style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px;'><br>

                <button onclick='sendNotification()' style='padding:15px; background: #e67e22; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold; width: 100%; box-shadow: 0px 4px 6px rgba(230,126,34,0.3);'>📢 Send Notification</button>
            </div>
        </div>

        <div id="toast"></div>

        <script>
            window.onclick = function(event) {
                var modal = document.getElementById('notifModal');
                if (event.target == modal) { modal.style.display = "none"; }
            }

            function showToast(msg, color) {
                var t = document.getElementById("toast");
                t.innerText = msg; t.style.backgroundColor = color || "#27ae60"; t.className = "show";
                setTimeout(function(){ t.className = t.className.replace("show", ""); }, 3000);
            }

            function previewImage(event, previewId) {
                var output = document.getElementById(previewId);
                if(event.target.files && event.target.files[0]) {
                    output.src = URL.createObjectURL(event.target.files[0]); output.style.display = 'block';
                } else { output.style.display = 'none'; }
            }

            function saveApp() {
                var app = {
                    appName: document.getElementById('appName').value, appUrl: document.getElementById('appUrl').value,
                    packageName: document.getElementById('packageName').value, onesignalAppId: document.getElementById('onesignalAppId').value
                };
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var existingIndex = apps.findIndex(a => a.packageName === app.packageName);
                if(existingIndex >= 0) { apps[existingIndex] = app; } else { apps.push(app); }
                localStorage.setItem('myBuilderApps', JSON.stringify(apps));
            }

            function deleteApp(packageName, event) {
                event.stopPropagation(); 
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                apps = apps.filter(a => a.packageName !== packageName);
                localStorage.setItem('myBuilderApps', JSON.stringify(apps));
                loadApps(); showToast("🗑️ App history se delete ho gaya!", "#e74c3c");
            }

            function loadApps() {
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var container = document.getElementById('savedAppsList');

                if(apps.length === 0) { container.innerHTML = '<p style="color:#7f8c8d; font-size:14px; font-style:italic;">Abhi tak koi app save nahi hai.</p>'; return; }
                container.innerHTML = '';
                apps.forEach(function(app) {
                    var card = document.createElement('div'); card.className = 'app-card';
                    card.innerHTML = \`<div onclick='fillData("\${app.packageName}")' style='padding-right: 30px;'><b>📱 \${app.appName}</b><br><small style="color:#bdc3c7;">\${app.packageName}</small></div><div class="del-btn" onclick='deleteApp("\${app.packageName}", event)'>🗑️</div>\`;
                    container.appendChild(card);
                });
            }

            function fillData(pkg) {
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var app = apps.find(a => a.packageName === pkg);
                if(app) {
                    document.getElementById('appName').value = app.appName;
                    document.getElementById('appUrl').value = app.appUrl;
                    document.getElementById('packageName').value = app.packageName;
                    document.getElementById('onesignalAppId').value = app.onesignalAppId || '';
                    document.getElementById('notifAppId').value = app.onesignalAppId || ''; 
                    showToast("✅ Details auto-fill ho gayi hain!", "#2980b9");
                }
            }

            async function sendNotification() {
                const appId = document.getElementById('notifAppId').value;
                const title = document.getElementById('notifTitle').value;
                const message = document.getElementById('notifMessage').value;
                const imageUrl = document.getElementById('notifImage').value; 

                if(!appId || !title || !message) {
                    showToast("⚠️ Kripya Title aur Message bharein!", "#e74c3c");
                    return;
                }

                showToast("⏳ Notification bheja ja raha hai...", "#f39c12");

                try {
                    const response = await fetch('/api/send-push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ appId, title, message, imageUrl })
                    });
                    const data = await response.json();
                    
                    if(data.success) {
                        showToast("✅ Notification chala gaya!", "#27ae60");
                        document.getElementById('notifTitle').value = '';
                        document.getElementById('notifMessage').value = '';
                        document.getElementById('notifImage').value = '';
                        setTimeout(() => { document.getElementById('notifModal').style.display = 'none'; }, 1000);
                    } else {
                        showToast("❌ Error: " + JSON.stringify(data.error), "#e74c3c");
                    }
                } catch (e) {
                    showToast("❌ API Key Render mein missing hai!", "#e74c3c");
                }
            }

            window.onload = loadApps;
        </script>
    </body></html>
    `);
});

app.post('/api/send-push', async (req, res) => {
    const { appId, title, message, imageUrl } = req.body;
    
    // NAYA: API Key ab GitHub se nahi, balki Render Environment se aayegi
    const SECRET_API_KEY = process.env.ONESIGNAL_API_KEY;

    if (!SECRET_API_KEY) {
        return res.json({ success: false, error: "Render par API Key save nahi hai!" });
    }

    try {
        const payload = {
            app_id: appId,
            included_segments: ["Subscribed Users"],
            headings: { en: title },
            contents: { en: message }
        };

        if (imageUrl && imageUrl.trim() !== '') {
            payload.big_picture = imageUrl; 
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + SECRET_API_KEY
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.errors) { res.json({ success: false, error: data.errors }); } 
        else { res.json({ success: true, data: data }); }
    } catch (error) { res.json({ success: false, error: error.message }); }
});

const cpUpload = upload.fields([{ name: 'appIcon', maxCount: 1 }, { name: 'splashLogo', maxCount: 1 }]);

app.post('/build', cpUpload, async (req, res) => {
    const { appName, appUrl, splashColor, themeColor, packageName, onesignalAppId, admobAppId, admobBannerId } = req.body;
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
                    appName, appUrl, appIconUrl: iconUrl, splashLogoUrl: splashUrl, buildId,
                    config: { splashColor: splashColor || '#FFFFFF', themeColor: themeColor || '#FFFFFF', admobAppId: admobAppId || '', admobBannerId: admobBannerId || '', packageName: finalPackageName, onesignalAppId: finalOneSignalId }
                }
            })
        });

        if (response.ok) {
            res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px;background:#eef2f3;">
                <h2 id="statusText" style="color: #e67e22;">⏳ Aapka Master App Ban Raha Hai...</h2>
                <a id="downloadBtn" href="` + downloadUrl + `" style="padding:15px 40px;background:#27ae60;color:white;text-decoration:none;font-size:20px;font-weight:bold;border-radius:8px;">⬇️ Download APK</a>
            </body></html>`);
        }
    } catch (error) { res.send("<h3>❌ Error: " + error.message + "</h3>"); }
});

app.listen(port, () => { console.log("Server running on port " + port); });
