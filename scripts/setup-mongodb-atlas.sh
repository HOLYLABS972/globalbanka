#!/bin/bash

# MongoDB Atlas Fresh Setup Script
echo "🚀 Setting up MongoDB Atlas for fresh start..."

# Create .env.local file with MongoDB Atlas URI
cat > .env.local << 'EOF'
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://Vercel-Admin-atlas-teal-garden:9h38ZfhOukRfHyts@atlas-teal-garden.ulmgxtg.mongodb.net/?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Database Name (optional - will use default from URI)
MONGODB_DB_NAME=globalbanka

# Existing API Keys (keep these)
NEXT_PUBLIC_ROAMJET_API_KEY=your-roamjet-api-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=your-stripe-test-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=your-stripe-live-key
STRIPE_SECRET_KEY_TEST=your-stripe-test-secret
STRIPE_SECRET_KEY_LIVE=your-stripe-live-secret
EOF

echo "✅ Created .env.local file with MongoDB Atlas URI"
echo ""
echo "📋 Next steps:"
echo "1. Update the JWT_SECRET with a strong, random secret key"
echo "2. Add your actual API keys (RoamJet, Stripe, etc.)"
echo "3. Install MongoDB dependencies: npm install mongoose bcryptjs jsonwebtoken"
echo "4. Test the connection: node scripts/test-mongodb-connection.js"
echo "5. Start your app: npm run dev"
echo ""
echo "🔐 Security Note:"
echo "Make sure to generate a strong JWT_SECRET for production!"
echo "You can use: openssl rand -base64 32"
echo ""
echo "🎉 Your MongoDB Atlas is ready for a fresh start!"
