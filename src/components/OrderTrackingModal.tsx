import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Send,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TrackingDetails } from '../types';
import { getTrackingDetails } from '../api/client';

interface OrderTrackingModalProps {
  initialToken?: string | null;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  initialToken,
  onClose,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [details, setDetails] = useState<TrackingDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTgLink, setCopiedTgLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchTracking = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTrackingDetails(token.trim());
      setDetails(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'অর্ডারটি খুঁজে পাওয়া যায়নি বা ট্র্যাকিং টোকেনটি ভুল।');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchTracking(initialToken);
    }
  }, [initialToken]);

  const handleCopyTrackingUrl = () => {
    const fullUrl = `${window.location.origin}/?token=${tokenInput}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyTgLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTgLink(true);
    setTimeout(() => setCopiedTgLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-5 py-3.5 bg-slate-950/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 shrink-0" />
              <span>অর্ডার ট্র্যাকিং ও লিংক অ্যাক্সেস</span>
            </h3>
            <p className="text-[11px] text-slate-400">নিরাপদ অর্ডার ট্র্যাকিং ও টেলিগ্রাম জয়েনিং</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Token Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="সিকিউর ট্র্যাকিং টোকেন লিখুন..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs sm:text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={() => fetchTracking(tokenInput)}
              disabled={loading || !tokenInput.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">ট্র্যাক করুন</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {details && (
            <div className="space-y-4 animate-fadeIn">
              {/* COMPACT ORDER STATUS PANEL WITH EXPAND/COLLAPSE CONTROL */}
              <div
                className={`rounded-2xl border p-4 sm:p-4.5 transition-all ${
                  details.status === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : details.status === 'pending'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : details.status === 'payment_issue'
                    ? 'border-orange-500/40 bg-orange-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                {/* Header: Order Ref & Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider block">
                      অর্ডার রেফারেন্স আইডি
                    </span>
                    <p className="text-base sm:text-lg font-mono font-extrabold text-white break-all">
                      {details.id}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {details.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>অনুমোদিত</span>
                      </span>
                    )}
                    {details.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-300">
                        <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                        <span>অপেক্ষমাণ</span>
                      </span>
                    )}
                    {details.status === 'payment_issue' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 px-2.5 py-1 text-xs font-bold text-orange-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                        <span>পেমেন্ট ইস্যু</span>
                      </span>
                    )}
                    {details.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-xs font-bold text-rose-300">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        <span>বাতিলকৃত</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct quick action for approved order even in collapsed state */}
                {details.status === 'approved' && details.telegramInvite && !isExpanded && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                      <Send className="h-3.5 w-3.5" />
                      টেলিগ্রাম লিংক প্রস্তুত
                    </span>
                    <a
                      href={details.telegramInvite.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors"
                    >
                      <span>গ্রুপে জয়েন করুন</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Expand / Collapse Control Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isExpanded ? 'সকল বিবরণ প্রদর্শিত হচ্ছে' : 'বিস্তারিত পেমেন্ট ও কোর্সের তথ্য'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত দেখুন'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* TELEGRAM ACCESS BLOCK (Shown when approved) */}
              {details.status === 'approved' && details.telegramInvite && (
                <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-900 p-4 space-y-3 shadow-lg shadow-cyan-950/30">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 font-bold shrink-0">
                      <Send className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        অফিসিয়াল টেলিগ্রাম ইনভাইটেশন লিংক
                      </h4>
                      <p className="text-[11px] text-cyan-300">
                        নিচের বোতামে ক্লিক করে সরাসরি ভিআইপি গ্রুপে জয়েন করুন
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <a
                      href={details.telegramInvite.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 px-4 text-xs sm:text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md"
                    >
                      <span>টেলিগ্রাম গ্রুপে জয়েন করুন</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyTgLink(details.telegramInvite!.inviteLink)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 transition-colors cursor-pointer"
                    >
                      {copiedTgLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-cyan-400" />
                          <span>লিংক কপি</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    * এটি একটি নিরাপদ একক-ব্যবহারকারী (Single-use) ইনভাইটেশন লিংক। কারো সাথে শেয়ার করবেন না।
                  </p>
                </div>
              )}

              {/* Status Message when Pending */}
              {details.status === 'pending' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>ম্যানুয়াল পেমেন্ট ভেরিফিকেশন চলছে</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                    আমাদের অ্যাডমিন বিকাশ বা নগদ অ্যাকাউন্টে ট্রানজেকশনটি যাচাই করছেন। অনুমোদিত হওয়ামাত্রই এখানে সরাসরি আপনার প্রাইভেট টেলিগ্রাম জয়েনিং লিংক চলে আসবে।
                  </p>
                </div>
              )}

              {/* Status Message when Rejected */}
              {details.status === 'rejected' && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-300">
                  <p className="font-semibold mb-1">পেমেন্ট অনুমোদন করা সম্ভব হয়নি</p>
                  <p className="text-rose-400/90 text-[11px] sm:text-xs">
                    ট্রানজেকশন আইডি সঠিক ছিল না অথবা পেমেন্ট পাওয়া যায়নি। সহায়তার জন্য আমাদের ফেসবুক পেজ বা নম্বরে যোগাযোগ করুন।
                  </p>
                </div>
              )}

              {/* FULL ORDER DETAILS (Shown only when isExpanded is TRUE) */}
              {isExpanded && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Admin notes if present */}
                  {details.adminNotes && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                      <span className="font-semibold text-slate-200">অ্যাডমিন রিভিউ নোট: </span>
                      <span>{details.adminNotes}</span>
                    </div>
                  )}

                  {/* Order Info Breakdown */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-start py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">কোর্সের নাম</span>
                      <span className="font-semibold text-white text-right break-words max-w-[240px]">
                        {details.courseTitle}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">প্যাকেজ</span>
                      <span className="font-semibold text-white text-right">
                        {details.packageSnapshot.name} ({details.packageSnapshot.durationDays ? `${details.packageSnapshot.durationDays} দিন` : 'লাইফটাইম'})
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">পরিশোধিত অর্থ</span>
                      <span className="font-bold text-cyan-400 tabular-nums">
                        ৳{details.amountBdt}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">পেমেন্ট মাধ্যম</span>
                      <span className="uppercase font-semibold text-white">
                        {details.paymentMethod} Send Money
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">প্রেরক মোবাইল</span>
                      <span className="font-mono text-slate-300 break-all">
                        {details.maskedSenderPhone}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/80 gap-2">
                      <span className="text-slate-400 shrink-0">ট্রানজেকশন আইডি</span>
                      <span className="font-mono font-bold text-slate-200 break-all">
                        {details.trxIdMasked}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 gap-2">
                      <span className="text-slate-400 shrink-0">অর্ডারের সময়</span>
                      <span className="text-slate-300 text-right text-[11px]">
                        {new Date(details.createdAt).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>

                  {/* Bookmark & Save Tracking URL */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="text-[11px] text-slate-400">
                      <p className="font-semibold text-slate-300">ট্র্যাকিং লিংক সংরক্ষণ করুন</p>
                      <p>পরবর্তীতে যেকোনো সময় এই লিংক দিয়ে অবস্থা দেখা যাবে।</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTrackingUrl}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-cyan-400" />
                          <span>লিংক কপি</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
