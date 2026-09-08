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

        // Google Login, Firebase & Intent Handler
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: android.webkit.WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                if (url == null) return false

                try {
                    // Firebase aur Google Auth intent ko theek karna
                    if (url.startsWith("intent://")) {
                        if (url.contains("accounts.google.com") || url.contains("firebaseapp.com")) {
                            // "intent://" ko hata kar normal HTTPS banayein aur bahar kholiye
                            val cleanUrl = url.replaceFirst("intent://", "https://")
                            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl))
                            startActivity(browserIntent)
                            return true
                        }

                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                        
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else if (fallbackUrl != null) {
                            view?.loadUrl(fallbackUrl)
                        }
                        return true
                    } 
                    // Direct links ke liye
                    else if (url.contains("accounts.google.com") || url.startsWith("whatsapp://") || url.startsWith("mailto:")) {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    return true
                }
                
                return false
            }
        }

        webView.loadUrl("https://aapki-website.com")
    }
}
