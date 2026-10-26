import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Course,
  Package,
  Order,
  TelegramInvite,
  Entitlement,
  AuditLog,
  SiteSettings,
  Lesson,
} from '../types';

interface DatabaseData {
  courses: Course[];
  packages: Package[];
  orders: Order[];
  telegramInvites: TelegramInvite[];
  entitlements: Entitlement[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
  recoveryChallenges: Array<{
    id: string;
    phone: string;
    otpHash: string;
    attempts: number;
    expiresAt: string;
    verified: boolean;
    createdAt: string;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'techvantage_store.json');

const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg_1m',
    name: '১ মাস সাবস্ক্রিপশন',
    durationDays: 30,
    priceBdt: 150,
    badge: 'জনপ্রিয় ট্রায়াল',
    description: '৩০ দিনের জন্য সকল প্রিমিয়াম টেক কোর্সের ভিডিও এবং প্রাইভেট টেলিগ্রাম সাপোর্ট চ্যানেলে পূর্ণ অ্যাক্সেস।',
    features: [
      '৩০ দিনের ফুল লাইব্রেরি অ্যাক্সেস',
      'প্রাইভেট টেলিগ্রাম ডিসকাশন গ্রুপ',
      'রিসোর্স ও সোর্স কোড ডাউনলোড',
      'মেন্টর প্রশ্নোত্তর সহায়তা',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'pkg_3m',
    name: '৩ মাস স্পেশাল',
    durationDays: 90,
    priceBdt: 250,
    badge: 'সেরা ভ্যালু',
    description: '৯০ দিন মেয়াদী এক্সটেন্ডেড সাপোর্ট ও প্রজেক্ট রিভিউ সহ টেক কেরিয়ার দ্রুত গড়ে তোলার স্পেশাল প্যাক।',
    features: [
      '৯০ দিনের ফুল লাইব্রেরি অ্যাক্সেস',
      'ভিআইপি টেলিগ্রাম কমিউনিটি অ্যাক্সেস',
      'লাইভ কিউএন্ডএ সেশন রেকর্ডিংস',
      'সব প্রজেক্ট ফাইল ও এক্সারসাইজ',
      'সার্টিফিকেট রিকুয়েস্ট সুবিধা',
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'pkg_lifetime',
    name: 'লাইফটাইম মেম্বারশিপ',
    durationDays: null,
    priceBdt: 500,
    badge: 'আনলিমিটেড অ্যাক্সেস',
    description: 'আজীবন সকল বর্তমান ও ভবিষ্যতের আপডেট করা কোর্স এবং পার্মানেন্ট টেলিগ্রাম ভিআইপি গ্রুপের আনলিমিটেড অ্যাক্সেস।',
    features: [
      'আজীবন সকল কোর্সে আনলিমিটেড অ্যাক্সেস',
      'লাইফটাইম টেলিগ্রাম ভিআইপি গ্রুপ লিংক',
      'ভবিষ্যতের সকল নতুন কোর্সে ফ্রি এন্ট্রি',
      '১-অন-১ চ্যাট সাপোর্ট ও ক্যারিয়ার গাইডেন্স',
      'কমপ্লিশন সার্টিফিকেট',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

const INITIAL_COURSES: Course[] = [
  {
    id: 'course_web_dev',
    title: 'ফুল-স্ট্যাক ওয়েব ডেভেলপমেন্ট মাস্টারক্লাস (React, Node, Express, DB)',
    shortDescription: 'জিরো থেকে প্রো লেভেল ফুল-স্ট্যাক প্রজেক্ট বিল্ডিং, রিয়েল ওয়ার্ল্ড এপিআই এবং ক্লাউড ডিপ্লয়মেন্ট।',
    fullDescription: 'এই কম্প্রিহেনসিভ কোর্সে আপনি শিখবেন কীভাবে আধুনিক রিয়্যাক্ট, টাইপস্ক্রিপ্ট, নোডজেএস এবং ডেটাবেস দিয়ে প্রোডাকশন-রেডি ওয়েব অ্যাপ্লিকেশন ডেভেলপ করতে হয়। প্রতিটি চ্যাপ্টারে রিয়েল-ওয়ার্ল্ড প্রজেক্ট এবং ইন্ডাস্ট্রি স্ট্যান্ডার্ড কোডিং প্র্যাকটিস রয়েছে।',
    category: 'ওয়েব ডেভেলপমেন্ট',
    thumbnailUrl: '/src/assets/images/course_web_dev_1792938698048.jpg',
    isFeatured: true,
    isPublished: true,
    highlights: ['৪৫+ ঘণ্টার ইন-ডেপথ ভিডিও', '৫টি রিয়েল-ওয়ার্ল্ড পোর্টফোলিও প্রজেক্ট', 'লাইভ টেলিগ্রাম কোড রিভিউ', 'লাইফটাইম রিসোর্স'],
    allowedPackageIds: ['pkg_1m', 'pkg_3m', 'pkg_lifetime'],
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: 'l_wd_01',
        courseId: 'course_web_dev',
        title: '১.১ পরিচিতি ও মডার্ন জাভাস্ক্রিপ্ট ফান্ডামেন্টালস',
        durationMin: 22,
        isPreview: true,
        sortOrder: 1,
      },
      {
        id: 'l_wd_02',
        courseId: 'course_web_dev',
        title: '১.২ রিয়্যাক্ট ও টাইপস্ক্রিপ্ট আর্কিটেকচার সেটআপ',
        durationMin: 35,
        isPreview: true,
        sortOrder: 2,
      },
      {
        id: 'l_wd_03',
        courseId: 'course_web_dev',
        title: '২.১ নোডজেএস ও এক্সপ্রেস এপিআই ডিজাইন প্যাটার্নস (লকড)',
        durationMin: 45,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/wd_secure_03.mp4',
        sortOrder: 3,
      },
      {
        id: 'l_wd_04',
        courseId: 'course_web_dev',
        title: '২.২ পোস্টগ্রেসকিউএল ও সিকিউর অথেন্টিকেশন সিস্টেম (লকড)',
        durationMin: 50,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/wd_secure_04.mp4',
        sortOrder: 4,
      },
      {
        id: 'l_wd_05',
        courseId: 'course_web_dev',
        title: '৩.১ ফুল-স্ট্যাক প্রজেক্ট ডিপ্লয়মেন্ট ও ডকার কনটেইনারাইজেশন (লকড)',
        durationMin: 60,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/wd_secure_05.mp4',
        sortOrder: 5,
      },
    ],
  },
  {
    id: 'course_python_ai',
    title: 'পাইথন এবং মেশিন লার্নিং ইঞ্জিনিয়ারিং হ্যান্ডস-অন বুটক্যাম্প',
    shortDescription: 'পাইথন ডেটা সায়েন্স, নিউরাল নেটওয়ার্ক, কম্পিউটার ভিশন এবং এআই মডেল বিল্ড ও ডিপ্লয়মেন্ট।',
    fullDescription: 'আধুনিক এআই যুগে নিজের স্কিলকে নেক্সট লেভেলে নিয়ে যান। ডেটা প্রসেসিং, টেনসরফ্লো, পাইটর্চ, এনএলপি এবং জেনারেটিভ এআই অ্যাপ্লিকেশন তৈরির খুঁটিনাটি হাতে-কলমে শিখুন।',
    category: 'আর্টিফিশিয়াল ইন্টেলিজেন্স',
    thumbnailUrl: '/src/assets/images/course_python_ai_1792938698935.jpg',
    isFeatured: true,
    isPublished: true,
    highlights: ['৩০+ হ্যান্ডস-অন এআই ল্যাব', 'লার্জ ল্যাঙ্গুয়েজ মডেল ফাইন-টিউনিং', 'মেশিন লার্নিং পাইপলাইন', 'অফিসিয়াল টেলিগ্রাম সাপোর্ট'],
    allowedPackageIds: ['pkg_1m', 'pkg_3m', 'pkg_lifetime'],
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: 'l_py_01',
        courseId: 'course_python_ai',
        title: '১.১ পাইথন প্রোগ্রামিং ও নিউমেরিক্যাল কম্পিউটিং বেসিক্স',
        durationMin: 28,
        isPreview: true,
        sortOrder: 1,
      },
      {
        id: 'l_py_02',
        courseId: 'course_python_ai',
        title: '১.২ পান্ডাস ও ডেটা ভিজ্যুয়ালাইজেশন ওয়ার্কফ্লো',
        durationMin: 40,
        isPreview: true,
        sortOrder: 2,
      },
      {
        id: 'l_py_03',
        courseId: 'course_python_ai',
        title: '২.১ সুপারভাইজড লার্নিং ও রিগ্রেশন অ্যালগরিদম (লকড)',
        durationMin: 55,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/py_secure_03.mp4',
        sortOrder: 3,
      },
      {
        id: 'l_py_04',
        courseId: 'course_python_ai',
        title: '২.২ ডিপ লার্নিং ও কনভোল্যুশনাল নিউরাল নেটওয়ার্কস (লকড)',
        durationMin: 65,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/py_secure_04.mp4',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'course_cyber_security',
    title: 'এথিক্যাল হ্যাকিং ও সাইবার সিকিউরিটি ডিফেন্স স্পেশালাইজেশন',
    shortDescription: 'নেটওয়ার্ক পেনিট্রেশন টেস্টিং, বাগ হান্টিং, ওয়েব সিকিউরিটি ভালনারেবিলিটি অ্যানালাইসিস।',
    fullDescription: 'সাইবার নিরাপত্তার বর্তমান চ্যালেঞ্জ ও সুরক্ষার বাস্তব টেকনিক। কালিলিনাক্স ল্যাব, ওয়্যারশার্ক প্যাকেট অ্যানালাইসিস, ওয়েব অ্যাপ সিকিউরিটি অডিটিং এবং ডিফেন্সিভ সাইবার মেকানিজম শিখুন।',
    category: 'সাইবার সিকিউরিটি',
    thumbnailUrl: '/src/assets/images/course_cyber_security_1792938699677.jpg',
    isFeatured: true,
    isPublished: true,
    highlights: ['প্র্যাকটিক্যাল ভার্চুয়াল ল্যাব সেটআপ', 'বাগ বাউন্টি মেথডলজি', 'নেটওয়ার্ক অডিট গাইডলাইনস', 'সিক্রেট টেলিগ্রাম রিসার্চ গ্রুপ'],
    allowedPackageIds: ['pkg_1m', 'pkg_3m', 'pkg_lifetime'],
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: 'l_cs_01',
        courseId: 'course_cyber_security',
        title: '১.১ নেটওয়ার্কিং প্রটোকল ও লিনাক্স এনভায়রনমেন্ট সেটআপ',
        durationMin: 30,
        isPreview: true,
        sortOrder: 1,
      },
      {
        id: 'l_cs_02',
        courseId: 'course_cyber_security',
        title: '১.২ ইনফরমেশন গ্যাদারিং ও ফুটপ্রিন্টিং টেকনিকস',
        durationMin: 45,
        isPreview: true,
        sortOrder: 2,
      },
      {
        id: 'l_cs_03',
        courseId: 'course_cyber_security',
        title: '২.১ ওয়েব ভালনারেবিলিটি স্ক্যানিং ও ওওয়াস্প টপ ১০ (লকড)',
        durationMin: 58,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/cs_secure_03.mp4',
        sortOrder: 3,
      },
      {
        id: 'l_cs_04',
        courseId: 'course_cyber_security',
        title: '২.২ পাসওয়ার্ড ক্র্যাকিং মেকানিজম ও ডিফেন্স শিল্ড (লকড)',
        durationMin: 50,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/cs_secure_04.mp4',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'course_cloud_devops',
    title: 'ক্লাউড ডেভঅপ্স ও সার্ভার আর্কিটেকচার (Docker, K8s, AWS, CI/CD)',
    shortDescription: 'কনটেইনারাইজেশন, কুবারনেটিস ক্লাস্টার ম্যানেজমেন্ট, অটোমেটেড সিআই/সিডি বিল্ড এবং মনিটরিং।',
    fullDescription: 'আধুনিক সফটওয়্যার ইঞ্জিনিয়ারিংয়ের মেরুদণ্ড হলো ডেভঅপ্স। ডকার, কুবারনেটিস, অ্যাডভান্সড সিআই/সিডি অটোমেশন পাইপলাইন এবং ক্লাউড ইনফ্রাস্ট্রাকচার ম্যানেজমেন্ট শিখুন একদম শুরু থেকে।',
    category: 'ক্লাউড ও ডেভঅপ্স',
    thumbnailUrl: '/src/assets/images/course_cloud_devops_1792938699068.jpg',
    isFeatured: false,
    isPublished: true,
    highlights: ['এডব্লিউএস ও ক্লাউড প্র্যাকটিস', 'ডকার ও কুবারনেটিস ডিপ্লয়মেন্ট', 'গিটহাব অ্যাকশনস পাইপলাইন', 'রিয়েল প্রোডাকশন কেস স্টাডি'],
    allowedPackageIds: ['pkg_1m', 'pkg_3m', 'pkg_lifetime'],
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    lessons: [
      {
        id: 'l_cd_01',
        courseId: 'course_cloud_devops',
        title: '১.১ ক্লাউড কম্পিউটিং ও সার্ভারলেস আর্কিটেকচার ওভারভিউ',
        durationMin: 25,
        isPreview: true,
        sortOrder: 1,
      },
      {
        id: 'l_cd_02',
        courseId: 'course_cloud_devops',
        title: '১.২ ডকার ফান্ডামেন্টালস ও কনটেইনার লাইফসাইকেল',
        durationMin: 42,
        isPreview: true,
        sortOrder: 2,
      },
      {
        id: 'l_cd_03',
        courseId: 'course_cloud_devops',
        title: '২.১ কুবারনেটিস পডস, সার্ভিসেস ও ক্লাস্টার ম্যানেজমেন্ট (লকড)',
        durationMin: 62,
        isPreview: false,
        videoUrl: 'https://techvantagebd.internal/stream/cd_secure_03.mp4',
        sortOrder: 3,
      },
    ],
  },
];

const INITIAL_SETTINGS: SiteSettings = {
  brandName: 'TechVantage BD',
  brandTagline: 'প্রফেশনাল ডিজিটাল লার্নিং প্ল্যাটফর্ম',
  language: 'bn',
  currency: 'BDT',
  bkashNumber: process.env.BKASH_NUMBER || '01983463798',
  nagadNumber: process.env.NAGAD_NUMBER || '01771576066',
  heroHeading: 'বাংলাদেশ সেরা প্রিমিয়াম টেক ও প্রোগ্রামিং স্কিল প্ল্যাটফর্ম',
  heroDescription: 'কোনো দীর্ঘ রেজিস্ট্রেশন ছাড়াই সহজে বিকাশ বা নগদে পেমেন্ট করুন এবং অ্যাডমিনের ভেরিফিকেশন সাপেক্ষে পান অফিশিয়াল প্রাইভেট টেলিগ্রাম কমিউনিটি ও ফুল কোর্স অ্যাক্সেস।',
  heroBadgeText: 'প্রফেশনাল ডিজিটাল লার্নিং প্ল্যাটফর্ম',
  ctaExplore: 'কোর্স দেখুন',
  ctaPricing: 'প্যাকেজ দেখুন',
  galleryHeading: 'প্রিমিয়াম ভিডিও কোর্সসমূহ',
  galleryDescription: 'ভিডিও থাম্বনেইলে ক্লিক করে কোর্সের পাঠ্যক্রম এবং পাবলিক প্রিভিউ লেকচার দেখুন।',
  footerCopyright: '© 2026 TechVantage BD. সর্বস্বত্ব সংরক্ষিত।',
  footerDescription: 'বাংলাদেশের টেক লার্নার ও প্রফেশনালদের জন্য বিশ্বমানের প্রজেক্ট-ভিত্তিক আইটি ও সফটওয়্যার স্কিল ডেভেলপমেন্ট প্ল্যাটফর্ম। বিকাশ ও নগদ ইনস্ট্যান্ট ম্যানুয়াল ভেরিফিকেশন।',
  contactPhone: '+8801983463798',
  contactEmail: 'support@techvantagebd.com',
  contactAddress: 'ঢাকা, বাংলাদেশ',
  announcementText: '📢 বিশেষ অফার: মাত্র ১৫০ টাকায় ৩০ দিনের কোর্স এক্সেস শুরু করুন! দ্রুত পেমেন্ট কনফার্মেশন ও টেলিগ্রাম সাপোর্ট।',
  showAnnouncement: true,
  
  // Header CMS
  navLinks: [
    { id: 'nav_home', label: 'হোম', href: 'home', isVisible: true },
    { id: 'nav_courses', label: 'কোর্সসমূহ', href: 'courses', isVisible: true },
    { id: 'nav_pricing', label: 'প্যাকেজ ও ফি', href: 'pricing', isVisible: true },
    { id: 'nav_faq', label: 'সচরাচর জিজ্ঞাসা', href: 'faq', isVisible: true },
  ],
  showHeaderCta: true,
  headerCtaText: 'এখনই কোর্স কিনুন',
  headerCtaHref: 'checkout',

  // Hero CMS
  heroSubtitle: 'বিকাশ ও নগদে সরাসরি সহজ পেমেন্ট · প্রাইভেট টেলিগ্রাম কমিউনিটি',
  heroImageUrl: '/src/assets/images/hero_techvantage_banner_1792938697744.jpg',

  // Section Ordering & Visibility CMS
  sectionVisibility: {
    hero: true,
    courses: true,
    pricing: true,
    testimonials: true,
    faq: true,
    footer: true,
  },

  // Footer CMS
  socialLinks: [
    { id: 'soc_tg', platform: 'Telegram', url: 'https://t.me/techvantagebd', isVisible: true },
    { id: 'soc_fb', platform: 'Facebook', url: 'https://facebook.com/techvantagebd', isVisible: true },
    { id: 'soc_yt', platform: 'YouTube', url: 'https://youtube.com/@techvantagebd', isVisible: true },
  ],
  footerLinks: [
    { id: 'fl_home', label: 'হোম পেজ', href: 'home', isVisible: true },
    { id: 'fl_courses', label: 'প্রিমিয়াম কোর্সসমূহ', href: 'courses', isVisible: true },
    { id: 'fl_pricing', label: 'প্যাকেজ ও ফি', href: 'pricing', isVisible: true },
    { id: 'fl_faq', label: 'সচরাচর জিজ্ঞাসা (FAQ)', href: 'faq', isVisible: true },
  ],

  // Telegram Settings (Admin Managed & Bot API)
  telegramMode: 'both',
  telegramChannelUrl: 'https://t.me/+TechVantageBD_VIP',
  isTelegramLinkEnabled: true,
  isTelegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  telegramInviteExpiryHours: Number(process.env.TELEGRAM_INVITE_EXPIRY_HOURS || 48),
  isOtpConfigured: Boolean(process.env.OTP_API_KEY && process.env.OTP_PROVIDER && process.env.OTP_PROVIDER !== 'none'),
  seoTitle: 'TechVantage BD — প্রিমিয়াম টেক ও স্কিল কোর্স প্ল্যাটফর্ম',
  seoDescription: 'TechVantage BD - Bangladesh premium tech learning portal with bKash and Nagad guest checkout and private Telegram access.',
  faqList: [
    {
      id: 'faq_1',
      question: 'কোর্স কেনার জন্য কি ওয়েবসাইটে একাউন্ট বা রেজিস্ট্রেশন করতে হবে?',
      answer: 'না, কোনো একাউন্ট তৈরি বা লগইন করার প্রয়োজন নেই। শুধুমাত্র আপনার প্রেরক ফোন নম্বর এবং বিকাশ বা নগদ ট্রানজেকশন আইডি (TrxID) দিয়ে সরাসরি সহজ পেমেন্ট রিকোয়েস্ট সাবমিট করতে পারবেন।',
    },
    {
      id: 'faq_2',
      question: 'পেমেন্ট করার পর টেলিগ্রাম লিংক কখন পাব?',
      answer: 'পেমেন্ট সাবমিট করার পর আমাদের অ্যাডমিন ম্যানুয়ালি আপনার ট্রানজেকশন যাচাই করবেন। পেমেন্ট অনুমোদিত (Approved) হওয়ার সাথে সাথে আপনার অর্ডার ট্র্যাকিং পেইজে সিকিউর টেলিগ্রাম ইনভাইটেশন লিংক জেনারেট হয়ে যাবে। অনুমোদন ছাড়া কোনো ইনভাইটেশন প্রদান করা হয় না।',
    },
    {
      id: 'faq_3',
      question: 'আমি কি পরে আমার অর্ডার এবং টেলিগ্রাম লিংক রিকভার করতে পারব?',
      answer: 'হ্যাঁ! উপরের "অর্ডার ট্র্যাকিং ও রিকভারি" মেন্যুতে আপনার প্রেরক ফোন নম্বর এবং TrxID দিয়ে নিরাপদ প্রক্রিয়ায় অর্ডার ভেরিফাই করে টেলিগ্রাম অ্যাক্সেস রিকভার করতে পারবেন।',
    },
    {
      id: 'faq_4',
      question: 'বিকাশ ও নগদ পেমেন্ট করার নিয়ম কী?',
      answer: 'আপনার বিকাশ বা নগদ অ্যাপ ওপেন করে Send Money অপশনে যান। আমাদের দেওয়া নাম্বারে সঠিক পরিমাণ টাকা সেন্ড মানি করুন। এরপর প্রাপ্ত TrxID এবং প্রেরক নাম্বার ফর্মে দিয়ে সাবমিট করুন।',
    },
    {
      id: 'faq_5',
      question: 'লাইফটাইম প্যাকেজে কী কী সুবিধা রয়েছে?',
      answer: 'লাইফটাইম মেম্বারশিপে আপনি বর্তমান সব কোর্সের পাশাপাশি ভবিষ্যতে যুক্ত হওয়া সকল কোর্সের আজীবন অ্যাক্সেস এবং স্থায়ী টেলিগ্রাম ভিআইপি গ্রুপের সদস্যপদ পাবেন।',
    },
  ],
  testimonials: [
    {
      id: 't_1',
      name: 'আরিফুল ইসলাম',
      role: 'জুনিয়র ফুল-স্ট্যাক ডেভেলপার',
      comment: 'TechVantage BD-এর কোর্স কনটেন্ট একদম প্র্যাকটিক্যাল। বিকাশ পেমেন্ট করার অল্প কিছুক্ষণের মধ্যেই অ্যাডমিন ভেরিফাই করে টেলিগ্রাম গ্রুপে অ্যাড করে দিয়েছেন।',
      rating: 5,
    },
    {
      id: 't_2',
      name: 'ফারহানা ইয়াসমিন',
      role: 'পাইথন শিক্ষার্থী',
      comment: 'কোনো লগইন বা সাইন আপ ছাড়া এত সহজে কোর্স কেনা যায় ভাবিনি। টেলিগ্রাম কমিউনিটিতে মেন্টররা দারুণ হেল্পফুল!',
      rating: 5,
    },
  ],
};

export function calculateEffectivePrice(
  basePrice: number,
  discount?: {
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    discountActive?: boolean;
    discountStartDate?: string | null;
    discountEndDate?: string | null;
    originalPriceBdt?: number;
  }
): {
  finalPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountLabel?: string;
  discountPercentage?: number;
} {
  const original = discount?.originalPriceBdt && discount.originalPriceBdt > basePrice
    ? discount.originalPriceBdt
    : basePrice;

  if (!discount || !discount.discountActive || !discount.discountValue || discount.discountValue <= 0) {
    return {
      finalPrice: Math.max(0, Math.round(basePrice)),
      originalPrice: original,
      hasDiscount: false,
    };
  }

  // Check date bounds if configured
  const now = new Date();
  if (discount.discountStartDate) {
    const start = new Date(discount.discountStartDate);
    if (!isNaN(start.getTime()) && now < start) {
      return { finalPrice: Math.max(0, Math.round(basePrice)), originalPrice: original, hasDiscount: false };
    }
  }
  if (discount.discountEndDate) {
    const end = new Date(discount.discountEndDate);
    if (!isNaN(end.getTime()) && now > end) {
      return { finalPrice: Math.max(0, Math.round(basePrice)), originalPrice: original, hasDiscount: false };
    }
  }

  let finalPrice = basePrice;
  let discountLabel = '';
  let discountPercentage = 0;

  if (discount.discountType === 'percentage') {
    // Prevent percentage greater than 100%
    const pct = Math.min(100, Math.max(0, discount.discountValue));
    finalPrice = Math.round(basePrice * (1 - pct / 100));
    discountLabel = `${pct}% ছাড়`;
    discountPercentage = pct;
  } else {
    // Fixed amount discount
    const fixed = Math.max(0, discount.discountValue);
    finalPrice = Math.max(0, Math.round(basePrice - fixed));
    discountLabel = `৳${fixed} ছাড়`;
    if (basePrice > 0) {
      discountPercentage = Math.round(((basePrice - finalPrice) / basePrice) * 100);
    }
  }

  // Never allow negative price
  finalPrice = Math.max(0, finalPrice);

  return {
    finalPrice,
    originalPrice: basePrice,
    hasDiscount: finalPrice < basePrice,
    discountLabel,
    discountPercentage,
  };
}

class Store {
  private data: DatabaseData;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          courses: parsed.courses || INITIAL_COURSES,
          packages: parsed.packages || INITIAL_PACKAGES,
          orders: parsed.orders || [],
          telegramInvites: parsed.telegramInvites || [],
          entitlements: parsed.entitlements || [],
          settings: {
            ...INITIAL_SETTINGS,
            ...(parsed.settings || {}),
            navLinks: parsed.settings?.navLinks?.length ? parsed.settings.navLinks : INITIAL_SETTINGS.navLinks,
            socialLinks: parsed.settings?.socialLinks?.length ? parsed.settings.socialLinks : INITIAL_SETTINGS.socialLinks,
            footerLinks: parsed.settings?.footerLinks?.length ? parsed.settings.footerLinks : INITIAL_SETTINGS.footerLinks,
            sectionVisibility: {
              ...INITIAL_SETTINGS.sectionVisibility,
              ...(parsed.settings?.sectionVisibility || {}),
            },
          },
          recoveryChallenges: parsed.recoveryChallenges || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (e) {
      console.error('[DB] Failed reading database file, using initial data:', e);
    }

    const initial: DatabaseData = {
      courses: INITIAL_COURSES,
      packages: INITIAL_PACKAGES,
      orders: [],
      telegramInvites: [],
      entitlements: [],
      auditLogs: [
        {
          id: 'log_init',
          action: 'SYSTEM_BOOTSTRAP',
          actor: 'system',
          targetType: 'system',
          details: { message: 'TechVantage BD Database initialized with default configuration' },
          createdAt: new Date().toISOString(),
        },
      ],
      settings: INITIAL_SETTINGS,
      recoveryChallenges: [],
    };

    this.save(initial);
    return initial;
  }

  private save(newData?: DatabaseData): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = newData || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Error persisting database file:', e);
    }
  }

  // --- Courses ---
  public getCourses(publicOnly: boolean = true): Course[] {
    const list = this.data.courses.filter(c => !publicOnly || c.isPublished);
    return list.map(c => {
      // For public list, strip protected lesson URLs
      const sanitizedLessons = (c.lessons || []).map(l => ({
        ...l,
        videoUrl: publicOnly && !l.isPreview ? undefined : l.videoUrl,
        notes: publicOnly && !l.isPreview ? undefined : l.notes,
      }));
      return {
        ...c,
        lessons: sanitizedLessons,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getCourseById(id: string, includeProtected: boolean = false): Course | undefined {
    const course = this.data.courses.find(c => c.id === id);
    if (!course) return undefined;
    const sanitizedLessons = (course.lessons || []).map(l => ({
      ...l,
      videoUrl: !includeProtected && !l.isPreview ? undefined : l.videoUrl,
      notes: !includeProtected && !l.isPreview ? undefined : l.notes,
    }));
    return {
      ...course,
      lessons: sanitizedLessons,
    };
  }

  public createCourse(course: Omit<Course, 'id' | 'createdAt'>): Course {
    const id = `course_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const newCourse: Course = {
      ...course,
      id,
      createdAt: new Date().toISOString(),
      sortOrder: course.sortOrder || this.data.courses.length + 1,
    };
    this.data.courses.push(newCourse);
    this.save();
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course | undefined {
    const index = this.data.courses.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    const updated = {
      ...this.data.courses[index],
      ...updates,
      id, // protect ID
    };
    this.data.courses[index] = updated;
    this.save();
    return updated;
  }

  public deleteCourse(id: string): boolean {
    const prevLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    if (this.data.courses.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Packages ---
  public getPackages(activeOnly: boolean = true): Package[] {
    return this.data.packages
      .filter(p => !activeOnly || p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getPackageById(id: string): Package | undefined {
    return this.data.packages.find(p => p.id === id);
  }

  public updatePackage(id: string, updates: Partial<Package>): Package | undefined {
    const index = this.data.packages.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    const updated = { ...this.data.packages[index], ...updates, id };
    this.data.packages[index] = updated;
    this.save();
    return updated;
  }

  // --- Orders ---
  public getOrders(filters?: { status?: string; paymentMethod?: string; search?: string }): Order[] {
    let list = [...this.data.orders];
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(o => o.status === filters.status);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      list = list.filter(o => o.paymentMethod === filters.paymentMethod);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        o =>
          o.id.toLowerCase().includes(q) ||
          o.trxId.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.senderPhone.includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }
    // Attach invite if available
    return list
      .map(o => ({
        ...o,
        telegramInvite: this.data.telegramInvites.find(i => i.orderId === o.id),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    const o = this.data.orders.find(ord => ord.id === id);
    if (!o) return undefined;
    return {
      ...o,
      telegramInvite: this.data.telegramInvites.find(i => i.orderId === o.id),
    };
  }

  public getOrderByTrx(trxId: string, paymentMethod: string): Order | undefined {
    const normalizedTrx = trxId.trim().toUpperCase();
    return this.data.orders.find(
      o => o.trxId.trim().toUpperCase() === normalizedTrx && o.paymentMethod === paymentMethod
    );
  }

  public getOrderByTokenHash(tokenHash: string): Order | undefined {
    const order = this.data.orders.find(o => o.tokenHash === tokenHash);
    if (!order) return undefined;
    return {
      ...order,
      telegramInvite: this.data.telegramInvites.find(i => i.orderId === order.id),
    };
  }

  public getOrdersByCustomerPhone(phone: string): Order[] {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.data.orders
      .filter(o => o.customerPhone.replace(/\D/g, '') === cleanPhone || o.senderPhone.replace(/\D/g, '') === cleanPhone)
      .map(o => ({
        ...o,
        telegramInvite: this.data.telegramInvites.find(i => i.orderId === o.id),
      }));
  }

  public getOrderByPhoneAndTrx(phone: string, trxId: string): Order | undefined {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanTrx = trxId.trim().toUpperCase();
    const order = this.data.orders.find(
      o =>
        (o.senderPhone.replace(/\D/g, '') === cleanPhone ||
          o.customerPhone.replace(/\D/g, '') === cleanPhone) &&
        o.trxId.trim().toUpperCase() === cleanTrx
    );
    if (!order) return undefined;
    return {
      ...order,
      telegramInvite: this.data.telegramInvites.find(i => i.orderId === order.id),
    };
  }

  public isTrxAlreadyApproved(trxId: string, excludeOrderId?: string): boolean {
    const cleanTrx = trxId.trim().toUpperCase();
    return this.data.orders.some(
      o =>
        o.id !== excludeOrderId &&
        o.status === 'approved' &&
        o.trxId.trim().toUpperCase() === cleanTrx
    );
  }

  public issueNewTrackingTokenForOrder(orderId: string): { trackingToken: string; tokenHash: string } | undefined {
    const rawSecretToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawSecretToken).digest('hex');
    const updated = this.updateOrder(orderId, { tokenHash });
    if (!updated) return undefined;
    return { trackingToken: rawSecretToken, tokenHash };
  }

  public createOrder(order: Order): Order {
    this.data.orders.push(order);
    this.save();
    return order;
  }

  public updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    this.data.orders[index] = {
      ...this.data.orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.orders[index];
  }

  // --- Telegram Invites ---
  public saveTelegramInvite(invite: TelegramInvite): TelegramInvite {
    const existingIdx = this.data.telegramInvites.findIndex(i => i.orderId === invite.orderId);
    if (existingIdx !== -1) {
      this.data.telegramInvites[existingIdx] = invite;
    } else {
      this.data.telegramInvites.push(invite);
    }
    this.save();
    return invite;
  }

  public getTelegramInviteByOrderId(orderId: string): TelegramInvite | undefined {
    return this.data.telegramInvites.find(i => i.orderId === orderId);
  }

  // --- Entitlements ---
  public saveEntitlement(entitlement: Entitlement): Entitlement {
    const existingIdx = this.data.entitlements.findIndex(e => e.orderId === entitlement.orderId);
    if (existingIdx !== -1) {
      this.data.entitlements[existingIdx] = entitlement;
    } else {
      this.data.entitlements.push(entitlement);
    }
    this.save();
    return entitlement;
  }

  public getEntitlements(): Entitlement[] {
    // Check expirations on the fly
    const now = new Date();
    this.data.entitlements.forEach(e => {
      if (e.status === 'active' && e.expiresAt) {
        if (new Date(e.expiresAt) < now) {
          e.status = 'expired';
        }
      }
    });
    return [...this.data.entitlements].sort(
      (a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime()
    );
  }

  public getEntitlementByOrderId(orderId: string): Entitlement | undefined {
    return this.data.entitlements.find(e => e.orderId === orderId);
  }

  public revokeEntitlement(id: string, reason: string): boolean {
    const ent = this.data.entitlements.find(e => e.id === id);
    if (ent) {
      ent.status = 'revoked';
      ent.revokedReason = reason;
      this.save();
      return true;
    }
    return false;
  }

  // --- Settings ---
  public getSettings(): SiteSettings {
    return {
      ...INITIAL_SETTINGS,
      ...this.data.settings,
      isTelegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      telegramChatId: process.env.TELEGRAM_CHAT_ID || this.data.settings.telegramChatId || '',
      isOtpConfigured: Boolean(process.env.OTP_API_KEY && process.env.OTP_PROVIDER && process.env.OTP_PROVIDER !== 'none'),
    };
  }

  public updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
    };
    this.save();
    return this.getSettings();
  }

  // --- Audit Logs ---
  public addAuditLog(
    action: string,
    actor: string,
    targetType: string,
    targetId: string | undefined,
    details: Record<string, unknown>,
    ipAddress?: string
  ): AuditLog {
    const log: AuditLog = {
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      action,
      actor,
      targetType,
      targetId,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Stats for Admin Overview ---
  public getDashboardOverview() {
    const orders = this.data.orders;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const approvedOrders = orders.filter(o => o.status === 'approved').length;
    const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
    const paymentIssues = orders.filter(o => o.status === 'payment_issue').length;

    // Confirmed revenue strictly from approved orders
    const confirmedRevenue = orders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + (Number(o.amountBdt) || 0), 0);

    const activeSubscriptions = this.getEntitlements().filter(e => e.status === 'active').length;
    const telegramFailures = orders.filter(
      o => o.status === 'approved' && o.telegramInviteStatus === 'failed'
    ).length;

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      paymentIssues,
      confirmedRevenue,
      totalCourses: this.data.courses.length,
      activeSubscriptions,
      telegramFailures,
      recentActivity: this.data.auditLogs.slice(0, 10),
    };
  }
}

export const db = new Store();
