import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ServiceFiltersProps {
  onApplyFilters: (filters: FilterCriteria) => void;
  onReset: () => void;
}

export interface FilterCriteria {
  maxDistance?: number;
  minPrice?: number;
  serviceTypes?: string[];
  paymentMethods?: string[];
}

const serviceTypeOptions = [
  { value: 'documentos', label: 'Documentos' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'encomendas', label: 'Encomendas' },
  { value: 'coleta-entrega', label: 'Coleta e Entrega' },
  { value: 'outros', label: 'Outros' },
];

const paymentMethodOptions = [
  { value: 'plataforma', label: 'Via Plataforma' },
  { value: 'direto', label: 'Direto ao Motoboy' },
  { value: 'combinar', label: 'A Combinar' },
];

export const ServiceFilters = ({ onApplyFilters, onReset }: ServiceFiltersProps) => {
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [minPrice, setMinPrice] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleTypeToggle = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handlePaymentToggle = (value: string) => {
    setSelectedPayments(prev =>
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    const filters: FilterCriteria = {
      maxDistance,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      serviceTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      paymentMethods: selectedPayments.length > 0 ? selectedPayments : undefined,
    };
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setMaxDistance(20);
    setMinPrice('');
    setSelectedTypes([]);
    setSelectedPayments([]);
    onReset();
    setIsOpen(false);
  };

  const activeFiltersCount = 
    (minPrice ? 1 : 0) +
    selectedTypes.length +
    selectedPayments.length;

  return (
    <div>
      {/* Filter Button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-primary">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="mt-4 absolute z-50 w-80 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Filtrar Corridas</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Distance Slider */}
            <div className="space-y-2">
              <Label>Distância Máxima: {maxDistance} km</Label>
              <Slider
                value={[maxDistance]}
                onValueChange={(value) => setMaxDistance(value[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Min Price */}
            <div className="space-y-2">
              <Label htmlFor="minPrice">Valor Mínimo (R$)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="Ex: 15.00"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            {/* Service Types */}
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <div className="space-y-2">
                {serviceTypeOptions.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={selectedTypes.includes(type.value)}
                      onCheckedChange={() => handleTypeToggle(type.value)}
                    />
                    <label
                      htmlFor={type.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="space-y-2">
                {paymentMethodOptions.map((payment) => (
                  <div key={payment.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={payment.value}
                      checked={selectedPayments.includes(payment.value)}
                      onCheckedChange={() => handlePaymentToggle(payment.value)}
                    />
                    <label
                      htmlFor={payment.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {payment.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleApply} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Resetar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
