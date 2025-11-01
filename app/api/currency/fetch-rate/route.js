import { NextResponse } from 'next/server';
import connectDB from '../../../../src/database/config';
import { AdminConfig } from '../../../../src/database/models';

export const dynamic = 'force-dynamic'; // Disable caching for this endpoint

export async function GET(request) {
  try {
    // Try multiple currency APIs to get USD to RUB rate
    const apiUrls = [
      'https://api.exchangerate-api.com/v4/latest/USD',
      'https://open.er-api.com/v6/latest/USD',
      'https://api.fixer.io/latest?base=USD&symbols=RUB'
    ];

    let usdToRubRate = null;

    for (const apiUrl of apiUrls) {
      try {
        console.log(`🔍 Trying to fetch rate from: ${apiUrl}`);
        const response = await fetch(apiUrl, {
          next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) {
          console.warn(`⚠️ API ${apiUrl} returned status ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`📊 Data from ${apiUrl}:`, data);

        // Parse different API response formats
        if (data.rates && data.rates.RUB) {
          usdToRubRate = parseFloat(data.rates.RUB);
          console.log(`✅ USD to RUB rate found: ${usdToRubRate}`);
          break;
        } else if (data.rates && typeof data.rates === 'object') {
          const rubRate = data.rates['RUB'] || data.rates['rub'];
          if (rubRate) {
            usdToRubRate = parseFloat(rubRate);
            console.log(`✅ USD to RUB rate found: ${usdToRubRate}`);
            break;
          }
        }
      } catch (apiError) {
        console.warn(`⚠️ Error fetching from ${apiUrl}:`, apiError.message);
        continue;
      }
    }

    // If all APIs failed, try CoinGecko API
    if (!usdToRubRate) {
      try {
        console.log('🔍 Trying CoinGecko API...');
        const cgResponse = await fetch('https://api.coingecko.com/api/v3/exchange_rates', {
          next: { revalidate: 3600 }
        });
        
        if (cgResponse.ok) {
          const cgData = await cgResponse.json();
          if (cgData.rates && cgData.rates.rub) {
            usdToRubRate = 1 / parseFloat(cgData.rates.rub.value);
            console.log(`✅ USD to RUB rate from CoinGecko: ${usdToRubRate}`);
          }
        }
      } catch (cgError) {
        console.warn('⚠️ CoinGecko API error:', cgError.message);
      }
    }

    // If still no rate, use fallback
    if (!usdToRubRate) {
      console.warn('⚠️ All currency APIs failed, using fallback');
      usdToRubRate = 95; // Fallback rate
    }

    // Save to MongoDB config
    try {
      await connectDB();
      let config = await AdminConfig.findOne();
      if (!config) {
        config = new AdminConfig({ adminPassword: '123456' });
      }
      
      config.usdToRubRate = usdToRubRate;
      config.lastUpdated = new Date();
      await config.save();
      console.log('✅ Saved currency rate to MongoDB:', usdToRubRate);
    } catch (dbError) {
      console.warn('⚠️ Failed to save currency rate to MongoDB:', dbError);
      // Continue - not critical
    }

    return NextResponse.json({
      success: true,
      rate: usdToRubRate,
      timestamp: new Date().toISOString(),
      source: usdToRubRate === 95 ? 'fallback' : 'live'
    });

  } catch (error) {
    console.error('❌ Error fetching currency rate:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch currency rate',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

