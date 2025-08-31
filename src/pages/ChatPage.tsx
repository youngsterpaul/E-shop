import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, Mail, Sparkles, ArrowRight, Users, Clock, CheckCircle } from 'lucide-react';

const ChatPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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

  const contactOptions = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Support',
      subtitle: 'Get instant responses',
      icon: MessageCircle,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500',
      action: handleWhatsAppClick,
      badge: 'Instant'
    },
    {
      id: 'phone',
      title: 'Call Us Now',
      subtitle: 'Speak with an expert',
      icon: Phone,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500',
      action: handleCallClick,
      badge: 'Direct'
    },
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Detailed assistance',
      icon: Mail,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500',
      action: handleEmailClick,
      badge: '24/7'
    }
  ];

  const features = [
    { icon: Users, text: "Expert Support Team", color: "text-blue-500" },
    { icon: Clock, text: "24/7 Availability", color: "text-green-500" },
    { icon: CheckCircle, text: "Quick Resolution", color: "text-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      {/* Mobile Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Customer Support
          </h1>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            FAQs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 pt-12">
        <div className={`w-full max-w-md space-y-8 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-bounce"></div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                How can we help?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Choose your preferred way to connect with our amazing support team
              </p>
            </div>
          </div>

          {/* Contact Cards */}
          <div className="space-y-4">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className={`group relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                    activeCard === option.id ? 'scale-105' : ''
                  }`}
                  onClick={option.action}
                  onMouseEnter={() => setActiveCard(option.id)}
                  onMouseLeave={() => setActiveCard(null)}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 group-hover:scale-110`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                            {option.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium bg-gradient-to-r ${option.color} text-white rounded-full`}>
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                          {option.subtitle}
                        </p>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 p-6 space-y-4">
            <h3 className="text-center text-lg font-semibold text-gray-800 mb-4">
              Why choose our support?
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">
                Support team is online and ready to help
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Placeholder */}
      <div className="h-16 bg-white/80 backdrop-blur-lg border-t border-white/20"></div>
    </div>
  );
};

export default ChatPage;
