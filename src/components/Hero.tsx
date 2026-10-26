import React from 'react';
import { Play, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroProps {
  settings: SiteSettings;
  onExploreCourses: () => void;
  onExplorePricing: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onExploreCourses,
  onExplorePricing,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-800/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Announcement Bar if set */}
        {settings.showAnnouncement !== false && settings.announcementText && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 text-xs text-cyan-200">
              <span className="font-semibold">{settings.announcementText}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>{settings.heroBadgeText || 'প্রফেশনাল ডিজিটাল লার্নিং প্ল্যাটফর্ম'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight lg:leading-[1.15]" style={{ textWrap: 'balance' }}>
              {settings.heroHeading || 'বাংলাদেশ সেরা প্রিমিয়াম টেক ও প্রোগ্রামিং স্কিল প্ল্যাটফর্ম'}
            </h1>

            {settings.heroSubtitle && (
              <p className="text-sm font-semibold text-cyan-300">
                {settings.heroSubtitle}
              </p>
            )}

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {settings.heroDescription ||
                'কোনো দীর্ঘ রেজিস্ট্রেশন ছাড়াই সহজে বিকাশ বা নগদে পেমেন্ট করুন এবং অ্যাডমিনের ভেরিফিকেশন সাপেক্ষে পান অফিশিয়াল প্রাইভেট টেলিগ্রাম কমিউনিটি ও ফুল কোর্স অ্যাক্সেস।'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExploreCourses}
                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/40 transition-all active:scale-95 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{settings.ctaExplore || 'কোর্স দেখুন'}</span>
              </button>

              <button
                onClick={onExplorePricing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 active:scale-95 cursor-pointer"
              >
                <span>{settings.ctaPricing || 'প্যাকেজ দেখুন'}</span>
                <ArrowRight className="h-4 w-4 text-cyan-400" />
              </button>
            </div>

            {/* Trust points in clean unboxed text with separators */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-cyan-400" />
                <span>বিকাশ ও নগদ ম্যানুয়াল ভেরিফিকেশন</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Lock className="h-4 w-4 text-amber-400" />
                <span>প্রাইভেট সিকিউর টেলিগ্রাম অ্যাক্সেস</span>
              </div>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>রেজিস্ট্রেশন ছাড়াই ওয়ান-ক্লিক পারচেজ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Video Platform Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-2 shadow-2xl shadow-cyan-950/30">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 group">
                {/* Hero preview video image */}
                <img
                  src={settings.heroImageUrl || "/src/assets/images/hero_techvantage_banner_1792938697744.jpg"}
                  alt="TechVantage BD Learning Experience"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Video player overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-cyan-400 border border-slate-700/60">
                      লকড প্রিমিয়াম স্ট্রিম
                    </span>
                    <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                      HD 1080p
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/90 text-slate-950 shadow-lg shadow-cyan-500/30 backdrop-blur-sm group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white truncate">
                      TechVantage BD ডিজিটাল একাডেমি প্রিভিউ
                    </p>
                    <p className="text-[11px] text-slate-400">
                      পেমেন্ট অনুমোদনের পর সম্পূর্ণ কোর্স আনলক হবে
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick stats footer under video */}
              <div className="grid grid-cols-3 divide-x divide-slate-800 pt-3 pb-1 text-center">
                <div>
                  <p className="text-xs text-slate-400">কোর্স লাইব্রেরি</p>
                  <p className="text-sm font-bold text-white tabular-nums">৪+ ট্র্যাক</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">প্যাকেজ শুরু</p>
                  <p className="text-sm font-bold text-cyan-400 tabular-nums">৳১৫০ / মাস</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">কমিউনিটি</p>
                  <p className="text-sm font-bold text-white">টেলিগ্রাম</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
