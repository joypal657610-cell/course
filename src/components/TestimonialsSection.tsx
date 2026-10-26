import React from 'react';
import { Star, Quote } from 'lucide-react';
import { SiteSettings } from '../types';

interface TestimonialsSectionProps {
  settings: SiteSettings;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ settings }) => {
  const testimonials = settings.testimonials && settings.testimonials.length > 0
    ? settings.testimonials
    : [
        {
          id: 't_1',
          name: 'আরিফুল ইসলাম',
          role: 'জুনিয়র ফুল-স্ট্যাক ডেভেলপার',
          comment: 'TechVantage BD-এর কোর্স কনটেন্ট একদম প্র্যাকটিক্যাল। বিকাশ পেমেন্ট করার অল্প কিছুক্ষণের মধ্যেই অ্যাডমিন ভেরিফাই করে টেলিগ্রাম গ্রুপে যুক্ত করে দিয়েছেন।',
          rating: 5,
        },
        {
          id: 't_2',
          name: 'ফারহানা ইয়াসমিন',
          role: 'পাইথন শিক্ষার্থী',
          comment: 'কোনো লগইন বা সাইন আপ ছাড়া এত সহজে কোর্স কেনা যায় ভাবিনি। টেলিগ্রাম কমিউনিটিতে মেন্টররা দারুণ হেল্পফুল!',
          rating: 5,
        },
        {
          id: 't_3',
          name: 'তানভীর হাসান',
          role: 'সাইবার সিকিউরিটি লার্নার',
          comment: 'প্রাইভেট টেলিগ্রাম কমিউনিটি অসাধারণ। যেকোনো প্রবলেমে সাহায্য পাই এবং রিসোর্সগুলো সত্যিই প্রিমিয়াম।',
          rating: 5,
        },
      ];

  return (
    <section className="py-16 sm:py-20 border-b border-slate-800/80 bg-slate-950/60 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>শিক্ষার্থীদের মতামত</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            গ্রাহক ও শিক্ষার্থীদের অভিজ্ঞতা
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            TechVantage BD-এর বিশ্বস্ত মেম্বারদের বাস্তব রিভিউ ও সফলতার গল্প।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
            >
              <Quote className="h-8 w-8 text-cyan-500/20 absolute top-4 right-4" />
              <div>
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < (t.rating || 5) ? 'fill-current' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/70">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {t.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
