import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Mail, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChatPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-14">
      {isMobile && (
        <MobileHeader 
          title="Customer Support"
          rightAction={
            <Link to="/faq">
              <Button variant="ghost" size="sm" className="p-2 text-blue-600 hover:text-blue-800 font-medium">
                FAQs
              </Button>
            </Link>
          }
        />
      )}
      
      {/* Professional Main Content */}
      <div className="flex-1 flex flex-col">
        <div className={`flex-1 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="w-full max-w-md space-y-8">
            
            {/* Professional Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Professional Support
                </h2>
                <p className="text-gray-600 text-base leading-relaxed max-w-sm mx-auto">
                  Connect with our expert support team through your preferred communication channel
                </p>
              </div>
            </div>

            {/* Professional Contact Cards */}
            <div className="space-y-3">
              {contactOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                      hoveredCard === option.id ? 'border-gray-300' : ''
                    }`}
                    onClick={option.action}
                    onMouseEnter={() => setHoveredCard(option.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${option.iconBg} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                          <Icon className={`w-6 h-6 ${option.iconColor}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                              {option.title}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
                              {option.badge}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">
                            {option.subtitle}
                          </p>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Professional Features Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Why Choose Our Support
              </h3>
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        {feature.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Professional Status Indicator */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 font-medium">
                    Support Team Available Now
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center space-y-2 pt-4">
              <p className="text-sm text-gray-500">
                Available 24/7 for your convenience
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">
                  Phone: {phoneNumber}
                </p>
                <p className="text-xs text-gray-400">
                  Email: {email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
