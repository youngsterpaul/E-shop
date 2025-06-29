
import { useCheckout } from '@/contexts/CheckoutContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export const CustomerDetailsStep = () => {
  const { customerDetails, updateCustomerDetails, setStep } = useCheckout();
  const { user, profile } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile && user) {
      updateCustomerDetails({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone || ''
      });
    }
  }, [profile, user, updateCustomerDetails]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!customerDetails.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerDetails.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!customerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+254|254|0)?[17]\d{8}$/.test(customerDetails.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length and starting digits
    if (digits.startsWith('254')) {
      return '+254 ' + digits.slice(3, 6) + ' ' + digits.slice(6, 9) + ' ' + digits.slice(9, 12);
    } else if (digits.startsWith('0')) {
      return digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 10);
    }
    return value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
        <p className="text-gray-600 text-sm">Please provide your contact details for order updates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={customerDetails.firstName}
            onChange={(e) => updateCustomerDetails({ firstName: e.target.value })}
            className={errors.firstName ? 'border-red-500' : ''}
            placeholder="Enter your first name"
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={customerDetails.lastName}
            onChange={(e) => updateCustomerDetails({ lastName: e.target.value })}
            className={errors.lastName ? 'border-red-500' : ''}
            placeholder="Enter your last name"
          />
          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={customerDetails.email}
          onChange={(e) => updateCustomerDetails({ email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (M-Pesa) *</Label>
        <Input
          id="phone"
          type="tel"
          value={customerDetails.phone}
          onChange={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            updateCustomerDetails({ phone: formatted });
          }}
          className={errors.phone ? 'border-red-500' : ''}
          placeholder="0712 345 678 or +254 712 345 678"
        />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        <p className="text-sm text-gray-500">
          This number will be used for M-Pesa payment and order updates
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
          Continue to Delivery
        </Button>
      </div>
    </div>
  );
};
