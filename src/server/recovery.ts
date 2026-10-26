import crypto from 'crypto';
import { db } from './db';

interface ChallengeSession {
  phone: string;
  codeHash: string;
  attempts: number;
  expiresAt: number;
  verified: boolean;
}

const activeChallenges = new Map<string, ChallengeSession>();

// Cleanup expired challenges every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeChallenges.entries()) {
    if (session.expiresAt < now) {
      activeChallenges.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

export function normalizeBDPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  }
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

export async function requestRecoveryChallenge(rawPhone: string) {
  const phone = normalizeBDPhone(rawPhone);
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    return {
      success: false,
      error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।',
    };
  }

  // Find orders for this phone
  const existingOrders = db.getOrdersByCustomerPhone(phone);
  if (existingOrders.length === 0) {
    return {
      success: false,
      error: 'এই মোবাইল নম্বরের বিপরীতে কোনো সক্রিয় অর্ডার খুঁজে পাওয়া যায়নি।',
    };
  }

  const isOtpConfigured = Boolean(
    process.env.OTP_API_KEY &&
      process.env.OTP_PROVIDER &&
      process.env.OTP_PROVIDER !== 'none'
  );

  if (!isOtpConfigured) {
    return {
      success: false,
      requiresOtpProvider: true,
      orderCount: existingOrders.length,
      message:
        'এসএমএস ওটিপি গেটওয়ে এখনও সিস্টেমে সক্রিয় করা হয়নি। ফোন ওনারশিপ যাচাই ছাড়া গোপনীয় অর্ডার উন্মোচন করা নিরাপদ নয়। অনুগ্রহ করে অ্যাডমিনের সাথে সরাসরি যোগাযোগ করুন অথবা আপনার চেকআউটকালীন অর্ডার ট্র্যাকিং লিংক ব্যবহার করুন।',
      setupGuide: {
        supportedGateways: ['MIM SMS (mimsms.com)', 'Greenweb BD', 'Twilio'],
        envVarsNeeded: ['OTP_PROVIDER=mimsms', 'OTP_API_KEY=your_key', 'OTP_SENDER_ID=TechVantage'],
      },
    };
  }

  // Generate 6-digit numeric OTP
  const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
  const challengeId = `ch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  activeChallenges.set(challengeId, {
    phone,
    codeHash,
    attempts: 0,
    expiresAt,
    verified: false,
  });

  // Attempt real SMS dispatch via configured provider
  try {
    const provider = process.env.OTP_PROVIDER;
    const apiKey = process.env.OTP_API_KEY;
    const senderId = process.env.OTP_SENDER_ID || 'TechVantage';
    const smsText = `আপনার TechVantage BD অর্ডার রিকভারি ওটিপি কোড: ${rawCode}। মেয়াদ ৫ মিনিট।`;

    if (provider === 'mimsms') {
      await fetch(
        `https://api.mimsms.com/api/sendsms?apikey=${apiKey}&senderid=${senderId}&mobileno=${phone}&msg=${encodeURIComponent(smsText)}`
      );
    }
  } catch (err) {
    console.error('[OTP Dispatch Error]:', err);
  }

  db.addAuditLog('RECOVERY_CHALLENGE_REQUESTED', 'guest', 'phone', phone, {
    challengeId,
    orderCount: existingOrders.length,
  });

  return {
    success: true,
    challengeId,
    orderCount: existingOrders.length,
    message: `${phone} নম্বরে ৬-সংখ্যার যাচাইকরণ কোড পাঠানো হয়েছে।`,
  };
}

export function verifyRecoveryOtp(challengeId: string, inputCode: string) {
  const session = activeChallenges.get(challengeId);
  if (!session) {
    return { success: false, error: 'যাচাইকরণ সেশনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' };
  }

  if (Date.now() > session.expiresAt) {
    activeChallenges.delete(challengeId);
    return { success: false, error: 'ওটিপি কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে।' };
  }

  if (session.attempts >= 4) {
    activeChallenges.delete(challengeId);
    return { success: false, error: 'সর্বোচ্চ প্রচেষ্টার সীমা অতিক্রান্ত। অনুগ্রহ করে নতুন করে কোড রিকোয়েস্ট করুন।' };
  }

  session.attempts += 1;
  const inputHash = crypto.createHash('sha256').update(inputCode.trim()).digest('hex');

  if (inputHash !== session.codeHash) {
    return { success: false, error: 'ভুল ওটিপি কোড। পুনরায় পরীক্ষা করে লিখুন।' };
  }

  // Verified!
  session.verified = true;
  const orders = db.getOrdersByCustomerPhone(session.phone);

  db.addAuditLog('RECOVERY_CHALLENGE_SUCCESS', 'guest', 'phone', session.phone, {
    challengeId,
    recoveredOrdersCount: orders.length,
  });

  // Issue temporary access details
  const recoveredList = orders.map(o => ({
    id: o.id,
    courseTitle: o.courseTitle || 'Tech Course',
    packageSnapshot: o.packageSnapshot,
    status: o.status,
    createdAt: o.createdAt,
    hasTelegramAccess: o.status === 'approved' && Boolean(o.telegramInvite),
    telegramInviteLink: o.status === 'approved' && o.telegramInvite ? o.telegramInvite.inviteLink : null,
  }));

  activeChallenges.delete(challengeId);

  return {
    success: true,
    phone: session.phone,
    orders: recoveredList,
  };
}
