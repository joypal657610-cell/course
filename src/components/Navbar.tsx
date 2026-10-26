import React, { useState } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { SiteSettings } from '../types';

interface NavbarProps {
  settings: SiteSettings;
  onNavigate: (sectionId: string) => void;
  onOpenRecovery: () => void;
  onOpenCheckout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onNavigate,
  onOpenRecovery,
  onOpenCheckout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = settings.navLinks?.filter((l) => l.isVisible !== false) || [
    { id: 'nav_home', label: 'হোম', href: 'home', isVisible: true },
    { id: 'nav_courses', label: 'কোর্সসমূহ', href: 'courses', isVisible: true },
    { id: 'nav_pricing', label: 'প্যাকেজ ও ফি', href: 'pricing', isVisible: true },
    { id: 'nav_faq', label: 'সচরাচর জিজ্ঞাসা', href: 'faq', isVisible: true },
  ];

  const handleLinkClick = (href: string) => {
    if (href === 'recovery' || href === 'tracking') {
      onOpenRecovery();
    } else if (href === 'checkout') {
      onOpenCheckout();
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark / Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90 shrink-0 cursor-pointer"
        >
          {settings.brandLogoUrl ? (
            <img
              src={settings.brandLogoUrl}
              alt={settings.brandName || 'TechVantage BD'}
              className="h-8 w-8 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-950/50">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            {settings.brandName || 'TechVantage BD'}
          </span>
        </button>

        {/* Zone 2: Dynamic Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.href)}
              className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={onOpenRecovery}
            className="hover:text-cyan-300 text-cyan-400/90 transition-colors whitespace-nowrap shrink-0 cursor-pointer font-medium"
          >
            অর্ডার ট্র্যাকিং ও রিকভারি
          </button>
        </nav>

        {/* Zone 3: CTA Button (Managed via CMS) */}
        {settings.showHeaderCta !== false && (
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (settings.headerCtaHref === 'courses' || settings.headerCtaHref === 'pricing') {
                  onNavigate(settings.headerCtaHref);
                } else {
                  onOpenCheckout();
                }
              }}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-900/20 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              {settings.headerCtaText || 'এখনই কোর্স কিনুন'}
            </button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 md:hidden">
          <div className="flex flex-col gap-3 text-base font-medium text-slate-300">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  handleLinkClick(link.href);
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-left hover:text-cyan-400 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                onOpenRecovery();
                setMobileMenuOpen(false);
              }}
              className="py-2 text-left text-cyan-400 font-semibold transition-colors"
            >
              অর্ডার ট্র্যাকিং ও রিকভারি
            </button>

            {settings.showHeaderCta !== false && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCheckout();
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-center text-xs font-bold text-slate-950 shadow-md"
                >
                  {settings.headerCtaText || 'এখনই কোর্স কিনুন'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
