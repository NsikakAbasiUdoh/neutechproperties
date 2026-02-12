import React, { useState } from "react";
import { ViewState } from "../types";
import {
  Menu,
  X,
  Home,
  Building,
  PlusCircle,
  Phone,
  Shield,
  Users,
} from "lucide-react";

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Home", view: "HOME" as ViewState, icon: Home },
    { label: "Properties", view: "PROPERTIES" as ViewState, icon: Building },
    { label: "Agents", view: "AGENTS" as ViewState, icon: Users },
    { label: "Upload", view: "UPLOAD" as ViewState, icon: PlusCircle },
    { label: "Contact", view: "CONTACT" as ViewState, icon: Phone },
    { label: "Admin", view: "ADMIN" as ViewState, icon: Shield },
  ];

  return (
    <nav className="bg-primary/90 backdrop-blur-md text-white sticky top-0 z-50 shadow-lg border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer flex items-center gap-2"
            onClick={() => onNavigate("HOME")}
          >
            {/* Replaced CSS logo with Image */}
            <img
              src="/logo.png"
              alt="Neutech Properties"
              className="h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback if image fails to load (e.g. user hasn't added it yet)
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
            {/* Fallback Text Logo (Hidden if image loads, shown if fails) */}
            <div className="hidden flex items-center gap-2">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center transform rotate-3 shadow-lg">
                <span className="text-primary font-bold text-xl">N</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight leading-none text-white drop-shadow-sm">
                  NEUTECH
                </span>
                <span className="text-xs text-gray-300 uppercase tracking-widest leading-none">
                  Properties
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.view)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${
                      currentView === item.view
                        ? "bg-secondary text-primary shadow-md transform scale-105"
                        : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white/10 inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/20 focus:outline-none backdrop-blur-sm"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-primary/95 backdrop-blur-xl border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.view);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium flex items-center gap-3
                  ${
                    currentView === item.view
                      ? "bg-secondary text-primary"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
