CREATE DATABASE IF NOT EXISTS nexus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexus;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS bank_transfers,notifications,reviews,order_items,orders,wishlists,activity_logs,products,categories,users;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,role ENUM('customer','seller','admin') NOT NULL DEFAULT 'customer',
 age INT NULL,gender VARCHAR(30) NULL,profession VARCHAR(100) NULL,phone VARCHAR(30) NULL,
 active TINYINT(1) NOT NULL DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL UNIQUE);
CREATE TABLE products (
 id INT AUTO_INCREMENT PRIMARY KEY,seller_id INT NOT NULL,category_id INT NOT NULL,name VARCHAR(180) NOT NULL,
 description TEXT,price DECIMAL(12,2) NOT NULL,quantity INT NOT NULL DEFAULT 0,photos JSON NULL,
 active TINYINT(1) NOT NULL DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(seller_id) REFERENCES users(id),FOREIGN KEY(category_id) REFERENCES categories(id)
);
CREATE TABLE wishlists (user_id INT NOT NULL,product_id INT NOT NULL,PRIMARY KEY(user_id,product_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
CREATE TABLE activity_logs (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,product_id INT NULL,action VARCHAR(40) NOT NULL,query_text VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);
CREATE TABLE orders (
 id INT AUTO_INCREMENT PRIMARY KEY,customer_id INT NOT NULL,total_amount DECIMAL(12,2) NOT NULL,
 admin_revenue DECIMAL(12,2) NOT NULL,seller_revenue DECIMAL(12,2) NOT NULL,payment_method VARCHAR(60),
 payment_status ENUM('pending','paid','failed','cod_pending') DEFAULT 'pending',
 status ENUM('confirmed','shipped','delivered','cancelled') DEFAULT 'confirmed',
 shipping_address TEXT,contact_phone VARCHAR(30) NULL,transaction_id VARCHAR(64) NULL,
 customer_approved TINYINT(1) DEFAULT 0,
 mobile_bank VARCHAR(30) NULL,mobile_phone VARCHAR(20) NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(customer_id) REFERENCES users(id)
);
CREATE TABLE order_items (
 id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,product_id INT NOT NULL,seller_id INT NOT NULL,
 quantity INT NOT NULL,unit_price DECIMAL(12,2) NOT NULL,line_total DECIMAL(12,2) NOT NULL,
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id),
 FOREIGN KEY(seller_id) REFERENCES users(id)
);
CREATE TABLE reviews (
 id INT AUTO_INCREMENT PRIMARY KEY,product_id INT NOT NULL,customer_id INT NOT NULL,rating INT NOT NULL,comment TEXT,
 sentiment ENUM('positive','neutral','negative') DEFAULT 'neutral',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,FOREIGN KEY(customer_id) REFERENCES users(id)
);
CREATE TABLE notifications (
 id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,type VARCHAR(40),title VARCHAR(160),message TEXT,
 is_read TINYINT(1) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE bank_transfers (
 id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,amount DECIMAL(12,2) NOT NULL,bank_name VARCHAR(120),
 account_last4 VARCHAR(4),transaction_id VARCHAR(64) NULL,
 status ENUM('requested','completed','failed') DEFAULT 'requested',
 completed_at TIMESTAMP NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
);

INSERT INTO categories(name) VALUES ('Electronics'),('Fashion'),('Home'),('Books'),('Beauty'),('Sports');

-- Passwords are REAL bcrypt hashes (cost 12) matching the demo accounts documented in README:
-- admin@nexus.local    / Admin123!
-- seller@nexus.local   / Seller123!
-- customer@nexus.local / Customer123!
INSERT INTO users(name,email,password_hash,role,age,gender,profession,phone) VALUES
('NEXUS Admin','admin@nexus.local','$2a$12$KWYiNdPitSGQYlf/.U8ZruypaoB0BvhDCiQCuGqianQHlNV7YY.Ty','admin',35,'Other','Administrator','01700000001'),
('Demo Seller','seller@nexus.local','$2a$12$d7Tvu1aWogCWtI4ZEFgSVevaEnKaA6buoGfsoC3BCR12gzKIQZPeq','seller',32,'Male','Entrepreneur','01700000002'),
('Demo Customer','customer@nexus.local','$2a$12$Kw7F.wkwWJRtS5ZpvLVkSehrRf5DXWSyyucu8ehV3EDapAmwj1.Gm','customer',24,'Female','Student','01700000003');

INSERT INTO products(seller_id,category_id,name,description,price,quantity,photos) VALUES
(2,1,'NEXUS Wireless Headphones','Low-latency wireless headphones with active noise control.',79.99,24,'["/uploads/headphones.jpg"]'),
(2,1,'Smart Watch Pro','Fitness and productivity smartwatch with health tracking.',119.00,18,'["/uploads/smartwatch.jpg"]'),
(2,2,'Urban Backpack','Water-resistant commuter backpack for students and professionals.',49.50,35,'["/uploads/backpack.jpg"]'),
(2,4,'Modern JavaScript','Practical JavaScript guide for modern developers.',34.99,15,'["/uploads/javascript-book.jpg"]'),
(2,3,'Desk LED Lamp','Adjustable LED desk lamp with three brightness modes.',29.95,21,'["/uploads/desk-lamp.jpg"]'),
(2,6,'Training Sneakers','Comfortable everyday training sneakers.',64.00,12,'["/uploads/sneakers.jpg"]');
