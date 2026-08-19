const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const db = new PrismaClient();

async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('Seeding database...');

  // 1. Create Users
  const admin = await db.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: await hashPassword('demo1234'),
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const customer1 = await db.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      password: await hashPassword('demo1234'),
      name: 'Alice Johnson',
      role: 'CUSTOMER',
      age: 28,
      profession: 'Software Engineer',
      phone: '+1234567890',
      address: '123 Tech Street, San Francisco, CA',
      isActive: true,
    },
  });

  const customer2 = await db.user.upsert({
    where: { email: 'customer2@demo.com' },
    update: {},
    create: {
      email: 'customer2@demo.com',
      password: await hashPassword('demo1234'),
      name: 'Bob Smith',
      role: 'CUSTOMER',
      age: 35,
      profession: 'Designer',
      phone: '+0987654321',
      address: '456 Design Ave, New York, NY',
      isActive: true,
    },
  });

  const customer3 = await db.user.upsert({
    where: { email: 'customer3@demo.com' },
    update: {},
    create: {
      email: 'customer3@demo.com',
      password: await hashPassword('demo1234'),
      name: 'Carol Davis',
      role: 'CUSTOMER',
      age: 22,
      profession: 'Student',
      phone: '+1122334455',
      address: '789 Campus Blvd, Boston, MA',
      isActive: true,
    },
  });

  const seller1 = await db.user.upsert({
    where: { email: 'seller@demo.com' },
    update: {},
    create: {
      email: 'seller@demo.com',
      password: await hashPassword('demo1234'),
      name: 'TechStore Inc.',
      role: 'SELLER',
      phone: '+1555666777',
      address: '100 Commerce St, Austin, TX',
      isActive: true,
    },
  });

  const seller2 = await db.user.upsert({
    where: { email: 'seller2@demo.com' },
    update: {},
    create: {
      email: 'seller2@demo.com',
      password: await hashPassword('demo1234'),
      name: 'FashionHub',
      role: 'SELLER',
      phone: '+1555777888',
      address: '200 Style Blvd, Los Angeles, CA',
      isActive: true,
    },
  });

  console.log('Users created');

  // 2. Create Products
  const productData = [
    { name: 'Pro Laptop 15"', description: 'High-performance laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers and creative professionals.', price: 1499.99, discountPrice: 1299.99, category: 'Electronics', subcategory: 'Laptops', tags: 'laptop,computer,developer,professional,work,portable', targetAgeMin: 20, targetAgeMax: 50, targetProfessions: 'Software Engineer,Designer,Freelancer,Business Owner', stockQuantity: 25, rating: 4.8, reviewCount: 156, isFeatured: true, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop' },
    { name: 'Wireless Noise-Canceling Headphones', description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support.', price: 349.99, discountPrice: 279.99, category: 'Electronics', subcategory: 'Audio', tags: 'headphones,audio,wireless,noise-canceling,music,work', targetAgeMin: 18, targetAgeMax: 55, targetProfessions: 'Software Engineer,Designer,Freelancer,Student,Other', stockQuantity: 50, rating: 4.6, reviewCount: 89, isFeatured: true, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop' },
    { name: '4K Ultra Monitor 27"', description: 'IPS panel with 4K resolution, USB-C connectivity, and color accuracy for design and development work.', price: 599.99, discountPrice: null, category: 'Electronics', subcategory: 'Monitors', tags: 'monitor,display,4k,developer,designer,work', targetAgeMin: 20, targetAgeMax: 50, targetProfessions: 'Software Engineer,Designer,Freelancer', stockQuantity: 15, rating: 4.7, reviewCount: 42, isFeatured: false, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop' },
    { name: 'Mechanical Keyboard RGB', description: 'Hot-swappable mechanical keyboard with RGB lighting, wireless connectivity, and premium keycaps.', price: 149.99, discountPrice: 119.99, category: 'Electronics', subcategory: 'Accessories', tags: 'keyboard,mechanical,gaming,developer,rgb', targetAgeMin: 16, targetAgeMax: 40, targetProfessions: 'Software Engineer,Student,Freelancer', stockQuantity: 100, rating: 4.5, reviewCount: 210, isFeatured: false, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop' },
    { name: 'Classic Leather Backpack', description: 'Handcrafted genuine leather backpack with laptop compartment, multiple pockets, and adjustable straps.', price: 189.99, discountPrice: 149.99, category: 'Fashion', subcategory: 'Bags', tags: 'backpack,leather,bag,work,school,travel', targetAgeMin: 18, targetAgeMax: 45, targetProfessions: 'Software Engineer,Designer,Student,Freelancer,Business Owner', stockQuantity: 30, rating: 4.4, reviewCount: 67, isFeatured: true, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop' },
    { name: 'Minimalist Smart Watch', description: 'Sleek smart watch with health tracking, GPS, notifications, and 5-day battery life.', price: 299.99, discountPrice: null, category: 'Fashion', subcategory: 'Watches', tags: 'watch,smartwatch,fitness,health,gps', targetAgeMin: 18, targetAgeMax: 50, targetProfessions: 'Software Engineer,Designer,Doctor,Business Owner,Freelancer,Student', stockQuantity: 40, rating: 4.3, reviewCount: 93, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop' },
    { name: 'Premium Sunglasses', description: 'UV400 polarized sunglasses with lightweight titanium frame and anti-scratch lenses.', price: 159.99, discountPrice: 129.99, category: 'Fashion', subcategory: 'Eyewear', tags: 'sunglasses,uv,polarized,fashion,summer', targetAgeMin: 18, targetAgeMax: 55, targetProfessions: 'Designer,Business Owner,Freelancer,Other', stockQuantity: 60, rating: 4.2, reviewCount: 45, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop' },
    { name: 'Smart Desk Lamp', description: 'LED desk lamp with adjustable color temperature, brightness control, and wireless phone charging base.', price: 79.99, discountPrice: null, category: 'Home & Garden', subcategory: 'Lighting', tags: 'lamp,desk,led,smart,work,study', targetAgeMin: 16, targetAgeMax: 50, targetProfessions: 'Software Engineer,Designer,Student,Freelancer,Teacher', stockQuantity: 80, rating: 4.5, reviewCount: 78, isFeatured: false, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab852?w=600&h=600&fit=crop' },
    { name: 'Ergonomic Office Chair', description: 'Full mesh office chair with lumbar support, adjustable armrests, and headrest for all-day comfort.', price: 499.99, discountPrice: 399.99, category: 'Home & Garden', subcategory: 'Furniture', tags: 'chair,ergonomic,office,work,comfort', targetAgeMin: 20, targetAgeMax: 60, targetProfessions: 'Software Engineer,Designer,Business Owner,Freelancer,Teacher', stockQuantity: 10, rating: 4.8, reviewCount: 134, isFeatured: true, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop' },
    { name: 'Clean Code (2nd Edition)', description: 'A handbook of agile software craftsmanship. Essential reading for every developer.', price: 44.99, discountPrice: null, category: 'Books', subcategory: 'Programming', tags: 'book,programming,clean code,developer,software', targetAgeMin: 18, targetAgeMax: 50, targetProfessions: 'Software Engineer,Student,Freelancer', stockQuantity: 200, rating: 4.9, reviewCount: 312, isFeatured: true, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop' },
    { name: 'Design Thinking Guide', description: 'A comprehensive guide to design thinking methodology for product design and innovation.', price: 29.99, discountPrice: 19.99, category: 'Books', subcategory: 'Design', tags: 'book,design,design thinking,creative,innovation', targetAgeMin: 18, targetAgeMax: 45, targetProfessions: 'Designer,Student,Business Owner,Freelancer,Marketing', stockQuantity: 150, rating: 4.4, reviewCount: 56, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=600&fit=crop' },
    { name: 'Yoga Mat Premium', description: 'Extra thick, non-slip yoga mat with alignment lines and carrying strap. Eco-friendly materials.', price: 49.99, discountPrice: null, category: 'Sports', subcategory: 'Yoga', tags: 'yoga,mat,fitness,exercise,wellness', targetAgeMin: 16, targetAgeMax: 60, targetProfessions: 'Software Engineer,Designer,Teacher,Student,Doctor,Freelancer,Other', stockQuantity: 120, rating: 4.6, reviewCount: 98, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop' },
    { name: 'Running Shoes Ultra', description: 'Lightweight running shoes with responsive cushioning and breathable mesh upper.', price: 129.99, discountPrice: 99.99, category: 'Sports', subcategory: 'Shoes', tags: 'shoes,running,fitness,sports,exercise', targetAgeMin: 16, targetAgeMax: 55, targetProfessions: 'Software Engineer,Student,Doctor,Freelancer,Other', stockQuantity: 70, rating: 4.5, reviewCount: 167, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop' },
    { name: 'Skincare Essential Kit', description: 'Complete skincare routine set: cleanser, toner, serum, moisturizer, and SPF protection.', price: 89.99, discountPrice: 69.99, category: 'Beauty', subcategory: 'Skincare', tags: 'skincare,beauty,face,cleanser,moisturizer', targetAgeMin: 18, targetAgeMax: 55, targetProfessions: 'Designer,Teacher,Student,Freelancer,Marketing,Other', stockQuantity: 90, rating: 4.3, reviewCount: 87, isFeatured: false, sellerId: seller2.id, imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop' },
    { name: 'Artisan Coffee Collection', description: 'Premium single-origin coffee beans from 5 different regions. Whole bean, freshly roasted.', price: 59.99, discountPrice: null, category: 'Food', subcategory: 'Beverages', tags: 'coffee,beverage,artisan,premium,organic', targetAgeMin: 18, targetAgeMax: 60, targetProfessions: 'Software Engineer,Designer,Teacher,Student,Freelancer,Business Owner,Other', stockQuantity: 200, rating: 4.7, reviewCount: 203, isFeatured: false, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop' },
    { name: 'STEM Robot Building Kit', description: 'Programmable robot building kit for learning electronics and coding. Ages 8+.', price: 79.99, discountPrice: null, category: 'Toys', subcategory: 'STEM', tags: 'robot,stem,kids,learning,coding,education', targetAgeMin: 8, targetAgeMax: 16, targetProfessions: 'Teacher,Student,Other', stockQuantity: 45, rating: 4.6, reviewCount: 56, isFeatured: false, sellerId: seller1.id, imageUrl: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=600&fit=crop' },
  ];

  const products = [];
  for (const p of productData) {
    const product = await db.product.create({ data: p });
    products.push(product);
  }
  console.log(products.length + ' products created');

  // 3. Browsing history
  for (let i = 0; i < 5; i++) {
    await db.browsingHistory.upsert({
      where: { customerId_productId: { customerId: customer1.id, productId: products[i].id } },
      update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      create: { customerId: customer1.id, productId: products[i].id, viewCount: Math.floor(Math.random() * 5) + 1 },
    });
  }
  const fashionProducts = products.filter(p => p.category === 'Fashion');
  for (const p of fashionProducts) {
    await db.browsingHistory.upsert({
      where: { customerId_productId: { customerId: customer2.id, productId: p.id } },
      update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      create: { customerId: customer2.id, productId: p.id, viewCount: Math.floor(Math.random() * 3) + 1 },
    });
  }
  const bookProducts = products.filter(p => p.category === 'Books');
  for (const p of bookProducts) {
    await db.browsingHistory.upsert({
      where: { customerId_productId: { customerId: customer3.id, productId: p.id } },
      update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      create: { customerId: customer3.id, productId: p.id, viewCount: Math.floor(Math.random() * 4) + 1 },
    });
  }
  console.log('Browsing history created');

  // 4. Reviews
  const reviewData = [
    { customerId: customer1.id, productId: products[0].id, rating: 5, comment: 'Excellent laptop! Super fast for development work.' },
    { customerId: customer1.id, productId: products[1].id, rating: 4, comment: 'Great sound quality, battery lasts forever.' },
    { customerId: customer2.id, productId: products[4].id, rating: 5, comment: 'Beautiful leather, very well crafted.' },
    { customerId: customer2.id, productId: products[5].id, rating: 4, comment: 'Love the design, very minimal and clean.' },
    { customerId: customer3.id, productId: products[9].id, rating: 5, comment: 'Must-read for every aspiring developer!' },
    { customerId: customer3.id, productId: products[11].id, rating: 4, comment: 'Very comfortable mat, great grip.' },
  ];
  for (const r of reviewData) {
    await db.review.upsert({
      where: { customerId_productId: { customerId: r.customerId, productId: r.productId } },
      update: {},
      create: r,
    });
  }
  console.log('Reviews created');

  // 5. Orders
  const order1Total = (products[0].discountPrice || products[0].price) + (products[1].discountPrice || products[1].price);
  const order1 = await db.order.create({
    data: {
      orderNumber: 'ORD-2025-001',
      customerId: customer1.id,
      sellerId: seller1.id,
      totalAmount: order1Total,
      sellerEarnings: Math.round(order1Total * 0.8 * 100) / 100,
      adminEarnings: Math.round(order1Total * 0.2 * 100) / 100,
      status: 'DELIVERED',
      shippingAddress: customer1.address || '',
      paymentMethod: 'Credit Card',
      items: { create: [
        { productId: products[0].id, productName: products[0].name, productPrice: products[0].discountPrice || products[0].price, quantity: 1 },
        { productId: products[1].id, productName: products[1].name, productPrice: products[1].discountPrice || products[1].price, quantity: 1 },
      ] },
    },
  });

  const order2Total = (products[4].discountPrice || products[4].price) + (products[5].discountPrice || products[5].price);
  const order2 = await db.order.create({
    data: {
      orderNumber: 'ORD-2025-002',
      customerId: customer2.id,
      sellerId: seller2.id,
      totalAmount: order2Total,
      sellerEarnings: Math.round(order2Total * 0.8 * 100) / 100,
      adminEarnings: Math.round(order2Total * 0.2 * 100) / 100,
      status: 'SHIPPED',
      shippingAddress: customer2.address || '',
      paymentMethod: 'PayPal',
      items: { create: [
        { productId: products[4].id, productName: products[4].name, productPrice: products[4].discountPrice || products[4].price, quantity: 1 },
        { productId: products[5].id, productName: products[5].name, productPrice: products[5].discountPrice || products[5].price, quantity: 1 },
      ] },
    },
  });

  const order3Total = products[9].price;
  await db.order.create({
    data: {
      orderNumber: 'ORD-2025-003',
      customerId: customer3.id,
      sellerId: seller1.id,
      totalAmount: order3Total,
      sellerEarnings: Math.round(order3Total * 0.8 * 100) / 100,
      adminEarnings: Math.round(order3Total * 0.2 * 100) / 100,
      status: 'PENDING',
      shippingAddress: customer3.address || '',
      paymentMethod: 'Debit Card',
      items: { create: [
        { productId: products[9].id, productName: products[9].name, productPrice: products[9].price, quantity: 1 },
      ] },
    },
  });
  console.log('Orders created');

  // 6. Payments
  await db.payment.createMany({
    data: [
      { orderId: order1.id, recipientId: seller1.id, amount: order1.sellerEarnings, type: 'SELLER_EARNING' },
      { orderId: order1.id, recipientId: admin.id, amount: order1.adminEarnings, type: 'ADMIN_COMMISSION' },
      { orderId: order2.id, recipientId: seller2.id, amount: order2.sellerEarnings, type: 'SELLER_EARNING' },
      { orderId: order2.id, recipientId: admin.id, amount: order2.adminEarnings, type: 'ADMIN_COMMISSION' },
    ],
  });
  console.log('Payments created');

  console.log('\nDatabase seeded successfully!');
  console.log('\nDemo Accounts:');
  console.log('  Admin:    admin@demo.com / demo1234');
  console.log('  Customer: customer@demo.com / demo1234');
  console.log('  Customer: customer2@demo.com / demo1234');
  console.log('  Customer: customer3@demo.com / demo1234');
  console.log('  Seller:   seller@demo.com / demo1234');
  console.log('  Seller:   seller2@demo.com / demo1234');
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
