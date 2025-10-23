#!/usr/bin/env node

/**
 * MongoDB Fresh Database Initialization
 * 
 * This script initializes your MongoDB Atlas database with empty collections
 * Run with: node scripts/init-fresh-database.js
 */

import connectDB from '../src/database/config.js';
import { 
  User, 
  BusinessUser, 
  DataPlan, 
  Country, 
  Newsletter, 
  Settings,
  Order,
  OTP
} from '../src/database/models.js';

async function initializeFreshDatabase() {
  console.log('🚀 Initializing fresh MongoDB Atlas database...');
  console.log('===============================================');
  
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas!');
    
    // Create indexes for all collections
    console.log('\n🔧 Creating database indexes...');
    
    // User indexes
    await User.createIndexes();
    console.log('✅ User indexes created');
    
    // BusinessUser indexes
    await BusinessUser.createIndexes();
    console.log('✅ BusinessUser indexes created');
    
    // DataPlan indexes
    await DataPlan.createIndexes();
    console.log('✅ DataPlan indexes created');
    
    // Country indexes
    await Country.createIndexes();
    console.log('✅ Country indexes created');
    
    // Newsletter indexes
    await Newsletter.createIndexes();
    console.log('✅ Newsletter indexes created');
    
    // Settings indexes
    await Settings.createIndexes();
    console.log('✅ Settings indexes created');
    
    // Order indexes
    await Order.createIndexes();
    console.log('✅ Order indexes created');
    
    // OTP indexes
    await OTP.createIndexes();
    console.log('✅ OTP indexes created');
    
    // Create default settings document
    console.log('\n⚙️ Creating default settings...');
    const defaultSettings = await Settings.findOne();
    if (!defaultSettings) {
      await Settings.create({
        socialMedia: {
          linkedin: '',
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          tiktok: '',
          telegram: '',
          whatsapp: ''
        },
        contact: {
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          website: ''
        },
        company: {
          name: '',
          description: '',
          founded: '',
          employees: '',
          industry: '',
          logo: ''
        },
        businessHours: {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '18:00', closed: false },
          saturday: { open: '10:00', close: '16:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        seo: {
          title: '',
          description: '',
          keywords: [],
          ogImage: '',
          favicon: ''
        },
        app: {
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: false,
          maxFileSize: 10,
          supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
        },
        appStore: {
          iosUrl: '',
          androidUrl: ''
        },
        regular: {
          discountPercentage: 20,
          minimumPrice: 0.5
        }
      });
      console.log('✅ Default settings created');
    } else {
      console.log('ℹ️ Settings already exist, skipping...');
    }
    
    // Show collection status
    console.log('\n📊 Database Collections Status:');
    const db = connectDB.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('📋 No collections found - they will be created when first used');
    } else {
      console.log('📋 Collections found:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    console.log('\n🎉 Fresh database initialization completed!');
    console.log('Your MongoDB Atlas database is ready for use.');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await connectDB.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

// Run initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeFreshDatabase();
}

export { initializeFreshDatabase };
