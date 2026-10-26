import React, { useState } from 'react';
import { X, Copy, Check, AlertCircle, ArrowRight, ShieldCheck, Loader2, Phone, Hash } from 'lucide-react';
import { Course, Package, PaymentMethod, SiteSettings } from '../types';
import { submitCheckout } from '../api/client';

interface CheckoutModalProps {
  initialCourse?: Course | null;
  initialPackage?: Package | null;
  courses: Course[];
  packages: Package[];
  settings: SiteSettings;
  onClose: () => void;
  onSuccess: (orderId: string, trackingToken: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  initialCourse,
  initialPackage,
  courses,
  packages,
  settings,
  onClose,
  onSuccess,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourse?.id || courses[0]?.id || ''
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialPackage?.id || packages[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');

  // ONLY 2 Required Customer Fields:
  // 1. যে নম্বর থেকে টাকা পাঠিয়েছেন (senderPhone)
  // 2. Transaction ID (trxId)
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const recipientNumber =
    paymentMethod === 'bkash'
      ? settings.bkashNumber || '01983463798'
      : settings.nagadNumber || '01771576066';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(recipientNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSenderPhone = senderPhone.replace(/\D/g, '');
    if (!cleanSenderPhone || cleanSenderPhone.length < 11 || !cleanSenderPhone.startsWith('01')) {
      setError('যে নম্বর থেকে টাকা পাঠিয়েছেন সেই সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }
    if (!trxId.trim() || trxId.trim().length < 5) {
      setError('সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন (যেমন: 9J82K3L5)।');
      return;
    }

    setLoading(true);
    try {
      const res = await submitCheckout({
        courseId: currentCourse.id,
        packageId: currentPackage.id,
        paymentMethod,
        senderPhone: senderPhone.trim(),
        trxId: trxId.trim().toUpperCase(),
      });

      onSuccess(res.orderId, res.trackingToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'পেমেন্ট রিকোয়েস্ট সাবমিশনে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-4 sm:my-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 sm:px-6 py-3.5 bg-slate-950/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <span>পেমেন্ট রিকোয়েস্ট ফর্ম</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">রেজিস্ট্রেশন ছাড়াই সহজ ও দ্রুত গেস্ট চেকআউট</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Course and Package Selection Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                নির্বাচিত কোর্স
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                প্যাকেজ ও মেয়াদ
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ৳{p.priceBdt} ({p.durationDays ? `${p.durationDays} দিন` : 'লাইফটাইম'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price display banner */}
          {(() => {
            const basePrice = currentPackage?.priceBdt || 150;
            let finalPrice = basePrice;
            let hasDiscount = false;

            if (currentPackage?.discountActive && currentPackage?.discountValue && currentPackage.discountValue > 0) {
              const now = new Date();
              let inDate = true;
              if (currentPackage.discountStartDate && now < new Date(currentPackage.discountStartDate)) inDate = false;
              if (currentPackage.discountEndDate && now > new Date(currentPackage.discountEndDate)) inDate = false;

              if (inDate) {
                if (currentPackage.discountType === 'percentage') {
                  const pct = Math.min(100, Math.max(0, currentPackage.discountValue));
                  finalPrice = Math.max(0, Math.round(basePrice * (1 - pct / 100)));
                  hasDiscount = finalPrice < basePrice;
                } else {
                  finalPrice = Math.max(0, Math.round(basePrice - currentPackage.discountValue));
                  hasDiscount = finalPrice < basePrice;
                }
              }
            }

            return (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-300 font-medium">পরিশোধযোগ্য সর্বমোট পরিমাণ</p>
                  <p className="text-[11px] text-slate-400">
                    {currentPackage?.durationDays ? `${currentPackage.durationDays} দিন মেয়াদ` : 'আজীবন অ্যাক্সেস'}
                  </p>
                </div>
                <div className="text-right">
                  {hasDiscount && (
                    <span className="text-xs text-slate-400 line-through mr-1.5 tabular-nums">
                      ৳{basePrice}
                    </span>
                  )}
                  <span className="text-2xl font-extrabold text-white tabular-nums">
                    ৳{finalPrice}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 2. Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পেমেন্ট মাধ্যম বেছে নিন
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-950/30 shadow-md shadow-pink-950/40 text-pink-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm">বিকাশ (bKash)</span>
                <span className="text-[10px] font-medium bg-pink-500/20 px-2 py-0.5 rounded text-pink-300">
                  Send Money
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'nagad'
                    ? 'border-amber-500 bg-amber-950/30 shadow-md shadow-amber-950/40 text-amber-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs sm:text-sm">নগদ (Nagad)</span>
                <span className="text-[10px] font-medium bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">
                  Send Money
                </span>
              </button>
            </div>
          </div>

          {/* 3. Send Money Instructions & Copy Number */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                  {paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} পার্সোনাল নম্বর (Send Money)
                </p>
                <p className="text-base sm:text-lg font-mono font-bold text-white tracking-wider mt-0.5">
                  {recipientNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500 transition-colors cursor-pointer"
              >
                {copiedNumber ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-xs">কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs">কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] sm:text-xs text-slate-400 space-y-1">
              <p>১. আপনার {paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} অ্যাপে <strong>Send Money</strong> অপশনে যান।</p>
              <p>২. উপরের নম্বরে ঠিক <strong>৳{currentPackage?.priceBdt}</strong> টাকা পাঠান।</p>
              <p>৩. সফল হওয়ার পর মেসেজ বা অ্যাপ থেকে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> নিচের ফর্মে লিখুন।</p>
            </div>
          </div>

          {/* 4. ONLY 2 REQUIRED CUSTOMER FIELDS */}
          <div className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                ১. যে নম্বর থেকে টাকা পাঠিয়েছেন <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                * পেমেন্ট ভেরিফিকেশন এবং পরবর্তীতে যেকোনো সময় অর্ডার রিকভার করার জন্য এই নম্বরটি ব্যবহৃত হবে।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                ২. Transaction ID (TrxID) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: BL83K90M2"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white font-mono uppercase tracking-wider focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notice about manual review */}
          <div className="rounded-lg bg-slate-950/70 border border-slate-800 p-2.5 text-[11px] text-slate-400">
            * ট্রানজেকশন সাবমিট করার পর রিকোয়েস্টটি পেন্ডিং অবস্থায় থাকবে। আমাদের অ্যাডমিন পেমেন্ট যাচাই করে অনুমোদন করার সাথে সাথে আপনার টেলিগ্রাম অ্যাক্সেস লিংক উন্মুক্ত হবে।
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 px-4 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>পেমেন্ট রিকোয়েস্ট জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>পেমেন্ট রিকোয়েস্ট সাবমিট করুন (৳{currentPackage?.priceBdt})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
