import React, { useState } from 'react';
import { Percent, Tag, Check, RefreshCw } from 'lucide-react';
import { Course, Package } from '../../types';
import { updateAdminPackage, updateAdminCourse } from '../../api/client';

interface DiscountManagerProps {
  packages: Package[];
  courses: Course[];
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const DiscountManager: React.FC<DiscountManagerProps> = ({
  packages,
  courses,
  onRefreshData,
  showToast,
}) => {
  const [targetType, setTargetType] = useState<'package' | 'course'>('package');
  const [selectedId, setSelectedId] = useState<string>(packages[0]?.id || '');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountActive, setDiscountActive] = useState<boolean>(true);
  const [originalPrice, setOriginalPrice] = useState<number>(packages[0]?.priceBdt || 150);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const currentPackage = packages.find((p) => p.id === selectedId);
  const currentCourse = courses.find((c) => c.id === selectedId);

  const basePrice = targetType === 'package' ? (currentPackage?.priceBdt || 150) : (currentCourse?.priceBdt || 150);
  const origPrice = originalPrice > 0 ? originalPrice : basePrice;

  // Calculate live preview
  let finalPreviewPrice = basePrice;
  let savings = 0;
  if (discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, discountValue));
    finalPreviewPrice = Math.max(0, Math.round(basePrice * (1 - pct / 100)));
    savings = basePrice - finalPreviewPrice;
  } else {
    finalPreviewPrice = Math.max(0, Math.round(basePrice - discountValue));
    savings = basePrice - finalPreviewPrice;
  }

  const handleSave = async () => {
    if (!selectedId) {
      showToast('অনুগ্রহ করে প্যাকেজ বা কোর্স নির্বাচন করুন।');
      return;
    }
    if (discountValue < 0) {
      showToast('ডিসকাউন্টের পরিমাণ শূন্য বা তদূর্ধ্ব হতে হবে।');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      showToast('শতকরা ছাড় ১০০% এর বেশি হতে পারে না।');
      return;
    }

    setSaving(true);
    try {
      if (targetType === 'package') {
        const pkg = packages.find((p) => p.id === selectedId);
        if (!pkg) throw new Error('প্যাকেজ পাওয়া যায়নি।');
        await updateAdminPackage(pkg.id, {
          ...pkg,
          discountType,
          discountValue: Number(discountValue),
          discountActive,
          originalPriceBdt: origPrice,
          discountStartDate: startDate || null,
          discountEndDate: endDate || null,
        });
        showToast('প্যাকেজ ডিসকাউন্ট সফলভাবে ডাটাবেসে সেভ হয়েছে!');
      } else {
        const course = courses.find((c) => c.id === selectedId);
        if (!course) throw new Error('কোর্স পাওয়া যায়নি।');
        await updateAdminCourse(course.id, {
          ...course,
          discountType,
          discountValue: Number(discountValue),
          discountActive,
          originalPriceBdt: origPrice,
          discountStartDate: startDate || null,
          discountEndDate: endDate || null,
        });
        showToast('কোর্স ডিসকাউন্ট সফলভাবে ডাটাবেসে সেভ হয়েছে!');
      }
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (type: 'package' | 'course', id: string) => {
    setSaving(true);
    try {
      if (type === 'package') {
        const pkg = packages.find((p) => p.id === id);
        if (pkg) {
          await updateAdminPackage(id, {
            ...pkg,
            discountActive: false,
            discountValue: 0,
            originalPriceBdt: undefined,
            discountStartDate: null,
            discountEndDate: null,
          });
        }
      } else {
        const course = courses.find((c) => c.id === id);
        if (course) {
          await updateAdminCourse(id, {
            ...course,
            discountActive: false,
            discountValue: 0,
            originalPriceBdt: undefined,
            discountStartDate: null,
            discountEndDate: null,
          });
        }
      }
      showToast('ডিসকাউন্ট সফলভাবে সরানো হয়েছে।');
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Percent className="h-6 w-6 text-cyan-400" />
          <span>ডিসকাউন্ট ও অফার ম্যানেজমেন্ট</span>
        </h1>
        <p className="text-xs text-slate-400">
          সাবস্ক্রিপশন প্যাকেজ ও কোর্সে নির্দিষ্ট টাকা বা শতকরা ছাড় নির্ধারণ করুন, মেয়াদ সেট করুন এবং সরাসরি প্রিভিউ দেখুন
        </p>
      </div>

      {/* Discount Configuration Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span>১. ডিসকাউন্ট কনফিগারেশন ফর্ম</span>
        </h3>

        {/* Target Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            কোথায় ডিসকাউন্ট প্রয়োগ করবেন?
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => {
                setTargetType('package');
                if (packages.length > 0) {
                  setSelectedId(packages[0].id);
                  setOriginalPrice(packages[0].originalPriceBdt || packages[0].priceBdt);
                  setDiscountType(packages[0].discountType || 'percentage');
                  setDiscountValue(packages[0].discountValue || 10);
                  setDiscountActive(packages[0].discountActive ?? true);
                  setStartDate(packages[0].discountStartDate || '');
                  setEndDate(packages[0].discountEndDate || '');
                }
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                targetType === 'package'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              প্যাকেজ (Packages)
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('course');
                if (courses.length > 0) {
                  setSelectedId(courses[0].id);
                  setOriginalPrice(courses[0].originalPriceBdt || courses[0].priceBdt || 150);
                  setDiscountType(courses[0].discountType || 'percentage');
                  setDiscountValue(courses[0].discountValue || 10);
                  setDiscountActive(courses[0].discountActive ?? true);
                  setStartDate(courses[0].discountStartDate || '');
                  setEndDate(courses[0].discountEndDate || '');
                }
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                targetType === 'course'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              কোর্স (Courses)
            </button>
          </div>
        </div>

        {/* Select Specific Item */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {targetType === 'package' ? 'নির্দিষ্ট প্যাকেজ নির্বাচন করুন' : 'নির্দিষ্ট কোর্স নির্বাচন করুন'}
          </label>
          <select
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              if (targetType === 'package') {
                const item = packages.find((p) => p.id === id);
                if (item) {
                  setOriginalPrice(item.originalPriceBdt || item.priceBdt);
                  setDiscountType(item.discountType || 'percentage');
                  setDiscountValue(item.discountValue || 10);
                  setDiscountActive(item.discountActive ?? true);
                  setStartDate(item.discountStartDate || '');
                  setEndDate(item.discountEndDate || '');
                }
              } else {
                const item = courses.find((c) => c.id === id);
                if (item) {
                  setOriginalPrice(item.originalPriceBdt || item.priceBdt || 150);
                  setDiscountType(item.discountType || 'percentage');
                  setDiscountValue(item.discountValue || 10);
                  setDiscountActive(item.discountActive ?? true);
                  setStartDate(item.discountStartDate || '');
                  setEndDate(item.discountEndDate || '');
                }
              }
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            {targetType === 'package'
              ? packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — বর্তমান মূল্য: ৳{p.priceBdt} {p.discountActive ? `(সক্রিয়: ${p.discountValue}${p.discountType === 'percentage' ? '%' : '৳'})` : ''}
                  </option>
                ))
              : courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — বর্তমান মূল্য: ৳{c.priceBdt || 150} {c.discountActive ? `(সক্রিয়: ${c.discountValue}${c.discountType === 'percentage' ? '%' : '৳'})` : ''}
                  </option>
                ))}
          </select>
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ডিসকাউন্ট টাইপ
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="percentage">শতকরা ছাড় (%)</option>
              <option value="fixed">নির্দিষ্ট টাকা ছাড় (৳ BDT)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ছাড়ের পরিমাণ ({discountType === 'percentage' ? '%' : '৳'})
            </label>
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : 100000}
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">
              {discountType === 'percentage' ? 'সর্বোচ্চ ১০০% হতে পারবে' : 'টাকার পরিমাণ'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              মূল / সাধারণ মূল্য (৳)
            </label>
            <input
              type="number"
              min="0"
              value={origPrice}
              onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">স্ট্রাইকথ্রু প্রদর্শন</span>
          </div>
        </div>

        {/* Start Date & Expiry Date (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              শুরুর তারিখ (ঐচ্ছিক)
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">খালি রাখলে অবিলম্বে কার্যকর হবে</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              মেয়াদোত্তীর্ণের তারিখ (ঐচ্ছিক)
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">খালি রাখলে স্থায়ীভাবে চালু থাকবে</span>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={discountActive}
              onChange={(e) => setDiscountActive(e.target.checked)}
              className="rounded text-cyan-500 h-4 w-4"
            />
            <span className="text-xs font-semibold text-white">
              এই ডিসকাউন্ট অফারটি এখন সক্রিয় (Active) রাখুন
            </span>
          </label>
        </div>

        {/* LIVE REAL-TIME PRICE PREVIEW BANNER */}
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-4 space-y-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
            লাইভ প্রাইস প্রিভিউ (ওয়েবসাইটে যেভাবে প্রদর্শিত হবে)
          </span>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
              ৳{finalPreviewPrice}
            </span>
            {discountActive && savings > 0 && (
              <span className="text-base text-slate-400 line-through tabular-nums">
                ৳{origPrice}
              </span>
            )}
            {discountActive && savings > 0 && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                {discountType === 'percentage' ? `${discountValue}% ছাড়` : `৳${discountValue} ছাড়`} (সাশ্রয়: ৳{savings})
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            * চেকআউটের সময় সার্ভার স্বয়ংক্রিয়ভাবে প্রদেয় সর্বমোট ৳{finalPreviewPrice} টাকা হিসেবে অর্ডার রেকর্ড করবে।
          </p>
        </div>

        {/* Save Discount Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
          >
            {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>ডিসকাউন্ট সংরক্ষণ ও প্রকাশ করুন</span>
          </button>
        </div>
      </div>

      {/* Current Active Discounts Overview List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <span>২. প্যাকেজ ও কোর্সের বর্তমান তালিকা ও ছাড়</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-3">আইটেম ও নাম</th>
                <th className="p-3">মূল প্রাইস</th>
                <th className="p-3">ডিসকাউন্ট তথ্য</th>
                <th className="p-3">চূড়ান্ত প্রদেয় মূল্য</th>
                <th className="p-3">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-850/40">
                  <td className="p-3 font-semibold text-white">
                    <span className="text-[10px] text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">প্যাকেজ</span>
                    {pkg.name}
                  </td>
                  <td className="p-3 tabular-nums font-mono text-slate-300">
                    ৳{pkg.originalPriceBdt || pkg.priceBdt}
                  </td>
                  <td className="p-3">
                    {pkg.discountActive && pkg.discountValue ? (
                      <span className="text-emerald-400 font-semibold">
                        {pkg.discountType === 'percentage' ? `${pkg.discountValue}%` : `৳${pkg.discountValue}`} ছাড়
                      </span>
                    ) : (
                      <span className="text-slate-500">কোনো ছাড় নেই</span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-cyan-400 tabular-nums">
                    ৳{pkg.priceBdt}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        pkg.discountActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pkg.discountActive ? 'সক্রিয় ছাড়' : 'স্ট্যান্ডার্ড'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('package');
                        setSelectedId(pkg.id);
                        setOriginalPrice(pkg.originalPriceBdt || pkg.priceBdt);
                        setDiscountType(pkg.discountType || 'percentage');
                        setDiscountValue(pkg.discountValue || 10);
                        setDiscountActive(pkg.discountActive ?? true);
                        setStartDate(pkg.discountStartDate || '');
                        setEndDate(pkg.discountEndDate || '');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="rounded-lg border border-slate-700 hover:border-cyan-500 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                    >
                      এডিট
                    </button>
                    {pkg.discountActive && (
                      <button
                        type="button"
                        onClick={() => handleRemove('package', pkg.id)}
                        className="rounded-lg border border-rose-900/60 hover:border-rose-500 px-2.5 py-1 text-rose-400 cursor-pointer"
                      >
                        মুছুন
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {courses.map((crs) => (
                <tr key={crs.id} className="hover:bg-slate-850/40">
                  <td className="p-3 font-semibold text-white">
                    <span className="text-[10px] text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">কোর্স</span>
                    {crs.title}
                  </td>
                  <td className="p-3 tabular-nums font-mono text-slate-300">
                    ৳{crs.originalPriceBdt || crs.priceBdt || 150}
                  </td>
                  <td className="p-3">
                    {crs.discountActive && crs.discountValue ? (
                      <span className="text-emerald-400 font-semibold">
                        {crs.discountType === 'percentage' ? `${crs.discountValue}%` : `৳${crs.discountValue}`} ছাড়
                      </span>
                    ) : (
                      <span className="text-slate-500">কোনো ছাড় নেই</span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-cyan-400 tabular-nums">
                    ৳{crs.priceBdt || 150}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        crs.discountActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {crs.discountActive ? 'সক্রিয় ছাড়' : 'স্ট্যান্ডার্ড'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType('course');
                        setSelectedId(crs.id);
                        setOriginalPrice(crs.originalPriceBdt || crs.priceBdt || 150);
                        setDiscountType(crs.discountType || 'percentage');
                        setDiscountValue(crs.discountValue || 10);
                        setDiscountActive(crs.discountActive ?? true);
                        setStartDate(crs.discountStartDate || '');
                        setEndDate(crs.discountEndDate || '');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="rounded-lg border border-slate-700 hover:border-cyan-500 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                    >
                      এডিট
                    </button>
                    {crs.discountActive && (
                      <button
                        type="button"
                        onClick={() => handleRemove('course', crs.id)}
                        className="rounded-lg border border-rose-900/60 hover:border-rose-500 px-2.5 py-1 text-rose-400 cursor-pointer"
                      >
                        মুছুন
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
