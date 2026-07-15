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
