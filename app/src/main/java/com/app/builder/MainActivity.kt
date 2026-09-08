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

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // Firebase Pop-ups allow karne ke liye
            javaScriptCanOpenWindowsAutomatically = true 
            setSupportMultipleWindows(true)
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        }

        // WebChromeClient Firebase login pop-ups ko block hone se rokta hai
        webView.webChromeClient = WebChromeClient()

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

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                
                if (url.contains("accounts.google.com") || url.contains("firebaseapp.com")) {
                    val cleanUrl = if (url.startsWith("intent://")) url.replaceFirst("intent://", "https://") else url
                    view?.context?.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(cleanUrl)))
                    return true
                }

                if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                        
                        if (intent.resolveActivity(packageManager) != null) {
                            startActivity(intent)
                        } else if (fallbackUrl != null) {
                            view?.loadUrl(fallbackUrl)
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

        webView.loadUrl("https://aapki-website.com")
    }
}
