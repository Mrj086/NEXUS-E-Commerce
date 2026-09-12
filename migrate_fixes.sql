-- Run this ONLY if you already imported an older copy of nexus.sql and don't want to
-- drop your data. If you are doing a fresh install, just import nexus.sql instead.
USE nexus;

-- 1) Add missing columns used by the updated backend/frontend.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL AFTER profession;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) NULL AFTER shipping_address,
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(64) NULL AFTER contact_phone;

-- 2) Fix the demo account passwords (the previous SQL file shipped a placeholder
--    hash that did not match ANY password, which is why login failed).
--    These are real bcrypt hashes (cost 12) for:
--    admin@nexus.local / Admin123!   seller@nexus.local / Seller123!   customer@nexus.local / Customer123!
UPDATE users SET password_hash='$2a$12$KWYiNdPitSGQYlf/.U8ZruypaoB0BvhDCiQCuGqianQHlNV7YY.Ty' WHERE email='admin@nexus.local';
UPDATE users SET password_hash='$2a$12$d7Tvu1aWogCWtI4ZEFgSVevaEnKaA6buoGfsoC3BCR12gzKIQZPeq' WHERE email='seller@nexus.local';
UPDATE users SET password_hash='$2a$12$Kw7F.wkwWJRtS5ZpvLVkSehrRf5DXWSyyucu8ehV3EDapAmwj1.Gm' WHERE email='customer@nexus.local';
