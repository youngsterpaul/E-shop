import React from 'react';
import { MessageCircle, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RealtimeChat = () => {
  const phoneNumber = "+254758475467";
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Contact Cards */}
        <div className="space-y-3 mb-6">
          {/* WhatsApp Card */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-green-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-lg">WhatsApp Chat</div>
                <div className="text-sm text-gray-500">Fastest response time</div>
              </div>
              <div className="text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Phone Card */}
          <button
            onClick={handleCallClick}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                <Phone className="w-7 h-7 text-blue-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-lg">Call Us</div>
                <div className="text-sm text-gray-500">{phoneNumber}</div>
              </div>
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Email Card */}
          <button
            onClick={handleEmailClick}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                <Mail className="w-7 h-7 text-purple-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-lg">Email Us</div>
                <div className="text-sm text-gray-500">support@smartkenya.co.ke</div>
              </div>
              <div className="text-purple-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm mb-1">24/7 Support Available</div>
              <div className="text-sm text-gray-600">
                Our team is ready to help you anytime, day or night
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;
