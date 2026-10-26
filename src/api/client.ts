import {
  Course,
  Package,
  SiteSettings,
  TrackingDetails,
  PaymentMethod,
  Order,
  Entitlement,
  AuditLog,
} from '../types';

let adminAuthToken: string | null = localStorage.getItem('tvb_admin_token');

export function setAdminToken(token: string | null) {
  adminAuthToken = token;
  if (token) {
    localStorage.setItem('tvb_admin_token', token);
  } else {
    localStorage.removeItem('tvb_admin_token');
  }
}

export function getAdminToken(): string | null {
  return adminAuthToken;
}

function getHeaders(includeAuth: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (includeAuth && adminAuthToken) {
    headers['Authorization'] = `Bearer ${adminAuthToken}`;
  }
  return headers;
}

// ---------------- Public APIs ----------------
export async function getPublicSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/public/settings');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed loading settings');
  return data.data;
}

export async function getPublicCourses(): Promise<Course[]> {
  const res = await fetch('/api/public/courses');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed loading courses');
  return data.data;
}

export async function getPublicCourseById(id: string): Promise<Course> {
  const res = await fetch(`/api/public/courses/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Course not found');
  return data.data;
}

export async function getPublicPackages(): Promise<Package[]> {
  const res = await fetch('/api/public/packages');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed loading packages');
  return data.data;
}

export async function submitCheckout(payload: {
  courseId: string;
  packageId: string;
  senderPhone: string;
  trxId: string;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
}): Promise<{ orderId: string; trackingToken: string; orderUrl: string; message: string }> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'পেমেন্ট রিকোয়েস্ট সাবমিশনে ত্রুটি হয়েছে');
  return data;
}

export async function getTrackingDetails(token: string): Promise<TrackingDetails> {
  const res = await fetch(`/api/track/${token}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Order tracking failed');
  return data.data;
}

export async function lookupOrderRecovery(payload: {
  phone?: string;
  trxId?: string;
  tokenOrOrderId?: string;
}): Promise<{
  success: boolean;
  orderFound?: boolean;
  orderId?: string;
  trackingToken?: string;
  status?: string;
  courseTitle?: string;
  hasTelegramAccess?: boolean;
  telegramInviteLink?: string | null;
  message: string;
}> {
  const res = await fetch('/api/recovery/lookup', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  });
  return await res.json();
}

export async function requestPhoneRecovery(phone: string) {
  const res = await fetch('/api/recovery/challenge', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ phone }),
  });
  return await res.json();
}

export async function verifyPhoneRecoveryOtp(challengeId: string, code: string) {
  const res = await fetch('/api/recovery/verify', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ challengeId, code }),
  });
  return await res.json();
}

// ---------------- Admin APIs ----------------
export async function verifyAdminPin(pin: string): Promise<{ token: string; message: string }> {
  const res = await fetch('/api/admin/verify-pin', {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'PIN verification failed');
  setAdminToken(data.token);
  return data;
}

export async function getAdminOverview() {
  const res = await fetch('/api/admin/overview', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Unauthorized');
  return data.data;
}

export async function getAdminOrders(params?: { status?: string; paymentMethod?: string; search?: string }): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/admin/orders?${query.toString()}`, { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function reviewAdminOrder(orderId: string, action: 'approve' | 'reject' | 'issue', notes: string) {
  const res = await fetch(`/api/admin/orders/${orderId}/review`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ action, notes }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export async function retryTelegramInvite(orderId: string) {
  const res = await fetch(`/api/admin/orders/${orderId}/retry-telegram`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed retrying Telegram invitation');
  return data;
}

export async function getAdminCourses(): Promise<Course[]> {
  const res = await fetch('/api/admin/courses', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createAdminCourse(course: Partial<Course>): Promise<Course> {
  const res = await fetch('/api/admin/courses', {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(course),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateAdminCourse(id: string, updates: Partial<Course>): Promise<Course> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteAdminCourse(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/courses/${id}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return true;
}

export async function getAdminPackages(): Promise<Package[]> {
  const res = await fetch('/api/admin/packages', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateAdminPackage(id: string, updates: Partial<Package>): Promise<Package> {
  const res = await fetch(`/api/admin/packages/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function getAdminSubscriptions(): Promise<Entitlement[]> {
  const res = await fetch('/api/admin/subscriptions', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function revokeAdminSubscription(id: string, reason: string): Promise<boolean> {
  const res = await fetch(`/api/admin/subscriptions/${id}/revoke`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return true;
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateAdminSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function getAdminAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function uploadAdminImage(base64Data: string, filename: string): Promise<string> {
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ base64Data, filename }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.url;
}

export async function testTelegramSettings(): Promise<{
  success: boolean;
  message: string;
  botStatus?: { ok: boolean; username?: string; error?: string };
  adminLinkStatus?: { valid: boolean; enabled: boolean; url: string };
}> {
  const res = await fetch('/api/admin/telegram/test', {
    method: 'POST',
    headers: getHeaders(true),
  });
  return await res.json();
}
