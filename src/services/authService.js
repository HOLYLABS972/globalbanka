import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../database/config';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
import { generateOTPWithTimestamp } from '../utils/otpUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Define schemas directly here to avoid import issues
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function() { return this.provider === 'local'; } },
  displayName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['customer', 'admin', 'business'], default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String },
  phone: { type: String },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['verification', 'password_reset'], required: true },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  source: { type: String, default: 'web' },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get models
function getModels() {
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);
  const Newsletter = mongoose.models.Newsletter || mongoose.model('Newsletter', newsletterSchema);
  return { User, OTP, Newsletter };
}

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
  }

  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Sign up with email and password
  async signup(email, password, displayName) {
    try {
      await connectDB();
      const { User, OTP } = getModels();

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Generate and send verification OTP
      const otpData = generateOTPWithTimestamp(10); // 10 minutes expiry
      const emailSent = await sendVerificationEmail(email, displayName, otpData.otp);
      
      if (emailSent) {
        console.log(`✅ Verification OTP sent to ${email}: ${otpData.otp}`);
      } else {
        console.log(`📧 OTP Code for ${email}: ${otpData.otp}`);
      }

      // Store OTP in database
      await OTP.create({
        email,
        otp: otpData.otp,
        type: 'verification',
        expiresAt: new Date(otpData.expiresAt)
      });

      return { pending: true, otp: otpData.otp };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Verify email OTP and complete signup
  async verifyEmailOTP(otp, pendingSignupData) {
    try {
      console.log('🔍 Starting OTP verification for:', pendingSignupData.email);
      await connectDB();
      const { User, OTP } = getModels();

      // Check if OTP has expired
      const now = Date.now();
      console.log('🕐 Current time:', now, 'Expires at:', pendingSignupData.expiresAt);
      if (now > pendingSignupData.expiresAt) {
        console.error('❌ OTP expired');
        throw new Error('Verification OTP has expired');
      }

      // Verify OTP from database
      console.log('🔍 Looking for OTP in database:', {
        email: pendingSignupData.email,
        otp: otp,
        type: 'verification'
      });

      const otpRecord = await OTP.findOne({
        email: pendingSignupData.email,
        otp,
        type: 'verification',
        used: false,
        expiresAt: { $gt: new Date() }
      });

      console.log('🔍 OTP record found:', otpRecord ? 'Yes' : 'No');

      if (!otpRecord) {
        // Let's check what OTPs exist for this email
        const allOtps = await OTP.find({ email: pendingSignupData.email });
        console.log('🔍 All OTPs for this email:', allOtps);
        throw new Error('Invalid verification OTP');
      }

      // Create user account
      const user = new User({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
        displayName: pendingSignupData.displayName,
        emailVerified: true,
        provider: 'local'
      });

      await user.save();

      // Mark OTP as used
      otpRecord.used = true;
      await otpRecord.save();

      // Add user to newsletter
      try {
        await this.addToNewsletter(user.email, user.displayName, 'web_dashboard');
        console.log('✅ User automatically added to newsletter');
      } catch (newsletterError) {
        console.error('❌ Error adding user to newsletter:', newsletterError);
        // Don't fail the signup if newsletter addition fails
      }

      // Generate token
      const token = this.generateToken(user._id);

      return {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        token
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      await connectDB();
      const { User } = getModels();

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      return {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Google OAuth login/signup
  async signInWithGoogle(googleUser) {
    try {
      await connectDB();
      const { User } = getModels();

      // Check if user already exists
      let user = await User.findOne({ email: googleUser.email });

      if (!user) {
        // Create new user
        user = new User({
          email: googleUser.email,
          displayName: googleUser.name,
          emailVerified: true,
          provider: 'google',
          avatar: googleUser.picture
        });

        await user.save();

        // Add user to newsletter
        try {
          await this.addToNewsletter(user.email, user.displayName, 'google_signup');
          console.log('✅ User automatically added to newsletter');
        } catch (newsletterError) {
          console.error('❌ Error adding user to newsletter:', newsletterError);
          // Don't fail the signup if newsletter addition fails
        }
      } else {
        // Update existing user's last login
        user.lastLogin = new Date();
        if (!user.emailVerified) {
          user.emailVerified = true;
        }
        await user.save();
      }

      // Generate token
      const token = this.generateToken(user._id);

      return {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          emailVerified: user.emailVerified,
          avatar: user.avatar
        },
        token
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Add user to newsletter
  async addToNewsletter(email, displayName, source) {
    try {
      await connectDB();
      const { Newsletter } = getModels();
      
      // Check if email already exists in newsletter
      const existingSubscription = await Newsletter.findOne({ email });
      
      if (!existingSubscription) {
        // Create new newsletter subscription
        await Newsletter.create({
          email,
          displayName,
          source,
          status: 'subscribed'
        });
      }
    } catch (error) {
      console.error('Error adding user to newsletter:', error);
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;