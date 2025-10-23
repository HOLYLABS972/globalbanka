import Auth from '../../src/components/Auth';

export const metadata = {
  title: 'Authentication - RoamJet',
  description: 'Sign in to your RoamJet account using email, Google, or Yandex authentication.',
  keywords: ['authentication', 'sign in', 'RoamJet account', 'eSIM authentication', 'email login', 'Google login', 'Yandex login'],
  openGraph: {
    title: 'Authentication - RoamJet | Global eSIM Plans',
    description: 'Sign in to your RoamJet account using email, Google, or Yandex authentication.',
    url: '/auth',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'RoamJet Authentication - Global eSIM Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Authentication - RoamJet | Global eSIM Plans',
    description: 'Sign in to your RoamJet account using email, Google, or Yandex authentication.',
    images: ['/images/og-image.svg'],
  },
  alternates: {
    canonical: '/auth',
  },
};

export default function AuthPage() {
  return <Auth />;
}
