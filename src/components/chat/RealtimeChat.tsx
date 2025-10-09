import React from 'react';
import { MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RealtimeChat = () => {
  const phoneNumber = "+254101762132";
  const email = "support@smartkenya.co.ke";
  
  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=Hello, I need support with my account`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallClick = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${email}?subject=Support Request`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Get in Touch</h2>
          <p className="text-gray-600">
            We're here to help! Choose your preferred way to contact us.
          </p>
        </div>

        {/* Contact Options */}
        <div className="space-y-4">
          {/* WhatsApp */}
          <Button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-2 h-auto rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-md">Chat us on WhatsApp</div>
              </div>
            </div>
          </Button>

          {/* Phone Call */}
          <Button
            onClick={handleCallClick}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 h-auto rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-md">Call Us</div>
              </div>
            </div>
          </Button>

          {/* Email */}
          <Button
            onClick={handleEmailClick}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white p-2 h-auto rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-md">Email Us</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Our support team is available 24/7 to assist you</p>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;