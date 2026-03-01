import React from 'react';
import { CONTACT_INFO } from '../constants';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="bg-primary/90 backdrop-blur text-white py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-md">Contact Us</h1>
          <p className="text-xl text-gray-300">We'd love to hear from you. Get in touch with our team today.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-20">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/20">
          
          {/* Contact Info */}
          <div className="p-10 space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">Get In Touch</h2>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Office Address</h3>
                <p className="text-gray-600 mt-1">{CONTACT_INFO.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-secondary">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Phone Numbers</h3>
                <p className="text-gray-600 mt-1">{CONTACT_INFO.phones[0]}</p>
                <p className="text-gray-600">{CONTACT_INFO.phones[1]}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Email</h3>
                <p className="text-gray-600 mt-1">info@neutechrealestate.com</p>
                <p className="text-sm text-gray-400">(This is a demo email)</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
               <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Business Hours</h3>
                <p className="text-gray-600 mt-1">Mon - Fri: 8:00 AM - 6:00 PM</p>
                <p className="text-gray-600">Sat: 9:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>

          {/* Map / Image Placeholder */}
          <div className="bg-gray-200 h-full min-h-[400px] relative">
             <img 
                src="https://picsum.photos/seed/map/800/800" 
                alt="Map Location" 
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded shadow-lg font-bold text-gray-800 border border-white/20">
                    Located in Ikot Oku Ikono, Uyo
                </span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;