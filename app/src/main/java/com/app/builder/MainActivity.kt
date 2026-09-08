          cat << EOF > "app/src/main/java/$PKG_DIR/MainActivity.kt"
          package $PKG
          
          import android.app.Activity
          import android.app.DownloadManager
          import android.content.Context
          import android.content.Intent
          import android.graphics.Color
          import android.net.Uri
          import android.os.Build
          import android.os.Bundle
          import android.os.Environment
          import android.webkit.DownloadListener
          import android.webkit.PermissionRequest
          import android.webkit.URLUtil
          import android.webkit.ValueCallback
          import android.webkit.WebChromeClient
          import android.webkit.WebSettings
          import android.webkit.WebView
          import android.webkit.WebViewClient
          import android.widget.Toast
          import com.google.android.gms.ads.AdRequest
          import com.google.android.gms.ads.AdView
          import com.google.android.gms.ads.MobileAds
          
          class MainActivity : Activity() {
              private var mFilePathCallback: ValueCallback<Array<Uri>>? = null
              private val FILECHOOSER_RESULTCODE = 103
              
              override fun onCreate(savedInstanceState: Bundle?) {
                  super.onCreate(savedInstanceState)
                  
                  try {
                      window.statusBarColor = Color.parseColor("${THEME_COLOR}")
                  } catch (e: Exception) {}
                  
                  setContentView(R.layout.activity_main)
                  
                  MobileAds.initialize(this) {}
                  val mAdView = findViewById<AdView>(R.id.adView)
                  mAdView.loadAd(AdRequest.Builder().build())
                  
                  val webView = findViewById<WebView>(R.id.webview)
                  try {
                      webView.setBackgroundColor(Color.parseColor("${BG_COLOR}"))
                  } catch (e: Exception) {}
                  
                  val webSettings = webView.settings
                  webSettings.javaScriptEnabled = true
                  webSettings.domStorageEnabled = true
                  webSettings.databaseEnabled = true
                  webSettings.allowFileAccess = true
                  webSettings.allowContentAccess = true
                  webSettings.loadWithOverviewMode = true
                  webSettings.useWideViewPort = true
                  webSettings.mediaPlaybackRequiresUserGesture = false
                  webSettings.geolocationEnabled = true
                  
                  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                      webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                  }
                  
                  // SAFE URL REDIRECT CLIENT
                  webView.webViewClient = object : WebViewClient() {
                      override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                          if (url != null && (url.contains("accounts.google.com") || url.contains("oauth") || url.startsWith("intent://"))) {
                              try {
                                  val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                  context.startActivity(intent)
                                  return true
                              } catch (e: Exception) {
                                  return false
                              }
                          }
                          return false
                      }
                  }

                  // DOWNLOAD LISTENER
                  webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
                      try {
                          val request = DownloadManager.Request(Uri.parse(url))
                          request.allowScanningByMediaScanner()
                          request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                          val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                          request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                          val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                          dm.enqueue(request)
                          Toast.makeText(applicationContext, "Downloading...", Toast.LENGTH_SHORT).show()
                      } catch (e: Exception) {}
                  })

                  webView.setWebChromeClient(object : WebChromeClient() {
                      override fun onPermissionRequest(request: PermissionRequest) {
                          request.grant(request.resources)
                      }
                      
                      override fun onShowFileChooser(webView: WebView, filePathCallback: ValueCallback<Array<Uri>>, fileChooserParams: FileChooserParams): Boolean {
                          if (mFilePathCallback != null) {
                              mFilePathCallback?.onReceiveValue(null)
                          }
                          mFilePathCallback = filePathCallback
                          val intent = fileChooserParams.createIntent()
                          try {
                              startActivityForResult(intent, FILECHOOSER_RESULTCODE)
                          } catch (e: Exception) {
                              mFilePathCallback = null
                              return false
                          }
                          return true
                      }
                  })
                  
                  webView.loadUrl("${{ github.event.client_payload.appUrl }}")
              }
              
              override fun onActivityResult(requestCode: Int, resultCode: Int, intent: Intent?) {
                  if (requestCode == FILECHOOSER_RESULTCODE) {
                      if (mFilePathCallback == null) return
                      val result = WebChromeClient.FileChooserParams.parseResult(resultCode, intent)
                      mFilePathCallback?.onReceiveValue(result)
                      mFilePathCallback = null
                  }
                  super.onActivityResult(requestCode, resultCode, intent)
              }
          }
          EOF
