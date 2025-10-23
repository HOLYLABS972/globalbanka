import mongoose from 'mongoose';

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-atlas-teal-garden:9h38ZfhOukRfHyts@atlas-teal-garden.ulmgxtg.mongodb.net/?retryWrites=true&w=majority';

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
};

// Cache the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('✅ Using existing MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔌 Creating new MongoDB connection...');
    
    try {
      cached.promise = mongoose.connect(MONGODB_URI, options).then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      });
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
