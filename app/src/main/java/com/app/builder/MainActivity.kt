package com.app.builder

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.net.Uri

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // Google block se bachne ke liye custom User Agent
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        }

        // Download Listener
        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            val request = android.app.DownloadManager.Request(Uri.parse(url))
            request.setMimeType(mimetype)
            request.addRequestHeader("cookie", android.webkit.CookieManager.getInstance().getCookie(url))
            request.addRequestHeader("User-Agent", userAgent)
            request.setDescription("Downloading file...")
            request.setTitle(android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype))
            request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype))
            
            val dm = getSystemService(android.content.Context.DOWNLOAD_SERVICE) as android.app.DownloadManager
            dm.enqueue(request)
            Toast.makeText(applicationContext, "Download shuru ho gaya hai...", Toast.LENGTH_SHORT).show()
        }

        // URL Interceptor (Google Login & Firebase)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                if (url == null) return false

                try {
                    // 1. Google Auth ya Firebase ka koi bhi link ho (intent ya https) usko Chrome me bhejo
                    if (url.contains("accounts.google.com") || url.contains("firebaseapp.com")) {
                        var cleanUrl = url
                        if (url.startsWith("intent://")) {
                            // intent:// ko hta kar https:// laga do
                            cleanUrl = url.replaceFirst("intent://", "https://")
                        }
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl))
                        startActivity(intent)
                        return true
                    }
                    
                    // 2. Baaki normal intents (WhatsApp, UPI, aadi)
                    if (url.startsWith("intent://") || url.startsWith("intent:")) {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else if (fallbackUrl != null) {
                            view?.loadUrl(fallbackUrl)
                        }
                        return true
                    }
                    
                    // 3. Custom links (mailto:, whatsapp://)
                    if (!url.startsWith("http://") && !url.startsWith("https://")) {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    }

                } catch (e: Exception) {
                    e.printStackTrace()
                    return true 
                }
                
                return false // Normal links app me hi khulenge
            }
        }

        webView.loadUrl("https://aapki-website.com")
    }
}
