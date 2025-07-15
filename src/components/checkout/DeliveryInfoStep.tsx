
import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

export const DeliveryInfoStep = () => {
  const { deliveryInfo, updateDeliveryInfo, setStep } = useCheckout();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!deliveryInfo.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    if (!deliveryInfo.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!deliveryInfo.county.trim()) {
      newErrors.county = 'County is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const deliveryOptions = [
    {
      id: 'standard',
      title: 'Standard Delivery',
      description: '3-5 business days',
      price: 500,
      icon: Truck
    },
    //{
      //id: 'express',
      //name: 'Express Delivery',
      //price: 1200,
      //time: '1-2 business days',
      //description: 'Fast delivery service'
    //}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
        <p className="text-gray-600 text-sm">Where should we deliver your order?</p>
      </div>

      {/* Delivery Address */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Delivery Address *</Label>
          <Textarea
            id="address"
            value={deliveryInfo.address}
            onChange={(e) => updateDeliveryInfo({ address: e.target.value })}
            className={errors.address ? 'border-red-500' : ''}
            placeholder="Enter your full delivery address (building, street, landmarks)"
            rows={3}
          />
          {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City/Town *</Label>
            <Input
              id="city"
              value={deliveryInfo.city}
              onChange={(e) => updateDeliveryInfo({ city: e.target.value })}
              className={errors.city ? 'border-red-500' : ''}
              placeholder="e.g., Nairobi, Mombasa, Kisumu"
            />
            {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County *</Label>
            <Input
              id="county"
              value={deliveryInfo.county}
              onChange={(e) => updateDeliveryInfo({ county: e.target.value })}
              className={errors.county ? 'border-red-500' : ''}
              placeholder="e.g., Nairobi, Mombasa, Kisumu"
            />
            {errors.county && <p className="text-sm text-red-500">{errors.county}</p>}
          </div>
        </div>
      </div>

      {/* Delivery Method */}
      <div className="space-y-4">
        <Label>Delivery Method *</Label>
        <RadioGroup
          value={deliveryInfo.deliveryMethod}
          onValueChange={(value: 'standard' | 'express') => 
            updateDeliveryInfo({ deliveryMethod: value })
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-colors ${
                    deliveryInfo.deliveryMethod === option.id 
                      ? 'ring-2 ring-orange-500 bg-orange-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => updateDeliveryInfo({ deliveryMethod: option.id as 'standard' | 'express' })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={option.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Icon className="h-4 w-4 text-orange-500" />
                          <h4 className="font-medium">{option.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                        <p className="text-sm font-semibold text-orange-600">
                          KES {option.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Special Instructions 
      <div className="space-y-2">
        <Label htmlFor="instructions">Special Delivery Instructions (Optional)</Label>
        <Textarea
          id="instructions"
          value={deliveryInfo.specialInstructions || ''}
          onChange={(e) => updateDeliveryInfo({ specialInstructions: e.target.value })}
          placeholder="Any special instructions for delivery (e.g., gate code, preferred time)"
          rows={2}
        />
      </div>*/}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};
