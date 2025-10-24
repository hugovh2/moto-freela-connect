/**
 * Motoboy Onboarding Component
 * Guides new motoboys through profile completion
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bike, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MotoboyOnboardingProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  initialData?: Partial<OnboardingData>;
}

export interface OnboardingData {
  vehicle_type: 'motorcycle' | 'bicycle' | 'car';
  vehicle_plate?: string;
  phone: string;
  emergency_contact: string;
  emergency_phone: string;
}

export const MotoboyOnboarding = ({ onComplete, initialData }: MotoboyOnboardingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>(initialData || {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.vehicle_type) {
      toast.error('Selecione o tipo de veículo');
      return;
    }
    
    if (!formData.phone) {
      toast.error('Telefone é obrigatório');
      return;
    }
    
    if (!formData.emergency_contact || !formData.emergency_phone) {
      toast.error('Contato de emergência é obrigatório');
      return;
    }

    setIsLoading(true);
    
    try {
      await onComplete(formData as OnboardingData);
      toast.success('Perfil completado com sucesso!');
    } catch (error) {
      console.error('[MotoboyOnboarding] Error:', error);
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Bike className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
              <CardDescription>
                Precisamos de algumas informações para você começar
              </CardDescription>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Veículo *</Label>
                    <RadioGroup
                      value={formData.vehicle_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, vehicle_type: value as any })
                      }
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="motorcycle" id="motorcycle" />
                        <Label htmlFor="motorcycle" className="cursor-pointer flex-1">
                          🏍️ Moto
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="bicycle" id="bicycle" />
                        <Label htmlFor="bicycle" className="cursor-pointer flex-1">
                          🚴 Bicicleta
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="car" id="car" />
                        <Label htmlFor="car" className="cursor-pointer flex-1">
                          🚗 Carro
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.vehicle_type === 'motorcycle' || formData.vehicle_type === 'car' ? (
                    <div>
                      <Label htmlFor="vehicle_plate">Placa do Veículo</Label>
                      <Input
                        id="vehicle_plate"
                        placeholder="ABC-1234"
                        value={formData.vehicle_plate || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicle_plate: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="phone">Seu Telefone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={formData.phone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!formData.vehicle_type || !formData.phone}
                >
                  Próximo
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Contato de Emergência:</strong> Precisamos de um contato de
                      confiança caso algo aconteça durante suas entregas.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emergency_contact">Nome do Contato *</Label>
                    <Input
                      id="emergency_contact"
                      placeholder="Maria Silva"
                      value={formData.emergency_contact || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, emergency_contact: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergency_phone">Telefone do Contato *</Label>
                    <Input
                      id="emergency_phone"
                      type="tel"
                      placeholder="(11) 91234-5678"
                      value={formData.emergency_phone || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, emergency_phone: e.target.value })
                      }
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotoboyOnboarding;
