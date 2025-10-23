#!/bin/bash

# Install MongoDB dependencies and remove Firebase dependencies
echo "🔄 Installing MongoDB dependencies..."

# Install new dependencies
npm install mongoose bcryptjs jsonwebtoken

# Remove Firebase dependencies
npm uninstall firebase firebase-admin

echo "✅ Dependencies updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your MongoDB database"
echo "2. Update your environment variables"
echo "3. Run the migration script: node scripts/migrate-firebase-to-mongodb.js"
echo "4. Update your application to use the new MongoDB services"
echo ""
echo "🔧 Required environment variables:"
echo "- MONGODB_URI: Your MongoDB connection string"
echo "- JWT_SECRET: Secret key for JWT tokens"
echo "- JWT_EXPIRES_IN: JWT token expiration time (default: 7d)"
