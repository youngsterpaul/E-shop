import React from 'react';
import { MessageCircle, Phone, Mail, Headset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const RealtimeChat = () => {
  const navigate = useNavigate();
  const phoneNumber = "+254798229783";
  const email = "support@smartkenya.co.ke";
  
  const handleInAppClick = () => {
    navigate("/chatting");
  };

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

  const contactItems = [
    {
      icon: Headset,
      title: 'Live Support ()',
      description: 'Chat with our team instantly',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: handleInAppClick
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Chat',
      description: 'Fastest response',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: handleWhatsAppClick
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: phoneNumber,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: handleCallClick
    },
    {
      icon: Mail,
      title: 'Email Us',
      description: email,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onClick: handleEmailClick
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-2 px-2">
        <div className="grid grid-cols-1 gap-2 mb-2">
          {contactItems.map((item) => (
            <Card 
              key={item.title} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={item.onClick}
            >
              <CardContent className="p-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtimeChat;