-- TechVantage BD - PostgreSQL Schema Migration
-- Designed for Supabase / PostgreSQL with Row-Level Security (RLS)

-- 1. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration_days INTEGER, -- NULL means lifetime access
    price_bdt NUMERIC NOT NULL,
    badge TEXT,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT true,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    allowed_package_ids JSONB NOT NULL DEFAULT '["p_1m", "p_3m", "p_lifetime"]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Lessons Table (Separates public preview titles from protected content)
CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_min INTEGER NOT NULL DEFAULT 15,
    is_preview BOOLEAN NOT NULL DEFAULT false,
    video_url TEXT, -- Protected content, never exposed in public API
    notes TEXT,     -- Protected content
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Guest Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, -- e.g. TVB-2026-9812
    course_id TEXT NOT NULL REFERENCES courses(id),
    package_id TEXT NOT NULL REFERENCES packages(id),
    package_snapshot JSONB NOT NULL, -- { id, name, duration_days, price_bdt } immutable snapshot
    amount_bdt NUMERIC NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad')),
    sender_phone TEXT NOT NULL,
    trx_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- SHA-256 of raw 32-byte secret token
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'payment_issue')),
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    telegram_invite_status TEXT NOT NULL DEFAULT 'none' CHECK (telegram_invite_status IN ('none', 'pending', 'created', 'failed', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uniqueness constraint on Transaction ID per provider to prevent duplicate submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_trx_payment ON orders (LOWER(trx_id), payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_token_hash ON orders (token_hash);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- 5. Course Entitlements Table (Authoritative subscription access)
CREATE TABLE IF NOT EXISTS entitlements (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    course_id TEXT NOT NULL REFERENCES courses(id),
    package_id TEXT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL for lifetime access
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    revoked_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_entitlements_customer ON entitlements(customer_phone, course_id);

-- 6. Telegram Chat Invitations
CREATE TABLE IF NOT EXISTS telegram_invites (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    invite_link TEXT NOT NULL,
    member_limit INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT false
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Website Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Phone Recovery Challenges
CREATE TABLE IF NOT EXISTS recovery_challenges (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_code_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_challenges ENABLE ROW LEVEL SECURITY;

-- Public can read published courses
CREATE POLICY "Public can view published courses" ON courses
    FOR SELECT USING (is_published = true);

-- Public can view active packages
CREATE POLICY "Public can view active packages" ON packages
    FOR SELECT USING (is_active = true);

-- Public can view preview lessons only
CREATE POLICY "Public can view preview lessons" ON lessons
    FOR SELECT USING (is_preview = true);

-- Orders, entitlements, invites, audit logs, and settings are restricted to server-side service role
CREATE POLICY "Service role full access on orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on entitlements" ON entitlements
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on telegram_invites" ON telegram_invites
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on audit_logs" ON audit_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on settings" ON settings
    FOR ALL USING (auth.role() = 'service_role');
