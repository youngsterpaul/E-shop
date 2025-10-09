
import React, { useState } from 'react';
import Header from '@/components/Header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneIcon, Mail, MapPin, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import InteractiveMap from '@/components/InteractiveMap';

const ContactPage = () => {
  const isMobile = isMobileUserAgent();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you soon!",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    }, 1500);
  };

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && ( 
        <MobileHeader
          title="Contact Us"
          backTo='/'
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />)}
        <main className={`flex-grow mx-auto px-4 container py-8 ${!isMobile ? 'xl:px-24' : ''}`}>
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-gray-600 mb-8">
            Have a question, suggestion, or concern? We're here to help!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <PhoneIcon className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-gray-700 mb-3">Mon-Fri from 8am to 5pm</p>
              <a href="tel:+254101762132" className="text-green-500 hover:text-orange-600">
                +254 101 762 132
              </a>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <Mail className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-gray-700 mb-3">We'll respond within 24 hours</p>
              <a href="mailto:support@smartkenya.co.ke" className="text-green-500 hover:text-orange-600">
                support@smartkenya.co.ke
              </a>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <MapPin className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-700 mb-3">Our headquarters</p>
              <address className="not-italic text-green-500">
                SmartKenya, Embu, Kenya
              </address>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Phone Number (Optional)
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+254 7XX XXX XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium">
                  Your Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please describe your inquiry in detail..."
                  className="min-h-32"
                  required
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full md:w-auto bg-green-500 hover:bg-green-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          
          <InteractiveMap />
      </main>

    </div>
  );
};

export default ContactPage;
