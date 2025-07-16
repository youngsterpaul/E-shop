
import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { MapPin, Truck, Clock } from 'lucide-react';

export const DeliveryStep = () => {
  const { deliveryInfo, updateDeliveryInfo, setStep } = useCheckout();
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    county: '',
    deliveryMethod: 'standard' as 'standard' | 'express',
    //specialInstructions: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      address: deliveryInfo.address || '',
      city: deliveryInfo.city || '',
      county: deliveryInfo.county || '',
      deliveryMethod: deliveryInfo.deliveryMethod || 'standard',
      //specialInstructions: deliveryInfo.specialInstructions || ''
    });
  }, [deliveryInfo]);

  const deliveryOptions = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      price: 0,
      time: '1-3 hours',
      description: 'Regular delivery service'
    }//,
    //{
      //id: 'express',
      //name: 'Express Delivery',
      //price: 1200,
      //time: '1-2 business days',
      //description: 'Fast delivery service'
    //}
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.county.trim()) {
      newErrors.county = 'County is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      updateDeliveryInfo(formData);
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Delivery Information</h3>
        <p className="text-gray-600 text-sm">
          Please provide your delivery address and preferred delivery method.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your full street address"
              className={errors.address ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City/Town</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter your city"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={formData.county}
                onChange={(e) => handleInputChange('county', e.target.value)}
                placeholder="Enter your county"
                className={errors.county ? 'border-red-500' : ''}
              />
              {errors.county && (
                <p className="text-red-500 text-sm mt-1">{errors.county}</p>
              )}
            </div>
          </div>

{/*
          <div>
            <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
            <Textarea
              id="specialInstructions"
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              placeholder="Any special delivery instructions..."
              rows={2}
            />
          </div>

*/}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />
            Delivery Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.deliveryMethod}
            onValueChange={(value) => handleInputChange('deliveryMethod', value)}
            className="space-y-3"
          >
            {deliveryOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <div>
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.name}
                    </Label>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">KES {option.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {option.time}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

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
