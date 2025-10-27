package com.motofreela.app;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.List;

public class RatingService {
    private static final String TAG = "RatingService";
    private Context context;
    private NotificationService notificationService;
    private SupabaseService supabaseService;
    
    public RatingService(Context context) {
        this.context = context;
        this.notificationService = new NotificationService(context);
        this.supabaseService = new SupabaseService(context);
    }
    
    // Interface para callbacks de avaliação
    public interface RatingCallback {
        void onRatingSubmitted(String ratingId, int rating, String comment);
        void onRatingReceived(int rating, String comment, String raterName);
        void onError(String error);
    }
    
    private RatingCallback callback;
    
    public void setRatingCallback(RatingCallback callback) {
        this.callback = callback;
    }
    
    // Tags positivas para avaliações
    public List<String> getPositiveTags() {
        List<String> tags = new ArrayList<>();
        tags.add("Pontual");
        tags.add("Educado");
        tags.add("Cuidadoso");
        tags.add("Rápido");
        tags.add("Confiável");
        tags.add("Profissional");
        return tags;
    }
    
    // Tags negativas para avaliações
    public List<String> getNegativeTags() {
        List<String> tags = new ArrayList<>();
        tags.add("Atrasado");
        tags.add("Rude");
        tags.add("Descuidado");
        tags.add("Lento");
        tags.add("Não confiável");
        return tags;
    }
    
    // Enviar avaliação
    public void submitRating(String serviceId, String ratedUserId, int rating, String comment, List<String> tags) {
        // Obter ID do usuário atual (você precisaria implementar isso)
        String currentUserId = "current_user_id"; // Substituir por ID real
        
        supabaseService.submitRating(serviceId, currentUserId, ratedUserId, rating, comment, new SupabaseService.SupabaseCallback() {
            @Override
            public void onSuccess(String response) {
                Log.d(TAG, "Avaliação enviada com sucesso: " + response);
                if (callback != null) {
                    callback.onRatingSubmitted("rating_" + System.currentTimeMillis(), rating, comment);
                }
                
                // Mostrar notificação de confirmação
                notificationService.showRideNotification(
                    "Avaliação Enviada",
                    "Obrigado pela sua avaliação!",
                    "rating_" + System.currentTimeMillis()
                );
            }
            
            @Override
            public void onError(String error) {
                Log.e(TAG, "Erro ao enviar avaliação: " + error);
                if (callback != null) {
                    callback.onError("Erro ao enviar avaliação");
                }
            }
        });
    }
    
    // Avaliação rápida (apenas estrelas)
    public void submitQuickRating(String serviceId, String ratedUserId, int rating) {
        submitRating(serviceId, ratedUserId, rating, "", new ArrayList<>());
    }
    
    // Avaliação com comentário
    public void submitRatingWithComment(String serviceId, String ratedUserId, int rating, String comment) {
        submitRating(serviceId, ratedUserId, rating, comment, new ArrayList<>());
    }
    
    // Avaliação com tags
    public void submitRatingWithTags(String serviceId, String ratedUserId, int rating, List<String> tags) {
        submitRating(serviceId, ratedUserId, rating, "", tags);
    }
    
    // Simular recebimento de avaliação
    public void simulateRatingReceived(int rating, String comment, String raterName) {
        if (callback != null) {
            callback.onRatingReceived(rating, comment, raterName);
        }
        
        // Mostrar notificação
        String title = "Nova Avaliação Recebida";
        String message = String.format("Você recebeu %d estrelas de %s", rating, raterName);
        
        if (rating >= 4) {
            message += " - Excelente trabalho!";
        }
        
        notificationService.showRideNotification(title, message, "rating_received");
    }
    
    // Obter texto da avaliação baseado na nota
    public String getRatingText(int rating) {
        switch (rating) {
            case 1: return "Muito ruim";
            case 2: return "Ruim";
            case 3: return "Regular";
            case 4: return "Bom";
            case 5: return "Excelente";
            default: return "Não avaliado";
        }
    }
    
    // Obter cor da avaliação
    public String getRatingColor(int rating) {
        switch (rating) {
            case 1: return "#FF4444"; // Vermelho
            case 2: return "#FF8800"; // Laranja
            case 3: return "#FFBB00"; // Amarelo
            case 4: return "#88BB00"; // Verde claro
            case 5: return "#00BB00"; // Verde
            default: return "#888888"; // Cinza
        }
    }
    
    // Calcular média de avaliações
    public double calculateAverageRating(List<Integer> ratings) {
        if (ratings.isEmpty()) return 0.0;
        
        int sum = 0;
        for (int rating : ratings) {
            sum += rating;
        }
        return (double) sum / ratings.size();
    }
    
    // Verificar se pode avaliar (apenas após corrida concluída)
    public boolean canRate(String serviceId, String serviceStatus) {
        return "completed".equals(serviceStatus) || "delivered".equals(serviceStatus);
    }
    
    // Obter critérios de avaliação
    public List<String> getRatingCriteria() {
        List<String> criteria = new ArrayList<>();
        criteria.add("Pontualidade");
        criteria.add("Comunicação");
        criteria.add("Cuidado com o produto");
        criteria.add("Velocidade");
        criteria.add("Profissionalismo");
        return criteria;
    }
}
