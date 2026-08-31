const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Yeh code user ka form data padhne ke kaam aata hai
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Main Page (Form)
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: Arial; padding: 20px; text-align: center;">
                <h2>My App Builder Engine 🚀</h2>
                <form action="/build" method="POST">
                    <input type="text" name="appName" placeholder="App ka Naam" required style="padding:10px; margin:5px;"><br>
                    <input type="url" name="appUrl" placeholder="Website ki Link (https://...)" required style="padding:10px; margin:5px; width:300px;"><br>
                    <button type="submit" style="padding:10px 20px; background:blue; color:white; border:none; cursor:pointer;">Build APK</button>
                </form>
            </body>
        </html>
    `);
});

// Jab user "Build APK" dabayega tab yeh chalega
app.post('/build', async (req, res) => {
    const { appName, appUrl } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Render se password lega
    
    // Aapke GitHub ka naam aur Project ka naam
    const githubUser = 'chandchand1514-blip';
    const repoName = 'My-App-Builder';

    try {
        // GitHub ko Signal bhej raha hai
        const response = await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${GITHUB_TOKEN}`
            },
            body: JSON.stringify({
                event_type: 'build-app',
                client_payload: {
                    appName: appName,
                    appUrl: appUrl
                }
            })
        });

        if (response.ok) {
            res.send(`<h3>✅ App banne ka order GitHub ko successfully chala gaya hai!</h3><p>Apne GitHub "Actions" tab mein jakar dekhein.</p>`);
        } else {
            const errorData = await response.text();
            res.send(`<h3>❌ Kuch galti hui:</h3><p>${errorData}</p>`);
        }
    } catch (error) {
        res.send(`<h3>❌ Server Error:</h3><p>${error.message}</p>`);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
