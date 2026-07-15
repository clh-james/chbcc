-- Run this entire migration bundle in Supabase SQL Editor (Project-level SQL) as an authenticated project admin.
-- IMPORTANT: Run in the Supabase Dashboard SQL editor (not via the anon key) so the commands that enable extensions and RLS succeed.
-- Order: core schema -> roles & permissions -> profiles RLS fix -> seed data

-- ===== 20260604000000_create_core_schema.sql =====
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  city text,
  country text DEFAULT 'USA',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#ec4899',
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#ec4899',
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  duration_minutes integer DEFAULT 60,
  price numeric(10,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 0,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  description text,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  cost_price numeric(10,2) DEFAULT 0,
  retail_price numeric(10,2) DEFAULT 0,
  current_stock integer DEFAULT 0,
  min_stock_level integer DEFAULT 0,
  unit text DEFAULT 'pcs',
  supplier text,
  barcode text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cost_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retail_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) DEFAULT 0,
  duration_days integer DEFAULT 30,
  benefits jsonb DEFAULT '[]'::jsonb,
  discount_percentage numeric(5,2) DEFAULT 0,
  points_multiplier numeric(5,2) DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS benefits jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_multiplier numeric(5,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS customer_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES memberships(id) ON DELETE CASCADE,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  status text DEFAULT 'active',
  amount_paid numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  role text,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  specializations text[] DEFAULT '{}',
  hourly_rate numeric(10,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 0,
  schedule jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  hire_date date DEFAULT CURRENT_DATE,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS hire_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  gender text,
  address text,
  notes text,
  preferences jsonb DEFAULT '{}'::jsonb,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  loyalty_points integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  visit_count integer DEFAULT 0,
  last_visit_at timestamptz,
  referred_by text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visit_at timestamptz,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  status text DEFAULT 'scheduled',
  total_amount numeric(10,2) DEFAULT 0,
  deposit_amount numeric(10,2) DEFAULT 0,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS appointment_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS start_time time NOT NULL DEFAULT '10:00:00',
  ADD COLUMN IF NOT EXISTS end_time time,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  subtotal numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'draft',
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid,
  name text NOT NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_type text,
  ADD COLUMN IF NOT EXISTS item_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS sms_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  phone text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'custom',
  status text DEFAULT 'pending',
  sent_at timestamptz,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_notifications
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  type text NOT NULL,
  description text,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_points
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS admin_read_all_profiles ON profiles;
CREATE POLICY admin_read_all_profiles ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS select_roles ON user_roles;
CREATE POLICY select_roles ON user_roles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_manage_roles ON user_roles;
CREATE POLICY admin_manage_roles ON user_roles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE name = 'admin') THEN
    INSERT INTO user_roles (name, description, permissions)
    VALUES (
      'admin',
      'Full system access',
      '["dashboard","appointments","pos","customers","staff","inventory","memberships","reports","analytics","sms","branches","settings"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE name = 'manager') THEN
    INSERT INTO user_roles (name, description, permissions)
    VALUES (
      'manager',
      'Manage staff and reports',
      '["dashboard","appointments","customers","staff","inventory","reports","analytics","settings"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE name = 'staff') THEN
    INSERT INTO user_roles (name, description, permissions)
    VALUES (
      'staff',
      'Handle appointments and customers',
      '["dashboard","appointments","customers","memberships"]'::jsonb
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE name = 'cashier') THEN
    INSERT INTO user_roles (name, description, permissions)
    VALUES (
      'cashier',
      'POS and billing only',
      '["pos","customers"]'::jsonb
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM branches LIMIT 1) THEN
    INSERT INTO branches (id, name, address, phone, email, city, country)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'Chloe House Of Beauty',
      '123 Beauty Ave',
      '+1 555-0100',
      'hello@chloehouse.com',
      'New York',
      'USA'
    );
  END IF;
END $$;

-- ===== 20260606052103_add_user_roles_and_permissions.sql =====
/*
# Add User Roles and Permissions

This migration adds role-based access control to the system.

1. New Tables:
- `user_roles` - Defines available roles (admin, manager, staff, cashier)
- Updates to `profiles` table to include role assignment

2. New Columns:
- `profiles.role` - User's assigned role

3. Security:
- Enable RLS on user_roles table
- Add policies for role-based access

## Roles and Permissions:

- **Admin**: Full system access (all modules)
- **Manager**: Staff, Reports, Inventory, Branches
- **Staff**: Appointments, Customers, Dashboard
- **Cashier**: POS/Billing only
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add role column to profiles if it doesn't exist
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN role text DEFAULT 'staff';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add role foreign key constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_fkey 
    FOREIGN KEY (role) 
    REFERENCES user_roles(name) 
    ON DELETE SET DEFAULT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO user_roles (name, description, permissions) VALUES
  ('admin', 'Full system access', '["dashboard","appointments","pos","customers","staff","inventory","memberships","reports","analytics","sms","branches","settings"]'::jsonb),
  ('manager', 'Manage staff and reports', '["dashboard","appointments","customers","staff","inventory","reports","analytics","settings"]'::jsonb),
  ('staff', 'Handle appointments and customers', '["dashboard","appointments","customers","memberships"]'::jsonb),
  ('cashier', 'POS and billing only', '["pos","customers"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create policies for user_roles (read-only for authenticated users)
DROP POLICY IF EXISTS "select_roles" ON user_roles;
CREATE POLICY "select_roles" ON user_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_roles" ON user_roles;
CREATE POLICY "admin_manage_roles" ON user_roles FOR ALL
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update profiles table to include role-based read permissions
DROP POLICY IF EXISTS "users_read_own_role" ON profiles;
CREATE POLICY "users_read_own_role" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Add index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON user_roles(name);

-- ===== 20260608151329_fix_profiles_rls_and_default_role.sql =====
-- Fix profiles RLS: allow authenticated users to insert and update their own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "users_read_own_role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- SELECT: users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- INSERT: users can create their own profile row
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (for staff management)
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Set default role to 'admin' for any profile with NULL role
UPDATE profiles SET role = 'admin' WHERE role IS NULL;

-- ===== 20260605035615_luxe_salon_seed_data.sql =====
/*
# Seed data for Luxe Salon

Inserts demo branch, service categories, services, staff, customers,
appointments, invoices, memberships into existing tables.
All inserts use ON CONFLICT DO NOTHING for idempotency.
*/

-- Default branch
INSERT INTO branches (id, name, address, phone, email, city, country)
VALUES ('00000000-0000-0000-0000-000000000001', 'Luxe Salon - Main Branch', '123 Beauty Ave', '+1 555-0100', 'main@luxesalon.com', 'New York', 'USA')
ON CONFLICT (id) DO NOTHING;

-- Service categories
INSERT INTO service_categories (id, name, color) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Hair', '#ec4899'),
  ('10000000-0000-0000-0000-000000000002', 'Nails', '#f59e0b'),
  ('10000000-0000-0000-0000-000000000003', 'Skin', '#10b981'),
  ('10000000-0000-0000-0000-000000000004', 'Massage', '#6366f1')
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, name, category_id, duration_minutes, price, commission_rate, branch_id) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Haircut & Style', '10000000-0000-0000-0000-000000000001', 60, 65.00, 15, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Color & Highlights', '10000000-0000-0000-0000-000000000001', 120, 120.00, 15, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Blowout', '10000000-0000-0000-0000-000000000001', 45, 45.00, 12, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Manicure', '10000000-0000-0000-0000-000000000002', 45, 35.00, 10, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'Pedicure', '10000000-0000-0000-0000-000000000002', 60, 50.00, 10, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', 'Gel Nails', '10000000-0000-0000-0000-000000000002', 75, 65.00, 12, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000007', 'Facial', '10000000-0000-0000-0000-000000000003', 60, 80.00, 15, '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000008', 'Swedish Massage', '10000000-0000-0000-0000-000000000004', 60, 90.00, 15, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Product categories
INSERT INTO product_categories (id, name) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Shampoo & Conditioner'),
  ('30000000-0000-0000-0000-000000000002', 'Styling Products'),
  ('30000000-0000-0000-0000-000000000003', 'Nail Polish'),
  ('30000000-0000-0000-0000-000000000004', 'Skincare')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, category_id, branch_id, cost_price, retail_price, current_stock, min_stock_level, supplier) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Keratin Shampoo 500ml', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 8.00, 22.00, 24, 5, 'Luxury Hair Co'),
  ('40000000-0000-0000-0000-000000000002', 'Deep Conditioner', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 10.00, 28.00, 18, 5, 'Luxury Hair Co'),
  ('40000000-0000-0000-0000-000000000003', 'Styling Mousse', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 6.00, 18.00, 3, 5, 'Style Pro'),
  ('40000000-0000-0000-0000-000000000004', 'Gel Top Coat', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 4.00, 12.00, 30, 10, 'Nail Art Inc'),
  ('40000000-0000-0000-0000-000000000005', 'Anti-Aging Serum', '30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 15.00, 45.00, 12, 5, 'Skin Luxe')
ON CONFLICT (id) DO NOTHING;

-- Memberships (benefits is jsonb)
INSERT INTO memberships (id, name, description, price, duration_days, benefits, discount_percentage, points_multiplier) VALUES
  ('50000000-0000-0000-0000-000000000001', 'Silver', 'Great starter plan', 29.99, 30, '["5% off all services","1.5x loyalty points"]'::jsonb, 5, 1.5),
  ('50000000-0000-0000-0000-000000000002', 'Gold', 'Most popular plan', 59.99, 30, '["10% off all services","2x loyalty points","Free blowout monthly"]'::jsonb, 10, 2.0),
  ('50000000-0000-0000-0000-000000000003', 'Platinum', 'Ultimate luxury experience', 99.99, 30, '["15% off all services","3x loyalty points","Free blowout monthly","Priority booking"]'::jsonb, 15, 3.0)
ON CONFLICT (id) DO NOTHING;

-- Staff
INSERT INTO staff (id, full_name, email, phone, role, branch_id, specializations, hourly_rate, commission_rate, hire_date) VALUES
  ('60000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah@luxesalon.com', '+1 555-0201', 'Senior Stylist', '00000000-0000-0000-0000-000000000001', ARRAY['Hair Color', 'Cuts', 'Extensions'], 25.00, 15, '2022-03-01'),
  ('60000000-0000-0000-0000-000000000002', 'Maria Garcia', 'maria@luxesalon.com', '+1 555-0202', 'Nail Technician', '00000000-0000-0000-0000-000000000001', ARRAY['Gel Nails', 'Manicure', 'Pedicure'], 20.00, 12, '2023-01-15'),
  ('60000000-0000-0000-0000-000000000003', 'James Lee', 'james@luxesalon.com', '+1 555-0203', 'Massage Therapist', '00000000-0000-0000-0000-000000000001', ARRAY['Swedish', 'Deep Tissue', 'Hot Stone'], 22.00, 12, '2021-07-10'),
  ('60000000-0000-0000-0000-000000000004', 'Emma Wilson', 'emma@luxesalon.com', '+1 555-0204', 'Esthetician', '00000000-0000-0000-0000-000000000001', ARRAY['Facials', 'Waxing', 'Peels'], 22.00, 13, '2023-06-01')
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO customers (id, full_name, email, phone, gender, branch_id, loyalty_points, total_spent, visit_count, last_visit_at) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Jennifer Adams', 'jennifer@email.com', '+1 555-1001', 'female', '00000000-0000-0000-0000-000000000001', 250, 420.00, 8, now() - interval '7 days'),
  ('70000000-0000-0000-0000-000000000002', 'Rachel Kim', 'rachel@email.com', '+1 555-1002', 'female', '00000000-0000-0000-0000-000000000001', 180, 310.00, 6, now() - interval '14 days'),
  ('70000000-0000-0000-0000-000000000003', 'Michael Chen', 'michael@email.com', '+1 555-1003', 'male', '00000000-0000-0000-0000-000000000001', 90, 145.00, 3, now() - interval '21 days'),
  ('70000000-0000-0000-0000-000000000004', 'Sophie Turner', 'sophie@email.com', '+1 555-1004', 'female', '00000000-0000-0000-0000-000000000001', 320, 580.00, 12, now() - interval '3 days'),
  ('70000000-0000-0000-0000-000000000005', 'David Park', 'david@email.com', '+1 555-1005', 'male', '00000000-0000-0000-0000-000000000001', 60, 95.00, 2, now() - interval '30 days')
ON CONFLICT (id) DO NOTHING;

-- Today's appointments
INSERT INTO appointments (id, customer_id, staff_id, branch_id, appointment_date, start_time, end_time, status, total_amount) VALUES
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:00', '11:00', 'confirmed', 65.00),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '11:30', '12:15', 'scheduled', 35.00),
  ('80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '14:00', '16:00', 'confirmed', 120.00),
  ('80000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '15:00', '16:00', 'scheduled', 90.00)
ON CONFLICT (id) DO NOTHING;

-- Invoices (recent paid)
INSERT INTO invoices (id, invoice_number, customer_id, branch_id, subtotal, tax_amount, total_amount, paid_amount, status, payment_method) VALUES
  ('90000000-0000-0000-0000-000000000001', 'INV-20260601-0001', '70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 120.00, 9.60, 129.60, 129.60, 'paid', 'card'),
  ('90000000-0000-0000-0000-000000000002', 'INV-20260601-0002', '70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 185.00, 14.80, 199.80, 199.80, 'paid', 'cash'),
  ('90000000-0000-0000-0000-000000000003', 'INV-20260602-0001', '70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 65.00, 5.20, 70.20, 70.20, 'paid', 'card'),
  ('90000000-0000-0000-0000-000000000004', 'INV-20260603-0001', '70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 90.00, 7.20, 97.20, 97.20, 'paid', 'card')
ON CONFLICT (id) DO NOTHING;
