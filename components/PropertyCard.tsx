import React from 'react';
import { Property, PropertyType } from '../types'; 
import { MapPin, ArrowRight, Phone, Send, ImageOff } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onRequest?: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onRequest }) => {
  // Defensive check: Ensure arrays exist
  const images = property.images || [];
  const features = property.features || [];
  const [imgError, setImgError] = React.useState(false);

  // Format price to Naira
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(price);
  };

  const isRent = property.type === PropertyType.RENT;
  const coverImage = images.length > 0 ? images[0] : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-white/20 flex flex-col h-full group hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative h-60 overflow-hidden bg-gray-200 cursor-pointer" onClick={() => onRequest && onRequest(property)}>
        {coverImage && !imgError ? (
          <img 
            src={coverImage} 
            alt={property.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              setImgError(true);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
             <ImageOff size={32} className="mb-2" />
             <span className="text-xs">Image not available</span>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/10">
          {property.type}
        </div>
        <div className="absolute top-4 left-4 bg-secondary/90 backdrop-blur text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-white/10">
          {property.category}
        </div>
        
        {/* Photo Count Indicator */}
        {images.length > 1 && (
             <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                 {images.length} photos
             </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white font-bold text-xl truncate drop-shadow-md">{formatPrice(property.price)}{isRent && '/yr'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-secondary transition-colors">
          {property.title}
        </h3>
        
        <div className="flex items-start text-gray-600 mb-4 text-sm">
          <MapPin size={16} className="mr-1 mt-0.5 flex-shrink-0 text-secondary" />
          <span className="line-clamp-2">{property.location.address}, {property.location.lga}, {property.location.state}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {property.description}
        </p>

        {/* Features Preview */}
        <div className="flex flex-wrap gap-2 mb-4">
          {features.slice(0, 3).map((feat, idx) => (
            <span key={idx} className="text-xs bg-gray-100/80 border border-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
              {feat}
            </span>
          ))}
          {features.length > 3 && (
            <span className="text-xs bg-gray-100/80 border border-gray-200 text-gray-700 px-2 py-1 rounded-md font-medium">
              +{features.length - 3} more
            </span>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mt-auto flex justify-between items-center gap-2">
           {/* Contact / Phone */}
           <div className="hidden sm:flex items-center text-gray-500 font-semibold text-xs">
            <Phone size={14} className="mr-1" />
            {property.contactPhone}
          </div>

          {/* Action Button */}
          {onRequest ? (
            <button 
                onClick={() => onRequest(property)}
                className="flex-1 bg-secondary text-white hover:bg-amber-600 text-sm font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
            >
                <Send size={14} className="mr-2" /> Interested? Click here
            </button>
          ) : (
            <button className="text-primary hover:text-secondary font-medium text-sm flex items-center transition-colors ml-auto">
                View Details <ArrowRight size={14} className="ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
