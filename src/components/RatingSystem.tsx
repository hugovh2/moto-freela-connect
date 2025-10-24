/**
 * Rating System Component
 * Sistema de avaliação para empresas e motoboys
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface RatingData {
  serviceId: string;
  ratedUserId: string;
  raterUserId: string;
  raterRole: 'company' | 'motoboy';
  rating: number;
  comment?: string;
  tags?: string[];
}

interface RatingSystemProps {
  serviceId: string;
  ratedUserId: string;
  ratedUserName: string;
  raterUserId: string;
  raterRole: 'company' | 'motoboy';
  onRatingComplete?: () => void;
}

const quickTags = {
  positive: [
    'Pontual',
    'Educado',
    'Cuidadoso',
    'Rápido',
    'Profissional',
    'Comunicativo',
  ],
  negative: [
    'Atrasado',
    'Descuidado',
    'Lento',
    'Mal educado',
    'Não seguiu instruções',
  ],
};

export const RatingSystem = ({
  serviceId,
  ratedUserId,
  ratedUserName,
  raterUserId,
  raterRole,
  onRatingComplete,
}: RatingSystemProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    setIsSubmitting(true);

    try {
      const ratingData: RatingData = {
        serviceId,
        ratedUserId,
        raterUserId,
        raterRole,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      // Save rating to database
      const { error } = await supabase.from('ratings').insert({
        service_id: ratingData.serviceId,
        rated_user_id: ratingData.ratedUserId,
        rater_user_id: ratingData.raterUserId,
        rater_role: ratingData.raterRole,
        rating: ratingData.rating,
        comment: ratingData.comment,
        tags: ratingData.tags,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      toast.success('Avaliação enviada com sucesso!');

      if (onRatingComplete) {
        onRatingComplete();
      }
    } catch (error) {
      console.error('[RatingSystem] Error submitting rating:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;
  const availableTags = rating >= 4 ? quickTags.positive : quickTags.negative;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliar {ratedUserName}</CardTitle>
        <CardDescription>
          Sua avaliação ajuda a melhorar a qualidade do serviço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div>
          <Label className="mb-3 block">Como foi sua experiência?</Label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-12 w-12 ${
                    value <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm text-muted-foreground">
              {rating === 5 && '⭐ Excelente!'}
              {rating === 4 && '😊 Muito bom!'}
              {rating === 3 && '😐 Bom'}
              {rating === 2 && '😕 Poderia melhorar'}
              {rating === 1 && '😞 Insatisfeito'}
            </p>
          )}
        </div>

        {/* Quick Tags */}
        {rating > 0 && (
          <div>
            <Label className="mb-3 block">
              {rating >= 4 ? (
                <span className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  O que você mais gostou?
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  O que pode melhorar?
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {rating > 0 && (
          <div>
            <Label htmlFor="comment" className="mb-2 block">
              Comentário (opcional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Conte mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Avaliação'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RatingSystem;
