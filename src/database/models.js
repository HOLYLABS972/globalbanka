import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// User Schema (replaces Firebase users collection)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    }
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'business'],
    default: 'customer'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  avatar: {
    type: String
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Business User Schema (replaces Firebase business_users collection)
const businessUserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'enterprise'],
    default: 'individual'
  },
  taxId: {
    type: String
  },
  apiCredentials: {
    apiKey: {
      type: String,
      required: true
    },
    secretKey: {
      type: String
    },
    mode: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox'
    }
  },
  stripeCredentials: {
    publishableKey: {
      test: String,
      live: String
    },
    secretKey: {
      test: String,
      live: String
    }
  },
  settings: {
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Data Plan Schema (replaces Firebase dataplans collection)
const dataPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  dataAmount: {
    type: String,
    required: true
  },
  validity: {
    type: String,
    required: true
  },
  country: {
    type: String
  },
  country_codes: [{
    type: String
  }],
  country_ids: [{
    type: String
  }],
  operator: {
    type: String
  },
  planType: {
    type: String,
    enum: ['data', 'voice', 'sms', 'unlimited'],
    default: 'data'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Country Schema (replaces Firebase countries collection)
const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 2
  },
  flagEmoji: {
    type: String
  },
  region: {
    type: String
  },
  continent: {
    type: String
  },
  currency: {
    type: String
  },
  timezone: {
    type: String
  },
  population: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Newsletter Schema (replaces Firebase newsletter collection)
const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['web_dashboard', 'mobile_app', 'api', 'manual'],
    default: 'web_dashboard'
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'pending'],
    default: 'subscribed'
  },
  preferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    categories: [{
      type: String
    }]
  },
  lastEmailSent: {
    type: Date
  },
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Settings Schema (replaces Firebase settings collection)
const settingsSchema = new mongoose.Schema({
  socialMedia: {
    linkedin: String,
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String,
    tiktok: String,
    telegram: String,
    whatsapp: String
  },
  contact: {
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    website: String
  },
  company: {
    name: String,
    description: String,
    founded: String,
    employees: String,
    industry: String,
    logo: String
  },
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String,
    favicon: String
  },
  app: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 10
    },
    supportedFormats: [String]
  },
  appStore: {
    iosUrl: String,
    androidUrl: String
  },
  regular: {
    discountPercentage: {
      type: Number,
      default: 20
    },
    minimumPrice: {
      type: Number,
      default: 0.5
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Order Schema (for tracking eSIM orders)
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  airaloOrderId: {
    type: String
  },
  packageId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  customerEmail: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  qrCode: {
    type: String
  },
  iccid: {
    type: String
  },
  simDetails: {
    type: mongoose.Schema.Types.Mixed
  },
  usage: {
    type: mongoose.Schema.Types.Mixed
  },
  mode: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  }
}, {
  timestamps: true
});

// OTP Schema (for email verification and password reset)
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verification', 'password_reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better performance (excluding fields that already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

businessUserSchema.index({ userId: 1 });
businessUserSchema.index({ 'apiCredentials.apiKey': 1 });

dataPlanSchema.index({ enabled: 1 });
dataPlanSchema.index({ country_codes: 1 });
dataPlanSchema.index({ price: 1 });

countrySchema.index({ isActive: 1 });

newsletterSchema.index({ status: 1 });

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });

otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.models?.User || mongoose.model('User', userSchema);
export const BusinessUser = mongoose.models?.BusinessUser || mongoose.model('BusinessUser', businessUserSchema);
export const DataPlan = mongoose.models?.DataPlan || mongoose.model('DataPlan', dataPlanSchema);
export const Country = mongoose.models?.Country || mongoose.model('Country', countrySchema);
export const Newsletter = mongoose.models?.Newsletter || mongoose.model('Newsletter', newsletterSchema);
export const Settings = mongoose.models?.Settings || mongoose.model('Settings', settingsSchema);
export const Order = mongoose.models?.Order || mongoose.model('Order', orderSchema);
export const OTP = mongoose.models?.OTP || mongoose.model('OTP', otpSchema);

export default {
  User,
  BusinessUser,
  DataPlan,
  Country,
  Newsletter,
  Settings,
  Order,
  OTP
};
