'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/settings';

  return (
    <div style={{
      background: '#080808',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      maxWidth: 390,
      margin: '0 auto',
      gap: 16,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: '#FF5C1A', marginBottom: 8 }}>
          FoodSwipe
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          로그인하고 취향을 저장하세요
        </p>
      </div>

      {/* Kakao login button */}
      <button
        onClick={() => signIn('kakao', { callbackUrl })}
        style={{
          width: '100%',
          padding: '15px 20px',
          background: '#FEE500',
          color: '#000000CC',
          border: 'none',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: 'Pretendard, -apple-system, sans-serif',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <ellipse cx="20" cy="18" rx="19" ry="17" fill="#391B1B"/>
          <path d="M20 5C11.163 5 4 10.82 4 18c0 4.624 2.978 8.68 7.5 11.101L9.75 34l7.5-3.6A19.5 19.5 0 0020 31c8.837 0 16-5.82 16-13S28.837 5 20 5z" fill="#391B1B"/>
          <path d="M13 21l2-5.5 2 5.5M14.3 19.5h1.4M19 15.5v5.5M22 21v-5.5l3.5 5.5V15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        카카오로 로그인
      </button>

      {/* Google login button */}
      <button
        onClick={() => signIn('google', { callbackUrl })}
        style={{
          width: '100%',
          padding: '15px 20px',
          background: '#ffffff',
          color: '#111111',
          border: 'none',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: 'Pretendard, -apple-system, sans-serif',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 로그인
      </button>

      {/* Skip */}
      <button
        onClick={() => window.history.back()}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
          cursor: 'pointer',
          marginTop: 8,
          fontFamily: 'Pretendard, -apple-system, sans-serif',
          padding: '8px 16px',
        }}
      >
        나중에 하기
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
