export type PaymentMethod = 'bkash' | 'nagad';

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'payment_issue';

export type TelegramInviteStatus = 'none' | 'pending' | 'created' | 'failed' | 'revoked';

export type EntitlementStatus = 'active' | 'expired' | 'revoked';

export type TelegramMode = 'bot_generated' | 'admin_link' | 'both';

export interface DiscountConfig {
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountActive?: boolean;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  originalPriceBdt?: number;
}

export interface Package extends DiscountConfig {
  id: string;
  name: string;
  durationDays: number | null; // null represents lifetime
  priceBdt: number;
  badge?: string;
  description: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  durationMin: number;
  isPreview: boolean;
  videoUrl?: string; // Private, protected by entitlement
  notes?: string;
  sortOrder: number;
}

export interface Course extends DiscountConfig {
  id: string;
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  highlights: string[];
  allowedPackageIds: string[];
  sortOrder: number;
  priceBdt?: number;
  lessons?: Lesson[];
  createdAt?: string;
}

export interface OrderPackageSnapshot {
  id: string;
  name: string;
  durationDays: number | null;
  priceBdt: number;
  originalPriceBdt?: number;
  discountApplied?: boolean;
}

export interface Order {
  id: string;
  courseId: string;
  courseTitle?: string;
  packageId: string;
  packageSnapshot: OrderPackageSnapshot;
  amountBdt: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  senderPhone: string;
  trxId: string;
  tokenHash: string;
  status: OrderStatus;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  telegramInviteStatus: TelegramInviteStatus;
  telegramInvite?: TelegramInvite;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramInvite {
  id: string;
  orderId: string;
  chatId: string;
  inviteLink: string;
  memberLimit: number;
  expiresAt: string;
  createdAt: string;
  isRevoked: boolean;
  isStaticAdminLink?: boolean;
}

export interface Entitlement {
  id: string;
  orderId: string;
  customerPhone: string;
  courseId: string;
  courseTitle?: string;
  packageId: string;
  grantedAt: string;
  expiresAt: string | null;
  status: EntitlementStatus;
  revokedReason?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  targetType: string;
  targetId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  comment: string;
  rating: number;
}

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  isVisible?: boolean;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
  isVisible: boolean;
}

export interface SectionVisibility {
  hero: boolean;
  courses: boolean;
  pricing: boolean;
  testimonials: boolean;
  faq: boolean;
  footer: boolean;
}

export interface SiteSettings {
  brandName: string;
  brandTagline?: string;
  brandLogoUrl?: string;
  language: string;
  currency: string;
  bkashNumber: string;
  nagadNumber: string;
  
  // Header CMS
  navLinks?: NavLinkItem[];
  showHeaderCta?: boolean;
  headerCtaText?: string;
  headerCtaHref?: string;
  
  // Hero CMS
  heroHeading: string;
  heroSubtitle?: string;
  heroDescription: string;
  heroBadgeText?: string;
  heroImageUrl?: string;
  ctaExplore: string;
  ctaPricing: string;
  
  // Gallery CMS
  galleryHeading?: string;
  galleryDescription?: string;
  
  // Section Ordering & Visibility CMS
  sectionVisibility?: SectionVisibility;
  
  // Footer CMS
  footerCopyright: string;
  footerDescription?: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress?: string;
  socialLinks?: SocialLinkItem[];
  footerLinks?: NavLinkItem[];
  
  // Announcement
  announcementText?: string;
  showAnnouncement?: boolean;
  
  // Telegram Settings
  telegramMode: TelegramMode;
  telegramChannelUrl: string; // Admin-configured join URL (e.g., https://t.me/+xyz)
  isTelegramLinkEnabled: boolean;
  isTelegramConfigured: boolean;
  telegramChatId: string;
  telegramInviteExpiryHours: number;
  
  // Security & Feature Toggles
  isOtpConfigured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  faqList: FaqItem[];
  testimonials?: TestimonialItem[];
}

export interface TrackingDetails {
  id: string;
  courseId: string;
  courseTitle: string;
  packageSnapshot: OrderPackageSnapshot;
  amountBdt: number;
  customerName: string;
  maskedCustomerPhone: string;
  maskedSenderPhone: string;
  paymentMethod: PaymentMethod;
  trxIdMasked: string;
  status: OrderStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  telegramInviteStatus: TelegramInviteStatus;
  telegramInvite?: {
    inviteLink: string;
    expiresAt: string;
    isRevoked: boolean;
    isStaticAdminLink?: boolean;
  } | null;
  entitlement?: {
    status: EntitlementStatus;
    expiresAt: string | null;
  } | null;
}
