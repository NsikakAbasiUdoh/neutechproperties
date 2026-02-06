
import React, { useState, useMemo, useEffect } from 'react';
import { Property, ClientRequest } from '../types';
import { NIGERIAN_STATES } from '../constants';
import { X, Send, User, MapPin, Mail, Phone, CheckCircle, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSubmit: (request: ClientRequest) => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, property, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    email: '',
    phone: '',
    state: '',
    lga: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset index when modal opens or property changes
  useEffect(() => {
    if (isOpen) {
        setCurrentImageIndex(0);
    }
  }, [isOpen, property]);

  // Get LGAs for selected state
  const availableLgas = useMemo(() => {
    const state = NIGERIAN_STATES.find(s => s.name === formData.state);
    return state ? state.lgas : [];
  }, [formData.state]);

  if (!isOpen || !property) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newRequest: ClientRequest = {
      id: Date.now().toString(),
      propertyId: property.id,
      propertyTitle: property.title,
      propertyImage: property.images[0], // Use first image as thumbnail
      propertyPrice: property.price,
      clientName: formData.fullName,
      clientAddress: formData.address,
      clientEmail: formData.email,
      clientPhone: formData.phone,
      clientState: formData.state,
      clientLga: formData.lga,
      dateRequested: Date.now()
    };

    // Simulate API call
    setTimeout(() => {
      onSubmit(newRequest);
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ fullName: '', address: '', email: '', phone: '', state: '', lga: '' });
        onClose();
      }, 2000);
    }, 1000);
  };

  // Carousel controls
  const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };
  const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background Overlay */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
          
          <div className="absolute top-4 right-4 z-20">
            <button onClick={onClose} className="bg-white/50 hover:bg-white rounded-full p-2 text-gray-500 hover:text-gray-700 transition-colors backdrop-blur-sm">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Side: Property Gallery */}
            <div className="relative bg-slate-900 h-64 md:h-auto overflow-hidden group">
              {/* Main Image */}
              <img 
                src={property.images[currentImageIndex]} 
                alt={`${property.title} - ${currentImageIndex + 1}`} 
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>

              {/* Navigation Arrows (Only if multiple images) */}
              {property.images.length > 1 && (
                  <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight size={24} />
                    </button>
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-24 md:bottom-32 left-0 right-0 flex justify-center space-x-2 z-10">
                        {property.images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-secondary' : 'bg-white/50 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                  </>
              )}

              {/* Property Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {property.type}
                    </span>
                    {property.images.length > 1 && (
                         <span className="text-white text-xs bg-black/50 px-2 py-1 rounded flex items-center backdrop-blur-sm">
                            <Camera size={12} className="mr-1" /> {currentImageIndex + 1} / {property.images.length}
                         </span>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{property.title}</h3>
                <p className="text-xl text-secondary font-semibold">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(property.price)}
                </p>
                <div className="flex items-center text-gray-300 text-sm mt-3">
                    <MapPin size={16} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{property.location.address}, {property.location.state}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="p-8 max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">I'm Interested</h2>
                <p className="text-gray-500 text-sm mt-1">Fill out the form below to request this property.</p>
              </div>

              {success ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Request Sent!</h3>
                    <p className="text-gray-500 mt-2">Our team will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Full Name</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="fullName"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm"
                                placeholder="John Doe"
                            />
                            <User size={16} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Phone Number</label>
                            <div className="relative">
                                <input 
                                    type="tel" 
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm"
                                    placeholder="080..."
                                />
                                <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Email Address</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm"
                                    placeholder="john@example.com"
                                />
                                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Address</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm"
                                placeholder="Street Address"
                            />
                            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">State</label>
                            <select
                                name="state"
                                required
                                value={formData.state}
                                onChange={(e) => setFormData(prev => ({...prev, state: e.target.value, lga: ''}))}
                                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm bg-white"
                            >
                                <option value="">Select State</option>
                                {NIGERIAN_STATES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">L.G.A</label>
                            <select
                                name="lga"
                                required
                                value={formData.lga}
                                onChange={handleChange}
                                disabled={!formData.state}
                                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary sm:text-sm bg-white disabled:bg-gray-100"
                            >
                                <option value="">Select LGA</option>
                                {availableLgas.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-secondary hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center transition-all transform hover:scale-[1.02]"
                        >
                            {isSubmitting ? (
                                <span>Sending...</span>
                            ) : (
                                <>
                                    <Send size={18} className="mr-2" /> Send Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
