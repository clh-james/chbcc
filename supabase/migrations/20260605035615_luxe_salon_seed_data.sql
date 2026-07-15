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
