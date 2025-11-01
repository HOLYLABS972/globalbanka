'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { initializeExchangeRates } from '../services/currencyService'

export default function Providers({ children }) {
  // Create a new QueryClient instance for each render to avoid SSR issues
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Initialize exchange rates on app startup
  useEffect(() => {
    initializeExchangeRates();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
