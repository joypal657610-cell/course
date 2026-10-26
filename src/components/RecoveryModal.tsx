import React, { useState } from 'react';
import {
  X,
  Phone,
  Hash,
  KeyRound,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Send,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { lookupOrderRecovery } from '../api/client';

interface RecoveryModalProps {
  onClose: () => void;
  onOpenOrderTracking: (token: string) => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  onClose,
  onOpenOrderTracking,
}) => {
  const [activeTab, setActiveTab] = useState<'phone_trx' | 'token'>('phone_trx');

  // Tab 1: Phone + TrxID
  const [phone, setPhone] = useState('');
  const [trxId, setTrxId] = useState('');

  // Tab 2: Token / Order ID
  const [tokenOrOrderId, setTokenOrOrderId] = useState('');

  // Status & results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean;
    orderFound?: boolean;
    orderId?: string;
    trackingToken?: string;
    status?: string;
    courseTitle?: string;
    hasTelegramAccess?: boolean;
    telegramInviteLink?: string | null;
    message: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const handlePhoneTrxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoveryResult(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      setError('যে নম্বর থেকে টাকা পাঠিয়েছেন সেই সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!trxId.trim() || trxId.trim().length < 4) {
      setError('পেমেন্টের Transaction ID (TrxID) প্রদান করুন।');
      return;
    }

    setLoading(true);
    try {
      const res = await lookupOrderRecovery({
        phone: cleanPhone,
        trxId: trxId.trim().toUpperCase(),
      });
      setRecoveryResult(res);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'অর্ডার অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে তথ্য যাচাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoveryResult(null);

    if (!tokenOrOrderId.trim() || tokenOrOrderId.trim().length < 6) {
      setError('অনুগ্রহ করে সঠিক অর্ডার রেফারেন্স আইডি বা সিকিউর ট্র্যাকিং টোকেন দিন।');
      return;
    }

    setLoading(true);
    try {
      const res = await lookupOrderRecovery({
        tokenOrOrderId: tokenOrOrderId.trim(),
      });
      setRecoveryResult(res);
      if (!res.success) {
        setError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'অর্ডার অনুসন্ধানে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-4 sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 sm:px-6 py-3.5 bg-slate-950/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-cyan-400" />
              <span>টেলিগ্রাম লিংক ও অর্ডার রিকভারি</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400">
              নিরাপদ পেমেন্ট ভেরিফিকেশন সাপেক্ষে লিংক পুনরুদ্ধার
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('phone_trx');
                setError(null);
                setRecoveryResult(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'phone_trx'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              পেমেন্ট নম্বর ও TrxID দিয়ে
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('token');
                setError(null);
                setRecoveryResult(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'token'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              অর্ডার রেফারেন্স / টোকেন দিয়ে
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form 1: Phone + TrxID */}
          {activeTab === 'phone_trx' && !recoveryResult?.orderFound && (
            <form onSubmit={handlePhoneTrxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  যে নম্বর থেকে পেমেন্ট করেছেন (বিকাশ/নগদ)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Transaction ID (TrxID)
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
                <p className="text-[10px] text-slate-400 mt-1">
                  * পেমেন্ট নম্বর এবং ট্রানজেকশন আইডি মিলে গেলে তাৎক্ষণিক আপনার অনুমোদিত টেলিগ্রাম অ্যাক্সেস লিংক প্রদর্শিত হবে।
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950/40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>অর্ডার ও টেলিগ্রাম লিংক খুঁজুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form 2: Token / Order ID */}
          {activeTab === 'token' && !recoveryResult?.orderFound && (
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  অর্ডার রেফারেন্স বা সিকিউর ট্র্যাকিং টোকেন
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="যেমন: TVB-123456 বা 64-অক্ষরের টোকেন"
                    value={tokenOrOrderId}
                    onChange={(e) => setTokenOrOrderId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * চেকআউট সাবমিশনের সময় প্রাপ্ত রেফারেন্স কোড বা বুকমার্ককৃত লিংক থেকে টোকেনটি পেস্ট করুন।
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 text-sm font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950/40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>অর্ডার বিস্তারিত লোড করুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* RECOVERY RESULT CARD */}
          {recoveryResult?.orderFound && (
            <div className="space-y-4 animate-fadeIn">
              <div
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                  recoveryResult.status === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : recoveryResult.status === 'pending'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-cyan-400" />
                    <span className="font-mono font-bold text-white text-sm">
                      {recoveryResult.orderId}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      recoveryResult.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : recoveryResult.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {recoveryResult.status === 'approved'
                      ? 'অনুমোদিত (Approved)'
                      : recoveryResult.status === 'pending'
                      ? 'অপেক্ষমাণ (Pending)'
                      : 'বাতিলকৃত'}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200">
                  {recoveryResult.courseTitle}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {recoveryResult.message}
                </p>

                {/* APPROVED: Telegram Access Link is revealed */}
                {recoveryResult.status === 'approved' && recoveryResult.telegramInviteLink && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                      <Send className="h-4 w-4" />
                      <span>অফিশিয়াল টেলিগ্রাম অ্যাক্সেস লিংক:</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <a
                        href={recoveryResult.telegramInviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 px-3 text-xs font-bold text-slate-950 transition-colors"
                      >
                        <span>টেলিগ্রাম গ্রুপে জয়েন করুন</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyInvite(recoveryResult.telegramInviteLink!)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-cyan-400" />
                            <span>কপি লিংক</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tracking View Button */}
                {recoveryResult.trackingToken && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onOpenOrderTracking(recoveryResult.trackingToken!)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
                    >
                      সম্পূর্ণ অর্ডার ট্র্যাকিং পেইজ খুলুন →
                    </button>
                  </div>
                )}
              </div>

              {/* Reset to search another */}
              <button
                type="button"
                onClick={() => {
                  setRecoveryResult(null);
                  setPhone('');
                  setTrxId('');
                  setTokenOrOrderId('');
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition-colors cursor-pointer"
              >
                আরেকটি অর্ডার অনুসন্ধান করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
