'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState('');

  useEffect(() => {
    const reasonParam = searchParams.get('reason');
    if (reasonParam) {
      setReason(reasonParam);
    }
  }, [searchParams]);

  const getErrorMessage = (reason) => {
    switch (reason) {
      case 'invalid_signature':
        return 'Payment verification failed. Please contact support if you were charged.';
      case 'processing_error':
        return 'There was an error processing your payment. Please try again.';
      case 'cancelled':
        return 'Payment was cancelled. You can try again anytime.';
      case 'insufficient_funds':
        return 'Payment failed due to insufficient funds. Please check your account balance.';
      default:
        return 'Payment was not completed. Please try again or contact support.';
    }
  };

  const handleRetryPayment = () => {
    // Go back to checkout or plans page
    router.back();
  };

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    window.open('mailto:support@globalbanka.com?subject=Payment Issue', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-6">
          <AlertCircle className="w-16 h-16 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          {getErrorMessage(reason)}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleRetryPayment}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={handleContactSupport}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Contact Support
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If you were charged but see this error, please contact our support team immediately with your order details.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailed() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
