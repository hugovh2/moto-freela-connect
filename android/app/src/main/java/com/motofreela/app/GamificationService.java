package com.motofreela.app;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

public class GamificationService {
    private static final String TAG = "GamificationService";
    private Context context;
    private NotificationService notificationService;
    
    // Definição de badges
    public static class Badge {
        public String id;
        public String name;
        public String description;
        public int requirement;
        public String category;
        public String color;
        public String icon;
        
        public Badge(String id, String name, String description, int requirement, String category, String color, String icon) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.requirement = requirement;
            this.category = category;
            this.color = color;
            this.icon = icon;
        }
    }
    
    // Badges disponíveis
    private static final List<Badge> AVAILABLE_BADGES = new ArrayList<Badge>() {{
        add(new Badge("first_ride", "Primeira Corrida", "Complete sua primeira corrida", 1, "rides", "#3B82F6", "⭐"));
        add(new Badge("veteran", "Veterano", "Complete 50 corridas", 50, "rides", "#F59E0B", "🏆"));
        add(new Badge("master", "Mestre", "Complete 100 corridas", 100, "rides", "#8B5CF6", "🎖️"));
        add(new Badge("legend", "Lenda", "Complete 500 corridas", 500, "rides", "#F97316", "👑"));
        add(new Badge("five_stars", "5 Estrelas", "Mantenha avaliação 5.0 por 10 corridas", 10, "rating", "#FCD34D", "⭐"));
        add(new Badge("speed_demon", "Velocista", "Complete 10 corridas em menos de 15 minutos", 10, "speed", "#EF4444", "⚡"));
        add(new Badge("punctual", "Pontual", "Chegue no horário em 20 corridas consecutivas", 20, "streak", "#10B981", "🕐"));
        add(new Badge("reliable", "Confiável", "Mantenha 95% de taxa de conclusão", 95, "rating", "#3B82F6", "🛡️"));
        add(new Badge("hot_streak", "Em Chamas", "Complete 7 corridas em um dia", 7, "streak", "#F59E0B", "🔥"));
        add(new Badge("top_rated", "Bem Avaliado", "Receba 100 avaliações positivas", 100, "rating", "#8B5CF6", "👍"));
    }};
    
    public GamificationService(Context context) {
        this.context = context;
        this.notificationService = new NotificationService(context);
    }
    
    // Interface para callbacks de gamificação
    public interface GamificationCallback {
        void onBadgeEarned(String badgeId, String badgeName);
        void onLevelUp(int newLevel, int newExperience);
        void onExperienceGained(int amount, String reason);
        void onError(String error);
    }
    
    private GamificationCallback callback;
    
    public void setGamificationCallback(GamificationCallback callback) {
        this.callback = callback;
    }
    
    // Obter todos os badges disponíveis
    public List<Badge> getAvailableBadges() {
        return new ArrayList<>(AVAILABLE_BADGES);
    }
    
    // Verificar se um badge foi conquistado
    public boolean checkBadgeEarned(String badgeId, Map<String, Integer> stats) {
        Badge badge = getBadgeById(badgeId);
        if (badge == null) return false;
        
        int currentValue = getCurrentValueForBadge(badge, stats);
        return currentValue >= badge.requirement;
    }
    
    // Obter progresso de um badge
    public int getBadgeProgress(String badgeId, Map<String, Integer> stats) {
        Badge badge = getBadgeById(badgeId);
        if (badge == null) return 0;
        
        int currentValue = getCurrentValueForBadge(badge, stats);
        return Math.min((currentValue * 100) / badge.requirement, 100);
    }
    
    // Adicionar experiência
    public void addExperience(int amount, String reason) {
        try {
            JSONObject expData = new JSONObject();
            expData.put("amount", amount);
            expData.put("reason", reason);
            expData.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Adicionando experiência: " + expData.toString());
            
            if (callback != null) {
                callback.onExperienceGained(amount, reason);
            }
            
            // Verificar se subiu de nível
            checkLevelUp();
            
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao adicionar experiência: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao adicionar experiência");
            }
        }
    }
    
    // Verificar subida de nível
    private void checkLevelUp() {
        // Aqui você calcularia o novo nível baseado na experiência
        // Por enquanto, simulamos
        int currentLevel = 1; // Obter do banco de dados
        int currentExp = 0; // Obter do banco de dados
        int newLevel = (currentExp / 1000) + 1;
        
        if (newLevel > currentLevel) {
            if (callback != null) {
                callback.onLevelUp(newLevel, currentExp);
            }
            
            // Mostrar notificação de level up
            notificationService.showRideNotification(
                "🎉 Level Up!",
                "Você subiu para o nível " + newLevel + "!",
                "level_up"
            );
        }
    }
    
    // Conceder badge
    public void awardBadge(String badgeId) {
        Badge badge = getBadgeById(badgeId);
        if (badge == null) return;
        
        try {
            JSONObject badgeData = new JSONObject();
            badgeData.put("badge_id", badgeId);
            badgeData.put("badge_name", badge.name);
            badgeData.put("timestamp", System.currentTimeMillis());
            
            Log.d(TAG, "Concedendo badge: " + badgeData.toString());
            
            if (callback != null) {
                callback.onBadgeEarned(badgeId, badge.name);
            }
            
            // Mostrar notificação de badge conquistado
            notificationService.showRideNotification(
                "🏆 Badge Conquistado!",
                badge.name + " - " + badge.description,
                "badge_" + badgeId
            );
            
        } catch (JSONException e) {
            Log.e(TAG, "Erro ao conceder badge: " + e.getMessage());
            if (callback != null) {
                callback.onError("Erro ao conceder badge");
            }
        }
    }
    
    // Obter badge por ID
    private Badge getBadgeById(String badgeId) {
        for (Badge badge : AVAILABLE_BADGES) {
            if (badge.id.equals(badgeId)) {
                return badge;
            }
        }
        return null;
    }
    
    // Obter valor atual para um badge
    private int getCurrentValueForBadge(Badge badge, Map<String, Integer> stats) {
        switch (badge.category) {
            case "rides":
                return stats.getOrDefault("totalRides", 0);
            case "rating":
                if (badge.id.equals("five_stars")) {
                    return stats.getOrDefault("fiveStarStreak", 0);
                } else if (badge.id.equals("reliable")) {
                    return stats.getOrDefault("completionRate", 0);
                } else if (badge.id.equals("top_rated")) {
                    return stats.getOrDefault("positiveRatings", 0);
                }
                break;
            case "speed":
                return stats.getOrDefault("fastRides", 0);
            case "streak":
                if (badge.id.equals("punctual")) {
                    return stats.getOrDefault("punctualStreak", 0);
                } else if (badge.id.equals("hot_streak")) {
                    return stats.getOrDefault("dailyRides", 0);
                }
                break;
        }
        return 0;
    }
    
    // Calcular XP para diferentes ações
    public int getExperienceForAction(String action) {
        switch (action) {
            case "complete_ride": return 100;
            case "five_star_rating": return 50;
            case "fast_delivery": return 25;
            case "daily_streak": return 10;
            case "first_ride": return 200;
            default: return 0;
        }
    }
    
    // Obter estatísticas do usuário
    public Map<String, Integer> getUserStats(String userId) {
        Map<String, Integer> stats = new HashMap<>();
        // Aqui você buscaria as estatísticas reais do banco de dados
        // Por enquanto, retornamos valores simulados
        stats.put("totalRides", 0);
        stats.put("averageRating", 0);
        stats.put("completionRate", 0);
        stats.put("fastRides", 0);
        stats.put("punctualStreak", 0);
        stats.put("dailyRides", 0);
        stats.put("positiveRatings", 0);
        stats.put("fiveStarStreak", 0);
        return stats;
    }
    
    // Verificar todos os badges possíveis
    public void checkAllBadges(String userId) {
        Map<String, Integer> stats = getUserStats(userId);
        
        for (Badge badge : AVAILABLE_BADGES) {
            if (checkBadgeEarned(badge.id, stats)) {
                awardBadge(badge.id);
            }
        }
    }
}
