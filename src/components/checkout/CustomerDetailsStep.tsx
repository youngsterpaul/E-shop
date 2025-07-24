
import { useCheckout } from '@/contexts/CheckoutContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { User, Mail, Phone } from 'lucide-react';

export const CustomerDetailsStep = () => {
  const { customerDetails, updateCustomerDetails, setStep } = useCheckout();
  const { user, profile } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    user_id: '',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Pre-fill with existing data or user profile
    setFormData({
      firstName: customerDetails.firstName || profile?.first_name || '',
      lastName: customerDetails.lastName || profile?.last_name || '',
      userName: `${customerDetails.firstName || profile?.first_name || ''} ${customerDetails.lastName || profile?.last_name || ''}`.trim(),
      email: customerDetails.email || user?.email || '',
      user_id: customerDetails.user_id || profile?.user_id || '',
      phone: customerDetails.phone || profile?.phone || ''
    });
  }, [customerDetails, profile, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.userName.trim()) {
      newErrors.userName = 'Full Name is required';
    }
    
    //if (!formData.lastName.trim()) {
      //newErrors.lastName = 'Last name is required';
    //}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+254|254|0)[17]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      updateCustomerDetails(formData);
      setStep(2);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
        <p className="text-gray-600 text-sm">
          Please provide your contact details for order updates and delivery.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="Full Name">Full Name</Label>
            <Input
              id="userName"
              value={formData.userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              placeholder="Enter your full name"
              className={errors.useName ? 'border-red-500' : ''}
            />
            {errors.useName && (
              <p className="text-red-500 text-sm mt-1">{errors.userName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (M-Pesa)
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="0712345678"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
          Continue to Delivery
        </Button>
      </div>
    </div>
  );
};
