require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

const sampleProducts = [
  {
    name: 'Pro Laptop 15"',
    description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD. Perfect for developers, designers, and power users. Features a stunning 4K display and all-day battery life.',
    price: 999,
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
    category: 'Electronics',
    stock: 15,
  },
  {
    name: 'Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life. Studio-quality sound with deep bass and crystal-clear highs. Foldable design for easy portability.',
    price: 79,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    category: 'Electronics',
    stock: 40,
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable everyday t-shirt made from 100% organic cotton. Available in multiple colors and sizes. Pre-shrunk and machine washable for easy care.',
    price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    category: 'Clothing',
    stock: 100,
  },
  {
    name: 'Winter Jacket',
    description: 'Warm and stylish winter jacket with water-resistant outer shell. Features multiple pockets, adjustable hood, and fleece lining. Perfect for cold weather adventures.',
    price: 89,
    imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80',
    category: 'Clothing',
    stock: 25,
  },
  {
    name: 'JavaScript: The Definitive Guide',
    description: "The definitive guide to JavaScript — the world's most-used programming language. Covers ES2020+ features, async programming, modules, and modern best practices for web development.",
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&q=80',
    category: 'Books',
    stock: 60,
  },
  {
    name: 'AWS Cloud Practitioner Handbook',
    description: 'Your comprehensive guide to Amazon Web Services. Covers core services, cloud architecture, security, pricing, and prepares you for the AWS Cloud Practitioner certification exam.',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    category: 'Books',
    stock: 35,
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Seed products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${products.length} products`);

    // Create admin user if not exists
    const adminEmail = 'admin@shopwave.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
      });
      console.log(`✅ Created admin user: ${adminEmail} / admin123`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    // Create a test user if not exists
    const testEmail = 'user@shopwave.com';
    const existingUser = await User.findOne({ email: testEmail });
    if (!existingUser) {
      await User.create({
        name: 'Test User',
        email: testEmail,
        password: 'user123',
        role: 'user',
      });
      console.log(`✅ Created test user: ${testEmail} / user123`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('   Admin → admin@shopwave.com / admin123');
    console.log('   User  → user@shopwave.com / user123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
