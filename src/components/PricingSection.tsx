import React from 'react';
import { Check, ShieldCheck, ArrowRight, Zap, Crown } from 'lucide-react';
import { Package } from '../types';

interface PricingSectionProps {
  packages: Package[];
  onSelectPackageForCheckout: (pkg: Package) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  packages,
  onSelectPackageForCheckout,
}) => {
  return (
    <section id="pricing" className="py-16 sm:py-24 border-b border-slate-800/80 bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            আপনার সুবিধাজনক প্যাকেজ বেছে নিন
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            বিকাশ বা নগদ সেন্ড মানির মাধ্যমে পেমেন্ট সম্পন্ন করুন। কোনো লুকায়িত ফি নেই।
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => {
            const isLifetime = pkg.durationDays === null;
            const isBestValue = pkg.badge === 'সেরা ভ্যালু' || pkg.id === 'pkg_3m';

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
                  isBestValue
                    ? 'border-cyan-500/60 bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-900 shadow-2xl shadow-cyan-950/40 md:-translate-y-2'
                    : isLifetime
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 shadow-xl'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {/* Badge if present */}
                {pkg.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`rounded-full px-3.5 py-1 text-xs font-bold tracking-wide shadow-md ${
                        isBestValue
                          ? 'bg-cyan-500 text-slate-950'
                          : isLifetime
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {isLifetime && <Crown className="h-5 w-5 text-amber-400" />}
                      {pkg.name}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 mb-6 min-h-[40px]">
                    {pkg.description}
                  </p>

                  {(() => {
                    const basePrice = pkg.priceBdt;
                    let finalPrice = basePrice;
                    let hasDiscount = false;
                    let discountLabel = '';

                    if (pkg.discountActive && pkg.discountValue && pkg.discountValue > 0) {
                      const now = new Date();
                      let inDate = true;
                      if (pkg.discountStartDate && now < new Date(pkg.discountStartDate)) inDate = false;
                      if (pkg.discountEndDate && now > new Date(pkg.discountEndDate)) inDate = false;

                      if (inDate) {
                        if (pkg.discountType === 'percentage') {
                          const pct = Math.min(100, Math.max(0, pkg.discountValue));
                          finalPrice = Math.max(0, Math.round(basePrice * (1 - pct / 100)));
                          hasDiscount = finalPrice < basePrice;
                          discountLabel = `${pct}% ছাড়`;
                        } else {
                          finalPrice = Math.max(0, Math.round(basePrice - pkg.discountValue));
                          hasDiscount = finalPrice < basePrice;
                          discountLabel = `৳${pkg.discountValue} ছাড়`;
                        }
                      }
                    }

                    return (
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-4xl font-extrabold text-white tabular-nums">
                            ৳{finalPrice}
                          </span>
                          {hasDiscount && (
                            <span className="text-base font-semibold text-slate-500 line-through tabular-nums">
                              ৳{basePrice}
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-400">
                            {pkg.durationDays ? `/ ${pkg.durationDays} দিন` : '/ আজীবন অ্যাক্সেস'}
                          </span>
                        </div>
                        {hasDiscount && (
                          <div className="mt-1.5">
                            <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-md px-2 py-0.5">
                              {discountLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Features list */}
                  <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-8">
                    {pkg.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Buy Now Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectPackageForCheckout(pkg)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                      isBestValue
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/50'
                        : isLifetime
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40'
                        : 'border border-slate-700 hover:border-cyan-500/60 bg-slate-800 hover:bg-slate-750 text-white'
                    }`}
                  >
                    <span>এখনই কিনুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    গেস্ট চেকআউট · কোনো রেজিস্ট্রেশনের প্রয়োজন নেই
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom guarantee strip */}
        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>অ্যাডমিন কর্তৃক সুরক্ষিত পেমেন্ট ভেরিফিকেশন</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>এককালীন ফি, কোনো গোপন অটো-রিনিউ চার্জ নেই</span>
          </div>
        </div>
      </div>
    </section>
  );
};
