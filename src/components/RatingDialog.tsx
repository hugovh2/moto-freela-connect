import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  toUserId: string;
  userType: 'company' | 'motoboy';
  onSuccess: () => void;
}

interface CriteriaRating {
  punctuality: number;
  communication: number;
  professionalism: number;
  quality: number;
}

const RatingDialog = ({ open, onOpenChange, serviceId, toUserId, userType, onSuccess }: RatingDialogProps) => {
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState("");
  const [criteria, setCriteria] = useState<CriteriaRating>({
    punctuality: 5,
    communication: 5,
    professionalism: 5,
    quality: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const haptics = useHaptics();

  const criteriaLabels = {
    company: {
      punctuality: "Pontualidade",
      communication: "Comunicação", 
      professionalism: "Profissionalismo",
      quality: "Cuidado com a entrega"
    },
    motoboy: {
      punctuality: "Pontualidade no pagamento",
      communication: "Clareza nas instruções",
      professionalism: "Cordialidade",
      quality: "Valor justo"
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Por favor, selecione uma avaliação");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Insert detailed rating
      const { error: ratingError } = await supabase
        .from("ratings")
        .insert({
          service_id: serviceId,
          from_user_id: user.id,
          to_user_id: toUserId,
          rating: overallRating,
          comment: comment.trim() || null,
          criteria: criteria
        });

      if (ratingError) throw ratingError;

      // Update service with simple rating for quick access
      const updateField = userType === 'motoboy' ? 'company_rating' : 'motoboy_rating';
      const updateCommentField = userType === 'motoboy' ? 'company_rating_comment' : 'motoboy_rating_comment';
      const updateDateField = userType === 'motoboy' ? 'company_rated_at' : 'motoboy_rated_at';

      const { error: serviceError } = await supabase
        .from("services")
        .update({
          [updateField]: overallRating,
          [updateCommentField]: comment.trim() || null,
          [updateDateField]: new Date().toISOString()
        })
        .eq("id", serviceId);

      if (serviceError) throw serviceError;

      haptics.success();
      toast.success("Avaliação enviada com sucesso!");
      
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setOverallRating(5);
      setComment("");
      setCriteria({
        punctuality: 5,
        communication: 5,
        professionalism: 5,
        quality: 5
      });

    } catch (error: any) {
      console.error('Rating error:', error);
      toast.error(error.message || "Erro ao enviar avaliação");
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const updateCriteria = (key: keyof CriteriaRating, value: number) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar {userType === 'motoboy' ? 'Empresa' : 'Motoboy'}</DialogTitle>
          <DialogDescription>
            Sua avaliação é muito importante para manter a qualidade da plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Avaliação Geral"
          />

          {/* Detailed Criteria */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Avaliação Detalhada</h4>
            
            {Object.entries(criteriaLabels[userType]).map(([key, label]) => (
              <StarRating
                key={key}
                value={criteria[key as keyof CriteriaRating]}
                onChange={(value) => updateCriteria(key as keyof CriteriaRating, value)}
                label={label}
              />
            ))}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comentário (opcional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || overallRating === 0}
              className="flex-1"
            >
              {isLoading ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
