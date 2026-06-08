'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem('fs-onboarding-done');
    router.replace(done ? '/swipe' : '/onboarding');
  }, [router]);

  return (
    <div style={{
      height: '100dvh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '3px solid rgba(255,92,26,0.3)',
        borderTopColor: '#FF5C1A',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
