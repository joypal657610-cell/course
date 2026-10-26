import { db } from './db';
import { Order, TelegramInvite } from '../types';

export interface TelegramInviteResult {
  success: boolean;
  inviteLink?: string;
  expiresAt?: string;
  isStaticAdminLink?: boolean;
  error?: string;
}

/**
 * Generates or assigns a Telegram join invite according to Admin-configured settings.
 * Strict Rule: Must only be invoked AFTER explicit administrator approval.
 */
export async function generateChatInvite(order: Order): Promise<TelegramInviteResult> {
  const settings = db.getSettings();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || settings.telegramChatId;
  const mode = settings.telegramMode || 'both';

  // 1. If Admin configured dedicated Telegram Join URL mode
  if (mode === 'admin_link') {
    if (!settings.isTelegramLinkEnabled) {
      const err = 'টেলিগ্রাম জয়েন লিংক বর্তমানে অ্যাডমিন কর্তৃক নিষ্ক্রিয় (Disabled) করা রয়েছে।';
      db.addAuditLog('TELEGRAM_INVITE_DISABLED', 'system', 'order', order.id, { reason: err });
      return { success: false, error: err };
    }

    if (!settings.telegramChannelUrl || !settings.telegramChannelUrl.trim().startsWith('http')) {
      const err = 'অ্যাডমিন প্যানেলে সঠিক টেলিগ্রাম চ্যানেল বা গ্রুপ লিংক কনফিগার করা নেই।';
      db.addAuditLog('TELEGRAM_INVITE_NO_URL', 'system', 'order', order.id, { reason: err });
      return { success: false, error: err };
    }

    const inviteRecord: TelegramInvite = {
      id: `tg_admin_${Date.now()}_${order.id}`,
      orderId: order.id,
      chatId: 'admin_managed_channel',
      inviteLink: settings.telegramChannelUrl.trim(),
      memberLimit: 0,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isRevoked: false,
      isStaticAdminLink: true,
    };

    db.saveTelegramInvite(inviteRecord);
    db.updateOrder(order.id, { telegramInviteStatus: 'created' });
    db.addAuditLog('TELEGRAM_INVITE_ADMIN_URL_ATTACHED', 'system', 'order', order.id, {
      url: settings.telegramChannelUrl.trim(),
    });

    return {
      success: true,
      inviteLink: settings.telegramChannelUrl.trim(),
      isStaticAdminLink: true,
    };
  }

  // 2. Bot API Generated Single-Use Invite Mode (or 'both' with Bot API first)
  if (botToken && chatId) {
    try {
      const expiryHours = settings.telegramInviteExpiryHours || 48;
      const expireDateUnix = Math.floor(Date.now() / 1000) + expiryHours * 3600;
      const expiresAtIso = new Date(expireDateUnix * 1000).toISOString();

      const url = `https://api.telegram.org/bot${botToken}/createChatInviteLink`;
      const payload = {
        chat_id: chatId,
        name: `TechVantage-${order.id}`,
        expire_date: expireDateUnix,
        member_limit: 1, // Single-use secure invite
        creates_join_request: false,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok: boolean;
        result?: { invite_link: string; expire_date?: number };
        description?: string;
        error_code?: number;
      };

      if (data.ok && data.result?.invite_link) {
        const inviteRecord: TelegramInvite = {
          id: `tg_${Date.now()}_${order.id}`,
          orderId: order.id,
          chatId: String(chatId),
          inviteLink: data.result.invite_link,
          memberLimit: 1,
          expiresAt: expiresAtIso,
          createdAt: new Date().toISOString(),
          isRevoked: false,
          isStaticAdminLink: false,
        };

        db.saveTelegramInvite(inviteRecord);
        db.updateOrder(order.id, { telegramInviteStatus: 'created' });
        db.addAuditLog('TELEGRAM_INVITE_BOT_CREATED', 'system', 'order', order.id, {
          inviteLink: data.result.invite_link,
          memberLimit: 1,
        });

        return {
          success: true,
          inviteLink: data.result.invite_link,
          expiresAt: expiresAtIso,
          isStaticAdminLink: false,
        };
      }
    } catch (botErr) {
      console.error('[Telegram Bot API Error]:', botErr);
    }
  }

  // 3. Fallback: If Bot API fails or unconfigured, check if Admin configured a static link
  if (
    settings.isTelegramLinkEnabled &&
    settings.telegramChannelUrl &&
    settings.telegramChannelUrl.trim().startsWith('http')
  ) {
    const inviteRecord: TelegramInvite = {
      id: `tg_fallback_${Date.now()}_${order.id}`,
      orderId: order.id,
      chatId: 'admin_fallback_channel',
      inviteLink: settings.telegramChannelUrl.trim(),
      memberLimit: 0,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isRevoked: false,
      isStaticAdminLink: true,
    };

    db.saveTelegramInvite(inviteRecord);
    db.updateOrder(order.id, { telegramInviteStatus: 'created' });
    db.addAuditLog('TELEGRAM_INVITE_FALLBACK_ATTACHED', 'system', 'order', order.id, {
      url: settings.telegramChannelUrl.trim(),
    });

    return {
      success: true,
      inviteLink: settings.telegramChannelUrl.trim(),
      isStaticAdminLink: true,
    };
  }

  // No active method available
  const err =
    'টেলিগ্রাম লিংক জেনারেট করা সম্ভব হয়নি। অনুগ্রহ করে অ্যাডমিন প্যানেলের "টেলিগ্রাম সেটিংস" থেকে একটি ইনভাইট লিংক দিন অথবা বটের টোকেন যুক্ত করুন।';
  db.addAuditLog('TELEGRAM_INVITE_FAILED', 'system', 'order', order.id, { reason: err });

  return {
    success: false,
    error: err,
  };
}

/**
 * Tests Telegram Configuration without exposing secret bot tokens.
 */
export async function testTelegramConfiguration(): Promise<{
  success: boolean;
  message: string;
  botStatus?: { ok: boolean; username?: string; error?: string };
  adminLinkStatus?: { valid: boolean; enabled: boolean; url: string };
}> {
  const settings = db.getSettings();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let botOk = false;
  let botUsername: string | undefined;
  let botError: string | undefined;

  // 1. Test Bot API token if provided
  if (botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json() as { ok: boolean; result?: { username?: string }; description?: string };
      if (data.ok && data.result?.username) {
        botOk = true;
        botUsername = data.result.username;
      } else {
        botError = data.description || 'বট টোকেন সঠিক নয় বা কাজ করছে না।';
      }
    } catch (e: unknown) {
      botError = e instanceof Error ? e.message : 'বট সার্ভারে সংযোগ পাওয়া যায়নি।';
    }
  }

  // 2. Test Admin Link
  const hasUrl = Boolean(settings.telegramChannelUrl && settings.telegramChannelUrl.trim().length > 5);
  const isValidUrl = hasUrl && /^https?:\/\/(t\.me|telegram\.me)\/.+/i.test(settings.telegramChannelUrl.trim());
  const isEnabled = Boolean(settings.isTelegramLinkEnabled);

  const overallSuccess = (botOk && Boolean(settings.telegramChatId)) || (isValidUrl && isEnabled);

  let message = '';
  if (overallSuccess) {
    message = 'টেলিগ্রাম কনফিগারেশন সক্রিয় এবং প্রস্তুত!';
  } else if (!hasUrl && !botToken) {
    message = 'কোনো টেলিগ্রাম লিংক বা বট টোকেন কনফিগার করা নেই। অনুগ্রহ করে একটি ইনভাইট লিংক দিন।';
  } else if (hasUrl && !isValidUrl) {
    message = 'অ্যাডমিন টেলিগ্রাম লিংকটি সঠিক নয় (https://t.me/... ফরম্যাট হতে হবে)।';
  } else if (hasUrl && !isEnabled) {
    message = 'অ্যাডমিন টেলিগ্রাম লিংকটি সেভ করা আছে কিন্তু বর্তমানে "নিষ্ক্রিয়" (Disabled) করা।';
  } else {
    message = botError || 'টেলিগ্রাম কনফিগারেশন যাচাই করা যায়নি।';
  }

  return {
    success: overallSuccess,
    message,
    botStatus: botToken
      ? { ok: botOk, username: botUsername, error: botError }
      : undefined,
    adminLinkStatus: {
      valid: isValidUrl,
      enabled: isEnabled,
      url: settings.telegramChannelUrl || '',
    },
  };
}
