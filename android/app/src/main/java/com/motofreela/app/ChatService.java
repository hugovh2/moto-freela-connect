package com.motofreela.app;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;

public class ChatService {
    private static final String TAG = "ChatService";
    private Context context;
    private NotificationService notificationService;
    private SupabaseService supabaseService;
    
    public ChatService(Context context) {
        this.context = context;
        this.notificationService = new NotificationService(context);
        this.supabaseService = new SupabaseService(context);
    }
    
    // Interface para callbacks do chat
    public interface ChatCallback {
        void onMessageReceived(String message, String senderName, String senderId);
        void onTypingStatusChanged(String userId, boolean isTyping);
        void onMessageSent(String messageId);
        void onError(String error);
    }
    
    private ChatCallback callback;
    
    public void setChatCallback(ChatCallback callback) {
        this.callback = callback;
    }
    
    // Enviar mensagem
    public void sendMessage(String serviceId, String receiverId, String content, String messageType) {
        // Obter ID do usuário atual (você precisaria implementar isso)
        String currentUserId = "current_user_id"; // Substituir por ID real
        
        supabaseService.sendChatMessage(serviceId, currentUserId, receiverId, content, messageType, new SupabaseService.SupabaseCallback() {
            @Override
            public void onSuccess(String response) {
                Log.d(TAG, "Mensagem enviada com sucesso: " + response);
                if (callback != null) {
                    callback.onMessageSent("msg_" + System.currentTimeMillis());
                }
            }
            
            @Override
            public void onError(String error) {
                Log.e(TAG, "Erro ao enviar mensagem: " + error);
                if (callback != null) {
                    callback.onError("Erro ao enviar mensagem");
                }
            }
        });
    }
    
    // Enviar localização
    public void sendLocation(String serviceId, String receiverId, double latitude, double longitude) {
        String locationText = String.format("📍 Localização: https://www.google.com/maps?q=%.6f,%.6f", 
                                           latitude, longitude);
        sendMessage(serviceId, receiverId, locationText, "location");
    }
    
    // Enviar mensagem rápida
    public void sendQuickMessage(String serviceId, String receiverId, String quickMessage) {
        sendMessage(serviceId, receiverId, quickMessage, "text");
    }
    
    // Indicar que está digitando
    public void setTypingStatus(String serviceId, String receiverId, boolean isTyping) {
        try {
            JSONObject typingData = new JSONObject();
            typingData.put("service_id", serviceId);
            typingData.put("receiver_id", receiverId);
            typingData.put("is_typing", isTyping);
            typingData.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Status de digitação: " + typingData.toString());
            
            if (callback != null) {
                callback.onTypingStatusChanged(receiverId, isTyping);
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao criar status de digitação: " + e.getMessage());
        }
    }
    
    // Marcar mensagens como lidas
    public void markMessagesAsRead(String serviceId) {
        try {
            JSONObject readData = new JSONObject();
            readData.put("service_id", serviceId);
            readData.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Marcando mensagens como lidas: " + readData.toString());
            
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao marcar mensagens como lidas: " + e.getMessage());
        }
    }
    
    // Simular recebimento de mensagem (para testes)
    public void simulateMessageReceived(String senderName, String senderId, String content) {
        if (callback != null) {
            callback.onMessageReceived(content, senderName, senderId);
        }
        
        // Mostrar notificação
        notificationService.showRideNotification(
            "Nova mensagem de " + senderName,
            content,
            "chat_" + System.currentTimeMillis()
        );
    }
    
    // Simular status de digitação
    public void simulateTypingStatus(String userId, boolean isTyping) {
        if (callback != null) {
            callback.onTypingStatusChanged(userId, isTyping);
        }
    }
    
    // Obter mensagens rápidas pré-definidas
    public String[] getQuickMessages() {
        return new String[]{
            "🏍️ Estou a caminho!",
            "📍 Cheguei no local",
            "✅ Coleta realizada",
            "🎉 Entrega concluída",
            "⏰ Atraso de 5 minutos"
        };
    }
    
    // Verificar se há mensagens não lidas
    public void checkUnreadMessages(String serviceId) {
        // Aqui você faria uma consulta ao Supabase
        // Por enquanto, simulamos
        Log.d(TAG, "Verificando mensagens não lidas para serviço: " + serviceId);
    }
    
    // Obter histórico de mensagens
    public void loadMessageHistory(String serviceId) {
        // Aqui você carregaria o histórico do Supabase
        Log.d(TAG, "Carregando histórico de mensagens para serviço: " + serviceId);
    }
}
