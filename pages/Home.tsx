import React, { useContext, useMemo, useState, useEffect } from "react";
import { NIGERIAN_STATES } from "../constants";
import { ViewState, PropertyContextType, PropertyStatus } from "../types";
import PropertyCard from "../components/PropertyCard";
import { Search, MapPin, ArrowRight, Shield, Tag, Clock } from "lucide-react";

interface HomeProps {
  propertyContext: PropertyContextType;
  onNavigate: (view: ViewState) => void;
}

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-e32c51082ce4?q=80&w=2074&auto=format&fit=crop", // Modern Exterior
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2074&auto=format&fit=crop", // Luxury Interior
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2074&auto=format&fit=crop", // Villa with Pool
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2074&auto=format&fit=crop", // Modern Living Room
  "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=2070&auto=format&fit=crop", // Luxury Hall
];

const Home: React.FC<HomeProps> = ({ propertyContext, onNavigate }) => {
  const {
    properties,
    setFilterState,
    setFilterLGA,
    filterState,
    filterLGA,
    openRequestModal,
  } = propertyContext;
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Background Slider Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState(e.target.value);
    setFilterLGA(""); // Reset LGA when state changes
  };

  const handleSearch = () => {
    onNavigate("PROPERTIES");
  };

  // Get LGAs for selected state
  const availableLgas = useMemo(() => {
    const state = NIGERIAN_STATES.find((s) => s.name === filterState);
    return state ? state.lgas : [];
  }, [filterState]);

  // Featured properties (latest 3 Approved)
  const featuredProperties = properties
    .filter((p) => p.status === PropertyStatus.APPROVED)
    .slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Slideshow (Fixed) */}
      <div className="fixed inset-0 z-0">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out`}
            style={{
              backgroundImage: `url(${img})`,
              opacity: index === currentBgIndex ? 1 : 0,
            }}
          >
            {/* Dark Overlay for better text visibility */}
            <div className="absolute inset-0 bg-slate-900/60" />
          </div>
        ))}
      </div>

      {/* Content Wrapper (z-10 to sit above background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <div className="relative min-h-[600px] flex items-center justify-center py-20">
          <div className="w-full max-w-5xl px-4 text-center">
            {/* Glassmorphism Container */}
            <div className="bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center">
              {/* Hero Logo */}
              <img
                src="/logo.png"
                alt="Neutech Properties"
                className="h-20 md:h-28 w-auto mb-6 object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                Find Your <span className="text-secondary">Dream Property</span>{" "}
                in Nigeria
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
                Discover modern duplexes, commercial hubs, and verified lands.
                Experience a seamless real estate journey with Neutech.
              </p>

              {/* Search Box */}
              <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3 max-w-4xl w-full mx-auto items-center border border-white/40">
                <div className="flex-1 w-full md:w-auto relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <select
                    value={filterState}
                    onChange={handleStateChange}
                    className="block w-full pl-10 pr-3 py-4 text-base border-transparent bg-transparent rounded-xl focus:ring-0 text-gray-800 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state.name} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-10 bg-gray-300 hidden md:block"></div>

                <div className="flex-1 w-full md:w-auto relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-secondary" />
                  </div>
                  <select
                    value={filterLGA}
                    onChange={(e) => setFilterLGA(e.target.value)}
                    disabled={!filterState}
                    className="block w-full pl-10 pr-3 py-4 text-base border-transparent bg-transparent rounded-xl focus:ring-0 text-gray-800 font-medium cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select L.G.A</option>
                    {availableLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto bg-primary hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg transform hover:scale-[1.02] active:scale-95"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Section - Transparent Background */}
        <section className="py-20 bg-slate-900/30 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-secondary font-bold tracking-wider uppercase text-sm">
                Exclusive Offers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 mt-2">
                Featured Properties
              </h2>
              <div className="w-24 h-1.5 bg-secondary mx-auto rounded-full"></div>
              <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
                Hand-picked selection of premium properties available for
                immediate acquisition.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  className="transform hover:-translate-y-2 transition-transform duration-300"
                >
                  <PropertyCard
                    property={property}
                    onRequest={openRequestModal}
                  />
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={() => onNavigate("PROPERTIES")}
                className="inline-flex items-center px-8 py-3 border border-white/30 rounded-full text-white font-semibold hover:bg-white hover:text-primary transition-all duration-300 backdrop-blur-sm"
              >
                View All Properties <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Trust Indicators - Glassy cards */}
        <section className="py-20 bg-gradient-to-b from-transparent to-slate-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Verified Listings
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Every property is thoroughly vetted to ensure authenticity,
                  legal standing, and peace of mind.
                </p>
              </div>

              <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Tag size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  Best Prices
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  We negotiate directly with property owners and developers to
                  bring you the best market deals.
                </p>
              </div>

              <div className="p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  24/7 Support
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Our dedicated team of real estate experts is always available
                  to guide you through every step.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
