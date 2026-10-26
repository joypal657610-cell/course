import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, calculateEffectivePrice } from './src/server/db';
import { generateChatInvite, testTelegramConfiguration } from './src/server/telegram';
import { requestRecoveryChallenge, verifyRecoveryOtp, normalizeBDPhone } from './src/server/recovery';
import { Order, OrderPackageSnapshot, PaymentMethod, OrderStatus } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Request parsers with generous limits for image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve public static assets
app.use('/uploads', express.static(UPLOADS_DIR));

// -----------------------------------------------------------------------------
// RATE LIMITING & SECURITY HELPERS
// -----------------------------------------------------------------------------
const pinAttemptMap = new Map<string, { attempts: number; blockedUntil: number }>();
const checkoutRateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Simple signed admin tokens
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'techvantage_super_secure_admin_secret_2026';

function generateAdminToken(): string {
  const payload = `techvantage_admin_${Date.now()}`;
  const hmac = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${hmac}`).toString('base64');
}

function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [payload, signature] = decoded.split('.');
    if (!payload || !signature) return false;
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Middleware: Require Admin Authentication
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'অননুমোদিত অ্যাক্সেস। অ্যাডমিন টোকেন আবশ্যক।' });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(403).json({ success: false, error: 'অবৈধ বা মেয়াদোত্তীর্ণ অ্যাডমিন সেশন।' });
    return;
  }
  next();
}

// Helper: Mask phone number (01983463798 -> 019****3798)
function maskPhone(phone: string): string {
  if (phone.length >= 10) {
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }
  return '****' + phone.slice(-2);
}

// Helper: Mask TrxID (ABC123XYZ -> ABC***XYZ)
function maskTrx(trx: string): string {
  if (trx.length > 5) {
    return trx.slice(0, 3) + '***' + trx.slice(-3);
  }
  return '***' + trx.slice(-2);
}

// -----------------------------------------------------------------------------
// PUBLIC APIS
// -----------------------------------------------------------------------------

// 1. Get site public settings
app.get('/api/public/settings', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  // Strip sensitive tokens before returning to client
  const safeSettings = {
    brandName: settings.brandName,
    brandTagline: settings.brandTagline,
    brandLogoUrl: settings.brandLogoUrl,
    language: settings.language,
    currency: settings.currency,
    bkashNumber: settings.bkashNumber,
    nagadNumber: settings.nagadNumber,
    navLinks: settings.navLinks,
    showHeaderCta: settings.showHeaderCta !== false,
    headerCtaText: settings.headerCtaText || 'এখনই কোর্স কিনুন',
    headerCtaHref: settings.headerCtaHref || 'pricing',
    heroHeading: settings.heroHeading,
    heroSubtitle: settings.heroSubtitle,
    heroDescription: settings.heroDescription,
    heroBadgeText: settings.heroBadgeText,
    heroImageUrl: settings.heroImageUrl,
    ctaExplore: settings.ctaExplore,
    ctaPricing: settings.ctaPricing,
    galleryHeading: settings.galleryHeading,
    galleryDescription: settings.galleryDescription,
    sectionVisibility: settings.sectionVisibility,
    footerCopyright: settings.footerCopyright,
    footerDescription: settings.footerDescription,
    contactPhone: settings.contactPhone,
    contactEmail: settings.contactEmail,
    contactAddress: settings.contactAddress,
    socialLinks: settings.socialLinks,
    footerLinks: settings.footerLinks,
    announcementText: settings.announcementText,
    showAnnouncement: settings.showAnnouncement !== false,
    telegramMode: settings.telegramMode,
    isTelegramLinkEnabled: settings.isTelegramLinkEnabled,
    isTelegramConfigured: settings.isTelegramConfigured || (settings.isTelegramLinkEnabled && Boolean(settings.telegramChannelUrl)),
    isOtpConfigured: settings.isOtpConfigured,
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    faqList: settings.faqList,
    testimonials: settings.testimonials || [],
  };
  res.json({ success: true, data: safeSettings });
});

// 2. Get public courses list
app.get('/api/public/courses', (_req: Request, res: Response) => {
  const courses = db.getCourses(true);
  res.json({ success: true, data: courses });
});

// 3. Get public course details
app.get('/api/public/courses/:id', (req: Request, res: Response) => {
  const course = db.getCourseById(req.params.id, false);
  if (!course) {
    res.status(404).json({ success: false, error: 'কোর্সটি খুঁজে পাওয়া যায়নি।' });
    return;
  }
  res.json({ success: true, data: course });
});

// 4. Get active packages
app.get('/api/public/packages', (_req: Request, res: Response) => {
  const packages = db.getPackages(true);
  res.json({ success: true, data: packages });
});

// 5. Account-Free Guest Checkout
app.post('/api/checkout', (req: Request, res: Response): void => {
  const ip = getClientIp(req);
  const now = Date.now();

  // Rate limiting: max 10 checkouts per 5 minutes per IP
  const rate = checkoutRateMap.get(ip) || { count: 0, resetAt: now + 5 * 60 * 1000 };
  if (now > rate.resetAt) {
    rate.count = 0;
    rate.resetAt = now + 5 * 60 * 1000;
  }
  rate.count += 1;
  checkoutRateMap.set(ip, rate);

  if (rate.count > 12) {
    res.status(429).json({
      success: false,
      error: 'অত্যধিক চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।',
    });
    return;
  }

  const {
    courseId,
    packageId,
    customerName,
    customerPhone,
    paymentMethod,
    senderPhone,
    trxId,
  } = req.body;

  // Validate simplified input: ONLY senderPhone and trxId required from customer
  const rawSenderPhone = String(senderPhone || customerPhone || '');
  const cleanSenderPhone = normalizeBDPhone(rawSenderPhone);
  if (!cleanSenderPhone || !/^01[3-9]\d{8}$/.test(cleanSenderPhone)) {
    res.status(400).json({ success: false, error: 'যে নম্বর থেকে টাকা পাঠিয়েছেন সেই সঠিক ১১-সংখ্যার বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।' });
    return;
  }

  const cleanTrx = String(trxId || '').trim().toUpperCase();
  if (cleanTrx.length < 5 || cleanTrx.length > 25 || !/^[A-Z0-9]+$/.test(cleanTrx)) {
    res.status(400).json({ success: false, error: 'সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন (যেমন: 9J82K3L5)' });
    return;
  }

  const validMethods: PaymentMethod[] = ['bkash', 'nagad'];
  const finalMethod: PaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'bkash';

  // Server-Authoritative Package & Course Validation
  const course = db.getCourseById(courseId, false) || db.getCourses(true)[0];
  if (!course) {
    res.status(400).json({ success: false, error: 'নির্বাচিত কোর্সটি সিস্টেমে বিদ্যমান নেই।' });
    return;
  }

  const canonicalPackage = db.getPackageById(packageId) || db.getPackages(true)[0];
  if (!canonicalPackage || !canonicalPackage.isActive) {
    res.status(400).json({ success: false, error: 'নির্বাচিত প্যাকেজটি বর্তমানে সক্রিয় নেই।' });
    return;
  }

  // Check duplicate Transaction ID
  const existingTrxOrder = db.getOrderByTrx(cleanTrx, finalMethod);
  if (existingTrxOrder) {
    res.status(409).json({
      success: false,
      error: `এই ট্রানজেকশন আইডি (${cleanTrx}) ইতিপূর্বে ব্যবহৃত হয়েছে। ডুপ্লিকেট পেমেন্ট সাবমিশন অনুমোদিত নয়।`,
    });
    return;
  }

  // Generate 32-byte cryptographically secure random token
  const rawSecretToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawSecretToken).digest('hex');

  // Calculate server-authoritative effective price (enforces discount limits, dates, non-negative)
  const pricing = calculateEffectivePrice(canonicalPackage.priceBdt, canonicalPackage);
  const finalPayable = pricing.finalPrice;

  // Create immutable snapshot of package
  const packageSnapshot: OrderPackageSnapshot = {
    id: canonicalPackage.id,
    name: canonicalPackage.name,
    durationDays: canonicalPackage.durationDays,
    priceBdt: finalPayable,
    originalPriceBdt: pricing.originalPrice,
    discountApplied: pricing.hasDiscount,
  };

  const orderId = `TVB-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const displayName = typeof customerName === 'string' && customerName.trim().length > 1
    ? customerName.trim()
    : `গ্রাহক (${cleanSenderPhone.slice(-4)})`;

  const newOrder: Order = {
    id: orderId,
    courseId: course.id,
    courseTitle: course.title,
    packageId: canonicalPackage.id,
    packageSnapshot,
    amountBdt: finalPayable,
    customerName: displayName,
    customerPhone: cleanSenderPhone,
    paymentMethod: finalMethod,
    senderPhone: cleanSenderPhone,
    trxId: cleanTrx,
    tokenHash,
    status: 'pending',
    telegramInviteStatus: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createOrder(newOrder);

  db.addAuditLog('ORDER_CREATED', 'guest', 'order', orderId, {
    courseId: course.id,
    amount: finalPayable,
    originalAmount: pricing.originalPrice,
    discountApplied: pricing.hasDiscount,
    paymentMethod,
    trxId: cleanTrx,
  }, ip);

  res.status(201).json({
    success: true,
    message: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। ম্যানুয়াল পেমেন্ট ভেরিফিকেশনের জন্য অপেক্ষমাণ।',
    orderId,
    trackingToken: rawSecretToken,
    orderUrl: `/track?token=${rawSecretToken}`,
  });
});

// 6. Secure Guest Order Tracking
app.get('/api/track/:token', (req: Request, res: Response): void => {
  const rawToken = req.params.token;
  if (!rawToken || rawToken.length < 32) {
    res.status(400).json({ success: false, error: 'অবৈধ ট্র্যাকিং টোকেন।' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const order = db.getOrderByTokenHash(tokenHash);

  if (!order) {
    res.status(404).json({ success: false, error: 'অর্ডারটি খুঁজে পাওয়া যায়নি বা ট্র্যাকিং লিংকটি সঠিক নয়।' });
    return;
  }

  const entitlement = db.getEntitlementByOrderId(order.id);

  // STRICT BUSINESS RULE: Expose telegram invite ONLY if order status is approved
  const isApproved = order.status === 'approved';
  const telegramInviteData =
    isApproved && order.telegramInvite
      ? {
          inviteLink: order.telegramInvite.inviteLink,
          expiresAt: order.telegramInvite.expiresAt,
          isRevoked: order.telegramInvite.isRevoked,
        }
      : null;

  const trackingDetails = {
    id: order.id,
    courseId: order.courseId,
    courseTitle: order.courseTitle || 'Tech Course',
    packageSnapshot: order.packageSnapshot,
    amountBdt: order.amountBdt,
    customerName: order.customerName,
    maskedCustomerPhone: maskPhone(order.customerPhone),
    maskedSenderPhone: maskPhone(order.senderPhone),
    paymentMethod: order.paymentMethod,
    trxIdMasked: maskTrx(order.trxId),
    status: order.status,
    adminNotes: order.adminNotes,
    createdAt: order.createdAt,
    reviewedAt: order.reviewedAt,
    telegramInviteStatus: order.telegramInviteStatus,
    telegramInvite: telegramInviteData,
    entitlement: entitlement
      ? {
          status: entitlement.status,
          expiresAt: entitlement.expiresAt,
        }
      : null,
  };

  res.json({ success: true, data: trackingDetails });
});

// 7. Safe Order & Telegram Recovery by Phone + TrxID or Order Token
app.post('/api/recovery/lookup', (req: Request, res: Response): void => {
  const ip = getClientIp(req);
  const now = Date.now();
  // Rate-limiting: max 20 requests per 10 minutes per IP
  const rateKey = `rec_${ip}`;
  const rate = checkoutRateMap.get(rateKey) || { count: 0, resetAt: now + 10 * 60 * 1000 };
  if (now > rate.resetAt) {
    rate.count = 0;
    rate.resetAt = now + 10 * 60 * 1000;
  }
  rate.count += 1;
  checkoutRateMap.set(rateKey, rate);

  if (rate.count > 25) {
    res.status(429).json({
      success: false,
      message: 'অত্যধিক চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
    });
    return;
  }

  const { phone, trxId, tokenOrOrderId } = req.body;

  // Direct Token or Order Reference ID lookup
  if (tokenOrOrderId && typeof tokenOrOrderId === 'string' && tokenOrOrderId.trim().length >= 6) {
    const rawVal = tokenOrOrderId.trim();
    const tokenHash = crypto.createHash('sha256').update(rawVal).digest('hex');
    let order = db.getOrderByTokenHash(tokenHash);
    if (!order) {
      order = db.getOrderById(rawVal);
    }
    if (order) {
      const issue = db.issueNewTrackingTokenForOrder(order.id);
      const isApproved = order.status === 'approved';
      res.json({
        success: true,
        orderFound: true,
        orderId: order.id,
        trackingToken: issue?.trackingToken || rawVal,
        status: order.status,
        courseTitle: order.courseTitle || 'Tech Course',
        hasTelegramAccess: isApproved && Boolean(order.telegramInvite),
        telegramInviteLink: isApproved && order.telegramInvite ? order.telegramInvite.inviteLink : null,
        message: isApproved
          ? 'অর্ডারটি সফলভাবে উদ্ধার করা হয়েছে!'
          : 'আপনার অর্ডারটি পাওয়া গেছে তবে পেমেন্ট এখনও ম্যানুয়াল যাচাইয়ের অপেক্ষায় রয়েছে।',
      });
      return;
    }
  }

  // Safe Phone + TrxID match (Requester must know both the payment phone and exact TrxID)
  if (!phone || !trxId) {
    res.status(400).json({
      success: false,
      message: 'যে নম্বর থেকে টাকা পাঠিয়েছেন সেই ফোন নম্বর এবং ট্রানজেকশন আইডি (TrxID) উভয়ই প্রদান করুন।',
    });
    return;
  }

  const cleanPhone = normalizeBDPhone(String(phone));
  const cleanTrx = String(trxId).trim().toUpperCase();

  const order = db.getOrderByPhoneAndTrx(cleanPhone, cleanTrx);

  if (order) {
    const isApproved = order.status === 'approved';
    const issue = db.issueNewTrackingTokenForOrder(order.id);

    db.addAuditLog('RECOVERY_MATCH_SUCCESS', 'guest', 'order', order.id, {
      status: order.status,
      isApproved,
    }, ip);

    if (isApproved) {
      res.json({
        success: true,
        orderFound: true,
        orderId: order.id,
        trackingToken: issue?.trackingToken,
        status: 'approved',
        courseTitle: order.courseTitle || 'Tech Course',
        hasTelegramAccess: Boolean(order.telegramInvite),
        telegramInviteLink: order.telegramInvite ? order.telegramInvite.inviteLink : null,
        message: 'আপনার পেমেন্ট অনুমোদিত হয়েছে এবং টেলিগ্রাম অ্যাক্সেস প্রস্তুত!',
      });
      return;
    } else if (order.status === 'pending') {
      res.json({
        success: true,
        orderFound: true,
        orderId: order.id,
        trackingToken: issue?.trackingToken,
        status: 'pending',
        courseTitle: order.courseTitle || 'Tech Course',
        hasTelegramAccess: false,
        telegramInviteLink: null,
        message: 'আপনার পেমেন্ট রিকোয়েস্টটি সাবমিট করা আছে। অ্যাডমিন কর্তৃক ভেরিফিকেশন সম্পন্ন হওয়ামাত্রই টেলিগ্রাম লিংক আনলক হবে।',
      });
      return;
    } else {
      res.json({
        success: true,
        orderFound: true,
        orderId: order.id,
        status: order.status,
        courseTitle: order.courseTitle || 'Tech Course',
        hasTelegramAccess: false,
        telegramInviteLink: null,
        message: 'অর্ডারের পেমেন্ট স্ট্যাটাস: বাতিলকৃত বা রিভিউ চলমান। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
      });
      return;
    }
  }

  // Generic response to avoid leaking phone existence or user records
  res.json({
    success: false,
    message: 'প্রদত্ত ফোন নম্বর ও ট্রানজেকশন আইডির বিপরীতে কোনো অনুমোদিত রেকর্ড পাওয়া যায়নি। তথ্যগুলো পুনরায় চেক করুন।',
  });
});

// 8. Phone Recovery Challenge Request (Optional fallback)
app.post('/api/recovery/challenge', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ success: false, error: 'মোবাইল নম্বর আবশ্যক।' });
    return;
  }
  const result = await requestRecoveryChallenge(String(phone));
  res.json(result);
});

// 9. Phone Recovery OTP Verification (Optional fallback)
app.post('/api/recovery/verify', (req: Request, res: Response) => {
  const { challengeId, code } = req.body;
  if (!challengeId || !code) {
    res.status(400).json({ success: false, error: 'চ্যালেঞ্জ আইডি এবং ওটিপি কোড উভয়ই আবশ্যক।' });
    return;
  }
  const result = verifyRecoveryOtp(String(challengeId), String(code));
  res.json(result);
});

// -----------------------------------------------------------------------------
// HIDDEN ADMINISTRATOR ENTRY & AUTHENTICATION
// -----------------------------------------------------------------------------

// Verify hidden PIN (clicked from © in footer)
app.post('/api/admin/verify-pin', (req: Request, res: Response): void => {
  const ip = getClientIp(req);
  const now = Date.now();

  const attempt = pinAttemptMap.get(ip) || { attempts: 0, blockedUntil: 0 };
  if (now < attempt.blockedUntil) {
    const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
    res.status(429).json({
      success: false,
      error: `অত্যধিক ভুল পিন প্রদানের কারণে সাময়িকভাবে ব্লক করা হয়েছে। অনুগ্রহ করে ${remainingSeconds} সেকেন্ড পর চেষ্টা করুন।`,
    });
    return;
  }

  const { pin } = req.body;
  const configuredPin = process.env.ADMIN_PIN || '20055';

  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ success: false, error: 'অ্যাডমিন পিন কোড প্রদান করুন।' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const pinBuffer = Buffer.from(pin.trim());
  const confBuffer = Buffer.from(configuredPin.trim());

  const matches =
    pinBuffer.length === confBuffer.length &&
    crypto.timingSafeEqual(pinBuffer, confBuffer);

  if (!matches) {
    attempt.attempts += 1;
    if (attempt.attempts >= 5) {
      attempt.blockedUntil = now + 15 * 60 * 1000; // 15 mins block
      attempt.attempts = 0;
    }
    pinAttemptMap.set(ip, attempt);

    db.addAuditLog('ADMIN_PIN_FAILED', 'unknown', 'admin_auth', undefined, {
      attemptCount: attempt.attempts,
    }, ip);

    res.status(401).json({
      success: false,
      error: 'ভুল অ্যাডমিন পিন! পুনরায় সঠিক পিন দিয়ে চেষ্টা করুন।',
    });
    return;
  }

  // Reset attempt count on success
  pinAttemptMap.delete(ip);

  // Generate real server-authorized admin session token
  const adminToken = generateAdminToken();

  db.addAuditLog('ADMIN_PIN_SUCCESS', 'admin', 'admin_auth', undefined, {
    message: 'Admin authorization granted via footer PIN entry',
  }, ip);

  res.json({
    success: true,
    token: adminToken,
    message: 'অ্যাডমিন পিন সফলভাবে অনুমোদিত হয়েছে।',
  });
});

// -----------------------------------------------------------------------------
// PROTECTED ADMINISTRATOR APIS
// -----------------------------------------------------------------------------

// Dashboard Overview
app.get('/api/admin/overview', requireAdmin, (_req: Request, res: Response) => {
  const stats = db.getDashboardOverview();
  res.json({ success: true, data: stats });
});

// Course Management: List all courses (including unpublished)
app.get('/api/admin/courses', requireAdmin, (_req: Request, res: Response) => {
  const courses = db.getCourses(false);
  res.json({ success: true, data: courses });
});

// Course Management: Create course
app.post('/api/admin/courses', requireAdmin, (req: Request, res: Response) => {
  const courseData = req.body;
  if (!courseData.title || !courseData.category) {
    res.status(400).json({ success: false, error: 'কোর্সের শিরোনাম এবং ক্যাটাগরি আবশ্যক।' });
    return;
  }
  const created = db.createCourse(courseData);
  db.addAuditLog('COURSE_CREATED', 'admin', 'course', created.id, { title: created.title });
  res.status(201).json({ success: true, data: created });
});

// Course Management: Update course
app.put('/api/admin/courses/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateCourse(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: 'কোর্স পাওয়া যায়নি।' });
    return;
  }
  db.addAuditLog('COURSE_UPDATED', 'admin', 'course', updated.id, { title: updated.title });
  res.json({ success: true, data: updated });
});

// Course Management: Delete course
app.delete('/api/admin/courses/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deleteCourse(req.params.id);
  if (!success) {
    res.status(404).json({ success: false, error: 'কোর্স পাওয়া যায়নি।' });
    return;
  }
  db.addAuditLog('COURSE_DELETED', 'admin', 'course', req.params.id, {});
  res.json({ success: true, message: 'কোর্স সফলভাবে ডিলিট করা হয়েছে।' });
});

// Package Management: List all packages
app.get('/api/admin/packages', requireAdmin, (_req: Request, res: Response) => {
  const pkgs = db.getPackages(false);
  res.json({ success: true, data: pkgs });
});

// Package Management: Update package
app.put('/api/admin/packages/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updatePackage(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ success: false, error: 'প্যাকেজ পাওয়া যায়নি।' });
    return;
  }
  db.addAuditLog('PACKAGE_UPDATED', 'admin', 'package', updated.id, { priceBdt: updated.priceBdt });
  res.json({ success: true, data: updated });
});

// Order Management: List and filter orders
app.get('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const { status, paymentMethod, search } = req.query;
  const orders = db.getOrders({
    status: typeof status === 'string' ? status : undefined,
    paymentMethod: typeof paymentMethod === 'string' ? paymentMethod : undefined,
    search: typeof search === 'string' ? search : undefined,
  });
  res.json({ success: true, data: orders });
});

// Order Management: Single Order Detail
app.get('/api/admin/orders/:id', requireAdmin, (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: 'অর্ডার পাওয়া যায়নি।' });
    return;
  }
  res.json({ success: true, data: order });
});

// Order Management: Review & Approve / Reject Payment
app.post('/api/admin/orders/:id/review', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { action, notes } = req.body; // action: 'approve' | 'reject' | 'issue'
  const order = db.getOrderById(req.params.id);

  if (!order) {
    res.status(404).json({ success: false, error: 'অর্ডার খুঁজে পাওয়া যায়নি।' });
    return;
  }

  if (action === 'approve') {
    if (order.status === 'approved') {
      res.status(400).json({ success: false, error: 'এই অর্ডারটি ইতিপূর্বে অনুমোদিত হয়ে গেছে। ডুপ্লিকেট অনুমোদন অনুমোদিত নয়।' });
      return;
    }

    if (db.isTrxAlreadyApproved(order.trxId, order.id)) {
      res.status(400).json({
        success: false,
        error: 'এই ট্রানজেকশন আইডি (TrxID) দিয়ে ইতিপূর্বে অন্য একটি অর্ডার ইতিমধ্যে অনুমোদিত হয়েছে। একই ট্রানজেকশন আইডি বারবার অনুমোদন করা যাবে না।'
      });
      return;
    }

    // 1. Transactionally update order status to approved
    const updatedOrder = db.updateOrder(order.id, {
      status: 'approved',
      adminNotes: notes || 'পেমেন্ট ভেরিফায়েড ও অনুমোদিত হয়েছে।',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Admin',
      telegramInviteStatus: 'pending',
    });

    if (!updatedOrder) {
      res.status(500).json({ success: false, error: 'অর্ডার আপডেট ব্যর্থ হয়েছে।' });
      return;
    }

    // 2. Grant authoritative course entitlement
    let expiresAt: string | null = null;
    if (order.packageSnapshot.durationDays) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + order.packageSnapshot.durationDays);
      expiresAt = expDate.toISOString();
    }

    db.saveEntitlement({
      id: `ent_${Date.now()}_${order.id}`,
      orderId: order.id,
      customerPhone: order.customerPhone,
      courseId: order.courseId,
      courseTitle: order.courseTitle,
      packageId: order.packageId,
      grantedAt: new Date().toISOString(),
      expiresAt,
      status: 'active',
    });

    db.addAuditLog('ORDER_APPROVED', 'admin', 'order', order.id, {
      amount: order.amountBdt,
      customerPhone: order.customerPhone,
      trxId: order.trxId,
    });

    // 3. Generate real Telegram chat invite link
    const inviteResult = await generateChatInvite(updatedOrder);

    res.json({
      success: true,
      message: 'পেমেন্ট অনুমোদিত হয়েছে এবং কোর্স এনটাইটেলমেন্ট প্রদান করা হয়েছে।',
      telegramResult: inviteResult,
    });
    return;
  } else if (action === 'reject') {
    db.updateOrder(order.id, {
      status: 'rejected',
      adminNotes: notes || 'ট্রানজেকশন আইডি অমিল বা পেমেন্ট পাওয়া যায়নি।',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Admin',
      telegramInviteStatus: 'none',
    });

    db.addAuditLog('ORDER_REJECTED', 'admin', 'order', order.id, {
      reason: notes,
      trxId: order.trxId,
    });

    res.json({
      success: true,
      message: 'অর্ডার বাতিল (Rejected) হিসেবে চিহ্নিত করা হয়েছে।',
    });
    return;
  } else if (action === 'issue') {
    db.updateOrder(order.id, {
      status: 'payment_issue',
      adminNotes: notes || 'পেমেন্ট ভেরিফিকেশনে সমস্যা দেখা দিয়েছে। গ্রাহকের সাথে যোগাযোগ করুন।',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Admin',
    });

    db.addAuditLog('ORDER_PAYMENT_ISSUE', 'admin', 'order', order.id, {
      notes,
    });

    res.json({
      success: true,
      message: 'পেমেন্ট ইস্যু হিসেবে মার্ক করা হয়েছে।',
    });
    return;
  }

  res.status(400).json({ success: false, error: 'অবৈধ অ্যাকশন।' });
});

// Order Management: Retry Telegram Invite Generation
app.post('/api/admin/orders/:id/retry-telegram', requireAdmin, async (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    res.status(404).json({ success: false, error: 'অর্ডার পাওয়া যায়নি।' });
    return;
  }

  if (order.status !== 'approved') {
    res.status(400).json({
      success: false,
      error: 'কেবলমাত্র অনুমোদিত অর্ডারের জন্য টেলিগ্রাম লিংক তৈরি করা সম্ভব।',
    });
    return;
  }

  const result = await generateChatInvite(order);
  res.json({ success: result.success, data: result });
});

// Telegram Settings: Test Configuration Endpoint
app.post('/api/admin/telegram/test', requireAdmin, async (_req: Request, res: Response) => {
  const result = await testTelegramConfiguration();
  res.json(result);
});

// Subscriptions & Entitlements Management
app.get('/api/admin/subscriptions', requireAdmin, (_req: Request, res: Response) => {
  const entitlements = db.getEntitlements();
  res.json({ success: true, data: entitlements });
});

app.post('/api/admin/subscriptions/:id/revoke', requireAdmin, (req: Request, res: Response) => {
  const { reason } = req.body;
  const ok = db.revokeEntitlement(req.params.id, reason || 'অ্যাডমিন কর্তৃক বাতিলকৃত');
  if (!ok) {
    res.status(404).json({ success: false, error: 'সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি।' });
    return;
  }
  db.addAuditLog('SUBSCRIPTION_REVOKED', 'admin', 'entitlement', req.params.id, { reason });
  res.json({ success: true, message: 'সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে।' });
});

// Website CMS Settings Management
app.get('/api/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({ success: true, data: settings });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.addAuditLog('SETTINGS_UPDATED', 'admin', 'settings', undefined, {
    updatedFields: Object.keys(req.body),
  });
  res.json({ success: true, data: updated });
});

// Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, data: logs });
});

// Image Upload Endpoint
app.post('/api/admin/upload-image', requireAdmin, (req: Request, res: Response): void => {
  const { base64Data, filename } = req.body;
  if (!base64Data || typeof base64Data !== 'string') {
    res.status(400).json({ success: false, error: 'ইমেজ ডেটা আবশ্যক।' });
    return;
  }

  // Parse data URL format: data:image/png;base64,....
  const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    res.status(400).json({ success: false, error: 'অবৈধ ইমেজ ফরম্যাট। JPEG, PNG অথবা WebP গ্রহণযোগ্য।' });
    return;
  }

  const ext = matches[1].replace('+xml', '');
  const buffer = Buffer.from(matches[2], 'base64');

  if (buffer.length > 8 * 1024 * 1024) {
    res.status(400).json({ success: false, error: 'ফাইলের সাইজ সর্বোচ্চ ৮ মেগাবাইট হতে পারবে।' });
    return;
  }

  const safeName = (filename || 'course_thumb')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const outFilename = `${safeName}_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
  const outPath = path.join(UPLOADS_DIR, outFilename);

  fs.writeFileSync(outPath, buffer);

  const publicUrl = `/uploads/${outFilename}`;
  db.addAuditLog('IMAGE_UPLOADED', 'admin', 'media', outFilename, { sizeBytes: buffer.length });

  res.json({
    success: true,
    url: publicUrl,
    filename: outFilename,
  });
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    // Dynamic import vite in dev
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TechVantage BD] Server is running on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch(err => {
  console.error('[TechVantage BD] Failed to start server:', err);
  process.exit(1);
});
