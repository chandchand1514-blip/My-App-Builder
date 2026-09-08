package com.app.builder

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import android.net.Uri
import java.net.URISyntaxException

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        }

        // Download Listener
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

        // Strict Intent Interceptor
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.contains("accounts.google.com")) {
                        view?.context?.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    }
                    return false // Normal links open inside the app
                }

                // Forcefully handle intent:// without Android 11+ package visibility checks
                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                    val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                    
                    try {
                        view?.context?.startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        if (fallbackUrl != null) {
                            view?.loadUrl(fallbackUrl)
                            return true
                        }
                    }
                } catch (e: URISyntaxException) {
                    e.printStackTrace()
                }
                
                // Return true forces WebView to stop, completely preventing the ERR_UNKNOWN_URL_SCHEME page
                return true 
            }
        }

        webView.loadUrl("https://aapki-website.com")
    }
}
