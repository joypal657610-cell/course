import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { verifyAdminPin } from '../api/client';

interface AdminPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await verifyAdminPin(pin.trim());
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'ভুল অ্যাডমিন পিন কোড! পুনরায় চেষ্টা করুন।');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-5 animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            অ্যাডমিনিস্ট্রেটর সিকিউরিটি গেটওয়ে
          </h3>
          <p className="text-xs text-slate-400">
            অ্যাডমিন প্যানেলে প্রবেশের জন্য আপনার সিক্রেট পিন কোড দিন
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              required
              maxLength={10}
              placeholder="•••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.4em] font-mono rounded-xl border border-slate-700 bg-slate-950 py-3 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 px-4 text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950/50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>যাচাই করে ড্যাশবোর্ডে প্রবেশ করুন</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500">
          সিকিউর রেট-লিমিটেড সার্ভার ভেরিফিকেশন
        </p>
      </div>
    </div>
  );
};
