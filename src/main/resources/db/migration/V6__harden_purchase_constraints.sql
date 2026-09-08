-- =============================================================================
-- V6__harden_purchase_constraints.sql
-- Add database-level CHECK constraints for purchase status, discount percentage,
-- tax rate, and payment method
-- =============================================================================

-- 1. Purchases table CHECK constraints
ALTER TABLE purchases
    ADD CONSTRAINT chk_purchase_status CHECK (status IN ('COMPLETED', 'CANCELLED')),
    ADD CONSTRAINT chk_purchase_discount_pct CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    ADD CONSTRAINT chk_purchase_tax_rate CHECK (tax_rate >= 0);

-- 2. Purchase Payments table CHECK constraints
ALTER TABLE purchase_payments
    ADD CONSTRAINT chk_purchase_payment_method CHECK (
        payment_method IN (
            'CASH',
            'UPI',
            'BANK_TRANSFER',
            'CARD',
            'OTHER'
        )
    );
