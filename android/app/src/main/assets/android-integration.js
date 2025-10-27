// Android Integration for MotoFreela
// This file provides JavaScript interfaces for native Android functionality

class AndroidIntegration {
    constructor() {
        this.isAndroid = window.Android !== undefined;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for Android location updates
        window.addEventListener('android-location', (event) => {
            this.handleLocationUpdate(event.detail);
        });
        
        // Listen for Android location errors
        window.addEventListener('android-location-error', (event) => {
            this.handleLocationError(event.detail.error);
        });
        
        // Listen for Android navigation events
        window.addEventListener('android-navigation', (event) => {
            this.handleNavigation(event.detail);
        });
    }
    
    // Location tracking
    startLocationTracking() {
        if (this.isAndroid) {
            window.Android.startLocationTracking();
        }
    }
    
    stopLocationTracking() {
        if (this.isAndroid) {
            window.Android.stopLocationTracking();
        }
    }
    
    hasLocationPermission() {
        if (this.isAndroid) {
            return window.Android.hasLocationPermission();
        }
        return false;
    }
    
    isLocationEnabled() {
        if (this.isAndroid) {
            return window.Android.isLocationEnabled();
        }
        return false;
    }
    
    handleLocationUpdate(location) {
        // Dispatch to Capacitor Geolocation plugin
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
            // Update location in the app
            console.log('Android location update:', location);
            
            // Trigger custom event for the app to handle
            window.dispatchEvent(new CustomEvent('native-location-update', {
                detail: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    timestamp: Date.now()
                }
            }));
        }
    }
    
    handleLocationError(error) {
        console.error('Android location error:', error);
        
        // Trigger custom event for the app to handle
        window.dispatchEvent(new CustomEvent('native-location-error', {
            detail: { error }
        }));
    }
    
    handleNavigation(data) {
        console.log('Android navigation:', data);
        
        // Navigate to specific service
        if (data.serviceId) {
            window.dispatchEvent(new CustomEvent('navigate-to-service', {
                detail: { serviceId: data.serviceId }
            }));
        }
    }
    
    // Notifications
    showNotification(title, message, serviceId) {
        if (this.isAndroid) {
            window.Android.showNotification(title, message, serviceId);
        }
    }
    
    showLocationNotification(motoboyName, status) {
        if (this.isAndroid) {
            window.Android.showLocationNotification(motoboyName, status);
        }
    }
    
    showEmergencyNotification(serviceId, location) {
        if (this.isAndroid) {
            window.Android.showEmergencyNotification(serviceId, location);
        }
    }
    
    // Camera integration
    openCamera() {
        if (this.isAndroid) {
            // This would integrate with Capacitor Camera plugin
            return window.Capacitor.Plugins.Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: 'uri'
            });
        }
        return Promise.reject('Camera not available');
    }
    
    // Haptic feedback
    vibrate(duration = 100) {
        if (this.isAndroid && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            window.Capacitor.Plugins.Haptics.vibrate({ duration });
        }
    }
    
    // Network status
    getNetworkStatus() {
        if (this.isAndroid && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network) {
            return window.Capacitor.Plugins.Network.getStatus();
        }
        return Promise.resolve({ connected: true, connectionType: 'wifi' });
    }
    
    // Chat functionality
    sendMessage(serviceId, receiverId, content, messageType = 'text') {
        if (this.isAndroid) {
            window.Android.sendMessage(serviceId, receiverId, content, messageType);
        }
    }
    
    sendLocation(serviceId, receiverId, latitude, longitude) {
        if (this.isAndroid) {
            window.Android.sendLocation(serviceId, receiverId, latitude, longitude);
        }
    }
    
    setTypingStatus(serviceId, receiverId, isTyping) {
        if (this.isAndroid) {
            window.Android.setTypingStatus(serviceId, receiverId, isTyping);
        }
    }
    
    markMessagesAsRead(serviceId) {
        if (this.isAndroid) {
            window.Android.markMessagesAsRead(serviceId);
        }
    }
    
    // Rating functionality
    submitRating(serviceId, ratedUserId, rating, comment = '') {
        if (this.isAndroid) {
            window.Android.submitRating(serviceId, ratedUserId, rating, comment);
        }
    }
    
    submitQuickRating(serviceId, ratedUserId, rating) {
        if (this.isAndroid) {
            window.Android.submitQuickRating(serviceId, ratedUserId, rating);
        }
    }
    
    // Gamification functionality
    addExperience(amount, reason) {
        if (this.isAndroid) {
            window.Android.addExperience(amount, reason);
        }
    }
    
    checkAllBadges(userId) {
        if (this.isAndroid) {
            window.Android.checkAllBadges(userId);
        }
    }
    
    // Document functionality
    uploadDocument(userId, documentType, base64Data, format) {
        if (this.isAndroid) {
            window.Android.uploadDocument(userId, documentType, base64Data, format);
        }
    }
    
    isValidDocumentType(documentType) {
        if (this.isAndroid) {
            return window.Android.isValidDocumentType(documentType);
        }
        return false;
    }
    
    isValidFileSize(base64Data) {
        if (this.isAndroid) {
            return window.Android.isValidFileSize(base64Data);
        }
        return false;
    }
}

// Initialize Android integration
const androidIntegration = new AndroidIntegration();

// Export for use in the app
window.AndroidIntegration = androidIntegration;
