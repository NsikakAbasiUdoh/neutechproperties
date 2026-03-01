
import React from 'react';
import { Settings, Clock, ShieldCheck } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-e32c51082ce4?q=80&w=2074&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
        
        {/* Icon */}
        <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="text-secondary animate-[spin_3s_linear_infinite]" size={40} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-4xl font-black text-white mb-6 tracking-tight uppercase">
          Scheduled Maintenance <br/>
          <span className="text-secondary">In Progress</span>
        </h1>

        {/* Divider */}
        <div className="h-1 w-20 bg-secondary mx-auto rounded-full mb-8"></div>

        {/* Message */}
        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
          <p>
            Our website is currently undergoing routine maintenance to improve performance and security.
          </p>
          <div className="flex items-center justify-center gap-2 text-white font-medium bg-white/10 py-3 px-6 rounded-lg w-fit mx-auto">
             <Clock size={18} className="text-secondary" />
             <span>We’ll be back online shortly.</span>
          </div>
          <p>Thank you for your patience.</p>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">Neutech Properties</span>
             <div className="flex items-center gap-1 text-xs text-green-500/80">
                <ShieldCheck size={12} />
                <span>Security Upgrade</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Maintenance;
