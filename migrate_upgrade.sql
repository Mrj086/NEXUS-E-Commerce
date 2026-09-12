-- NEXUS UI Upgrade Migration
-- Run this AFTER importing nexus.sql

-- 1. Update orders table: change status to support full flow
ALTER TABLE orders MODIFY COLUMN status ENUM('confirmed','shipped','delivered','cancelled') DEFAULT 'confirmed';

-- 2. Add customer delivery approval column
ALTER TABLE orders ADD COLUMN customer_approved TINYINT(1) DEFAULT 0 AFTER contact_phone;

-- 3. Add payment_method detail column for mobile banking
ALTER TABLE orders ADD COLUMN mobile_bank VARCHAR(30) NULL AFTER payment_method;
ALTER TABLE orders ADD COLUMN mobile_phone VARCHAR(20) NULL AFTER mobile_bank;

-- 4. Update bank_transfers: add completed status and transaction_id
ALTER TABLE bank_transfers MODIFY COLUMN status ENUM('requested','completed','failed') DEFAULT 'requested';
ALTER TABLE bank_transfers ADD COLUMN transaction_id VARCHAR(64) NULL AFTER account_last4;
ALTER TABLE bank_transfers ADD COLUMN completed_at TIMESTAMP NULL AFTER created_at;
