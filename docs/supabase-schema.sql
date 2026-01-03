-- Dilo App - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'crypto', 'digital')),
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('VES', 'USD', 'BTC', 'ETH', 'USDT', 'USDC')),
    balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
    icon VARCHAR(50) NOT NULL DEFAULT 'wallet',
    color VARCHAR(20) NOT NULL DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for default categories
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories (users can see defaults + their own)
CREATE POLICY "Users can view default and own categories" ON categories
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount_original DECIMAL(18, 2) NOT NULL,
    currency_original VARCHAR(10) NOT NULL,
    amount_usd DECIMAL(18, 2) NOT NULL,
    amount_ves DECIMAL(18, 2) NOT NULL,
    bcv_rate_used DECIMAL(18, 4) NOT NULL,
    description TEXT,
    voice_raw TEXT, -- Original voice command
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BCV RATE HISTORY TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS bcv_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate DECIMAL(18, 4) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'bcv',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed - public read
ALTER TABLE bcv_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view BCV rates" ON bcv_rates
    FOR SELECT USING (true);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ============================================
-- DEFAULT CATEGORIES (Run once)
-- ============================================

INSERT INTO categories (id, user_id, name, icon, type, color, is_default) VALUES
    -- Expenses
    ('a1111111-1111-1111-1111-111111111111', NULL, 'Comida', 'utensils', 'expense', '#F59E0B', true),
    ('a2222222-2222-2222-2222-222222222222', NULL, 'Transporte', 'car', 'expense', '#3B82F6', true),
    ('a3333333-3333-3333-3333-333333333333', NULL, 'Combustible', 'fuel', 'expense', '#EF4444', true),
    ('a4444444-4444-4444-4444-444444444444', NULL, 'Servicios', 'home', 'expense', '#8B5CF6', true),
    ('a5555555-5555-5555-5555-555555555555', NULL, 'Salud', 'heart', 'expense', '#EC4899', true),
    ('a6666666-6666-6666-6666-666666666666', NULL, 'Entretenimiento', 'gamepad-2', 'expense', '#14B8A6', true),
    ('a7777777-7777-7777-7777-777777777777', NULL, 'Compras', 'shopping-bag', 'expense', '#F97316', true),
    ('a8888888-8888-8888-8888-888888888888', NULL, 'Educación', 'graduation-cap', 'expense', '#6366F1', true),
    -- Income
    ('b1111111-1111-1111-1111-111111111111', NULL, 'Salario', 'banknote', 'income', '#10B981', true),
    ('b2222222-2222-2222-2222-222222222222', NULL, 'Ventas', 'store', 'income', '#22C55E', true),
    ('b3333333-3333-3333-3333-333333333333', NULL, 'Freelance', 'laptop', 'income', '#06B6D4', true),
    ('b4444444-4444-4444-4444-444444444444', NULL, 'Transferencia', 'arrow-right-left', 'income', '#8B5CF6', true),
    ('b5555555-5555-5555-5555-555555555555', NULL, 'Otro', 'circle-dot', 'both', '#6B7280', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTION: Update updated_at automatically
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your Dilo App database is ready.
-- ============================================
