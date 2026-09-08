const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// HTML form se aane wale data ko read karne ke liye zaroori lines
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic test route taaki Render error na de
app.get('/', (req, res) => {
    res.send("App Builder Server Live Hai!");
});

// Main Build API jahan form submit hota hai
app.post('/build', (req, res) => {
    const appName = req.body.appName || "My App";
    const appUrl = req.body.appUrl || "https://aapki-website.com";
    
    // Checkbox ON/OFF values
    const isChromeLoginEnabled = req.body.enableChromeLogin === 'true';
    const isDownloadEnabled = req.body.enableDownload === 'true';

    // Kotlin Android Code (Dynamic variables ke sath)
    const mainActivityCode = `
package com.app.builder

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.net.Uri
import android.os.Message

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        setContentView(webView)

        // Web Panel se set kiye gaye ON/OFF options
        val isChromeLoginEnabled = ${isChromeLoginEnabled}
        val isDownloadEnabled = ${isDownloadEnabled}

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(true) 
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        }

        // --- DOWNLOAD SYSTEM ---
        if (isDownloadEnabled) {
            webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
                val request = android.app.DownloadManager.Request(Uri.parse(url))
                request.setMimeType(mimetype)
                request.addRequestHeader("cookie", android.webkit.CookieManager.getInstance().getCookie(url))
                request.addRequestHeader("User-Agent", userAgent)
                request.setTitle(android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype))
                request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype))
                val dm = getSystemService(DOWNLOAD_SERVICE) as android.app.DownloadManager
                dm.enqueue(request)
                Toast.makeText(applicationContext, "Downloading...", Toast.LENGTH_SHORT).show()
            }
        }

        // --- GOOGLE LOGIN (Javascript Popups) ---
        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
                val newWebView = WebView(this@MainActivity)
                newWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        val url = request?.url.toString()
                        
                        if (isChromeLoginEnabled && (url.contains("accounts.google.com") || url.contains("google.com") || url.contains("firebaseapp.com"))) {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            intent.setPackage("com.android.chrome")
                            try {
                                startActivity(intent)
                            } catch (e: Exception) {
                                intent.setPackage(null)
                                startActivity(intent)
                            }
                            return true
                        }
                        return false
                    }
                }
                val transport = resultMsg?.obj as WebView.WebViewTransport
                transport.webView = newWebView
                resultMsg.sendToTarget()
                return true
            }
        }

        // --- GOOGLE LOGIN (Direct Links) & APP INTENTS ---
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                if (isChromeLoginEnabled && (url.contains("accounts.google.com") || url.contains("firebaseapp.com"))) {
                    val cleanUrl = if (url.startsWith("intent://")) url.replaceFirst("intent://", "https://") else url
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl))
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    intent.setPackage("com.android.chrome")
                    try {
                        startActivity(intent)
                    } catch (e: Exception) {
                        intent.setPackage(null)
                        startActivity(intent)
                    }
                    return true
                }

                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else {
                            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    return true 
                }
                return false
            }
        }

        webView.loadUrl("${appUrl}")
    }
}
`;

    // YAHAN AAPKA GITHUB PUSH KAKNE WALA CODE AAYEGA 
    // (Jo purane setup mein aap actions/API ko bhejte the)
    
    res.send("App ka code set ho gaya hai! Build shuru ho chuka hai.");
});

// Render server ko start karne ke liye
app.listen(port, () => {
    console.log("Server port " + port + " par chal raha hai.");
});
