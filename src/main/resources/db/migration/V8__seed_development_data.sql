-- =============================================================================
-- V8__seed_development_data.sql
-- Seed initial realistic master data for development environment
-- Idempotent: Uses WHERE NOT EXISTS to avoid duplicate entries
-- =============================================================================

-- 1. Categories
INSERT INTO categories (name, status, created_at, updated_at)
SELECT c.name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Travel Bags'),
    ('School Bags'),
    ('Laptop Bags'),
    ('Raincoats'),
    ('Wallets'),
    ('Accessories')
) AS c(name)
WHERE NOT EXISTS (
    SELECT 1 FROM categories existing WHERE LOWER(existing.name) = LOWER(c.name)
);

-- 2. Brands
INSERT INTO brands (name, status, created_at, updated_at)
SELECT b.name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('American Tourister'),
    ('Skybags'),
    ('Wildcraft'),
    ('Safari'),
    ('VIP')
) AS b(name)
WHERE NOT EXISTS (
    SELECT 1 FROM brands existing WHERE LOWER(existing.name) = LOWER(b.name)
);

-- 3. Suppliers
INSERT INTO suppliers (name, gst_number, address, status, created_at, updated_at)
SELECT s.name, s.gst_number, s.address, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Metro Bag Wholesalers', '27ABCDE1234F1Z5', 'Shop 12, Wholesale Market, Mumbai 400001'),
    ('Apex Luggage Distributors', '27BCDEF2345G2Z6', 'Plot 45, Industrial Area, Pune 411018'),
    ('Classic Leather Crafts', '27CDEFG3456H3Z7', '18 Leather Complex, Dharavi, Mumbai 400017')
) AS s(name, gst_number, address)
WHERE NOT EXISTS (
    SELECT 1 FROM suppliers existing WHERE LOWER(existing.name) = LOWER(s.name)
);

-- 3a. Supplier Phones
INSERT INTO supplier_phones (supplier_id, phone_number, label)
SELECT s.supplier_id, p.phone_number, p.label
FROM (VALUES
    ('Metro Bag Wholesalers', '+91 9820011223', 'Main'),
    ('Metro Bag Wholesalers', '+91 9820011224', 'Warehouse'),
    ('Apex Luggage Distributors', '+91 9850022334', 'Office'),
    ('Classic Leather Crafts', '+91 9819933445', 'Support')
) AS p(supplier_name, phone_number, label)
JOIN suppliers s ON LOWER(s.name) = LOWER(p.supplier_name)
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_phones sp
    WHERE sp.supplier_id = s.supplier_id AND sp.phone_number = p.phone_number
);

-- 3b. Supplier Emails
INSERT INTO supplier_emails (supplier_id, email, label)
SELECT s.supplier_id, e.email, e.label
FROM (VALUES
    ('Metro Bag Wholesalers', 'sales@metrobag.com', 'Orders'),
    ('Apex Luggage Distributors', 'orders@apexluggage.com', 'Sales'),
    ('Classic Leather Crafts', 'info@classicleather.in', 'Support')
) AS e(supplier_name, email, label)
JOIN suppliers s ON LOWER(s.name) = LOWER(e.supplier_name)
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_emails se
    WHERE se.supplier_id = s.supplier_id AND se.email = e.email
);

-- 4. Products (All starting with stock 0 as required by inventory architecture)
INSERT INTO products (
    name, sku, barcode, category_id, brand_id, color, capacity,
    purchase_price, selling_price, stock_quantity, minimum_stock,
    status, created_at, updated_at
)
SELECT
    p.name, p.sku, p.barcode, c.category_id, b.brand_id, p.color, p.capacity,
    p.purchase_price, p.selling_price, 0, p.minimum_stock,
    'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Skybags Backpack 30L', 'SKY-BP-30L-BLK', '890123456701', 'School Bags', 'Skybags', 'Black', '30L', 850.00, 1499.00, 5),
    ('American Tourister Trolley 55cm', 'AT-TR-55-BLU', '890123456702', 'Travel Bags', 'American Tourister', 'Navy Blue', '45L', 2200.00, 3799.00, 3),
    ('Wildcraft Laptop Backpack 25L', 'WLD-LP-25L-GRY', '890123456703', 'Laptop Bags', 'Wildcraft', 'Heather Grey', '25L', 1100.00, 1899.00, 5),
    ('Safari Hard-Sided Cabin Bag 35L', 'SAF-CS-35L-RED', '890123456704', 'Travel Bags', 'Safari', 'Crimson Red', '35L', 1650.00, 2899.00, 4),
    ('VIP Classic Executive Folio Case', 'VIP-EF-BRN', '890123456705', 'Laptop Bags', 'VIP', 'Dark Brown', '15L', 1400.00, 2499.00, 3),
    ('Classic Leather Bifold Wallet', 'CL-WL-BF-BLK', '890123456706', 'Wallets', NULL, 'Black', 'Standard', 350.00, 799.00, 10),
    ('All-Weather Heavy Duty Raincoat', 'AW-RC-XL-NVY', '890123456707', 'Raincoats', 'Wildcraft', 'Navy', 'Size XL', 600.00, 1199.00, 8),
    ('TSA Approved Luggage Combination Lock', 'ACC-TSA-LOCK-SLV', '890123456708', 'Accessories', NULL, 'Silver', 'Compact', 180.00, 399.00, 15)
) AS p(name, sku, barcode, category_name, brand_name, color, capacity, purchase_price, selling_price, minimum_stock)
JOIN categories c ON LOWER(c.name) = LOWER(p.category_name)
LEFT JOIN brands b ON LOWER(b.name) = LOWER(p.brand_name)
WHERE NOT EXISTS (
    SELECT 1 FROM products existing WHERE LOWER(existing.sku) = LOWER(p.sku)
);
