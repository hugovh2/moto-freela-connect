/**
 * Badge System Component
 * Sistema de gamificação com badges e níveis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Award,
  TrendingUp,
  Clock,
  ThumbsUp,
  Shield,
  Flame,
} from 'lucide-react';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  category: 'rides' | 'rating' | 'speed' | 'streak';
  color: string;
}

export const AVAILABLE_BADGES: BadgeDefinition[] = [
  {
    id: 'first_ride',
    name: 'Primeira Corrida',
    description: 'Complete sua primeira corrida',
    icon: <Star className="h-6 w-6" />,
    requirement: 1,
    category: 'rides',
    color: 'bg-blue-500',
  },
  {
    id: 'veteran',
    name: 'Veterano',
    description: 'Complete 50 corridas',
    icon: <Trophy className="h-6 w-6" />,
    requirement: 50,
    category: 'rides',
    color: 'bg-yellow-500',
  },
  {
    id: 'master',
    name: 'Mestre',
    description: 'Complete 100 corridas',
    icon: <Award className="h-6 w-6" />,
    requirement: 100,
    category: 'rides',
    color: 'bg-purple-500',
  },
  {
    id: 'legend',
    name: 'Lenda',
    description: 'Complete 500 corridas',
    icon: <Trophy className="h-6 w-6" />,
    requirement: 500,
    category: 'rides',
    color: 'bg-orange-500',
  },
  {
    id: 'five_stars',
    name: '5 Estrelas',
    description: 'Mantenha avaliação 5.0 por 10 corridas',
    icon: <Star className="h-6 w-6" />,
    requirement: 10,
    category: 'rating',
    color: 'bg-yellow-400',
  },
  {
    id: 'speed_demon',
    name: 'Velocista',
    description: 'Complete 10 corridas em menos de 15 minutos',
    icon: <Zap className="h-6 w-6" />,
    requirement: 10,
    category: 'speed',
    color: 'bg-red-500',
  },
  {
    id: 'punctual',
    name: 'Pontual',
    description: 'Chegue no horário em 20 corridas consecutivas',
    icon: <Clock className="h-6 w-6" />,
    requirement: 20,
    category: 'streak',
    color: 'bg-green-500',
  },
  {
    id: 'reliable',
    name: 'Confiável',
    description: 'Mantenha 95% de taxa de conclusão',
    icon: <Shield className="h-6 w-6" />,
    requirement: 95,
    category: 'rating',
    color: 'bg-blue-600',
  },
  {
    id: 'hot_streak',
    name: 'Em Chamas',
    description: 'Complete 7 corridas em um dia',
    icon: <Flame className="h-6 w-6" />,
    requirement: 7,
    category: 'streak',
    color: 'bg-orange-600',
  },
  {
    id: 'top_rated',
    name: 'Bem Avaliado',
    description: 'Receba 100 avaliações positivas',
    icon: <ThumbsUp className="h-6 w-6" />,
    requirement: 100,
    category: 'rating',
    color: 'bg-green-600',
  },
];

interface BadgeSystemProps {
  earnedBadges: string[];
  stats: {
    totalRides: number;
    averageRating: number;
    completionRate: number;
    fastRides: number;
    currentStreak: number;
    positiveRatings: number;
  };
  level: number;
  experience: number;
}

export const BadgeSystem = ({ earnedBadges, stats, level, experience }: BadgeSystemProps) => {
  const xpForNextLevel = level * 1000;
  const xpProgress = (experience % 1000) / 10;

  const checkBadgeProgress = (badge: BadgeDefinition): number => {
    switch (badge.category) {
      case 'rides':
        return Math.min((stats.totalRides / badge.requirement) * 100, 100);
      case 'rating':
        if (badge.id === 'five_stars') {
          return stats.averageRating >= 5.0 ? 100 : (stats.averageRating / 5.0) * 100;
        }
        if (badge.id === 'reliable') {
          return Math.min((stats.completionRate / badge.requirement) * 100, 100);
        }
        if (badge.id === 'top_rated') {
          return Math.min((stats.positiveRatings / badge.requirement) * 100, 100);
        }
        return 0;
      case 'speed':
        return Math.min((stats.fastRides / badge.requirement) * 100, 100);
      case 'streak':
        return Math.min((stats.currentStreak / badge.requirement) * 100, 100);
      default:
        return 0;
    }
  };

  const sortedBadges = [...AVAILABLE_BADGES].sort((a, b) => {
    const aEarned = earnedBadges.includes(a.id);
    const bEarned = earnedBadges.includes(b.id);
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Nível {level}</CardTitle>
              <CardDescription>
                {experience.toLocaleString()} XP • {xpForNextLevel - (experience % 1000)} XP para o
                próximo nível
              </CardDescription>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={xpProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
          <CardDescription>
            {earnedBadges.length} de {AVAILABLE_BADGES.length} badges desbloqueados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedBadges.map((badge) => {
              const isEarned = earnedBadges.includes(badge.id);
              const progress = checkBadgeProgress(badge);

              return (
                <Card
                  key={badge.id}
                  className={`relative overflow-hidden transition-all ${
                    isEarned
                      ? 'border-2 border-primary shadow-lg'
                      : 'opacity-60 hover:opacity-80'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-16 h-16 ${badge.color} rounded-full flex items-center justify-center text-white ${
                          !isEarned && 'grayscale'
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                      {isEarned ? (
                        <Badge className="bg-green-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Conquistado
                        </Badge>
                      ) : (
                        <div className="w-full">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {progress.toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* XP Rewards Info */}
      <Card>
        <CardHeader>
          <CardTitle>Como Ganhar XP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold">Completar Corrida</h4>
                <p className="text-sm text-muted-foreground">+100 XP</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="font-semibold">Avaliação 5 Estrelas</h4>
                <p className="text-sm text-muted-foreground">+50 XP</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold">Entrega Rápida</h4>
                <p className="text-sm text-muted-foreground">+25 XP</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flame className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold">Sequência Diária</h4>
                <p className="text-sm text-muted-foreground">+10 XP por dia</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BadgeSystem;
