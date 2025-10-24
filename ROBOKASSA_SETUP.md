# Robokassa Integration Setup

This document explains how to configure the Robokassa payment integration in the globalbanka app.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Robokassa Configuration
ROBOKASSA_MERCHANT_LOGIN=your_merchant_login
ROBOKASSA_PASS_ONE=your_pass_one
ROBOKASSA_PASS_TWO=your_pass_two
ROBOKASSA_MODE=test
ROBOKASSA_BASE_URL=https://auth.robokassa.ru/Merchant/Index.aspx

# For production, change ROBOKASSA_MODE to 'production'
# ROBOKASSA_MODE=production

# API Configuration
NEXT_PUBLIC_API_URL=https://api.roamjet.net
```

## Robokassa Dashboard Configuration

1. **Login to Robokassa Dashboard**: Access your Robokassa merchant account
2. **Configure Callback URLs**:
   - Success URL: `https://yourdomain.com/api/robokassa/callback`
   - Fail URL: `https://yourdomain.com/payment-failed`
3. **Enable Test Mode**: Make sure test mode is enabled for development
4. **Get Credentials**: Copy your merchant login, password 1, and password 2

## Key Changes Made

### 1. Payment Service
- **File**: `src/services/robokassaService.js`
- **Purpose**: Handles Robokassa payment processing
- **Features**: Payment URL generation, signature verification, callback handling

### 2. Checkout Component
- **File**: `src/components/Checkout.jsx`
- **Changes**: Updated to use Robokassa instead of Stripe
- **Currency**: Changed from USD to RUB (Russian Rubles)

### 3. Checkout Page Client
- **File**: `app/checkout/CheckoutPageClient.jsx`
- **Changes**: Removed Stripe Elements wrapper, simplified for Robokassa redirect

### 4. Payment Success Component
- **File**: `src/components/PaymentSuccess.jsx`
- **Changes**: Updated references from Stripe to Robokassa

### 5. API Routes
- **File**: `app/api/robokassa/callback/route.js`
- **Purpose**: Handles Robokassa payment callbacks and verification

### 6. Payment Failed Page
- **File**: `app/payment-failed/page.jsx`
- **Purpose**: Displays payment failure messages

### 7. Configuration Service
- **File**: `src/services/configService.js`
- **Changes**: Updated default settings to include Robokassa configuration

## Testing

1. **Test Mode**: Ensure `ROBOKASSA_MODE=test` in your environment
2. **Test Payments**: Use Robokassa test credentials
3. **Callback Testing**: Verify callback URLs are accessible
4. **Signature Verification**: Test signature generation and verification

## Production Deployment

1. **Update Environment Variables**: Change to production Robokassa credentials
2. **Update Mode**: Set `ROBOKASSA_MODE=production`
3. **Configure Callbacks**: Update callback URLs to production domain
4. **Test Thoroughly**: Verify all payment flows work correctly

## Security Notes

- **Signature Verification**: Always verify Robokassa signatures
- **Environment Variables**: Keep credentials secure and never commit to version control
- **HTTPS**: Ensure all callback URLs use HTTPS in production
- **Validation**: Validate all payment data before processing

## Troubleshooting

### Common Issues

1. **Invalid Signature**: Check that passwords are correct and signature generation matches Robokassa requirements
2. **Callback Not Working**: Verify callback URLs are accessible and return proper responses
3. **Currency Issues**: Ensure amounts are converted to kopecks (multiply by 100)
4. **Test vs Production**: Make sure you're using the correct credentials for your environment

### Debug Steps

1. Check browser console for error messages
2. Verify environment variables are loaded correctly
3. Test signature generation manually
4. Check Robokassa dashboard for transaction logs
5. Verify callback URLs are accessible from external sources

## Support

For issues with this integration, check:
1. Robokassa documentation: https://docs.robokassa.ru/
2. Console logs for detailed error messages
3. Network tab for API call failures
