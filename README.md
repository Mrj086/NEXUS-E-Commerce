# NEXUS — AI E-Commerce Management System

Academic/demo-ready local e-commerce application with Customer, Seller and Admin roles.

## UI
- Refreshed, industry-style design system (design tokens, motion/animation library, refined states for every page) in `frontend/src/styles.css`.
- New animated landing page: a Three.js-powered 3D "AI commerce engine" visual (rotating node network with a pulsing core and a live traveling data point) inside the hero panel — see `frontend/src/Hero3D.jsx`.
- Staggered entrance transitions on the hero, product grids, and stat cards, plus a fade transition whenever you switch pages.
- Run `npm install` in `frontend/` after pulling this update — it adds the `three` package used by the new landing visual.

## Stack
- Frontend: React + Vite + Three.js
- Backend: Node.js + Express
- Database: MySQL (XAMPP)
- Authentication: JWT + bcrypt
- Charts: Recharts
- AI features are local/rule-based so no paid API is required:
  - Personalized recommendations
  - Image-search interface with filename/category matching fallback
  - Product/order support chatbot
  - Voice product search using browser SpeechRecognition when available
  - Review sentiment analysis
  - Sales/demand forecasting

## Revenue rule
For each paid order:
- Seller receives 80%
- Platform/Admin receives 20%

Revenue is calculated server-side and stored per order.

## Requirements
- Node.js 18+
- XAMPP with Apache + MySQL
- Modern Chrome/Edge recommended for voice search

## 1. Database
1. Start MySQL from XAMPP.
2. Open phpMyAdmin.
3. Import `database/nexus.sql`.
4. Default database is `nexus`.

The backend also seeds demo accounts if the database is empty.

## 2. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Linux/macOS:
```bash
cp .env.example .env
npm install
npm run dev
```

Backend: http://localhost:5000

Edit `.env` if your XAMPP MySQL password/port differs.

## 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal, normally http://localhost:5173.

## Demo accounts
- Admin: admin@nexus.local / Admin123!
- Seller: seller@nexus.local / Seller123!
- Customer: customer@nexus.local / Customer123!

New customers and sellers can register from the login page.

## Fixes in this update
- **Login failing with the correct demo password**: the shipped SQL used a placeholder bcrypt hash
  that didn't match ANY password. `database/nexus.sql` now ships real hashes for the three demo
  accounts. If you already imported the old file, run `database/migrate_fixes.sql` instead of
  re-importing everything.
- **No "My Orders" page / no account menu**: clicking the round avatar in the top-right now opens
  a dropdown with **My Profile**, **My Orders** (customers), the role dashboard, and **Logout**.
  A new "My Orders" page lists full order history with a per-order invoice download.
  Customers now also get a `phone` field on their profile.
- **Search bar missing**: a persistent search box now sits in the header (desktop) in addition to
  the full search/voice/image bar on the Shop page.
  A change-password form was also added under Profile.
- **AI image search not working**: the frontend was calling `/api/products/image-search` but the
  backend only defined `/api/products/:id/image-search` — a 404 on every attempt. The endpoint is
  fixed and now scores the uploaded filename's keywords against the product catalog for a better
  local match, with a sensible fallback list instead of an empty result.
- **Voice search**: added proper `lang`, start/error/end handling, and a "Listening..." indicator
  so failures (e.g. blocked microphone, unsupported browser) show a clear message instead of doing
  nothing.
- **Chatbot**: unchanged logic, but errors are now caught so a failed request shows a message in
  the chat instead of silently doing nothing; a welcome message is now shown on load.
- **Footer**: now reads exactly "NEXUS © 2026 AI Based Marketplace."
- **Payment gateway**: "Pay now" opens a demo payment gateway modal (card number, expiry, CVV,
  name) that is validated and produces a transaction ID server-side (`POST /api/orders`). Delivery
  address and a contact phone number are now required before payment.
- **PDF invoice**: order success and "My Orders" both offer a real PDF invoice (via jsPDF)
  containing Customer Name, Phone Number, Order Number, Delivery Address, Transaction ID and
  Amount — replacing the old browser print button.
- **Seller product photos**: the backend already had a photo-upload endpoint that the UI never
  called. Sellers can now upload a photo directly from the Inventory list (in addition to pasting
  photo URLs).
- **Bug fixes**: the Catalog page crashed when clicking "Order now" because `nav` wasn't passed
  into it; a malformed SQL placeholder string in order creation was cleaned up; admin/seller pages
  now show explicit empty states and surface request errors instead of failing silently.

## Main workflows
Customer:
- Search/filter products
- Product detail modal
- Add to cart / Order Now
- Checkout and demo payment
- Successful payment → order page
- Download invoice
- Wishlist, reviews, profile
- AI recommendations using age, profession, gender, browsing/search history
- Image search UI
- Voice search
- AI chatbot

Seller:
- Dashboard revenue/statistics
- Product CRUD
- Multiple product photos
- Active/inactive products
- Inventory/stock status
- Orders and reviews
- Bank transfer request

Admin:
- Platform analytics
- Users/sellers/products/orders
- Activate/deactivate products
- Notifications
- Bank transfer request

## Payment note
This academic build uses a local "demo payment" flow rather than a real gateway. Do not use it for real money without integrating a regulated payment provider and proper security/compliance.

## Production hardening
For deployment, add HTTPS, CSRF protection, rate limiting, secure cookies, object storage for images, real payment verification/webhooks, email/SMS notifications, audit logs, and stronger authorization policies.
