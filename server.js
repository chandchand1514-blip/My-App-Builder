// server.js ke andar
app.post('/build', (req, res) => {
    // 1. HTML form se data receive karna
    const appName = req.body.appName;
    const appUrl = req.body.appUrl;
    
    // Agar checkbox checked hoga toh "true" aayega, warna checkbox ki value false ho jayegi
    const isChromeLoginEnabled = req.body.enableChromeLogin === 'true';
    const isDownloadEnabled = req.body.enableDownload === 'true';

    // 2. Dynamic MainActivity.kt Code Banana (Backticks ` ` ke andar)
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

        // Form se aaya website URL yahan set hoga
        webView.loadUrl("${appUrl}")
    }
}
`;

    // 3. Ab is 'mainActivityCode' string ko aap apne GitHub API block mein 
    // content update ke liye bhej sakte hain.
    
    // Yahan GitHub Actions ko trigger karne ka code aayega...
    
    res.send("GitHub par code successfully bhej diya gaya hai!");
});
