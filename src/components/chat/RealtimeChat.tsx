import React from 'react';
import { MessageCircle, Phone, Mail, Clock } from 'lucide-react';

const RealtimeChat = () => {
  const phoneNumber = "+254798229783";
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
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-2 py-2">
        {/* Contact Cards */}
        <div className="space-y-2 mb-2">
          {/* WhatsApp Card */}
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-sm">WhatsApp Chat</div>
                <div className="text-xs text-gray-500">Fastest response</div>
              </div>
              <div className="text-green-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Phone Card */}
          <button
            onClick={handleCallClick}
            className="w-full bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-sm">Call Us</div>
                <div className="text-xs text-gray-500">{phoneNumber}</div>
              </div>
              <div className="text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Email Card */}
          <button
            onClick={handleEmailClick}
            className="w-full bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 active:scale-98 transition-transform duration-150 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-purple-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 text-sm">Email Us</div>
                <div className="text-xs text-gray-500">{email}</div>
              </div>
              <div className="text-purple-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;
