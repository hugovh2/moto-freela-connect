package com.motofreela.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import android.util.Log;

public class LocationService implements LocationListener {
    private static final String TAG = "LocationService";
    private static final long MIN_TIME_MS = 5000; // 5 segundos
    private static final float MIN_DISTANCE_M = 10; // 10 metros
    
    private Context context;
    private LocationManager locationManager;
    private LocationCallback callback;
    private SupabaseService supabaseService;
    
    public interface LocationCallback {
        void onLocationUpdate(double latitude, double longitude, float accuracy);
        void onLocationError(String error);
    }
    
    public LocationService(Context context) {
        this.context = context;
        this.locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        this.supabaseService = new SupabaseService(context);
    }
    
    public void setLocationCallback(LocationCallback callback) {
        this.callback = callback;
    }
    
    public boolean hasLocationPermission() {
        return ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
    
    public boolean isLocationEnabled() {
        return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || 
               locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
    }
    
    public void startLocationUpdates() {
        if (!hasLocationPermission()) {
            if (callback != null) {
                callback.onLocationError("Permissão de localização negada");
            }
            return;
        }
        
        if (!isLocationEnabled()) {
            if (callback != null) {
                callback.onLocationError("GPS desabilitado");
            }
            return;
        }
        
        try {
            // Tentar GPS primeiro
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    MIN_TIME_MS,
                    MIN_DISTANCE_M,
                    this
                );
            }
            
            // Fallback para Network
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    MIN_TIME_MS,
                    MIN_DISTANCE_M,
                    this
                );
            }
            
            Log.d(TAG, "Localização iniciada");
        } catch (SecurityException e) {
            Log.e(TAG, "Erro de permissão: " + e.getMessage());
            if (callback != null) {
                callback.onLocationError("Erro de permissão de localização");
            }
        }
    }
    
    public void stopLocationUpdates() {
        try {
            locationManager.removeUpdates(this);
            Log.d(TAG, "Localização parada");
        } catch (SecurityException e) {
            Log.e(TAG, "Erro ao parar localização: " + e.getMessage());
        }
    }
    
    public Location getLastKnownLocation() {
        if (!hasLocationPermission()) {
            return null;
        }
        
        try {
            Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
            Location networkLocation = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
            
            // Retornar a localização mais recente
            if (gpsLocation != null && networkLocation != null) {
                return gpsLocation.getTime() > networkLocation.getTime() ? gpsLocation : networkLocation;
            } else if (gpsLocation != null) {
                return gpsLocation;
            } else {
                return networkLocation;
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Erro ao obter última localização: " + e.getMessage());
            return null;
        }
    }
    
    @Override
    public void onLocationChanged(Location location) {
        if (location != null && callback != null) {
            Log.d(TAG, "Nova localização: " + location.getLatitude() + ", " + location.getLongitude());
            
            // Notificar callback local
            callback.onLocationUpdate(
                location.getLatitude(),
                location.getLongitude(),
                location.getAccuracy()
            );
            
            // Enviar para Supabase (você precisaria do userId real)
            String currentUserId = "current_user_id"; // Substituir por ID real
            supabaseService.updateUserLocation(
                currentUserId,
                location.getLatitude(),
                location.getLongitude(),
                location.getAccuracy(),
                new SupabaseService.SupabaseCallback() {
                    @Override
                    public void onSuccess(String response) {
                        Log.d(TAG, "Localização enviada para Supabase: " + response);
                    }
                    
                    @Override
                    public void onError(String error) {
                        Log.e(TAG, "Erro ao enviar localização para Supabase: " + error);
                    }
                }
            );
        }
    }
    
    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d(TAG, "Status do provider " + provider + " mudou para: " + status);
    }
    
    @Override
    public void onProviderEnabled(String provider) {
        Log.d(TAG, "Provider " + provider + " habilitado");
    }
    
    @Override
    public void onProviderDisabled(String provider) {
        Log.d(TAG, "Provider " + provider + " desabilitado");
        if (callback != null) {
            callback.onLocationError("GPS desabilitado");
        }
    }
}
