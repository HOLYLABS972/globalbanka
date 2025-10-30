'use client';

import React, { useEffect, useState } from 'react';
import { robokassaService } from '../services/robokassaService';
import { convertCurrency } from '../services/currencyService';
// import { esimService } from '../services/esimService'; // Removed - causes client-side issues
import { useAuth } from '../contexts/AuthContext';

import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Checkout = ({ plan }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Allow checkout without authentication - collect email instead
    if (plan) {
      console.log('🚀 Starting checkout for plan:', plan.name);
      
      // Create order and redirect immediately (no auth required)
      const redirectToPayment = async () => {
        try {
          // Generate unique order ID
          const uniqueOrderId = `${plan.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Send email if user is logged in; Robokassa can also collect it
          const amountUSD = parseFloat(plan.price) || 0;
          const amountRUB = convertCurrency(amountUSD, 'RUB');

          const orderData = {
            orderId: uniqueOrderId,
            planId: plan.id,
            planName: plan.name,
            customerEmail: currentUser ? currentUser.email : null,
            amount: amountRUB,
            currency: 'RUB'
          };
          
          console.log('💳 Order data for payment:', orderData);

          // Store order info for payment success handling
          localStorage.setItem('pendingEsimOrder', JSON.stringify({
            orderId: uniqueOrderId,
            planId: plan.id,
            customerEmail: currentUser ? currentUser.email : null, // Store email if logged in
            amount: amountRUB,
            currency: 'RUB'
          }));

          // Redirect to Robokassa payment (client-side, no server needed)
          await robokassaService.createPayment(orderData);
          
        } catch (err) {
          console.error('❌ Payment redirect failed:', err);
          setError('Failed to redirect to payment');
        }
      };

      redirectToPayment();
    }
  }, [plan]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a202c]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300">План не выбран</p>
        </div>
      </div>
    );
  }




  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a202c]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Show loading while redirecting to payment
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a202c]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Перенаправление на оплату...</p>
      </div>
    </div>
  );
};

export default Checkout;
