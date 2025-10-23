import jwt from 'jsonwebtoken';
import { User, OTP, Newsletter } from '../database/models';
import connectDB from '../database/config';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
import { generateOTPWithTimestamp } from '../utils/otpUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

      // Store pending signup data in localStorage (client-side)
      const pendingSignup = {
        email,
        password,
        displayName,
        otp: otpData.otp,
        expiresAt: otpData.expiresAt,
        timestamp: Date.now()
      };

      return { pending: true, otp: otpData.otp };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Verify email OTP and complete signup
  async verifyEmailOTP(otp, pendingSignupData) {
    try {
      await connectDB();

      // Check if OTP has expired
      if (Date.now() > pendingSignupData.expiresAt) {
        throw new Error('Verification OTP has expired');
      }

      // Verify OTP from database
      const otpRecord = await OTP.findOne({
        email: pendingSignupData.email,
        otp,
        type: 'verification',
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
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

  // Reset password
  async resetPassword(email) {
    try {
      await connectDB();

      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate and send password reset OTP
      const otpData = generateOTPWithTimestamp(10); // 10 minutes expiry
      const emailSent = await sendPasswordResetEmail(email, user.displayName, otpData.otp);
      
      if (emailSent) {
        console.log(`✅ Password reset OTP sent to ${email}: ${otpData.otp}`);
      } else {
        console.log(`📧 OTP Code for ${email}: ${otpData.otp}`);
      }

      // Store OTP in database
      await OTP.create({
        email,
        otp: otpData.otp,
        type: 'password_reset',
        expiresAt: new Date(otpData.expiresAt)
      });

      return { success: true, otp: otpData.otp };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Verify password reset OTP and update password
  async verifyPasswordResetOTP(email, otp, newPassword) {
    try {
      await connectDB();

      // Verify OTP from database
      const otpRecord = await OTP.findOne({
        email,
        otp,
        type: 'password_reset',
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        throw new Error('Invalid or expired OTP');
      }

      // Update user password
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw new Error('User not found');
      }

      user.password = newPassword;
      await user.save();

      // Mark OTP as used
      otpRecord.used = true;
      await otpRecord.save();

      return { success: true };
    } catch (error) {
      console.error('Password reset verification error:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      await connectDB();
      const user = await User.findById(userId).select('-password');
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      await connectDB();
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');
      
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Add user to newsletter
  async addToNewsletter(email, displayName, source) {
    try {
      await connectDB();
      
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

  // Middleware to verify JWT token
  async verifyAuthToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await this.getUserById(decoded.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
