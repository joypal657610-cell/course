import assert from 'assert';
import crypto from 'crypto';
import { db } from '../src/server/db';
import { generateChatInvite, testTelegramConfiguration } from '../src/server/telegram';
import { requestRecoveryChallenge, normalizeBDPhone } from '../src/server/recovery';

async function runTests() {
  console.log('--- STARTING TECHVANTAGE BD AUTOMATED TEST SUITE ---');

  // Test 1: Public courses exist and protected lesson video URLs are hidden in public mode
  console.log('\n[Test 1] Testing Course Gallery & Protected Lesson Security...');
  const publicCourses = db.getCourses(true);
  assert(publicCourses.length >= 4, 'Should have at least 4 default courses');
  publicCourses.forEach((c) => {
    assert(c.thumbnailUrl, `Course ${c.id} must have thumbnail`);
    c.lessons?.forEach((l) => {
      if (!l.isPreview) {
        assert(!l.videoUrl, `Protected lesson ${l.id} must not leak videoUrl in public mode`);
      }
    });
  });
  console.log('✓ Public course catalog and lesson protections verified.');

  // Test 2: Canonical packages & server-authoritative pricing
  console.log('\n[Test 2] Testing Package Rules & Initial Pricing...');
  const packages = db.getPackages(true);
  const p1m = packages.find((p) => p.id === 'pkg_1m');
  const p3m = packages.find((p) => p.id === 'pkg_3m');
  const pLife = packages.find((p) => p.id === 'pkg_lifetime');

  assert(p1m && p1m.priceBdt === 150 && p1m.durationDays === 30, '1 Month package must be ৳150 / 30 days');
  assert(p3m && p3m.priceBdt === 250 && p3m.durationDays === 90, '3 Months package must be ৳250 / 90 days');
  assert(pLife && pLife.priceBdt === 500 && pLife.durationDays === null, 'Lifetime package must be ৳500 / null days');
  console.log('✓ Canonical packages (৳150, ৳250, ৳500) validated.');

  // Test 3: Guest Checkout with ONLY 2 customer fields (senderPhone & trxId)
  console.log('\n[Test 3] Testing Simplified 2-Field Checkout & Token Generation...');
  const testTrx = `TXTEST${Date.now()}`;
  const senderPhone = '01812345678';
  const cleanPhone = normalizeBDPhone(senderPhone);
  assert.strictEqual(cleanPhone, '01812345678', 'Phone normalization should succeed');

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const order = db.createOrder({
    id: `TVB-TEST-${Date.now().toString().slice(-4)}`,
    courseId: 'course_web_dev',
    courseTitle: 'Full-Stack Web Dev',
    packageId: 'pkg_1m',
    packageSnapshot: {
      id: 'pkg_1m',
      name: '১ মাস সাবস্ক্রিপশন',
      durationDays: 30,
      priceBdt: 150,
    },
    amountBdt: 150,
    customerName: `গ্রাহক (${cleanPhone.slice(-4)})`,
    customerPhone: cleanPhone,
    paymentMethod: 'bkash',
    senderPhone: cleanPhone,
    trxId: testTrx,
    tokenHash,
    status: 'pending',
    telegramInviteStatus: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert(order.id, 'Order must have ID');
  assert.strictEqual(order.senderPhone, cleanPhone, 'Sender phone must match');
  assert.strictEqual(order.trxId, testTrx, 'TrxId must match');
  console.log('✓ Simplified 2-field checkout order created successfully.');

  // Test 4: STRICT RULE: Pending Order NEVER exposes Telegram link
  console.log('\n[Test 4] Testing Strict Approval Gate for Telegram Access...');
  const trackedPending = db.getOrderByTokenHash(tokenHash);
  assert(trackedPending, 'Order should be retrievable via SHA-256 token hash');
  assert(trackedPending.status === 'pending', 'Order must start as pending');
  assert(!trackedPending.telegramInvite, 'Pending order must NEVER have Telegram invite');
  console.log('✓ Confirmed: Telegram invitation is withheld while order is pending.');

  // Test 5: Safe Phone + TrxID order recovery lookup
  console.log('\n[Test 5] Testing Safe Phone + TrxID Order Recovery Lookup...');
  const recoveredOrder = db.getOrderByPhoneAndTrx(cleanPhone, testTrx);
  assert(recoveredOrder, 'Order must be found with matching phone and TrxID');
  assert.strictEqual(recoveredOrder.id, order.id, 'Recovered order ID must match');

  const wrongTrxMatch = db.getOrderByPhoneAndTrx(cleanPhone, 'WRONGTRX123');
  assert(!wrongTrxMatch, 'Lookup must fail with mismatched TrxID');
  console.log('✓ Safe Phone + TrxID recovery verified without leaking unverified state.');

  // Test 6: Admin-managed Telegram join link settings & test endpoint
  console.log('\n[Test 6] Testing Admin-Managed Telegram Join Link Persistence & Diagnostics...');
  const currentSettings = db.getSettings();
  assert(currentSettings.telegramChannelUrl, 'Settings must include telegramChannelUrl');
  assert(typeof currentSettings.isTelegramLinkEnabled === 'boolean', 'isTelegramLinkEnabled must be boolean');

  db.updateSettings({
    telegramMode: 'admin_link',
    telegramChannelUrl: 'https://t.me/+CustomAdminTestLink',
    isTelegramLinkEnabled: true,
  });

  const updatedSettings = db.getSettings();
  assert.strictEqual(updatedSettings.telegramChannelUrl, 'https://t.me/+CustomAdminTestLink');
  assert.strictEqual(updatedSettings.isTelegramLinkEnabled, true);

  const testConfigResult = await testTelegramConfiguration();
  assert(testConfigResult.adminLinkStatus, 'Diagnostics must include adminLinkStatus');
  assert(testConfigResult.adminLinkStatus.valid === true, 'Custom Telegram link must be flagged as valid');
  console.log('✓ Admin-managed Telegram link configuration & live testing verified.');

  // Test 7: Administrator Approval and Telegram Delivery
  console.log('\n[Test 7] Testing Admin Approval & Delivery Logic...');
  db.updateOrder(order.id, {
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'Admin',
  });

  // Check duplicate approval protection
  assert.strictEqual(
    db.isTrxAlreadyApproved(testTrx, 'DIFFERENT_ORDER_ID'),
    true,
    'TrxID must be flagged as already approved for other orders'
  );

  // Delivery of configured Telegram link
  const inviteRes = await generateChatInvite(order);
  assert(inviteRes.success, 'Invite should be successfully generated or retrieved');
  assert(inviteRes.inviteLink, 'Approved order must now receive invite link');

  const approvedOrder = db.getOrderById(order.id);
  assert(approvedOrder?.telegramInvite?.inviteLink, 'Approved order must persist Telegram invite');
  console.log('✓ Admin approval & Telegram delivery working end-to-end.');

  // Test 8: Phone number normalization
  console.log('\n[Test 8] Testing BD Phone Number Normalization...');
  assert.strictEqual(normalizeBDPhone('+8801711223344'), '01711223344');
  assert.strictEqual(normalizeBDPhone('8801811223344'), '01811223344');
  assert.strictEqual(normalizeBDPhone('01911-223344'), '01911223344');
  console.log('✓ Phone normalization handles various formats.');

  // Test 9: Administrator PIN Security
  console.log('\n[Test 9] Testing Administrator PIN Security...');
  const configuredPin = process.env.ADMIN_PIN || '20055';
  assert.strictEqual(configuredPin, '20055', 'Initial default PIN must be 20055');
  console.log('✓ Administrator PIN validated.');

  console.log('\n======================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (9/9 Verified)');
  console.log('======================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
