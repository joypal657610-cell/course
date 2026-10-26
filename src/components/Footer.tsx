import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  onTriggerAdminPinModal: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenRecovery: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onTriggerAdminPinModal,
  onNavigate,
  onOpenRecovery,
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 pt-12 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {settings.brandName || 'TechVantage BD'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              {settings.footerDescription ||
                'বাংলাদেশের টেক লার্নার ও প্রফেশনালদের জন্য বিশ্বমানের প্রজেক্ট-ভিত্তিক আইটি ও সফটওয়্যার স্কিল ডেভেলপমেন্ট প্ল্যাটফর্ম। বিকাশ ও নগদ ইনস্ট্যান্ট ম্যানুয়াল ভেরিফিকেশন।'}
            </p>
            {settings.contactAddress && (
              <p className="text-xs text-slate-500 font-medium">
                📍 {settings.contactAddress}
              </p>
            )}
          </div>

          {/* Quick links & Socials */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              কুইক লিংকস
            </h4>
            <ul className="space-y-2 text-xs">
              {(settings.footerLinks || [
                { id: 'fl_home', label: 'হোম পেজ', href: 'home' },
                { id: 'fl_courses', label: 'প্রিমিয়াম কোর্সসমূহ', href: 'courses' },
                { id: 'fl_pricing', label: 'প্যাকেজ ও ফি', href: 'pricing' },
                { id: 'fl_faq', label: 'সচরাচর জিজ্ঞাসা (FAQ)', href: 'faq' },
              ]).map((fl) => (
                <li key={fl.id}>
                  <button
                    onClick={() => onNavigate(fl.href)}
                    className="hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {fl.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={onOpenRecovery}
                  className="text-cyan-400/90 hover:text-cyan-300 transition-colors cursor-pointer font-medium"
                >
                  অর্ডার ট্র্যাকিং ও রিকভারি
                </button>
              </li>
            </ul>

            {/* Social Links if configured */}
            {settings.socialLinks && settings.socialLinks.filter((s) => s.isVisible).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-900">
                <p className="text-[11px] font-semibold text-slate-400 mb-2">কমিউনিটি ও সোশ্যাল</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {settings.socialLinks
                    .filter((s) => s.isVisible)
                    .map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        {s.platform}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
              পেমেন্ট মাধ্যম
            </h4>
            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                বিকাশ (Send Money):{' '}
                <span className="font-mono text-cyan-400 font-semibold">{settings.bkashNumber || '01983463798'}</span>
              </p>
              <p className="text-slate-300">
                নগদ (Send Money):{' '}
                <span className="font-mono text-cyan-400 font-semibold">{settings.nagadNumber || '01771576066'}</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                * সঠিক TrxID সহ ফর্ম জমা দিন, অ্যাডমিন প্যানেলে যাচাই সাপেক্ষে স্বয়ংক্রিয়ভাবে অ্যাক্সেস প্রদান করা হবে।
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Strip with EXACT Copyright requirement & Hidden Entry Point */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center sm:text-left select-none">
            {/* The copyright symbol © is the discrete hidden administrator entry point */}
            <span
              onClick={onTriggerAdminPinModal}
              title="TechVantage BD"
              className="cursor-pointer hover:text-cyan-400 transition-colors duration-200 font-bold"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onTriggerAdminPinModal();
              }}
            >
              ©
            </span>{' '}
            {settings.footerCopyright?.replace(/©/g, '').trim() || '2026 TechVantage BD. সর্বস্বত্ব সংরক্ষিত।'}
          </p>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>প্রাইভেসি পলিসি</span>
            <span>·</span>
            <span>শর্তাবলী</span>
            <span>·</span>
            <span>বাংলাদেশ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
