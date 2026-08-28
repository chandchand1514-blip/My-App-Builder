const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' }); 

// Yeh route ab seedha aapka banaya hua HTML design dikhayega
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// App banne ki request yahan aayegi
app.post('/build', upload.single('appLogo'), (req, res) => {
    const appName = req.body.appName;
    const appUrl = req.body.appUrl;
    
    console.log(`Building APK for: ${appName}`);
    res.send(`Badhai ho! ${appName} ka URL (${appUrl}) server ko mil gaya hai. Cloud compilation ka logic jaldi hi add hoga.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
