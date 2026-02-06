
import React from 'react';
import { CONTACT_INFO } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary/95 backdrop-blur-md text-gray-300 py-12 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-xl text-white">NEUTECH PROPERTIES</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your trusted partner in finding the perfect home, land, or commercial space across Nigeria. We make real estate simple, transparent, and efficient.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
          <address className="not-italic text-sm space-y-3">
            <p className="flex items-start">
              <span className="text-secondary font-bold mr-2">Address:</span>
              {CONTACT_INFO.address}
            </p>
            <p className="flex items-center">
              <span className="text-secondary font-bold mr-2">Phone:</span>
              <span>{CONTACT_INFO.phones.join(', ')}</span>
            </p>
          </address>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Service Areas</h3>
          <ul className="text-sm space-y-2">
            <li>Akwa Ibom Real Estate</li>
            <li>Lagos Property Market</li>
            <li>Abuja Commercial Properties</li>
            <li>Rivers Industrial Spaces</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Neutech Properties. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
