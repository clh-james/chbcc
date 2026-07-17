from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'supabase' / 'migrations'
files = [
    '20260604000000_create_core_schema.sql',
    '20260606052103_add_user_roles_and_permissions.sql',
    '20260608151329_fix_profiles_rls_and_default_role.sql',
    '20260605035615_luxe_salon_seed_data.sql',
]
out = root / '000_apply_all.sql'
header = '''-- Run this entire migration bundle in Supabase SQL Editor (Project-level SQL) as an authenticated project admin.
-- IMPORTANT: Run in the Supabase Dashboard SQL editor (not via the anon key) so the commands that enable extensions and RLS succeed.
-- Order: core schema -> roles & permissions -> profiles RLS fix -> seed data

'''
parts = []
for f in files:
    p = root / f
    if not p.exists():
        raise FileNotFoundError(f'Missing migration file: {p}')
    contents = p.read_text(encoding='utf-8').rstrip()
    parts.append(f'-- ===== {f} =====\n{contents}')
out.write_text(header + '\n\n'.join(parts) + '\n', encoding='utf-8')
print(f'Rebuilt {out} with {out.stat().st_size} bytes')
