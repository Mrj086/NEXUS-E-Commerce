import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "./db.js";
import { requireAuth, requireRole, signUser } from "./auth.js";

dotenv.config();
const app = express();
const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({ storage: storage });


const q = async (sql, params = []) => (await pool.execute(sql, params))[0];

async function notify(userId, type, title, message) {
  await q("INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)", [userId, type, title, message]);
}

function productDto(row) {
  return {
    ...row,
    price: Number(row.price),
    quantity: Number(row.quantity),
    photos: row.photos ? JSON.parse(row.photos) : []
  };
}

app.get("/api/health", async (_req, res) => {
  try { await q("SELECT 1"); res.json({ ok: true, app: "NEXUS" }); }
  catch (e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role = "customer", age, gender, profession, phone } = req.body;
  if (!name || !email || !password || !["customer", "seller"].includes(role))
    return res.status(400).json({ message: "Name, email, password and a valid role are required." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  const existing = await q("SELECT id FROM users WHERE email=?", [email.toLowerCase()]);
  if (existing.length) return res.status(409).json({ message: "Email already registered." });
  const hash = await bcrypt.hash(password, 12);
  const result = await q(
    "INSERT INTO users(name,email,password_hash,role,age,gender,profession,phone) VALUES (?,?,?,?,?,?,?,?)",
    [name, email.toLowerCase(), hash, role, age || null, gender || null, profession || null, phone || null]
  );
  const user = { id: result.insertId, name, email: email.toLowerCase(), role };
  res.status(201).json({ token: signUser(user), user });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const rows = await q("SELECT * FROM users WHERE email=?", [email?.toLowerCase()]);
  if (!rows.length || !(await bcrypt.compare(password || "", rows[0].password_hash)))
    return res.status(401).json({ message: "Invalid email or password." });
  const u = rows[0];
  res.json({ token: signUser(u), user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const rows = await q("SELECT id,name,email,role,age,gender,profession,phone,created_at FROM users WHERE id=?", [req.user.id]);
  res.json(rows[0]);
});

app.put("/api/me", requireAuth, async (req, res) => {
  const { name, age, gender, profession, phone } = req.body;
  await q("UPDATE users SET name=?,age=?,gender=?,profession=?,phone=? WHERE id=?", [name, age || null, gender || null, profession || null, phone || null, req.user.id]);
  res.json({ message: "Profile updated." });
});

app.put("/api/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters." });
  const rows = await q("SELECT password_hash FROM users WHERE id=?", [req.user.id]);
  if (!rows.length || !(await bcrypt.compare(currentPassword || "", rows[0].password_hash)))
    return res.status(401).json({ message: "Current password is incorrect." });
  const hash = await bcrypt.hash(newPassword, 12);
  await q("UPDATE users SET password_hash=? WHERE id=?", [hash, req.user.id]);
  res.json({ message: "Password updated." });
});

app.get("/api/products", async (req, res) => {
  const { search = "", category = "", seller = "" } = req.query;
  let sql = `SELECT p.*, c.name category_name, u.name seller_name
             FROM products p JOIN categories c ON c.id=p.category_id
             JOIN users u ON u.id=p.seller_id
             WHERE p.active=1`;
  const params = [];
  if (search) { sql += " AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)"; const s = `%${search}%`; params.push(s,s,s); }
  if (category) { sql += " AND c.name=?"; params.push(category); }
  if (seller) { sql += " AND u.name LIKE ?"; params.push(`%${seller}%`); }
  sql += " ORDER BY p.created_at DESC";
  const rows = await q(sql, params);
  res.json(rows.map(productDto));
});

app.get("/api/products/:id", async (req, res) => {
  const rows = await q(`SELECT p.*, c.name category_name, u.name seller_name
    FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id
    WHERE p.id=?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Product not found." });
  const product = productDto(rows[0]);
  if (req.user?.id) await q("INSERT INTO activity_logs(user_id,product_id,action) VALUES (?,?,?)", [req.user.id, product.id, "view"]);
  res.json(product);
});

app.get("/api/categories", async (_req, res) => res.json(await q("SELECT * FROM categories ORDER BY name")));

app.post("/api/products/image-search", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "An image file is required." });
  const raw = (req.file.originalname || "").replace(/\.[^.]+$/, "").replace(/[_\-.]+/g, " ").trim();
  const catalog = await q(`SELECT p.id,p.name,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.active=1`);
  const stop = new Set(["image","photo","img","picture","pic","download","file","screenshot","untitled"]);
  const words = raw.toLowerCase().split(/\s+/).filter(w => w && !stop.has(w) && isNaN(w));
  let bestWord = "";
  if (words.length) {
    let bestScore = -1;
    for (const w of words) {
      const score = catalog.filter(p => p.name.toLowerCase().includes(w) || p.category_name.toLowerCase().includes(w)).length;
      if (score > bestScore) { bestScore = score; bestWord = w; }
    }
  }
  const term = bestWord || words.join(" ");
  let rows;
  if (term) {
    rows = await q(`SELECT p.*, c.name category_name, u.name seller_name
      FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id
      WHERE p.active=1 AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
      ORDER BY p.created_at DESC LIMIT 12`, [`%${term}%`, `%${term}%`, `%${term}%`]);
  }
  if (!rows || !rows.length) {
    rows = await q(`SELECT p.*, c.name category_name, u.name seller_name
      FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id
      WHERE p.active=1 ORDER BY p.created_at DESC LIMIT 12`);
  }
  if (req.user?.id) await q("INSERT INTO activity_logs(user_id,action,query_text) VALUES (?,?,?)", [req.user.id, "image-search", term || raw || "image"]).catch(() => {});
  res.json({ mode: "local visual-search fallback", query: term || raw || "image", products: rows.map(productDto) });
});

app.get("/api/recommendations", requireAuth, requireRole("customer"), async (req, res) => {
  const user = (await q("SELECT age,gender,profession FROM users WHERE id=?", [req.user.id]))[0];
  const history = await q(`SELECT DISTINCT p.category_id FROM activity_logs a JOIN products p ON p.id=a.product_id
    WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 5`, [req.user.id]);
  const cats = history.map(x => x.category_id);
  let sql = `SELECT p.*, c.name category_name, u.name seller_name FROM products p
    JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id WHERE p.active=1`;
  const params = [];
  if (cats.length) { sql += ` AND p.category_id IN (${cats.map(() => "?").join(",")})`; params.push(...cats); }
  sql += " ORDER BY p.created_at DESC LIMIT 12";
  const rows = await q(sql, params);
  res.json({ profile: user, reason: "Matches profile plus recent browsing/search categories.", products: rows.map(productDto) });
});

app.post("/api/activity", requireAuth, async (req, res) => {
  const { productId, action, query } = req.body;
  await q("INSERT INTO activity_logs(user_id,product_id,action,query_text) VALUES (?,?,?,?)",
    [req.user.id, productId || null, action || "search", query || null]);
  res.json({ ok: true });
});

app.get("/api/wishlist", requireAuth, requireRole("customer"), async (req, res) => {
  res.json(await q(`SELECT p.*, c.name category_name, u.name seller_name FROM wishlists w
    JOIN products p ON p.id=w.product_id JOIN categories c ON c.id=p.category_id
    JOIN users u ON u.id=p.seller_id WHERE w.user_id=?`, [req.user.id]));
});
app.post("/api/wishlist/:productId", requireAuth, requireRole("customer"), async (req, res) => {
  await q("INSERT IGNORE INTO wishlists(user_id,product_id) VALUES (?,?)", [req.user.id, req.params.productId]);
  res.json({ message: "Added to wishlist." });
});
app.delete("/api/wishlist/:productId", requireAuth, requireRole("customer"), async (req, res) => {
  await q("DELETE FROM wishlists WHERE user_id=? AND product_id=?", [req.user.id, req.params.productId]);
  res.json({ message: "Removed from wishlist." });
});

function generateTransactionId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NEX-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// ========== PAYMENT GATEWAY - Supports Card, COD, Mobile Banking (bKash, Nagad, UPay) ==========
function processPayment({ method, card = {}, mobilePhone, mobileBank, amount }) {
  if (amount <= 0) return { ok: false, message: "Invalid amount." };

  if (method === "cod") {
    return { ok: true, transactionId: `COD-${Date.now()}`, paymentStatus: "cod_pending" };
  }

  if (method === "mobile_banking") {
    return { ok: true, transactionId: `MB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`, paymentStatus: "paid" };
  }

  // Card payment
  const digits = String(card.cardNumber || "").replace(/\s+/g, "");
  if (digits.length < 12 || digits.length > 19 || !/^\d+$/.test(digits))
    return { ok: false, message: "Invalid card number." };
  if (!/^\d{2}\/\d{2}$/.test(card.expiry || ""))
    return { ok: false, message: "Invalid card expiry." };
  if (!/^\d{3,4}$/.test(card.cvv || ""))
    return { ok: false, message: "Invalid CVV." };
  return { ok: true, transactionId: generateTransactionId(), paymentStatus: "paid" };
}

app.post("/api/payment/verify-otp", (req, res) => {
  const { otp } = req.body;
  if (otp && String(otp).length === 4 && /^\d{4}$/.test(otp)) {
    res.json({ ok: true, message: "OTP verified." });
  } else {
    res.json({ ok: false, message: "Invalid OTP. Enter 4 digits." });
  }
});

app.post("/api/orders", requireAuth, requireRole("customer"), async (req, res) => {
  const { items, shippingAddress, contactPhone, paymentMethod = "Card", card = {}, mobilePhone, mobileBank } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty." });
  if (!shippingAddress || !String(shippingAddress).trim()) return res.status(400).json({ message: "Delivery address is required." });
  if (!contactPhone || !String(contactPhone).trim()) return res.status(400).json({ message: "Contact phone number is required." });

  if (paymentMethod === "mobile_banking") {
    if (!mobilePhone || !/^01\d{9}$/.test(mobilePhone))
      return res.status(400).json({ message: "Mobile number must be 11 digits starting with 01." });
    if (!["bKash", "Nagad", "UPay"].includes(mobileBank))
      return res.status(400).json({ message: "Select bKash, Nagad, or UPay." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    const normalized = [];
    for (const item of items) {
      const rows = await conn.execute("SELECT * FROM products WHERE id=? AND active=1 FOR UPDATE", [item.productId]);
      const p = rows[0][0];
      if (!p) throw new Error("Product unavailable.");
      const qty = Math.max(1, Number(item.quantity || 1));
      if (p.quantity < qty) throw new Error(`Insufficient stock for ${p.name}.`);
      const line = Number(p.price) * qty;
      total += line;
      normalized.push({ p, qty, line });
    }
    const payment = processPayment({ method: paymentMethod, card, mobilePhone, mobileBank, amount: total });
    if (!payment.ok) throw new Error(payment.message);

    const adminCut = +(total * 0.20).toFixed(2);
    const sellerCut = +(total * 0.80).toFixed(2);
    const orderResult = await conn.execute(
      `INSERT INTO orders(customer_id,total_amount,admin_revenue,seller_revenue,payment_method,payment_status,status,shipping_address,contact_phone,transaction_id,customer_approved,mobile_bank,mobile_phone)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)`,
      [req.user.id, total, adminCut, sellerCut, paymentMethod, payment.paymentStatus, "confirmed", shippingAddress, contactPhone, payment.transactionId, paymentMethod === "mobile_banking" ? mobileBank : null, paymentMethod === "mobile_banking" ? mobilePhone : null]
    );
    const orderId = orderResult[0].insertId;
    for (const {p,qty} of normalized) {
      await conn.execute("INSERT INTO order_items(order_id,product_id,seller_id,quantity,unit_price,line_total) VALUES (?,?,?,?,?,?)",
        [orderId, p.id, p.seller_id, qty, p.price, Number(p.price) * qty]);
      await conn.execute("UPDATE products SET quantity=quantity-? WHERE id=?", [qty, p.id]);
      await conn.execute("INSERT INTO notifications(user_id,type,title,message) VALUES (?,?,?,?)",
        [p.seller_id, "order", "New Order #" + orderId, `Order #${orderId} has been placed. Payment: ${paymentMethod}.`]);
    }
    const admins = await conn.execute("SELECT id FROM users WHERE role='admin'");
    for (const a of admins[0]) {
      await conn.execute("INSERT INTO notifications(user_id,type,title,message) VALUES (?,?,?,?)",
        [a.id, "order", "New Order #" + orderId, `Order #${orderId} placed. Payment: ${paymentMethod}. Total: ৳${total.toFixed(2)}`]);
    }
    await conn.execute("INSERT INTO notifications(user_id,type,title,message) VALUES (?,?,?,?)",
      [req.user.id, "order", "Order Confirmed", `Order #${orderId} has been confirmed. Transaction ID: ${payment.transactionId}.`]);
    await conn.commit();
    res.status(201).json({ orderId, total, adminRevenue: adminCut, sellerRevenue: sellerCut, transactionId: payment.transactionId, paymentStatus: payment.paymentStatus, message: "Payment successful" });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ message: e.message });
  } finally { conn.release(); }
});

app.get("/api/orders", requireAuth, async (req, res) => {
  const where = req.user.role === "customer" ? "o.customer_id=?" :
    req.user.role === "seller" ? "oi.seller_id=?" : "1=1";
  const params = req.user.role === "admin" ? [] : [req.user.id];
  const rows = await q(`SELECT DISTINCT o.*, u.name customer_name FROM orders o
    JOIN users u ON u.id=o.customer_id
    LEFT JOIN order_items oi ON oi.order_id=o.id
    WHERE ${where} ORDER BY o.created_at DESC`, params);
  res.json(rows.map(r => ({...r, total_amount:Number(r.total_amount),admin_revenue:Number(r.admin_revenue),seller_revenue:Number(r.seller_revenue)})));
});

app.get("/api/orders/:id", requireAuth, async (req, res) => {
  const rows = await q(`SELECT o.*, u.name customer_name, u.phone customer_phone, u.email customer_email FROM orders o JOIN users u ON u.id=o.customer_id WHERE o.id=?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Order not found." });
  const o = rows[0];
  if (req.user.role === "customer" && o.customer_id !== req.user.id) return res.status(403).json({message:"Permission denied."});
  const items = await q(`SELECT oi.*,p.name,p.photos FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`, [req.params.id]);
  res.json({...o,total_amount:Number(o.total_amount),admin_revenue:Number(o.admin_revenue),seller_revenue:Number(o.seller_revenue),
    items:items.map(i=>({...i,unit_price:Number(i.unit_price),line_total:Number(i.line_total),photos:i.photos?JSON.parse(i.photos):[]}))});
});

// ========== ORDER STATUS MANAGEMENT ==========
app.put("/api/orders/:id/ship", requireAuth, async (req, res) => {
  if (req.user.role !== "seller" && req.user.role !== "admin")
    return res.status(403).json({ message: "Only sellers or admins can update order status." });
  const rows = await q("SELECT * FROM orders WHERE id=?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Order not found." });
  if (rows[0].status !== "confirmed") return res.status(400).json({ message: "Only confirmed orders can be shipped." });
  await q("UPDATE orders SET status='shipped' WHERE id=?", [req.params.id]);
  const order = rows[0];
  await notify(order.customer_id, "order", "Order Shipped", `Order #${req.params.id} has been shipped and is on its way!`);
  const admins = await q("SELECT id FROM users WHERE role='admin'");
  for (const a of admins) await notify(a.id, "order", "Order Shipped", `Order #${req.params.id} marked as shipped.`);
  res.json({ message: "Order marked as shipped." });
});

app.put("/api/orders/:id/deliver", requireAuth, async (req, res) => {
  if (req.user.role !== "seller" && req.user.role !== "admin")
    return res.status(403).json({ message: "Only sellers or admins can update order status." });
  const rows = await q("SELECT * FROM orders WHERE id=?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Order not found." });
  if (rows[0].status !== "shipped") return res.status(400).json({ message: "Only shipped orders can be marked as delivered." });
  await q("UPDATE orders SET status='delivered' WHERE id=?", [req.params.id]);
  const order = rows[0];
  await notify(order.customer_id, "order", "Order Delivered", `Order #${req.params.id} has been delivered. Please confirm receipt.`);
  const admins = await q("SELECT id FROM users WHERE role='admin'");
  for (const a of admins) await notify(a.id, "order", "Order Delivered", `Order #${req.params.id} marked as delivered, awaiting customer approval.`);
  res.json({ message: "Order marked as delivered. Awaiting customer confirmation." });
});

app.put("/api/orders/:id/approve", requireAuth, async (req, res) => {
  if (req.user.role !== "customer") return res.status(403).json({ message: "Only customers can approve delivery." });
  const rows = await q("SELECT * FROM orders WHERE id=? AND customer_id=?", [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ message: "Order not found." });
  if (rows[0].status !== "delivered") return res.status(400).json({ message: "Only delivered orders can be approved." });
  await q("UPDATE orders SET customer_approved=1 WHERE id=?", [req.params.id]);
  const order = rows[0];
  const sellers = await q("SELECT DISTINCT seller_id FROM order_items WHERE order_id=?", [req.params.id]);
  for (const s of sellers) await notify(s.seller_id, "order", "Delivery Confirmed", `Customer approved delivery for Order #${req.params.id}.`);
  const admins = await q("SELECT id FROM users WHERE role='admin'");
  for (const a of admins) await notify(a.id, "order", "Delivery Confirmed", `Customer confirmed delivery for Order #${req.params.id}.`);
  res.json({ message: "Delivery confirmed. Thank you!" });
});

app.get("/api/notifications", requireAuth, async (req,res) => {
  res.json(await q("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50",[req.user.id]));
});
app.put("/api/notifications/:id/read", requireAuth, async (req,res) => {
  await q("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",[req.params.id,req.user.id]); res.json({ok:true});
});

app.get("/api/notifications/unread", requireAuth, async (req, res) => {
  const rows = await q("SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=0", [req.user.id]);
  res.json({ count: rows[0].count });
});

app.get("/api/seller/products", requireAuth, requireRole("seller"), async (req,res) => {
  const rows = await q("SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE seller_id=? ORDER BY p.created_at DESC",[req.user.id]);
  res.json(rows.map(productDto));
});

app.post("/api/seller/products", requireAuth, requireRole("seller"), upload.single("photo"), async (req,res) => {
  try {
    const { name, description, price, quantity, categoryId } = req.body;
    let photos = [];
    if (req.file) {
      photos.push(`/uploads/${req.file.filename}`);
    }
    const r = await q("INSERT INTO products(seller_id,category_id,name,description,price,quantity,photos,active) VALUES (?,?,?,?,?,?,?,1)",
      [req.user.id, categoryId, name, description, Number(price), Number(quantity), JSON.stringify(photos)]);
    res.status(201).json({ id: r.insertId, message: "Product created." });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

// FIXED: Added upload.single("photo") and merged form data logic
app.put("/api/seller/products/:id", requireAuth, requireRole("seller"), upload.single("photo"), async (req,res) => {
  try {
    const { name, description, price, quantity, categoryId, active } = req.body;
    const rows = await q("SELECT photos FROM products WHERE id=? AND seller_id=?", [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "Product not found." });
    
    let photos = [];
    if (rows[0].photos) {
      try { photos = JSON.parse(rows[0].photos); } catch(e) { photos = []; }
    }
    
    // THIS IS THE FIX: It replaces the old photo array with the new one
    if (req.file) {
      photos = [`/uploads/${req.file.filename}`];
    }
    
    const isActive = active === "true" || active === true ? 1 : 0;
    
    await q("UPDATE products SET name=?,description=?,price=?,quantity=?,category_id=?,photos=?,active=? WHERE id=? AND seller_id=?",
      [name, description, Number(price), Number(quantity), categoryId, JSON.stringify(photos), isActive, req.params.id, req.user.id]);
      
    res.json({ message: "Product updated." });
  } catch(e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/api/seller/products/:id", requireAuth, requireRole("seller"), async (req,res) => {
  await q("DELETE FROM products WHERE id=? AND seller_id=?",[req.params.id,req.user.id]); res.json({message:"Product deleted."});
});
app.post("/api/seller/products/:id/photos", requireAuth, requireRole("seller"), upload.single("photo"), async (req,res) => {
  if (!req.file) return res.status(400).json({message:"Photo required."});
  const rows=await q("SELECT photos FROM products WHERE id=? AND seller_id=?",[req.params.id,req.user.id]);
  if (!rows.length) return res.status(404).json({message:"Product not found."});
  const photos=rows[0].photos?JSON.parse(rows[0].photos):[];
  photos.push(`/uploads/${req.file.filename}`);
  await q("UPDATE products SET photos=? WHERE id=? AND seller_id=?",[JSON.stringify(photos),req.params.id,req.user.id]);
  res.json({photos});
});

app.get("/api/seller/analytics", requireAuth, requireRole("seller"), async (req,res) => {
  const [summary]=await Promise.all([
    q(`SELECT COALESCE(SUM(seller_revenue),0) revenue,COUNT(*) orders FROM orders o
       WHERE EXISTS(SELECT 1 FROM order_items oi WHERE oi.order_id=o.id AND oi.seller_id=?) AND payment_status='paid'`,[req.user.id])
  ]);
  const monthly=await q(`SELECT DATE_FORMAT(o.created_at,'%Y-%m') month,SUM(oi.line_total)*0.8 revenue
    FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.seller_id=? AND o.payment_status='paid'
    GROUP BY month ORDER BY month`,[req.user.id]);
  res.json({summary:summary[0],monthly});
});

app.get("/api/reviews", async (req,res) => {
  const rows=await q(`SELECT r.*,u.name customer_name,p.name product_name FROM reviews r
    JOIN users u ON u.id=r.customer_id JOIN products p ON p.id=r.product_id
    WHERE r.product_id=? ORDER BY r.created_at DESC`,[req.query.productId]);
  res.json(rows);
});
app.post("/api/reviews", requireAuth, requireRole("customer"), async (req,res) => {
  const {productId,rating,comment}=req.body;
  const text=(comment||"").toLowerCase();
  const positive=["good","great","excellent","love","fast","amazing","perfect","nice","quality"].filter(w=>text.includes(w)).length;
  const negative=["bad","poor","slow","hate","broken","terrible","worst"].filter(w=>text.includes(w)).length;
  const sentiment=positive>negative?"positive":negative>positive?"negative":"neutral";
  await q("INSERT INTO reviews(product_id,customer_id,rating,comment,sentiment) VALUES (?,?,?,?,?)",
    [productId,req.user.id,rating,comment,sentiment]);
  res.status(201).json({message:"Review submitted.",sentiment});
});

// ========== AI CHATBOT ==========
app.post("/api/ai/chat", requireAuth, async (req,res) => {
  const rawMsg = (req.body.message||"").toLowerCase().trim();
  let answer = "I'm not sure how to help with that. You can ask me about products, stock levels, your orders, payments, or returns.";
  
  // Intent: Greetings
  if(/^(hi|hello|hey|salam|assalam|yo)\b/.test(rawMsg)) {
    answer = "Hello! I'm your NEXUS AI Assistant. I can help you find products, check stock, track orders, or explain payment methods. What's on your mind?";
  } 
  // Intent: Help
  else if(rawMsg.includes("help") || rawMsg.includes("what can you do")) {
    answer = "I can do quite a bit! Try asking:\n- 'Do you have any laptops?'\n- 'Is the wireless headphone in stock?'\n- 'Where is my order?'\n- 'What payment methods do you accept?'";
  }
  // Intent: Order Tracking
  else if(rawMsg.includes("order") || rawMsg.includes("track") || rawMsg.includes("delivery") || rawMsg.includes("shipment")) {
    const rows = await q("SELECT id, status, payment_status, total_amount FROM orders WHERE customer_id=? ORDER BY created_at DESC LIMIT 3", [req.user.id]);
    if(rows.length) {
      answer = "Here are your recent orders:\n" + rows.map(o => `Order #${o.id} - Status: ${o.status.toUpperCase()} - Total: ৳${o.total_amount}`).join("\n");
    } else {
      answer = "You haven't placed any orders yet. Would you like me to recommend some products?";
    }
  } 
  // Intent: Returns & Refunds
  else if(rawMsg.includes("return") || rawMsg.includes("refund") || rawMsg.includes("exchange")) {
    answer = "Our return policy allows refunds within 7 days of delivery. For this demo, you can record a return request by contacting the seller or admin directly.";
  }
  // Intent: Payment Methods
  else if(rawMsg.includes("payment") || rawMsg.includes("pay") || rawMsg.includes("cod") || rawMsg.includes("bkash") || rawMsg.includes("card")) {
    answer = "We support three secure payment methods:\n1. Cash on Delivery (COD)\n2. Mobile Banking (bKash, Nagad, UPay)\n3. Credit/Debit Cards. All transactions are securely processed!";
  }
  // Intent: Recommendations
  else if(rawMsg.includes("recommend") || rawMsg.includes("suggest") || rawMsg.includes("what should i buy")) {
    const rows = await q("SELECT p.name, p.price FROM products p WHERE p.active=1 ORDER BY p.created_at DESC LIMIT 3");
    answer = rows.length ? `Based on our latest arrivals, I highly recommend: ${rows.map(p => `${p.name} (৳${p.price})`).join(", ")}.` : "We have no products to recommend right now.";
  }
  // Intent: Product Search, Category Search & Stock Check
  else {
    // Extract meaningful words (ignore stop words)
    const stopWords = new Set(["i", "want", "to", "buy", "do", "you", "have", "is", "the", "a", "in", "of", "are", "there", "any", "stock", "available", "price", "cost", "how", "much", "for", "need", "show", "me", "list"]);
    const keywords = rawMsg.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    
    if(keywords.length > 0) {
      // Search database for name, description, OR category matches
      const searchSql = `
        SELECT p.name, p.price, p.quantity, c.name as category_name 
        FROM products p 
        JOIN categories c ON c.id = p.category_id 
        WHERE p.active=1 AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?) 
        LIMIT 5
      `;
      const param = `%${keywords.join(" ")}%`;
      const rows = await q(searchSql, [param, param, param]);
      
      if(rows.length) {
        // Check if user specifically asked about stock
        if(rawMsg.includes("stock") || rawMsg.includes("available")) {
          answer = "Here is the current stock status:\n" + rows.map(p => `${p.name}: ${p.quantity > 0 ? `${p.quantity} units available` : "Out of stock"}`).join("\n");
        } 
        // Check if user specifically asked about price
        else if(rawMsg.includes("price") || rawMsg.includes("cost") || rawMsg.includes("how much")) {
          answer = "Here are the prices:\n" + rows.map(p => `${p.name}: ৳${p.price}`).join("\n");
        } 
        // General product info (Includes category name now!)
        else {
          answer = "I found the following products:\n" + rows.map(p => `${p.name} (${p.category_name}) - ৳${p.price} [${p.quantity > 0 ? "In Stock" : "Out of Stock"}]`).join("\n");
        }
      } else {
        answer = `I couldn't find any products or categories matching "${keywords.join(" ")}". Try searching for 'Electronics' or 'Books'.`;
      }
    }
  }
  
  
  res.json({ answer });
});

// ========== ADMIN ENDPOINTS ==========
app.get("/api/admin/users", requireAuth, requireRole("admin"), async (_req,res)=>res.json(await q("SELECT id,name,email,role,age,gender,profession,active,created_at FROM users ORDER BY created_at DESC")));
app.put("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req,res)=>{
  await q("UPDATE users SET active=? WHERE id=?",[req.body.active?1:0,req.params.id]); res.json({message:"User status updated."});
});
app.get("/api/admin/products", requireAuth, requireRole("admin"), async (_req,res)=>{
  const rows=await q(`SELECT p.*,c.name category_name,u.name seller_name FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.seller_id ORDER BY p.created_at DESC`);
  res.json(rows.map(productDto));
});
app.put("/api/admin/products/:id", requireAuth, requireRole("admin"), async (req,res)=>{
  await q("UPDATE products SET active=? WHERE id=?",[req.body.active?1:0,req.params.id]); res.json({message:"Product status updated."});
});
app.get("/api/admin/analytics", requireAuth, requireRole("admin"), async (_req,res)=>{
  const [summary]=await Promise.all([q(`SELECT COUNT(*) orders,COALESCE(SUM(total_amount),0) gross,
    COALESCE(SUM(admin_revenue),0) platform_revenue,COALESCE(SUM(seller_revenue),0) seller_revenue
    FROM orders WHERE payment_status='paid'`)]);
  const sellers=await q(`SELECT u.name,COALESCE(SUM(o.seller_revenue),0) revenue,COUNT(DISTINCT o.id) orders
    FROM users u LEFT JOIN order_items oi ON oi.seller_id=u.id LEFT JOIN orders o ON o.id=oi.order_id
    WHERE u.role='seller' GROUP BY u.id ORDER BY revenue DESC`);
  const withdrawn=await q("SELECT COALESCE(SUM(amount),0) as total FROM bank_transfers WHERE status='completed'");
  res.json({summary:{...summary[0],withdrawn:Number(withdrawn[0].total)},sellers});
});

// ========== BANK TRANSFERS ==========
app.post("/api/transfers", requireAuth, async (req,res)=>{
  if(!["seller","admin"].includes(req.user.role)) return res.status(403).json({message:"Only sellers/admins can request transfers."});
  const amount=Number(req.body.amount);
  const bankName=req.body.bankName||"";
  const account=req.body.account||"";
  if(!bankName.trim()) return res.status(400).json({message:"Bank name is required."});
  if(!account.trim()) return res.status(400).json({message:"Account number is required."});
  if(!amount || amount<=0) return res.status(400).json({message:"Valid amount required."});
  if(req.user.role==="seller"){
    const bal=await q("SELECT COALESCE(SUM(seller_revenue),0) r FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.seller_id=? AND o.payment_status='paid'",[req.user.id]);
    const wd=await q("SELECT COALESCE(SUM(amount),0) w FROM bank_transfers WHERE user_id=? AND status='completed'",[req.user.id]);
    const available=Number(bal[0].r)-Number(wd[0].w);
    if(amount>available) return res.status(400).json({message:`Insufficient balance. Available: ৳${available.toFixed(2)}`});
  }
  const txnId = generateTransactionId();
  await q("INSERT INTO bank_transfers(user_id,amount,bank_name,account_last4,status,transaction_id,completed_at) VALUES (?,?,?,?,?,?,NOW())",
    [req.user.id, amount, bankName, String(account).slice(-4), "completed", txnId]);
  const transfer = { id: 0, amount, bank_name: bankName, account_last4: String(account).slice(-4), transaction_id: txnId, status: "completed", completed_at: new Date().toISOString() };
  res.status(201).json({ message: "Transfer Completed", transfer });
});

app.get("/api/transfers", requireAuth, async (req, res) => {
  const where = req.user.role === "admin" ? "1=1" : "user_id=?";
  const params = req.user.role === "admin" ? [] : [req.user.id];
  const rows = await q(`SELECT bt.*, u.name user_name FROM bank_transfers bt JOIN users u ON u.id=bt.user_id WHERE ${where} ORDER BY bt.created_at DESC`, params);
  const totalRows = await q(`SELECT COALESCE(SUM(amount),0) as total FROM bank_transfers WHERE status='completed' AND (${where})`, params);
  res.json({ transfers: rows.map(r => ({...r, amount: Number(r.amount)})), total_withdrawn: Number(totalRows[0].total) });
});

app.get("/api/transfers/:id", requireAuth, async (req, res) => {
  const rows = await q(`SELECT bt.*, u.name user_name, u.email user_email FROM bank_transfers bt JOIN users u ON u.id=bt.user_id WHERE bt.id=?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: "Transfer not found." });
  const t = rows[0];
  if (req.user.role !== "admin" && t.user_id !== req.user.id) return res.status(403).json({ message: "Permission denied." });
  res.json({ ...t, amount: Number(t.amount) });
});

app.get("/api/dashboard", requireAuth, async (req,res)=>{
  if(req.user.role==="customer"){
    const [orders,wishlist]=await Promise.all([
      q("SELECT COUNT(*) count FROM orders WHERE customer_id=?",[req.user.id]),
      q("SELECT COUNT(*) count FROM wishlists WHERE user_id=?",[req.user.id])
    ]);
    return res.json({orders:orders[0].count,wishlist:wishlist[0].count});
  }
  if(req.user.role==="seller"){
    const rows=await q(`SELECT COALESCE(SUM(o.seller_revenue),0) revenue,COUNT(DISTINCT o.id) orders
      FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.seller_id=? AND o.payment_status='paid'`,[req.user.id]);
    const products=await q("SELECT COUNT(*) count FROM products WHERE seller_id=?",[req.user.id]);
    const withdrawn=await q("SELECT COALESCE(SUM(amount),0) total FROM bank_transfers WHERE user_id=? AND status='completed'",[req.user.id]);
    return res.json({revenue:Number(rows[0].revenue),orders:rows[0].orders,products:products[0].count,withdrawn:Number(withdrawn[0].total)});
  }
  const rows=await q("SELECT COUNT(*) orders,COALESCE(SUM(total_amount),0) gross,COALESCE(SUM(admin_revenue),0) revenue FROM orders WHERE payment_status='paid'");
  const users=await q("SELECT COUNT(*) count FROM users");
  const withdrawn=await q("SELECT COALESCE(SUM(amount),0) total FROM bank_transfers WHERE status='completed'");
  res.json({orders:rows[0].orders,gross:Number(rows[0].gross),revenue:Number(rows[0].revenue),users:users[0].count,withdrawn:Number(withdrawn[0].total)});
});

app.use((err, _req, res, _next) => res.status(500).json({message: err.message || "Server error."}));
app.listen(Number(process.env.PORT || 5000), ()=>console.log("NEXUS API running on http://localhost:5000"));