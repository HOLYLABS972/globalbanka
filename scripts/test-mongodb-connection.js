#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test
 * 
 * This script tests the connection to your MongoDB Atlas cluster
 * Run with: node scripts/test-mongodb-connection.js
 */

import mongoose from 'mongoose';
import connectDB from '../src/database/config.js';

async function testConnection() {
  console.log('🔌 Testing MongoDB Atlas connection...');
  console.log('=====================================');
  
  try {
    // Test connection
    await connectDB();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    if (collections.length > 0) {
      console.log('📋 Collections:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    // Test model creation
    console.log('\n🔧 Testing model creation...');
    const testSchema = new mongoose.Schema({
      testField: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    // Create a test document
    const testDoc = new TestModel({ testField: 'Connection test successful!' });
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 All tests passed! MongoDB Atlas is ready to use.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('  - MongoDB Atlas username and password');
      console.log('  - Database user permissions');
      console.log('  - IP whitelist settings');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Network error. Please check:');
      console.log('  - Internet connection');
      console.log('  - MongoDB Atlas cluster status');
      console.log('  - Firewall settings');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Connection timeout. Please check:');
      console.log('  - MongoDB Atlas cluster is running');
      console.log('  - Connection string is correct');
      console.log('  - Network latency');
    }
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection();
}

export { testConnection };
