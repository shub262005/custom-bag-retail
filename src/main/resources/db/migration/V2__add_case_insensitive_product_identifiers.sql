-- =============================================================================
-- V2__add_case_insensitive_product_identifiers.sql
-- Enforce database-level case-insensitive uniqueness for products.sku and products.barcode
-- =============================================================================

-- Drop old case-sensitive unique constraints if they exist
ALTER TABLE products DROP CONSTRAINT IF EXISTS uk_product_sku;
ALTER TABLE products DROP CONSTRAINT IF EXISTS uk_product_barcode;

-- Create functional unique indexes for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_sku_lower ON products (LOWER(sku));
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_barcode_lower ON products (LOWER(barcode));
