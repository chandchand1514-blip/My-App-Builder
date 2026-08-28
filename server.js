const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Custom logo yahan aayega

// Server zinda hai ya nahi, yeh check karne ka route
app.get('/', (req, res) => {
    res.send("DesiStore: Web to APK Builder API is Live!");
});

// User se App ka naam aur Logo lene ka route
app.post('/build', upload.single('appLogo'), (req, res) => {
    const appName = req.body.appName;
    const appUrl = req.body.appUrl;
    
    console.log(`Building APK for: ${appName}`);
    res.send(`APK build request received for ${appName}. Cloud compiling start ho gayi hai!`);
    
    // Yahan hum aage chalkar Android SDK aur Kotlin template wala logic jodenge
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
