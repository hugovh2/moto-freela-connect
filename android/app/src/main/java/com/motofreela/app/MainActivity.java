package com.motofreela.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private NotificationService notificationService;
    private LocationService locationService;
    private ChatService chatService;
    private RatingService ratingService;
    private GamificationService gamificationService;
    private DocumentService documentService;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize services
        notificationService = new NotificationService(this);
        locationService = new LocationService(this);
        chatService = new ChatService(this);
        ratingService = new RatingService(this);
        gamificationService = new GamificationService(this);
        documentService = new DocumentService(this);
        
        // Request permissions
        requestPermissions();
        
        // Configure WebView for better performance
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings webSettings = webView.getSettings();
            
            // Enable JavaScript
            webSettings.setJavaScriptEnabled(true);
            
            // Enable DOM storage
            webSettings.setDomStorageEnabled(true);
            
            // Enable database storage
            webSettings.setDatabaseEnabled(true);
            
            // Set cache mode
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Enable mixed content
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable hardware acceleration
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
            
            // Enable zoom controls
            webSettings.setBuiltInZoomControls(true);
            webSettings.setDisplayZoomControls(false);
            
            // Enable support for multiple windows
            webSettings.setSupportMultipleWindows(true);
            
            // Enable support for JavaScript alerts
            webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
            
            // Add JavaScript interface for native functionality
            webView.addJavascriptInterface(new WebAppInterface(), "Android");
            
            // Load Android integration script
            webView.evaluateJavascript(
                "if (typeof AndroidIntegration === 'undefined') { " +
                "  const script = document.createElement('script'); " +
                "  script.src = 'file:///android_asset/android-integration.js'; " +
                "  document.head.appendChild(script); " +
                "}",
                null
            );
        }
        
        // Handle intent extras
        handleIntentExtras(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntentExtras(intent);
    }
    
    private void handleIntentExtras(Intent intent) {
        if (intent != null) {
            String serviceId = intent.getStringExtra("serviceId");
            boolean isEmergency = intent.getBooleanExtra("emergency", false);
            
            if (serviceId != null) {
                // Navigate to specific service
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('android-navigation', { detail: { serviceId: '" + serviceId + "' } }));",
                        null
                    );
                }
            }
            
            if (isEmergency) {
                // Handle emergency notification
                notificationService.showEmergencyNotification(serviceId, "Localização de emergência");
            }
        }
    }
    
    private void requestPermissions() {
        List<String> permissions = new ArrayList<>();
        
        // Location permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }
        
        // Camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        
        // Storage permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        }
        
        // Notification permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        
        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            
            if (allPermissionsGranted) {
                // All permissions granted, start location service
                startLocationTracking();
            }
        }
    }
    
    private void startLocationTracking() {
        locationService.setLocationCallback(new LocationService.LocationCallback() {
            @Override
            public void onLocationUpdate(double latitude, double longitude, float accuracy) {
                // Send location to web app
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('android-location', { " +
                        "detail: { latitude: " + latitude + ", longitude: " + longitude + ", accuracy: " + accuracy + " } " +
                        "}));",
                        null
                    );
                }
            }
            
            @Override
            public void onLocationError(String error) {
                // Send error to web app
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('android-location-error', { " +
                        "detail: { error: '" + error + "' } " +
                        "}));",
                        null
                    );
                }
            }
        });
        
        locationService.startLocationUpdates();
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (locationService != null) {
            locationService.stopLocationUpdates();
        }
    }
    
    // JavaScript interface for native functionality
    public class WebAppInterface {
        @JavascriptInterface
        public void showNotification(String title, String message, String serviceId) {
            runOnUiThread(() -> {
                notificationService.showRideNotification(title, message, serviceId);
            });
        }
        
        @JavascriptInterface
        public void showLocationNotification(String motoboyName, String status) {
            runOnUiThread(() -> {
                notificationService.showLocationUpdateNotification(motoboyName, status);
            });
        }
        
        @JavascriptInterface
        public void showEmergencyNotification(String serviceId, String location) {
            runOnUiThread(() -> {
                notificationService.showEmergencyNotification(serviceId, location);
            });
        }
        
        @JavascriptInterface
        public void startLocationTracking() {
            runOnUiThread(() -> {
                startLocationTracking();
            });
        }
        
        @JavascriptInterface
        public void stopLocationTracking() {
            runOnUiThread(() -> {
                if (locationService != null) {
                    locationService.stopLocationUpdates();
                }
            });
        }
        
        @JavascriptInterface
        public boolean hasLocationPermission() {
            return locationService != null && locationService.hasLocationPermission();
        }
        
        @JavascriptInterface
        public boolean isLocationEnabled() {
            return locationService != null && locationService.isLocationEnabled();
        }
        
        // Chat methods
        @JavascriptInterface
        public void sendMessage(String serviceId, String receiverId, String content, String messageType) {
            runOnUiThread(() -> {
                if (chatService != null) {
                    chatService.sendMessage(serviceId, receiverId, content, messageType);
                }
            });
        }
        
        @JavascriptInterface
        public void sendLocation(String serviceId, String receiverId, double latitude, double longitude) {
            runOnUiThread(() -> {
                if (chatService != null) {
                    chatService.sendLocation(serviceId, receiverId, latitude, longitude);
                }
            });
        }
        
        @JavascriptInterface
        public void setTypingStatus(String serviceId, String receiverId, boolean isTyping) {
            runOnUiThread(() -> {
                if (chatService != null) {
                    chatService.setTypingStatus(serviceId, receiverId, isTyping);
                }
            });
        }
        
        @JavascriptInterface
        public void markMessagesAsRead(String serviceId) {
            runOnUiThread(() -> {
                if (chatService != null) {
                    chatService.markMessagesAsRead(serviceId);
                }
            });
        }
        
        // Rating methods
        @JavascriptInterface
        public void submitRating(String serviceId, String ratedUserId, int rating, String comment) {
            runOnUiThread(() -> {
                if (ratingService != null) {
                    ratingService.submitRatingWithComment(serviceId, ratedUserId, rating, comment);
                }
            });
        }
        
        @JavascriptInterface
        public void submitQuickRating(String serviceId, String ratedUserId, int rating) {
            runOnUiThread(() -> {
                if (ratingService != null) {
                    ratingService.submitQuickRating(serviceId, ratedUserId, rating);
                }
            });
        }
        
        // Gamification methods
        @JavascriptInterface
        public void addExperience(int amount, String reason) {
            runOnUiThread(() -> {
                if (gamificationService != null) {
                    gamificationService.addExperience(amount, reason);
                }
            });
        }
        
        @JavascriptInterface
        public void checkAllBadges(String userId) {
            runOnUiThread(() -> {
                if (gamificationService != null) {
                    gamificationService.checkAllBadges(userId);
                }
            });
        }
        
        // Document methods
        @JavascriptInterface
        public void uploadDocument(String userId, String documentType, String base64Data, String format) {
            runOnUiThread(() -> {
                if (documentService != null) {
                    documentService.uploadDocument(userId, documentType, base64Data, format);
                }
            });
        }
        
        @JavascriptInterface
        public boolean isValidDocumentType(String documentType) {
            return documentService != null && documentService.isValidDocumentType(documentType);
        }
        
        @JavascriptInterface
        public boolean isValidFileSize(String base64Data) {
            return documentService != null && documentService.isValidFileSize(base64Data);
        }
    }
}
