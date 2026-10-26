import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react';
import { SiteSettings } from '../types';

interface FaqSectionProps {
  settings: SiteSettings;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ settings }) => {
  const [openId, setOpenId] = useState<string | null>(settings.faqList[0]?.id || null);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 border-b border-slate-800/80 bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>সচরাচর জিজ্ঞাসা</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            সাধারণ প্রশ্ন ও উত্তর
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            কোর্স সাবস্ক্রিপশন, পেমেন্ট এবং টেলিগ্রাম এক্সেস সম্পর্কিত সাধারণ তথ্যাবলী।
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 mb-14">
          {settings.faqList.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors hover:border-slate-700"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-semibold text-slate-200 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300/90 leading-relaxed border-t border-slate-800/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Strip */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                আরও কোনো প্রশ্ন বা জিজ্ঞাসা আছে?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                আমাদের সাপোর্ট টিম প্রতিদিন সকাল ১০টা থেকে রাত ১১টা পর্যন্ত সহায়তার জন্য প্রস্তুত।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span className="font-mono">{settings.contactPhone || '+8801983463798'}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span>{settings.contactEmail || 'support@techvantagebd.com'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
