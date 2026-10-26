import React, { useState } from 'react';
import {
  Globe,
  Upload,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { SiteSettings, NavLinkItem, SocialLinkItem, FaqItem, TestimonialItem } from '../../types';
import { updateAdminSettings, uploadAdminImage } from '../../api/client';

interface WebsiteCmsManagerProps {
  settings: SiteSettings;
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
}

export const WebsiteCmsManager: React.FC<WebsiteCmsManagerProps> = ({
  settings: initialSettings,
  onRefreshData,
  showToast,
}) => {
  const [settings, setSettings] = useState<SiteSettings>({ ...initialSettings });
  const [saving, setSaving] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialItem> | null>(null);

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadAdminImage(base64, file.name);
        setSettings((prev) => ({ ...prev, brandLogoUrl: url }));
        showToast('ব্র্যান্ড লোগো আপলোড সফল হয়েছে!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`লোগো আপলোড ত্রুটি: ${msg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Hero BG upload
  const handleHeroBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadAdminImage(base64, file.name);
        setSettings((prev) => ({ ...prev, heroImageUrl: url }));
        showToast('হিরো ইমেজ আপলোড সফল হয়েছে!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`ইমেজ আপলোড ত্রুটি: ${msg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateAdminSettings(settings);
      showToast('ওয়েবসাইট কন্টেন্ট সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে!');
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`সংরক্ষণ ত্রুটি: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Navigation Links Helpers
  const currentNavLinks: NavLinkItem[] = settings.navLinks || [
    { id: 'nav_home', label: 'হোম', href: 'home', isVisible: true },
    { id: 'nav_courses', label: 'কোর্সসমূহ', href: 'courses', isVisible: true },
    { id: 'nav_pricing', label: 'প্যাকেজ ও ফি', href: 'pricing', isVisible: true },
    { id: 'nav_faq', label: 'সচরাচর জিজ্ঞাসা', href: 'faq', isVisible: true },
  ];

  const handleAddNavLink = () => {
    const newLink: NavLinkItem = {
      id: `nav_${Date.now()}`,
      label: 'নতুন লিংক',
      href: 'courses',
      isVisible: true,
    };
    setSettings({
      ...settings,
      navLinks: [...currentNavLinks, newLink],
    });
  };

  const handleUpdateNavLink = (id: string, updates: Partial<NavLinkItem>) => {
    setSettings({
      ...settings,
      navLinks: currentNavLinks.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  const handleDeleteNavLink = (id: string) => {
    setSettings({
      ...settings,
      navLinks: currentNavLinks.filter((l) => l.id !== id),
    });
  };

  // Social Links Helpers
  const currentSocialLinks: SocialLinkItem[] = settings.socialLinks || [
    { id: 'soc_tg', platform: 'Telegram', url: 'https://t.me/techvantagebd', isVisible: true },
    { id: 'soc_fb', platform: 'Facebook', url: 'https://facebook.com/techvantagebd', isVisible: true },
    { id: 'soc_yt', platform: 'YouTube', url: 'https://youtube.com/@techvantagebd', isVisible: true },
  ];

  const handleAddSocialLink = () => {
    const newSocial: SocialLinkItem = {
      id: `soc_${Date.now()}`,
      platform: 'Facebook',
      url: 'https://',
      isVisible: true,
    };
    setSettings({
      ...settings,
      socialLinks: [...currentSocialLinks, newSocial],
    });
  };

  const handleUpdateSocialLink = (id: string, updates: Partial<SocialLinkItem>) => {
    setSettings({
      ...settings,
      socialLinks: currentSocialLinks.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleDeleteSocialLink = (id: string) => {
    setSettings({
      ...settings,
      socialLinks: currentSocialLinks.filter((s) => s.id !== id),
    });
  };

  // Section Visibility Helpers
  const secVis = settings.sectionVisibility || {
    hero: true,
    courses: true,
    pricing: true,
    testimonials: true,
    faq: true,
    footer: true,
  };

  const toggleSection = (key: keyof typeof secVis) => {
    setSettings({
      ...settings,
      sectionVisibility: {
        ...secVis,
        [key]: !secVis[key],
      },
    });
  };

  // FAQ Handlers
  const handleSaveFaq = async () => {
    if (!editingFaq || !editingFaq.question || !editingFaq.answer) return;
    let updatedFaqs = [...(settings.faqList || [])];
    if (editingFaq.id) {
      updatedFaqs = updatedFaqs.map((f) => (f.id === editingFaq.id ? (editingFaq as FaqItem) : f));
    } else {
      updatedFaqs.push({
        id: `faq_${Date.now()}`,
        question: editingFaq.question,
        answer: editingFaq.answer,
      });
    }
    const newSettings = { ...settings, faqList: updatedFaqs };
    setSettings(newSettings);
    setEditingFaq(null);
    try {
      await updateAdminSettings({ faqList: updatedFaqs });
      showToast('FAQ সংরক্ষিত হয়েছে।');
      await onRefreshData();
    } catch {
      showToast('FAQ সংরক্ষণ ত্রুটি।');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    const updatedFaqs = (settings.faqList || []).filter((f) => f.id !== id);
    setSettings({ ...settings, faqList: updatedFaqs });
    try {
      await updateAdminSettings({ faqList: updatedFaqs });
      showToast('FAQ মুছে ফেলা হয়েছে।');
      await onRefreshData();
    } catch {
      showToast('FAQ ডিলিট ত্রুটি।');
    }
  };

  // Testimonial Handlers
  const handleSaveTestimonial = async () => {
    if (!editingTestimonial || !editingTestimonial.name || !editingTestimonial.comment) return;
    let updated = [...(settings.testimonials || [])];
    if (editingTestimonial.id) {
      updated = updated.map((t) => (t.id === editingTestimonial.id ? (editingTestimonial as TestimonialItem) : t));
    } else {
      updated.push({
        id: `t_${Date.now()}`,
        name: editingTestimonial.name,
        role: editingTestimonial.role || 'শিক্ষার্থী',
        comment: editingTestimonial.comment,
        rating: editingTestimonial.rating || 5,
      });
    }
    setSettings({ ...settings, testimonials: updated });
    setEditingTestimonial(null);
    try {
      await updateAdminSettings({ testimonials: updated });
      showToast('রিভিউ সংরক্ষিত হয়েছে।');
      await onRefreshData();
    } catch {
      showToast('রিভিউ সংরক্ষণ ত্রুটি।');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const updated = (settings.testimonials || []).filter((t) => t.id !== id);
    setSettings({ ...settings, testimonials: updated });
    try {
      await updateAdminSettings({ testimonials: updated });
      showToast('রিভিউ মুছে ফেলা হয়েছে।');
      await onRefreshData();
    } catch {
      showToast('ডিলিট ত্রুটি।');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-cyan-400" />
            <span>ওয়েবসাইট কন্টেন্ট ম্যানেজমেন্ট (CMS)</span>
          </h1>
          <p className="text-xs text-slate-400">
            হেডার, নেভিগেশন, হিরো ব্যানার, সেকশন ভিজিবিলিটি, ফুটার ও সোশ্যাল লিংক পরিচালনা করুন
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-lg cursor-pointer"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span>সকল কন্টেন্ট সংরক্ষণ করুন</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SECTION 1: HEADER & NAVIGATION CMS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <span>১. হেডার, ব্র্যান্ড ও নেভিগেশন সেটিংস</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ব্র্যান্ড নাম</label>
              <input
                type="text"
                value={settings.brandName || ''}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ব্র্যান্ড ট্যাগলাইন</label>
              <input
                type="text"
                value={settings.brandTagline || ''}
                onChange={(e) => setSettings({ ...settings, brandTagline: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Logo URL & Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ব্র্যান্ড লোগো (URL বা আপলোড)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="লোগো ইমেজ লিঙ্ক..."
                value={settings.brandLogoUrl || ''}
                onChange={(e) => setSettings({ ...settings, brandLogoUrl: e.target.value })}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>লোগো আপলোড</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Announcement Bar */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">অ্যানাউন্সমেন্ট ব্যানার টেক্সট</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={settings.showAnnouncement !== false}
                  onChange={(e) => setSettings({ ...settings, showAnnouncement: e.target.checked })}
                  className="rounded text-cyan-500"
                />
                <span className="text-slate-300 font-medium">ব্যানার চালু রাখুন</span>
              </label>
            </div>
            <input
              type="text"
              value={settings.announcementText || ''}
              onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Header Call-to-Action (CTA) */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">হেডার কল-টু-অ্যাকশন (CTA) বাটন</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={settings.showHeaderCta !== false}
                  onChange={(e) => setSettings({ ...settings, showHeaderCta: e.target.checked })}
                  className="rounded text-cyan-500"
                />
                <span className="text-slate-300 font-medium">CTA বাটন চালু</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">বাটন টেক্সট</span>
                <input
                  type="text"
                  value={settings.headerCtaText || 'এখনই কোর্স কিনুন'}
                  onChange={(e) => setSettings({ ...settings, headerCtaText: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 mb-1 block">বাটন গন্তব্য</span>
                <select
                  value={settings.headerCtaHref || 'pricing'}
                  onChange={(e) => setSettings({ ...settings, headerCtaHref: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="checkout">চেকআউট ফর্ম ওপেন</option>
                  <option value="pricing">প্যাকেজ সেকশন (pricing)</option>
                  <option value="courses">কোর্স গ্যালারি (courses)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Navigation Menu Items */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">হেডার নেভিগেশন মেন্যু আইটেম</h4>
                <p className="text-[11px] text-slate-400">ওয়েবসাইটের উপরের মেন্যু লিঙ্কগুলো সম্পাদনা করুন</p>
              </div>
              <button
                type="button"
                onClick={handleAddNavLink}
                className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন মেন্যু লিংক</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentNavLinks.map((link) => (
                <div key={link.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleUpdateNavLink(link.id, { label: e.target.value })}
                    placeholder="লিংকের নাম"
                    className="flex-1 min-w-[120px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={link.href}
                    onChange={(e) => handleUpdateNavLink(link.id, { href: e.target.value })}
                    placeholder="গন্তব্য (e.g. home, courses, pricing)"
                    className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={link.isVisible}
                      onChange={(e) => handleUpdateNavLink(link.id, { isVisible: e.target.checked })}
                      className="rounded text-cyan-500"
                    />
                    <span>দৃশ্যমান</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteNavLink(link.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: HERO SECTION CMS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
              ২. হিরো সেকশন কন্টেন্ট ও ব্যানার
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={secVis.hero !== false}
                onChange={() => toggleSection('hero')}
                className="rounded text-cyan-500"
              />
              <span className="text-slate-300 font-semibold">হিরো সেকশন সক্রিয়</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">টপ ব্যাজ টেক্সট</label>
              <input
                type="text"
                value={settings.heroBadgeText || ''}
                onChange={(e) => setSettings({ ...settings, heroBadgeText: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">সাবটাইটেল</label>
              <input
                type="text"
                value={settings.heroSubtitle || ''}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">হিরো প্রধান হেডলাইন *</label>
            <input
              type="text"
              value={settings.heroHeading || ''}
              onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">হিরো বিস্তারিত বিবরণ *</label>
            <textarea
              rows={2}
              value={settings.heroDescription || ''}
              onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CTA বাটন ১ (কোর্স দেখুন)</label>
              <input
                type="text"
                value={settings.ctaExplore || 'কোর্স দেখুন'}
                onChange={(e) => setSettings({ ...settings, ctaExplore: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CTA বাটন ২ (প্যাকেজ দেখুন)</label>
              <input
                type="text"
                value={settings.ctaPricing || 'প্যাকেজ দেখুন'}
                onChange={(e) => setSettings({ ...settings, ctaPricing: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Hero Banner Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">হিরো ব্যানার/ভিডিও প্রিভিউ ইমেজ</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ইমেজ URL..."
                value={settings.heroImageUrl || ''}
                onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>ইমেজ আপলোড</span>
                <input type="file" accept="image/*" onChange={handleHeroBgUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: SECTION VISIBILITY TOGGLES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            <span>৩. হোমপেজ সেকশন প্রদর্শন ও ভিজিবিলিটি কন্ট্রোল</span>
          </h3>
          <p className="text-xs text-slate-400">
            হোমপেজের নির্দিষ্ট সেকশন চালু বা বন্ধ করুন:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'hero', label: '১. হিরো সেকশন' },
              { key: 'courses', label: '২. কোর্স গ্যালারি' },
              { key: 'pricing', label: '৩. প্যাকেজ ও প্রাইসিং' },
              { key: 'testimonials', label: '৪. শিক্ষার্থী রিভিউ' },
              { key: 'faq', label: '৫. সচরাচর জিজ্ঞাসা (FAQ)' },
              { key: 'footer', label: '৬. ফুটার সেকশন' },
            ].map(({ key, label }) => {
              const isShown = secVis[key as keyof typeof secVis] !== false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key as keyof typeof secVis)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    isShown
                      ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
                      : 'border-slate-800 bg-slate-950 text-slate-500'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`h-2 w-2 rounded-full ${isShown ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: GALLERY HEADINGS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            ৪. ভিডিও গ্যালারি হেডিংস
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">গ্যালারি শিরোনাম</label>
              <input
                type="text"
                value={settings.galleryHeading || ''}
                onChange={(e) => setSettings({ ...settings, galleryHeading: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">গ্যালারি সংক্ষিপ্ত বিবরণ</label>
              <input
                type="text"
                value={settings.galleryDescription || ''}
                onChange={(e) => setSettings({ ...settings, galleryDescription: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: FOOTER, CONTACT & SOCIAL LINKS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            ৫. ফুটার, যোগাযোগ ও সোশ্যাল লিংক
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">কপিরাইট টেক্সট</label>
            <input
              type="text"
              value={settings.footerCopyright || ''}
              onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ফুটার বিবরণ বার্তা</label>
            <textarea
              rows={2}
              value={settings.footerDescription || ''}
              onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">অফিস/ঠিকানা</label>
              <input
                type="text"
                value={settings.contactAddress || ''}
                onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">সাপোর্ট ইমেইল</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">সাপোর্ট ফোন</label>
              <input
                type="text"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Social Links Manager */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">সোশ্যাল ও কমিউনিটি লিংকস</h4>
                <p className="text-[11px] text-slate-400">টেলিগ্রাম, ফেসবুক, ইউটিউব ইত্যাদি লিংক যুক্ত করুন</p>
              </div>
              <button
                type="button"
                onClick={handleAddSocialLink}
                className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন সোশ্যাল লিংক</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentSocialLinks.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950">
                  <input
                    type="text"
                    value={s.platform}
                    onChange={(e) => handleUpdateSocialLink(s.id, { platform: e.target.value })}
                    placeholder="প্ল্যাটফর্ম (e.g. Telegram, Facebook)"
                    className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={s.url}
                    onChange={(e) => handleUpdateSocialLink(s.id, { url: e.target.value })}
                    placeholder="URL লিংক (https://...)"
                    className="flex-1 min-w-[140px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.isVisible}
                      onChange={(e) => handleUpdateSocialLink(s.id, { isVisible: e.target.checked })}
                      className="rounded text-cyan-500"
                    />
                    <span>দৃশ্যমান</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSocialLink(s.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>ওয়েবসাইট কন্টেন্ট সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>

      {/* SECTION 6: FAQS MANAGER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>৬. সচরাচর জিজ্ঞাসা (FAQ) ম্যানেজমেন্ট</span>
            </h3>
            <p className="text-xs text-slate-400">গ্রাহকদের সচরাচর জিজ্ঞাসিত প্রশ্ন ও উত্তর পরিচালনা করুন</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingFaq({ question: '', answer: '' })}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন FAQ</span>
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {(settings.faqList || []).map((faq) => (
            <div key={faq.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-xs font-bold text-white">{faq.question}</h4>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingFaq(faq)}
                    className="text-xs text-cyan-400 hover:underline cursor-pointer"
                  >
                    এডিট
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* FAQ Edit Modal */}
        {editingFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                {editingFaq.id ? 'FAQ সম্পাদনা' : 'নতুন FAQ তৈরি'}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">প্রশ্ন *</label>
                  <input
                    type="text"
                    value={editingFaq.question || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">উত্তর *</label>
                  <textarea
                    rows={4}
                    value={editingFaq.answer || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveFaq}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: TESTIMONIALS MANAGER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>৭. শিক্ষার্থীদের রিভিউ ও টেস্টোমনিয়াল</span>
            </h3>
            <p className="text-xs text-slate-400">হোমপেজে প্রদর্শিত শিক্ষার্থীদের মতামত পরিচালনা করুন</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingTestimonial({ name: '', role: 'শিক্ষার্থী', comment: '', rating: 5 })}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>নতুন রিভিউ</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {(settings.testimonials || []).map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <span className="text-[11px] text-slate-400">{t.role}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  <span>★</span>
                  <span>{t.rating || 5}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 italic">"{t.comment}"</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(t)}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  এডিট
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTestimonial(t.id)}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Edit Modal */}
        {editingTestimonial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                {editingTestimonial.id ? 'রিভিউ সম্পাদনা' : 'নতুন রিভিউ যুক্ত করুন'}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">শিক্ষার্থীর নাম *</label>
                    <input
                      type="text"
                      value={editingTestimonial.name || ''}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">রোল / পদবী</label>
                    <input
                      type="text"
                      value={editingTestimonial.role || ''}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">রেটিং (১ থেকে ৫)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editingTestimonial.rating || 5}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) || 5 })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">রিভিউ / মন্তব্য *</label>
                  <textarea
                    rows={3}
                    value={editingTestimonial.comment || ''}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, comment: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTestimonial(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveTestimonial}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
