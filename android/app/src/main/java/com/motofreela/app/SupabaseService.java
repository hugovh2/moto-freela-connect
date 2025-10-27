package com.motofreela.app;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.*;

public class SupabaseService {
    private static final String TAG = "SupabaseService";
    private Context context;
    private OkHttpClient httpClient;
    private String supabaseUrl;
    private String supabaseKey;
    
    public SupabaseService(Context context) {
        this.context = context;
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();
        
        // Configurar URL e chave do Supabase (mesmo da versão web)
        this.supabaseUrl = context.getString(R.string.supabase_url);
        this.supabaseKey = context.getString(R.string.supabase_anon_key);
    }
    
    // Interface para callbacks do Supabase
    public interface SupabaseCallback {
        void onSuccess(String response);
        void onError(String error);
    }
    
    // Autenticação
    public void signIn(String email, String password, SupabaseCallback callback) {
        try {
            JSONObject authData = new JSONObject();
            authData.put("email", email);
            authData.put("password", password);
            
            makeRequest("POST", "/auth/v1/token?grant_type=password", authData.toString(), callback);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao criar dados de autenticação: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao fazer login");
            }
        }
    }
    
    // Registrar usuário
    public void signUp(String email, String password, String fullName, String role, SupabaseCallback callback) {
        try {
            JSONObject userData = new JSONObject();
            userData.put("email", email);
            userData.put("password", password);
            userData.put("data", new JSONObject()
                .put("full_name", fullName)
                .put("role", role)
            );
            
            makeRequest("POST", "/auth/v1/signup", userData.toString(), callback);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao criar dados de registro: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao registrar usuário");
            }
        }
    }
    
    // Obter perfil do usuário
    public void getUserProfile(String userId, SupabaseCallback callback) {
        makeRequest("GET", "/rest/v1/profiles?id=eq." + userId, null, callback);
    }
    
    // Enviar mensagem de chat
    public void sendChatMessage(String serviceId, String senderId, String receiverId, String content, String messageType, SupabaseCallback callback) {
        try {
            JSONObject messageData = new JSONObject();
            messageData.put("service_id", serviceId);
            messageData.put("sender_id", senderId);
            messageData.put("receiver_id", receiverId);
            messageData.put("content", content);
            messageData.put("message_type", messageType);
            
            makeRequest("POST", "/rest/v1/messages", messageData.toString(), callback);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao criar mensagem: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao enviar mensagem");
            }
        }
    }
    
    // Obter mensagens do chat
    public void getChatMessages(String serviceId, SupabaseCallback callback) {
        makeRequest("GET", "/rest/v1/messages?service_id=eq." + serviceId + "&order=created_at.asc", null, callback);
    }
    
    // Enviar avaliação
    public void submitRating(String serviceId, String raterId, String ratedId, int rating, String comment, SupabaseCallback callback) {
        try {
            JSONObject ratingData = new JSONObject();
            ratingData.put("service_id", serviceId);
            ratingData.put("rater_id", raterId);
            ratingData.put("rated_id", ratedId);
            ratingData.put("rating", rating);
            ratingData.put("comment", comment);
            
            makeRequest("POST", "/rest/v1/ratings", ratingData.toString(), callback);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao criar avaliação: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao enviar avaliação");
            }
        }
    }
    
    // Atualizar localização do usuário
    public void updateUserLocation(String userId, double latitude, double longitude, float accuracy, SupabaseCallback callback) {
        try {
            JSONObject locationData = new JSONObject();
            locationData.put("user_id", userId);
            locationData.put("latitude", latitude);
            locationData.put("longitude", longitude);
            locationData.put("accuracy", accuracy);
            locationData.put("updated_at", "now()");
            
            makeRequest("POST", "/rest/v1/user_locations", locationData.toString(), callback);
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao atualizar localização: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao atualizar localização");
            }
        }
    }
    
    // Obter localização do usuário
    public void getUserLocation(String userId, SupabaseCallback callback) {
        makeRequest("GET", "/rest/v1/user_locations?user_id=eq." + userId, null, callback);
    }
    
    // Upload de documento
    public void uploadDocument(String userId, String documentType, String base64Data, String format, SupabaseCallback callback) {
        try {
            // Converter base64 para bytes
            byte[] imageBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
            
            // Gerar nome do arquivo
            String filename = userId + "/" + documentType + "_" + System.currentTimeMillis() + "." + format;
            
            // Upload para Supabase Storage
            RequestBody requestBody = RequestBody.create(
                MediaType.parse("image/" + format),
                imageBytes
            );
            
            Request request = new Request.Builder()
                .url(supabaseUrl + "/storage/v1/object/documents/" + filename)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .addHeader("Content-Type", "image/" + format)
                .post(requestBody)
                .build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Erro no upload: " + e.getMessage());
                    if (callback != null) {
                        callback.onError("Erro no upload do documento");
                    }
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (response.isSuccessful()) {
                        String documentUrl = supabaseUrl + "/storage/v1/object/public/documents/" + filename;
                        if (callback != null) {
                            callback.onSuccess(documentUrl);
                        }
                    } else {
                        Log.e(TAG, "Erro no upload: " + response.code());
                        if (callback != null) {
                            callback.onError("Erro no upload: " + response.code());
                        }
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Erro ao processar documento: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao processar documento");
            }
        }
    }
    
    // Fazer requisição HTTP para Supabase
    private void makeRequest(String method, String endpoint, String body, SupabaseCallback callback) {
        try {
            Request.Builder requestBuilder = new Request.Builder()
                .url(supabaseUrl + endpoint)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .addHeader("apikey", supabaseKey)
                .addHeader("Content-Type", "application/json");
            
            if ("POST".equals(method) && body != null) {
                requestBuilder.post(RequestBody.create(MediaType.parse("application/json"), body));
            } else if ("GET".equals(method)) {
                requestBuilder.get();
            }
            
            Request request = requestBuilder.build();
            
            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(TAG, "Erro na requisição: " + e.getMessage());
                    if (callback != null) {
                        callback.onError("Erro de conexão: " + e.getMessage());
                    }
                }
                
                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    String responseBody = response.body() != null ? response.body().string() : "";
                    
                    if (response.isSuccessful()) {
                        Log.d(TAG, "Resposta do Supabase: " + responseBody);
                        if (callback != null) {
                            callback.onSuccess(responseBody);
                        }
                    } else {
                        Log.e(TAG, "Erro na resposta: " + response.code() + " - " + responseBody);
                        if (callback != null) {
                            callback.onError("Erro: " + response.code() + " - " + responseBody);
                        }
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Erro ao fazer requisição: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro interno: " + e.getMessage());
            }
        }
    }
}
