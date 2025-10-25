'use client';

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Checkout from '../../src/components/Checkout'
import Loading from '../../src/components/Loading'

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              price: packageData.priceUSD || packageData.price, // Use USD price for API
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

  if (loading) {
    return <Loading />;
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a202c]">
        <div className="max-w-md mx-auto bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            План не выбран
          </h2>
          <p className="text-gray-300 mb-4">
            Пожалуйста, выберите план со страницы тарифов, чтобы продолжить оформление заказа.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Посмотреть планы
          </button>
        </div>
      </div>
    );
  }

  return (
    <Checkout plan={plan} />
  );
}
