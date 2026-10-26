import React from 'react';
import { Home, KeyRound } from 'lucide-react';

interface MobileBottomNavProps {
  currentView?: string;
  onGoHome: () => void;
  onOpenYourLink: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView = 'home',
  onGoHome,
  onOpenYourLink,
}) => {
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl shadow-black/80"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Action 1: হোম (Home / Scroll to Top) */}
        <button
          type="button"
          onClick={onGoHome}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            currentView === 'home'
              ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Home className="h-5 w-5 mb-1 shrink-0" />
          <span className="text-[11px] tracking-wide">হোম</span>
        </button>

        {/* Subtle center divider */}
        <div className="h-6 w-px bg-slate-800 mx-1" aria-hidden="true" />

        {/* Action 2: Your Link (অর্ডার ট্র্যাকিং ও টেলিগ্রাম লিংক এক্সেস) */}
        <button
          type="button"
          onClick={onOpenYourLink}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            currentView === 'your_link'
              ? 'text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-500/20'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900/60'
          }`}
        >
          <div className="relative">
            <KeyRound className="h-5 w-5 mb-1 shrink-0" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          </div>
          <span className="text-[11px] tracking-wide font-medium">Your Link</span>
        </button>
      </div>
    </nav>
  );
};
