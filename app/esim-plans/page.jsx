'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EsimPlansPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main page
    router.replace('/');
  }, [router]);
  
  return null;
}
