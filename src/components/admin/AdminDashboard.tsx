import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  Package as PackageIcon,
  Globe,
  Users,
  ShieldAlert,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Send,
  Upload,
  Eye,
  Lock,
  Check,
  X,
  MessageSquare,
  HelpCircle,
  Quote,
  Star,
  Radio,
  Percent,
  Sliders,
  Tag,
} from 'lucide-react';
import { Course, Order, Package, SiteSettings, Entitlement, AuditLog, FaqItem, TestimonialItem, NavLinkItem, SocialLinkItem } from '../../types';
import { DiscountManager } from './DiscountManager';
import { WebsiteCmsManager } from './WebsiteCmsManager';
import {
  getAdminOverview,
  getAdminOrders,
  reviewAdminOrder,
  retryTelegramInvite,
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  getAdminPackages,
  updateAdminPackage,
  getAdminSettings,
  updateAdminSettings,
  getAdminSubscriptions,
  revokeAdminSubscription,
  getAdminAuditLogs,
  uploadAdminImage,
  testTelegramSettings,
  setAdminToken,
} from '../../api/client';

interface AdminDashboardProps {
  onExit: () => void;
  onRefreshPublicData: () => void;
}

type TabType =
  | 'overview'
  | 'orders'
  | 'courses'
  | 'packages'
  | 'discounts'
  | 'telegram'
  | 'settings'
  | 'subscriptions'
  | 'audit';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExit,
  onRefreshPublicData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Overview stats
  const [overview, setOverview] = useState<{
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    rejectedOrders: number;
    paymentIssues: number;
    confirmedRevenue: number;
    totalCourses: number;
    activeSubscriptions: number;
    telegramFailures: number;
    recentActivity: AuditLog[];
  } | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderMethodFilter, setOrderMethodFilter] = useState('all');
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'issue'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  // Courses state
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);

  // Packages state
  const [packages, setPackages] = useState<Package[]>([]);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Telegram Testing state
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    message: string;
    botStatus?: { ok: boolean; username?: string; error?: string };
    adminLinkStatus?: { valid: boolean; enabled: boolean; url: string };
  } | null>(null);

  // FAQ & Testimonial state
  const [editingFaq, setEditingFaq] = useState<Partial<FaqItem> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<TestimonialItem> | null>(null);

  // Subscriptions & Audit
  const [subscriptions, setSubscriptions] = useState<Entitlement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Discount Management State
  const [discountTargetType, setDiscountTargetType] = useState<'package' | 'course'>('package');
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [discountActive, setDiscountActive] = useState<boolean>(true);
  const [discountOriginalPrice, setDiscountOriginalPrice] = useState<number>(0);
  const [discountStartDate, setDiscountStartDate] = useState<string>('');
  const [discountEndDate, setDiscountEndDate] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, ord, crs, pkgs, st, subs, logs] = await Promise.all([
        getAdminOverview(),
        getAdminOrders(),
        getAdminCourses(),
        getAdminPackages(),
        getAdminSettings(),
        getAdminSubscriptions(),
        getAdminAuditLogs(),
      ]);
      setOverview(ov);
      setOrders(ord);
      setCourses(crs);
      setPackages(pkgs);
      setSettings(st);
      setSubscriptions(subs);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed loading admin data:', err);
      showToast('ডাটা লোড করতে ব্যর্থতা। দয়া করে পুনরায় লগইন করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    setAdminToken(null);
    onExit();
  };

  // --- Order Review Handlers ---
  const handleReviewSubmit = async () => {
    if (!selectedOrderForReview) return;
    setLoading(true);
    try {
      const res = await reviewAdminOrder(
        selectedOrderForReview.id,
        reviewAction,
        reviewNotes
      );
      showToast(res.message || 'অর্ডার স্ট্যাটাস আপডেট হয়েছে।');
      setSelectedOrderForReview(null);
      setReviewNotes('');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryTelegram = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await retryTelegramInvite(orderId);
      if (res.success) {
        showToast('টেলিগ্রাম ইনভাইটেশন সফলভাবে তৈরি হয়েছে!');
      } else {
        showToast(res.data?.error || 'টেলিগ্রাম লিংক তৈরিতে সমস্যা।');
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ব্যর্থ: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Course Handlers ---
  const handleSaveCourse = async () => {
    if (!editingCourse || !editingCourse.title || !editingCourse.category) {
      showToast('শিরোনাম ও ক্যাটাগরি পূরণ করুন।');
      return;
    }
    setLoading(true);
    try {
      if (editingCourse.id) {
        await updateAdminCourse(editingCourse.id, editingCourse);
        showToast('কোর্স সফলভাবে আপডেট হয়েছে।');
      } else {
        await createAdminCourse(editingCourse);
        showToast('নতুন কোর্স তৈরি হয়েছে।');
      }
      setEditingCourse(null);
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই কোর্সটি মুছে ফেলতে চান?')) return;
    setLoading(true);
    try {
      await deleteAdminCourse(id);
      showToast('কোর্স মুছে ফেলা হয়েছে।');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload helper
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadAdminImage(base64, file.name);
        setEditingCourse((prev) => ({ ...prev, thumbnailUrl: url }));
        showToast('ইমেজ আপলোড সফল হয়েছে!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`ইমেজ আপলোড ত্রুটি: ${msg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Package Handlers ---
  const handleSavePackage = async () => {
    if (!editingPackage) return;
    setLoading(true);
    try {
      await updateAdminPackage(editingPackage.id, editingPackage);
      showToast('প্যাকেজ সংরক্ষিত হয়েছে।');
      setEditingPackage(null);
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    try {
      await updateAdminSettings(settings);
      showToast('ওয়েবসাইট সেটিংস সফলভাবে আপডেট হয়েছে!');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    setTelegramTestResult(null);
    try {
      const res = await testTelegramSettings();
      setTelegramTestResult(res);
      if (res.success) {
        showToast('টেলিগ্রাম টেস্ট সফল হয়েছে!');
      } else {
        showToast('টেলিগ্রাম টেস্টে সমস্যা পাওয়া গেছে।');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTelegramTestResult({
        success: false,
        message: `টেস্ট করতে ব্যর্থ: ${msg}`,
      });
      showToast(`টেস্ট ত্রুটি: ${msg}`);
    } finally {
      setTelegramTesting(false);
    }
  };

  const handleSaveTelegramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    try {
      await updateAdminSettings({
        telegramMode: settings.telegramMode,
        telegramChannelUrl: settings.telegramChannelUrl,
        isTelegramLinkEnabled: settings.isTelegramLinkEnabled,
        telegramChatId: settings.telegramChatId,
        telegramInviteExpiryHours: settings.telegramInviteExpiryHours,
      });
      showToast('টেলিগ্রাম কনফিগারেশন সফলভাবে ডাটাবেসে সেভ হয়েছে!');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Image upload helpers for CMS
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadAdminImage(base64, file.name);
        setSettings((prev) => (prev ? { ...prev, brandLogoUrl: url } : null));
        showToast('ব্র্যান্ড লোগো আপলোড সফল হয়েছে!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`লোগো আপলোড ত্রুটি: ${msg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const url = await uploadAdminImage(base64, file.name);
        setSettings((prev) => (prev ? { ...prev, heroImageUrl: url } : null));
        showToast('হিরো ইমেজ আপলোড সফল হয়েছে!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`ইমেজ আপলোড ত্রুটি: ${msg}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Discount Handlers
  const handleSaveDiscount = async () => {
    if (!selectedDiscountId) {
      showToast('অনুগ্রহ করে প্যাকেজ বা কোর্স নির্বাচন করুন।');
      return;
    }
    if (discountValue < 0) {
      showToast('ডিসকাউন্টের পরিমাণ শূন্য বা তদূর্ধ্ব হতে হবে।');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      showToast('শতকরা ডিসকাউন্ট ১০০% এর বেশি হতে পারে না।');
      return;
    }

    setLoading(true);
    try {
      if (discountTargetType === 'package') {
        const pkg = packages.find((p) => p.id === selectedDiscountId);
        if (!pkg) throw new Error('প্যাকেজ পাওয়া যায়নি।');
        await updateAdminPackage(pkg.id, {
          ...pkg,
          discountType,
          discountValue: Number(discountValue),
          discountActive,
          originalPriceBdt: discountOriginalPrice > 0 ? Number(discountOriginalPrice) : pkg.priceBdt,
          discountStartDate: discountStartDate || null,
          discountEndDate: discountEndDate || null,
        });
        showToast('প্যাকেজ ডিসকাউন্ট সফলভাবে ডাটাবেসে সেভ হয়েছে!');
      } else {
        const course = courses.find((c) => c.id === selectedDiscountId);
        if (!course) throw new Error('কোর্স পাওয়া যায়নি।');
        await updateAdminCourse(course.id, {
          ...course,
          discountType,
          discountValue: Number(discountValue),
          discountActive,
          originalPriceBdt: discountOriginalPrice > 0 ? Number(discountOriginalPrice) : (course.priceBdt || 150),
          discountStartDate: discountStartDate || null,
          discountEndDate: discountEndDate || null,
        });
        showToast('কোর্স ডিসকাউন্ট সফলভাবে ডাটাবেসে সেভ হয়েছে!');
      }
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async (type: 'package' | 'course', id: string) => {
    setLoading(true);
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
      showToast('ডিসকাউন্ট প্রত্যাহার করা হয়েছে।');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!settings || !editingFaq || !editingFaq.question || !editingFaq.answer) return;
    setLoading(true);
    try {
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
      await updateAdminSettings({ faqList: updatedFaqs });
      showToast('FAQ সফলভাবে সংরক্ষিত হয়েছে।');
      setEditingFaq(null);
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!settings || !confirm('আপনি কি এই FAQ টি মুছে ফেলতে চান?')) return;
    setLoading(true);
    try {
      const updatedFaqs = (settings.faqList || []).filter((f) => f.id !== id);
      await updateAdminSettings({ faqList: updatedFaqs });
      showToast('FAQ মুছে ফেলা হয়েছে।');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestimonial = async () => {
    if (!settings || !editingTestimonial || !editingTestimonial.name || !editingTestimonial.comment) return;
    setLoading(true);
    try {
      let updatedTestimonials = [...(settings.testimonials || [])];
      if (editingTestimonial.id) {
        updatedTestimonials = updatedTestimonials.map((t) =>
          t.id === editingTestimonial.id ? (editingTestimonial as TestimonialItem) : t
        );
      } else {
        updatedTestimonials.push({
          id: `t_${Date.now()}`,
          name: editingTestimonial.name,
          role: editingTestimonial.role || 'শিক্ষার্থী',
          comment: editingTestimonial.comment,
          rating: editingTestimonial.rating || 5,
        });
      }
      await updateAdminSettings({ testimonials: updatedTestimonials });
      showToast('টেস্টোমনিয়াল সফলভাবে সংরক্ষিত হয়েছে।');
      setEditingTestimonial(null);
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!settings || !confirm('আপনি কি এই রিভিউটি মুছে ফেলতে চান?')) return;
    setLoading(true);
    try {
      const updated = (settings.testimonials || []).filter((t) => t.id !== id);
      await updateAdminSettings({ testimonials: updated });
      showToast('টেস্টোমনিয়াল মুছে ফেলা হয়েছে।');
      await loadData();
      onRefreshPublicData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ত্রুটি: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl border border-cyan-500/40 bg-slate-900 px-4 py-3 text-xs font-semibold text-cyan-300 shadow-2xl shadow-cyan-950/60 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                TechVantage Admin
              </h2>
              <span className="text-[11px] text-cyan-400 font-mono">
                CMS & Control Center
              </span>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="রিফ্রেশ ডাটা"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>ড্যাশবোর্ড ওভারভিউ</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4" />
                <span>অর্ডার ও পেমেন্ট রিভিউ</span>
              </div>
              {overview?.pendingOrders ? (
                <span className="rounded-full bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-bold">
                  {overview.pendingOrders}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>কোর্স ম্যানেজমেন্ট</span>
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'packages'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PackageIcon className="h-4 w-4" />
              <span>প্যাকেজ ও প্রাইসিং</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('discounts');
                if (!selectedDiscountId && packages.length > 0) {
                  setSelectedDiscountId(packages[0].id);
                  setDiscountOriginalPrice(packages[0].priceBdt);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'discounts'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Percent className="h-4 w-4" />
              <span>ডিসকাউন্ট ম্যানেজমেন্ট</span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>এনটাইটেলমেন্ট ও এক্সেস</span>
            </button>

            <button
              onClick={() => setActiveTab('telegram')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'telegram'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>টেলিগ্রাম সেটিংস</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>ওয়েবসাইট কন্টেন্ট (CMS)</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>সিকিউরিটি অডিট লগ</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Eye className="h-4 w-4 text-cyan-400" />
            <span>লাইভ ওয়েবসাইটে ফিরুন</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
        {/* ---------------- 1. OVERVIEW TAB ---------------- */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">ড্যাশবোর্ড ওভারভিউ</h1>
              <p className="text-xs text-slate-400">রিয়েল-টাইম বিজনেস মেট্রিক্স ও পেমেন্ট স্ট্যাটিস্টিক্স</p>
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <span className="text-xs text-slate-400">সর্বমোট অর্ডার</span>
                <p className="text-2xl font-extrabold text-white tabular-nums mt-1">{overview.totalOrders}</p>
                <span className="text-[11px] text-slate-500">গেস্ট সাবমিশন</span>
              </div>

              <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4">
                <span className="text-xs text-amber-300 font-semibold">অপেক্ষমাণ পেমেন্ট (Pending)</span>
                <p className="text-2xl font-extrabold text-amber-400 tabular-nums mt-1">{overview.pendingOrders}</p>
                <span className="text-[11px] text-amber-300/80">ম্যানুয়াল রিভিউ প্রয়োজন</span>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4">
                <span className="text-xs text-emerald-300 font-semibold">অনুমোদিত অর্ডার (Approved)</span>
                <p className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">{overview.approvedOrders}</p>
                <span className="text-[11px] text-emerald-300/80">টেলিগ্রাম ইনভাইট প্রদানকৃত</span>
              </div>

              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4">
                <span className="text-xs text-cyan-300 font-semibold">নিশ্চিত আয় (Confirmed Revenue)</span>
                <p className="text-2xl font-extrabold text-white tabular-nums mt-1">৳{overview.confirmedRevenue}</p>
                <span className="text-[11px] text-cyan-300/80">অনুমোদিত অর্ডার থেকে সংগৃহীত</span>
              </div>
            </div>

            {/* Sub Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">সক্রিয় সাবস্ক্রিপশন</span>
                  <p className="text-lg font-bold text-white tabular-nums">{overview.activeSubscriptions}</p>
                </div>
                <Users className="h-6 w-6 text-cyan-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">মোট কোর্স সংখ্যা</span>
                  <p className="text-lg font-bold text-white tabular-nums">{overview.totalCourses}</p>
                </div>
                <BookOpen className="h-6 w-6 text-cyan-400" />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">টেলিগ্রাম ডেলিভারি ফেইলিওর</span>
                  <p className="text-lg font-bold text-rose-400 tabular-nums">{overview.telegramFailures}</p>
                </div>
                <Send className="h-6 w-6 text-rose-400" />
              </div>
            </div>

            {/* Recent Activity Mini Feed */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-bold text-white mb-3">সাম্প্রতিক সিস্টেম অ্যাক্টিভিটি</h3>
              <div className="divide-y divide-slate-800/80 text-xs">
                {overview.recentActivity.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-cyan-300">{log.action}</span>
                      <span className="text-slate-400 ml-2">দ্বারা: {log.actor}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- 2. ORDERS TAB ---------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">অর্ডার ও পেমেন্ট ম্যানেজমেন্ট</h1>
                <p className="text-xs text-slate-400">ম্যানুয়াল পেমেন্ট ভেরিফিকেশন ও টেলিগ্রাম ইনভাইটেশন কন্ট্রোল</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="নাম, ফোন, TrxID দিয়ে সার্চ..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="pending">অপেক্ষমাণ (Pending)</option>
                  <option value="approved">অনুমোদিত (Approved)</option>
                  <option value="payment_issue">ইস্যু (Issue)</option>
                  <option value="rejected">বাতিলকৃত (Rejected)</option>
                </select>

                <select
                  value={orderMethodFilter}
                  onChange={(e) => setOrderMethodFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">সকল মেথড</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3.5">অর্ডার আইডি</th>
                      <th className="p-3.5">গ্রাহকের তথ্য</th>
                      <th className="p-3.5">প্যাকেজ ও ফি</th>
                      <th className="p-3.5">পেমেন্ট মেথড ও TrxID</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5">টেলিগ্রাম লিংক</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders
                      .filter((o) => {
                        if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                        if (orderMethodFilter !== 'all' && o.paymentMethod !== orderMethodFilter) return false;
                        if (orderSearch) {
                          const q = orderSearch.toLowerCase();
                          return (
                            o.id.toLowerCase().includes(q) ||
                            o.customerName.toLowerCase().includes(q) ||
                            o.customerPhone.includes(q) ||
                            o.senderPhone.includes(q) ||
                            o.trxId.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-white">{ord.id}</td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-200">{ord.customerName}</p>
                            <p className="text-[11px] font-mono text-slate-400">{ord.customerPhone}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-cyan-400 tabular-nums">৳{ord.amountBdt}</p>
                            <p className="text-[11px] text-slate-400">{ord.packageSnapshot.name}</p>
                          </td>
                          <td className="p-3.5">
                            <span className="uppercase font-bold text-[11px] text-pink-400">
                              {ord.paymentMethod}
                            </span>
                            <p className="font-mono font-bold text-white tracking-wider">{ord.trxId}</p>
                            <p className="text-[10px] text-slate-400">প্রেরক: {ord.senderPhone}</p>
                          </td>
                          <td className="p-3.5">
                            {ord.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>অনুমোদিত</span>
                              </span>
                            )}
                            {ord.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                <Clock className="h-3 w-3" />
                                <span>অপেক্ষমাণ</span>
                              </span>
                            )}
                            {ord.status === 'payment_issue' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                                <AlertTriangle className="h-3 w-3" />
                                <span>পেমেন্ট ইস্যু</span>
                              </span>
                            )}
                            {ord.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                                <XCircle className="h-3 w-3" />
                                <span>বাতিল</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {ord.telegramInvite ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400">
                                <Check className="h-3 w-3" />
                                <span>জেনারেট সম্পন্ন</span>
                              </span>
                            ) : ord.status === 'approved' ? (
                              <button
                                onClick={() => handleRetryTelegram(ord.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>পুনরায় লিংক বানান</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">অনুমোদনের পর হবে</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrderForReview(ord);
                                setReviewNotes(ord.adminNotes || '');
                              }}
                              className="rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                            >
                              রিভিউ
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Review Modal */}
            {selectedOrderForReview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">
                      পেমেন্ট যাচাই ও রিভিউ — {selectedOrderForReview.id}
                    </h3>
                    <button
                      onClick={() => setSelectedOrderForReview(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 space-y-2 text-xs">
                    <p><span className="text-slate-400">গ্রাহকের নাম:</span> <strong className="text-white">{selectedOrderForReview.customerName}</strong></p>
                    <p><span className="text-slate-400">কন্টাক্ট ফোন:</span> <strong className="text-white font-mono">{selectedOrderForReview.customerPhone}</strong></p>
                    <p><span className="text-slate-400">প্রেরক ফোন:</span> <strong className="text-white font-mono">{selectedOrderForReview.senderPhone}</strong></p>
                    <p><span className="text-slate-400">পেমেন্ট মেথড:</span> <strong className="uppercase text-cyan-400">{selectedOrderForReview.paymentMethod}</strong></p>
                    <p><span className="text-slate-400">ট্রানজেকশন আইডি:</span> <strong className="text-white font-mono text-sm tracking-wider bg-slate-800 px-2 py-0.5 rounded">{selectedOrderForReview.trxId}</strong></p>
                    <p><span className="text-slate-400">টাকার পরিমাণ:</span> <strong className="text-emerald-400 font-bold tabular-nums">৳{selectedOrderForReview.amountBdt}</strong></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">সিদ্ধান্ত গ্রহণ করুন:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewAction('approve')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          reviewAction === 'approve'
                            ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        অনুমোদন (Approve)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('issue')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          reviewAction === 'issue'
                            ? 'border-orange-500 bg-orange-950/40 text-orange-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        পেমেন্ট ইস্যু
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('reject')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          reviewAction === 'reject'
                            ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        বাতিল (Reject)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      রিভিউ নোট (গ্রাহক ট্র্যাকিং পেজে দেখতে পাবে)
                    </label>
                    <textarea
                      rows={2}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="যেমন: পেমেন্ট সফলভাবে যাচাই হয়েছে। স্বাগতম!"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setSelectedOrderForReview(null)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleReviewSubmit}
                      disabled={loading}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950"
                    >
                      নিশ্চিত করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- 3. COURSES TAB ---------------- */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">কোর্স ম্যানেজমেন্ট</h1>
                <p className="text-xs text-slate-400">কোর্সের কন্টেন্ট, কারিকুলাম ও থাম্বনেইল সম্পাদনা</p>
              </div>
              <button
                onClick={() =>
                  setEditingCourse({
                    title: '',
                    shortDescription: '',
                    fullDescription: '',
                    category: 'ওয়েব ডেভেলপমেন্ট',
                    thumbnailUrl: '/src/assets/images/course_web_dev_1792938698048.jpg',
                    isFeatured: false,
                    isPublished: true,
                    highlights: ['লাইভ সাপোর্ট', 'হ্যান্ডস-অন প্রজেক্ট'],
                    allowedPackageIds: ['pkg_1m', 'pkg_3m', 'pkg_lifetime'],
                    sortOrder: courses.length + 1,
                    lessons: [
                      { id: `l_${Date.now()}_1`, courseId: '', title: '১.১ ইন্ট্রোডাকশন', durationMin: 20, isPreview: true, sortOrder: 1 },
                      { id: `l_${Date.now()}_2`, courseId: '', title: '১.২ ফান্ডামেন্টালস (লকড)', durationMin: 40, isPreview: false, sortOrder: 2 },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>নতুন কোর্স যুক্ত করুন</span>
              </button>
            </div>

            {/* Courses List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((crs) => (
                <div key={crs.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-950">
                      <img
                        src={crs.thumbnailUrl}
                        alt={crs.title}
                        className="w-full h-full object-cover filter blur-[2px] brightness-75"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-cyan-400" />
                      </div>
                      <span className="absolute top-2 left-2 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] text-cyan-300">
                        {crs.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{crs.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{crs.shortDescription}</p>

                    <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{crs.lessons?.length || 0}টি লেকচার</span>
                      <span>·</span>
                      <span className={crs.isPublished ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {crs.isPublished ? 'পাবলিশড' : 'ড্রাফট'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingCourse(crs)}
                      className="rounded-lg border border-slate-700 hover:border-cyan-500 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5 inline mr-1" />
                      এডিট
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(crs.id)}
                      className="rounded-lg border border-rose-900/60 hover:border-rose-500 px-3 py-1.5 text-xs text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                      ডিলিট
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Edit Drawer/Modal */}
            {editingCourse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 my-8">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">
                      {editingCourse.id ? 'কোর্স সম্পাদনা' : 'নতুন কোর্স তৈরি'}
                    </h3>
                    <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">কোর্স শিরোনাম *</label>
                      <input
                        type="text"
                        value={editingCourse.title || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">ক্যাটাগরি *</label>
                        <input
                          type="text"
                          value={editingCourse.category || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">ক্রম (Sort Order)</label>
                        <input
                          type="number"
                          value={editingCourse.sortOrder || 1}
                          onChange={(e) => setEditingCourse({ ...editingCourse, sortOrder: parseInt(e.target.value) || 1 })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">কোর্স মূল্য (৳)</label>
                        <input
                          type="number"
                          value={editingCourse.priceBdt ?? 150}
                          onChange={(e) => setEditingCourse({ ...editingCourse, priceBdt: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">পূর্বের মূল্য / স্ট্রাইকথ্রু (৳, ঐচ্ছিক)</label>
                        <input
                          type="number"
                          value={editingCourse.originalPriceBdt ?? 0}
                          onChange={(e) => setEditingCourse({ ...editingCourse, originalPriceBdt: parseFloat(e.target.value) || 0 })}
                          placeholder="ঐচ্ছিক"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-300">সংক্ষিপ্ত বিবরণ</label>
                        <span className="text-[10px] text-cyan-400 font-medium">ঐচ্ছিক (Optional)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="খালি রাখতে পারেন — ওয়েবসাইটে কোনো খালি বক্স দেখাবে না"
                        value={editingCourse.shortDescription || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, shortDescription: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-semibold text-slate-300">পূর্ণ বিবরণ</label>
                        <span className="text-[10px] text-cyan-400 font-medium">ঐচ্ছিক (Optional)</span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="খালি রাখতে পারেন — বিবরণ ছাড়াই সেভ করা যাবে"
                        value={editingCourse.fullDescription || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, fullDescription: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    {/* Thumbnail URL & Upload */}
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">কোর্স থাম্বনেইল ইমেজ</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingCourse.thumbnailUrl || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, thumbnailUrl: e.target.value })}
                          placeholder="ইমেজ URL..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2 text-white focus:outline-none"
                        />
                        <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 cursor-pointer">
                          <Upload className="h-3.5 w-3.5" />
                          <span>আপলোড</span>
                          <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingCourse.isPublished ?? true}
                          onChange={(e) => setEditingCourse({ ...editingCourse, isPublished: e.target.checked })}
                          className="rounded text-cyan-500"
                        />
                        <span>ওয়েবসাইটে লাইভ প্রকাশ করুন (Published)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingCourse.isFeatured ?? false}
                          onChange={(e) => setEditingCourse({ ...editingCourse, isFeatured: e.target.checked })}
                          className="rounded text-cyan-500"
                        />
                        <span>ফিচার্ড কোর্স</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setEditingCourse(null)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleSaveCourse}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- 4. PACKAGES TAB ---------------- */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">প্যাকেজ ও প্রাইসিং ম্যানেজমেন্ট</h1>
              <p className="text-xs text-slate-400">সাবস্ক্রিপশন প্ল্যান, মূল্য এবং মেয়াদের কনফিগারেশন</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                    {pkg.badge && (
                      <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-3xl font-extrabold text-white tabular-nums">৳{pkg.priceBdt}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({pkg.durationDays ? `${pkg.durationDays} দিন` : 'লাইফটাইম'})
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{pkg.description}</p>

                  <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="w-full rounded-xl border border-slate-700 hover:border-cyan-500 py-2 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    ফি ও সেটিংস সম্পাদনা
                  </button>
                </div>
              ))}
            </div>

            {/* Package Edit Modal */}
            {editingPackage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">প্যাকেজ সম্পাদনা — {editingPackage.name}</h3>
                    <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">প্যাকেজের নাম</label>
                      <input
                        type="text"
                        value={editingPackage.name}
                        onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">মূল্য (BDT ৳)</label>
                        <input
                          type="number"
                          value={editingPackage.priceBdt}
                          onChange={(e) => setEditingPackage({ ...editingPackage, priceBdt: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">মেয়াদ (দিন, ০ = লাইফটাইম)</label>
                        <input
                          type="number"
                          value={editingPackage.durationDays ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setEditingPackage({ ...editingPackage, durationDays: val === 0 ? null : val });
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">ব্যাজ (Badge)</label>
                      <input
                        type="text"
                        value={editingPackage.badge || ''}
                        onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setEditingPackage(null)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={handleSavePackage}
                      className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs font-bold text-slate-950"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- 4.5. DEDICATED DISCOUNT MANAGEMENT TAB ---------------- */}
        {activeTab === 'discounts' && (
          <DiscountManager
            packages={packages}
            courses={courses}
            onRefreshData={loadData}
            showToast={showToast}
          />
        )}

        {/* ---------------- 5. DEDICATED TELEGRAM SETTINGS TAB ---------------- */}
        {activeTab === 'telegram' && settings && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Send className="h-6 w-6 text-cyan-400" />
                  <span>টেলিগ্রাম সেটিংস ও চ্যানেল লিংক</span>
                </h1>
                <p className="text-xs text-slate-400">
                  অনুমোদিত গ্রাহকদের ডেলিভারির জন্য গ্রুপ/চ্যানেল ইনভাইট লিংক, মোড ও নিরাপত্তা কনফিগারেশন
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={telegramTesting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 px-4 py-2 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${telegramTesting ? 'animate-spin' : ''}`} />
                  <span>{telegramTesting ? 'যাচাই হচ্ছে...' : 'কনফিগারেশন টেস্ট করুন'}</span>
                </button>
              </div>
            </div>

            {/* Test Results Banner */}
            {telegramTestResult && (
              <div
                className={`rounded-2xl border p-4 space-y-2 text-xs ${
                  telegramTestResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {telegramTestResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-400" />
                    )}
                    {telegramTestResult.message}
                  </span>
                  <button
                    onClick={() => setTelegramTestResult(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] font-mono border-t border-slate-800">
                  <div className="rounded-lg bg-slate-950/60 p-2.5">
                    <p className="text-slate-400 font-sans font-semibold mb-1">টেলিগ্রাম বট স্ট্যাটাস:</p>
                    {telegramTestResult.botStatus?.ok ? (
                      <p className="text-emerald-400">
                        সক্রিয় (বট ইউজারনেম: @{telegramTestResult.botStatus.username})
                      </p>
                    ) : (
                      <p className="text-amber-400">
                        {telegramTestResult.botStatus?.error || 'বট টোকেন কনফিগার করা নেই'}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-2.5">
                    <p className="text-slate-400 font-sans font-semibold mb-1">অ্যাডমিন জয়েন লিংক স্ট্যাটাস:</p>
                    <p className={telegramTestResult.adminLinkStatus?.valid ? 'text-emerald-400' : 'text-amber-400'}>
                      {telegramTestResult.adminLinkStatus?.valid
                        ? `বৈধ লিংক (${telegramTestResult.adminLinkStatus.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`
                        : 'সঠিক লিংক পাওয়া যায়নি'}
                    </p>
                    {telegramTestResult.adminLinkStatus?.url && (
                      <p className="text-slate-400 truncate mt-0.5">{telegramTestResult.adminLinkStatus.url}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Telegram Settings Form */}
            <form onSubmit={handleSaveTelegramConfig} className="space-y-6">
              {/* Delivery Mode Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <span>১. টেলিগ্রাম ইনভাইটেশন ও ডেলিভারি মোড</span>
                </h3>
                <p className="text-xs text-slate-400">
                  গ্রাহকের পেমেন্ট অনুমোদনের পর কীভাবে টেলিগ্রাম গ্রুপ লিংক তৈরি বা সরবরাহ করা হবে তা নির্ধারণ করুন:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label
                    className={`rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      settings.telegramMode === 'admin_link'
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="telegramMode"
                        value="admin_link"
                        checked={settings.telegramMode === 'admin_link'}
                        onChange={() => setSettings({ ...settings, telegramMode: 'admin_link' })}
                        className="mt-1 text-cyan-500"
                      />
                      <div>
                        <strong className="block text-xs font-bold text-white mb-0.5">
                          🔗 অ্যাডমিন জয়েন লিংক
                        </strong>
                        <span className="text-[11px] leading-relaxed">
                          অ্যাডমিনের সেট করা চ্যানেল বা গ্রুপ জয়েন লিংক সরাসরি অনুমোদিত গ্রাহককে দেওয়া হবে।
                        </span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      settings.telegramMode === 'bot_generated'
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="telegramMode"
                        value="bot_generated"
                        checked={settings.telegramMode === 'bot_generated'}
                        onChange={() => setSettings({ ...settings, telegramMode: 'bot_generated' })}
                        className="mt-1 text-cyan-500"
                      />
                      <div>
                        <strong className="block text-xs font-bold text-white mb-0.5">
                          🤖 বট এপিআই (একবার ব্যবহার্য)
                        </strong>
                        <span className="text-[11px] leading-relaxed">
                          বট দিয়ে স্বয়ংক্রিয়ভাবে প্রতি গ্রাহকের জন্য ইউনিক সিঙ্গেল-ইউজ ইনভাইট লিংক তৈরি হবে।
                        </span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      settings.telegramMode === 'both'
                        ? 'border-cyan-500 bg-cyan-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="telegramMode"
                        value="both"
                        checked={settings.telegramMode === 'both'}
                        onChange={() => setSettings({ ...settings, telegramMode: 'both' })}
                        className="mt-1 text-cyan-500"
                      />
                      <div>
                        <strong className="block text-xs font-bold text-white mb-0.5">
                          ⚡ বোথ / হাইব্রিড মোড
                        </strong>
                        <span className="text-[11px] leading-relaxed">
                          বট থাকলে সিঙ্গেল-ইউজ তৈরি হবে, বট না থাকলে স্বয়ংক্রিয়ভাবে অ্যাডমিন লিংকে ফলব্যাক করবে।
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Admin Telegram URL Configuration */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    ২. অ্যাডমিন টেলিগ্রাম গ্রুপ/চ্যানেল ইনভাইট URL
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={settings.isTelegramLinkEnabled}
                      onChange={(e) => setSettings({ ...settings, isTelegramLinkEnabled: e.target.checked })}
                      className="rounded text-cyan-500 h-4 w-4"
                    />
                    <span className={settings.isTelegramLinkEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {settings.isTelegramLinkEnabled ? 'লিংক সক্রিয় (Enabled)' : 'লিংক নিষ্ক্রিয় (Disabled)'}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    টেলিগ্রাম চ্যানেল বা গ্রুপ জয়েন URL *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={settings.telegramChannelUrl || ''}
                      onChange={(e) => setSettings({ ...settings, telegramChannelUrl: e.target.value })}
                      placeholder="https://t.me/+AbCdEfGhIjKlMnOp বা https://t.me/techvantagebd"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * এই লিংকটি শুধুমাত্র <strong>অনুমোদিত (Approved)</strong> গ্রাহকদের সুরক্ষিত ট্র্যাকিং পেজে দেখানো হবে।
                  </p>
                </div>
              </div>

              {/* Telegram Bot API Details */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
                  ৩. টেলিগ্রাম বট এপিআই ও চ্যানেল আইডি
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      চ্যানেল/গ্রুপ চ্যাট আইডি (Chat ID)
                    </label>
                    <input
                      type="text"
                      placeholder="-1001234567890"
                      value={settings.telegramChatId || ''}
                      onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">প্রাইভেট চ্যানেলের চ্যাট আইডি সাধারণত -100 দিয়ে শুরু হয়।</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ইনভাইট লিংক মেয়াদ (ঘণ্টা)
                    </label>
                    <input
                      type="number"
                      value={settings.telegramInviteExpiryHours || 48}
                      onChange={(e) => setSettings({ ...settings, telegramInviteExpiryHours: parseInt(e.target.value) || 48 })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">ডিফল্ট: ৪৮ ঘণ্টা।</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">বট সিকিউরিটি ও স্ট্যাটাস</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      টেলিগ্রাম বট টোকেন নিরাপদে সার্ভার এনভায়রনমেন্টে সংরক্ষিত থাকে এবং ফ্রন্টএন্ডে কখনও ফাঁস করা হয় না।
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${
                      settings.isTelegramConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {settings.isTelegramConfigured ? 'বট কনফিগার করা আছে' : 'বট সেট করা নেই'}
                  </span>
                </div>
              </div>

              {/* Security Policy Reminder */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-cyan-200/90 flex items-start gap-3">
                <Lock className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-white mb-0.5">নিরাপত্তা ও ডেলিভারি নীতি</strong>
                  <span>
                    কোনো অবস্থাতেই অপেক্ষমাণ (Pending) বা বাতিলকৃত (Rejected) অর্ডারের ক্ষেত্রে টেলিগ্রাম লিংক প্রকাশ করা হয় না।
                    অ্যাডমিন প্যানেল থেকে আপনি ‘Approve’ বাটনে ক্লিক করার পরই শুধুমাত্র সেই নির্দিষ্ট গ্রাহকের জন্য লিংক সক্রিয় হবে।
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
                >
                  টেলিগ্রাম সেটিংস সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- 6. WEBSITE CONTENT MANAGEMENT (CMS) ---------------- */}
        {activeTab === 'settings' && settings && (
          <WebsiteCmsManager
            settings={settings}
            onRefreshData={loadData}
            showToast={showToast}
          />
        )}

        {/* ---------------- 6. SUBSCRIPTIONS TAB ---------------- */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">এনটাইটেলমেন্ট ও সাবস্ক্রিপশন ম্যানেজমেন্ট</h1>
              <p className="text-xs text-slate-400">গ্রাহকদের অ্যাক্টিভ এক্সেস এবং এক্সপায়ারেশন মনিটরিং</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="p-3.5">অর্ডার আইডি</th>
                      <th className="p-3.5">গ্রাহকের ফোন</th>
                      <th className="p-3.5">কোর্স</th>
                      <th className="p-3.5">শুরুর তারিখ</th>
                      <th className="p-3.5">মেয়াদ উত্তীর্ণ</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-850/50">
                        <td className="p-3.5 font-mono font-bold text-white">{sub.orderId}</td>
                        <td className="p-3.5 font-mono text-slate-300">{sub.customerPhone}</td>
                        <td className="p-3.5 text-slate-200 font-semibold">{sub.courseTitle || 'Tech Course'}</td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(sub.grantedAt).toLocaleDateString('bn-BD')}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('bn-BD') : 'লাইফটাইম'}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              sub.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sub.status === 'active' ? 'সক্রিয়' : 'বাতিল/উত্তীর্ণ'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {sub.status === 'active' && (
                            <button
                              onClick={async () => {
                                if (confirm('আপনি কি এই গ্রাহকের এক্সেস বাতিল করতে চান?')) {
                                  await revokeAdminSubscription(sub.id, 'অ্যাডমিন কর্তৃক বাতিল');
                                  showToast('অ্যাক্সেস বাতিল করা হয়েছে।');
                                  loadData();
                                }
                              }}
                              className="text-xs text-rose-400 hover:underline"
                            >
                              বাতিল
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
        )}

        {/* ---------------- 7. AUDIT LOGS TAB ---------------- */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">সিকিউরিটি অডিট ট্রেইল</h1>
              <p className="text-xs text-slate-400">সকল প্রশাসনিক অ্যাকশন, পিন ভেরিফিকেশন ও ট্রানজেকশন লগ</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="divide-y divide-slate-800 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-cyan-400 mr-2">{log.action}</span>
                      <span className="text-slate-300">অ্যাক্টর: {log.actor}</span>
                      {log.targetType && (
                        <span className="text-slate-500 ml-2">[{log.targetType}: {log.targetId}]</span>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {JSON.stringify(log.details)}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {new Date(log.createdAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
