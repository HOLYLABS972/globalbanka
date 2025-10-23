import { Suspense } from 'react'
import Script from 'next/script'
import Register from '../../src/components/Register'
import Loading from '../../src/components/Loading'
import AuthRedirect from '../../src/components/AuthRedirect'

export const metadata = {
  title: 'Register - Globalbanka',
  description: 'Create your Globalbanka account to start buying and managing global eSIM plans for your travels.',
  keywords: ['register', 'sign up', 'create account', 'Globalbanka account', 'travel eSIM registration'],
  openGraph: {
    title: 'Register - Globalbanka | Global eSIM Plans',
    description: 'Create your Globalbanka account to start buying and managing global eSIM plans for your travels.',
    url: '/register',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Globalbanka Register - Global eSIM Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register - Globalbanka | Global eSIM Plans',
    description: 'Create your Globalbanka account to start buying and managing global eSIM plans for your travels.',
    images: ['/images/og-image.svg'],
  },
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <AuthRedirect redirectTo="/dashboard">
          <Register />
        </AuthRedirect>
      </Suspense>
    </>
  )
}
