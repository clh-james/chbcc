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
