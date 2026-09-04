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
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DesiStore - Web to APK Builder</title>
    <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
        #toast { visibility: hidden; min-width: 280px; background-color: #333; color: #fff; text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 1000; left: 50%; bottom: 30px; transform: translateX(-50%); box-shadow: 0px 5px 15px rgba(0,0,0,0.3); font-size: 16px; font-weight: bold; }
        #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
        @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
        @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
        
        .app-card { background: #2c3e50; color: white; padding: 15px; margin: 8px; border-radius: 8px; display: inline-block; text-align: left; position: relative; min-width: 180px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); vertical-align: top; }
        .del-btn { position: absolute; top: 10px; right: 10px; background: #e74c3c; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: 0.3s; cursor: pointer; }
        .del-btn:hover { background: #c0392b; }
        
        .modal { display: none; position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(3px); align-items: center; justify-content: center; }
        .modal-content { background-color: white; padding: 30px; border-radius: 12px; width: 400px; max-width: 90%; text-align: center; box-shadow: 0px 10px 30px rgba(0,0,0,0.3); }
        .spinner { border: 6px solid #f3f3f3; border-top: 6px solid #27ae60; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px auto; }
    </style>
    </head>
    <body style='font-family: Arial; padding: 20px; text-align: center; background: #eef2f3; margin:0;'>
        <h2 style='color: #2c3e50;'>🚀 Professional App Builder</h2>
        
        <div style='background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; width: 500px; max-width: 95%; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); display: inline-block; text-align: left;'>
            <h3 style='margin-top: 0; color: #8e44ad;'>🔄 Aapke Purane Apps</h3>
            <div id='savedAppsList'></div>
        </div>
        <br>

        <form id="buildForm" onsubmit="submitBuildForm(event)" enctype='multipart/form-data' style='background: white; padding: 25px; border-radius: 12px; display: inline-block; box-shadow: 0px 4px 10px rgba(0,0,0,0.1); text-align: left; width: 500px; max-width: 95%; margin: 0 auto;'>
            <h3 style='margin-top: 0; color: #2980b9;'>📱 Build New App</h3>
            
            <label style='font-weight: bold; color: #333;'>App ka Naam:</label><br>
            <input type='text' id='appName' name='appName' placeholder='Ex: DesiStore' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;'><br>
            
            <label style='font-weight: bold; color: #333;'>Website Link:</label><br>
            <input type='url' id='appUrl' name='appUrl' placeholder='https://...' required style='padding:10px; margin:8px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;'><br>
            
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
            <input type='text' id='packageName' name='packageName' placeholder='com.aapka.app' required style='padding:8px; margin:5px 0 15px 0; width: 100%; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box;'><br>

            <button type='submit' style='padding:15px; background: #27ae60; color:white; border:none; border-radius: 5px; cursor:pointer; font-size: 16px; font-weight: bold; width: 100%;'>🚀 Build Master App</button>
        </form>

        <div id="buildStatusOverlay" class="modal">
            <div class="modal-content">
                <div id="spinner" class="spinner"></div>
                <h3 id="loadingText" style="color:#e67e22; margin-top:0;">⏳ Aapka App Ban Raha Hai...<br><small style="color:#7f8c8d; font-size:13px; font-weight:normal;">Aap is panel ko band kar sakte hain. App background mein banta rahega aur upar list mein aa jayega.</small></h3>
                <a id="downloadBtn" href="#" style="display:none; padding:15px 40px; background:#27ae60; color:white; text-decoration:none; font-size:18px; font-weight:bold; border-radius:8px; margin-top:15px; width:100%; box-sizing:border-box;">⬇️ Install App</a>
                <button onclick="closeModal()" style="margin-top:20px; padding:10px 20px; border:none; background:#ccc; cursor:pointer; border-radius:5px; font-weight:bold;">Close Panel</button>
            </div>
        </div>

        <div id="toast"></div>

        <script>
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

            function closeModal() { document.getElementById('buildStatusOverlay').style.display='none'; }

            function saveAppToLocal(appData) {
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                var existingIndex = apps.findIndex(a => a.packageName === appData.packageName);
                if(existingIndex >= 0) { 
                    apps[existingIndex] = { ...apps[existingIndex], ...appData }; 
                } else { 
                    apps.push(appData); 
                }
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
                    var actionHtml = '';
                    if (app.status === 'building') {
                        actionHtml = \`<div style="margin-top:10px; font-size:13px; color:#f1c40f; font-weight:bold;">⏳ Building... (Wait)</div>\`;
                    } else if (app.status === 'ready' && app.downloadUrl) {
                        actionHtml = \`<a href="\${app.downloadUrl}" style="margin-top:10px; display:inline-block; background:#2ecc71; color:white; padding:8px 15px; border-radius:5px; text-decoration:none; font-size:14px; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">⬇️ Install App</a>\`;
                    }

                    var card = document.createElement('div'); card.className = 'app-card';
                    card.innerHTML = \`<div style='padding-right: 30px;' onclick='fillData("\${app.packageName}")' style="cursor:pointer;">
                        <b>📱 \${app.appName}</b><br>
                        <small style="color:#bdc3c7;">\${app.packageName}</small>
                    </div>
                    \${actionHtml}
                    <div class="del-btn" onclick='deleteApp("\${app.packageName}", event)'>🗑️</div>\`;
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
                    showToast("✅ Details auto-fill ho gayi hain!", "#2980b9");
                }
            }

            async function submitBuildForm(event) {
                event.preventDefault();
                
                var appData = {
                    appName: document.getElementById('appName').value, 
                    appUrl: document.getElementById('appUrl').value,
                    packageName: document.getElementById('packageName').value,
                    status: 'building'
                };
                saveAppToLocal(appData);
                loadApps();
                
                const form = document.getElementById('buildForm');
                const formData = new FormData(form);

                document.getElementById('buildStatusOverlay').style.display = 'flex';
                document.getElementById('spinner').style.display = 'block';
                document.getElementById('downloadBtn').style.display = 'none';
                document.getElementById('loadingText').innerHTML = "⏳ Aapka App Ban Raha Hai...<br><small style='color:#7f8c8d; font-size:13px; font-weight:normal;'>Aap is panel ko band kar sakte hain. App background mein banta rahega aur upar list mein aa jayega.</small>";

                try {
                    const response = await fetch('/build', { method: 'POST', body: formData });
                    const data = await response.json();
                    
                    if(data.success) {
                        appData.buildId = data.buildId;
                        saveAppToLocal(appData);
                        checkBuildStatus(data.buildId, appData.packageName);
                    } else {
                        appData.status = 'failed';
                        saveAppToLocal(appData);
                        loadApps();
                        showToast("❌ Error: " + data.error, "#e74c3c");
                        closeModal();
                    }
                } catch(e) {
                    appData.status = 'failed';
                    saveAppToLocal(appData);
                    loadApps();
                    showToast("❌ Error: " + e.message, "#e74c3c");
                    closeModal();
                }
            }

            // Live status checker - updates the UI automatically
            function checkBuildStatus(buildId, packageName) {
                const interval = setInterval(async () => {
                    try {
                        const res = await fetch('/check-build/' + buildId);
                        const data = await res.json();
                        
                        if(data.ready) {
                            clearInterval(interval);
                            
                            var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                            var appIndex = apps.findIndex(a => a.packageName === packageName);
                            
                            if(appIndex >= 0) {
                                apps[appIndex].status = 'ready';
                                apps[appIndex].downloadUrl = data.downloadUrl;
                                localStorage.setItem('myBuilderApps', JSON.stringify(apps));
                                loadApps(); // Refresh card to show Install button
                                showToast("🎉 " + apps[appIndex].appName + " Ready hai!", "#27ae60");
                            }

                            if(document.getElementById('buildStatusOverlay').style.display === 'flex') {
                                document.getElementById('spinner').style.display = 'none';
                                document.getElementById('loadingText').innerHTML = "✅ Aapka App Ready Hai!";
                                document.getElementById('downloadBtn').href = data.downloadUrl;
                                document.getElementById('downloadBtn').style.display = 'inline-block';
                            }
                        }
                    } catch(e) { console.log("Checking API..."); }
                }, 10000); 
            }

            // Agar page refresh ho jaye toh jo app ban rahe the unka status check resume karega
            function resumePendingBuilds() {
                var apps = JSON.parse(localStorage.getItem('myBuilderApps') || '[]');
                apps.forEach(app => {
                    if(app.status === 'building' && app.buildId) {
                        checkBuildStatus(app.buildId, app.packageName);
                    }
                });
            }

            window.onload = function() {
                loadApps();
                resumePendingBuilds();
            };
        </script>
    </body></html>
    `);
});

const cpUpload = upload.fields([{ name: 'appIcon', maxCount: 1 }, { name: 'splashLogo', maxCount: 1 }]);

app.post('/build', cpUpload, async (req, res) => {
    const { appName, appUrl, splashColor, themeColor, packageName, admobAppId, admobBannerId } = req.body;
    const dummyOneSignalId = '00000000-0000-0000-0000-000000000000'; 
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    const buildId = Date.now().toString(); 
    
    let iconUrl = ''; let splashUrl = '';
    if (req.files['appIcon']) { iconUrl = 'https://' + req.get('host') + '/logos/' + req.files['appIcon'][0].filename; }
    if (req.files['splashLogo']) { splashUrl = 'https://' + req.get('host') + '/logos/' + req.files['splashLogo'][0].filename; }

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/dispatches", {
            method: 'POST',
            headers: { 'Accept': 'application/vnd.github.v3+json', 'Authorization': "token " + GITHUB_TOKEN },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: { 
                    appName, appUrl, appIconUrl: iconUrl, splashLogoUrl: splashUrl, buildId,
                    config: { splashColor: splashColor || '#FFFFFF', themeColor: themeColor || '#FFFFFF', admobAppId: admobAppId || '', admobBannerId: admobBannerId || '', packageName: packageName, onesignalAppId: dummyOneSignalId }
                }
            })
        });

        if (response.ok) {
            res.json({ success: true, buildId: buildId });
        } else {
            res.json({ success: false, error: "GitHub action trigger nahi ho paya." });
        }
    } catch (error) { res.json({ success: false, error: error.message }); }
});

app.get('/check-build/:buildId', async (req, res) => {
    const buildId = req.params.buildId;
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    try {
        const response = await fetch("https://api.github.com/repos/" + githubUser + "/" + repoName + "/releases/tags/build-" + buildId, {
            headers: { 'Authorization': "token " + GITHUB_TOKEN }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.assets && data.assets.length > 0) {
                return res.json({ ready: true, downloadUrl: data.assets[0].browser_download_url });
            }
        }
        res.json({ ready: false });
    } catch (error) {
        res.json({ ready: false });
    }
});

app.listen(port, () => { console.log("Server running on port " + port); });
