'use client';

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Checkout from '../../src/components/Checkout'
import Loading from '../../src/components/Loading'

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const planId = searchParams.get('plan');
        const planType = searchParams.get('type');
        
        // First, check if we have package data in localStorage (from share page)
        const selectedPackage = localStorage.getItem('selectedPackage');
        if (selectedPackage) {
          try {
            const packageData = JSON.parse(selectedPackage);
            console.log('📦 Package data from localStorage:', packageData);
            
            const planData = {
              id: packageData.packageId,
              name: packageData.packageName,
              description: packageData.packageDescription,
              price: packageData.price,
              currency: packageData.currency,
              data: packageData.data,
              dataUnit: packageData.dataUnit,
              period: packageData.period,
              duration: packageData.period,
              country_code: packageData.country_code,
              benefits: packageData.benefits,
              speed: packageData.speed,
              type: 'package'
            };
            
            console.log('🎯 Plan data for checkout:', planData);
            setPlan(planData);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing selected package:', parseError);
            // Data removal removed - keeping selectedPackage in localStorage
          }
        }
        
        // If no localStorage data, check URL parameters
        if (!planId) {
          setError('No plan selected');
          setLoading(false);
          return;
        }

        // Load plan data from API
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
          const response = await fetch(`${API_BASE_URL}/api/public/plans/${planId}`);
          
          if (!response.ok) {
            throw new Error(`Plan not found: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.data.plan) {
            const planData = data.data.plan;
            setPlan({
              id: planData._id || planData.id,
              ...planData,
              type: planType || 'country'
            });
          } else {
            setError('Plan not found');
          }
        } catch (apiError) {
          console.error('Error loading plan from API:', apiError);
          setError('Failed to load plan');
        }
      } catch (err) {
        console.error('Error loading plan:', err);
        setError('Failed to load plan');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [searchParams]);

  // Load Stripe configuration
  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        // Use environment variables instead of configService to avoid MongoDB connections
        const mode = process.env.NEXT_PUBLIC_STRIPE_MODE || 'test';
        let publishableKey = mode === 'live' 
          ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE
          : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
        
        // Fallback to hardcoded test key if no environment key is found
        if (!publishableKey && mode === 'test') {
          publishableKey = 'pk_test_51QgvHMDAQpPJFhcuO3sh2pE1JSysFYHgJo781w5lzeDX6Qh9P026LaxpeilCyXx73TwCLHcF5O0VQU45jPZhLBK800G6bH5LdA';
          console.log('🔑 Using fallback Stripe test key');
        }
        
        if (publishableKey) {
          console.log(`🔑 Loading Stripe in ${mode.toUpperCase()} mode`);
          const stripe = await loadStripe(publishableKey);
          setStripePromise(stripe);
        } else {
          console.error('No Stripe publishable key found');
        }
      } catch (err) {
        console.error('Error loading Stripe config:', err);
      }
    };

    loadStripeConfig();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Plan Selected
          </h2>
          <p className="text-gray-600 mb-4">
            Please select a plan from the plans page to continue with checkout.
          </p>
          <button
            onClick={() => window.location.href = '/plans'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-blue-500 text-6xl mb-4">💳</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Payment System
          </h2>
          <p className="text-gray-600 mb-4">
            Please wait while we set up your payment...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Checkout plan={plan} />
    </Elements>
  );
}
