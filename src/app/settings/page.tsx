'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TabBar from '@/components/TabBar';
import ToggleSwitch from '@/components/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';

/* ── SNS 아이콘 SVGs ── */
function KakaoIcon() {
  return (
    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 0C5.373 0 0 4.163 0 9.3c0 3.274 2.133 6.148 5.367 7.8l-1.37 5.102a.4.4 0 0 0 .591.44L10.7 19.35A13.8 13.8 0 0 0 12 19.44c0-.003 0-.003 0 0 6.627 0 12-4.163 12-9.14C24 4.163 18.627 0 12 0z"
        fill="#391B1B"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SocialBtn({
  onClick, bg, border, children, label,
}: {
  onClick: () => void;
  bg: string;
  border?: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: bg,
          border: border ?? 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.12s, box-shadow 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {children}
      </button>
      <span style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }}>{label}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { notifNewOpen, setNotifNewOpen, notifGroupMatch, setNotifGroupMatch } = useApp();
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === 'authenticated';
  const isLoading  = status === 'loading';

  const handleLogout = async () => {
    localStorage.removeItem('fs-onboarding-done');
    localStorage.removeItem('fs-taste');
    localStorage.removeItem('fs-wishlist');
    await signOut({ redirect: false });
    router.replace('/');
  };

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">나</h1>
      </div>

      <div className="settings-scroll">

        {/* ── Profile / Login ── */}
        <div className="settings-section">
          {isLoading ? (
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid rgba(255,92,26,0.2)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            </div>

          ) : isLoggedIn ? (
            /* 로그인 상태 — 프로필 카드 */
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px',
              background: 'var(--surface)',
              border: '0.5px solid var(--border-color)',
              borderRadius: 16,
            }}>
              {session.user?.image ? (
                <img src={session.user.image} alt=""
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {(session.user?.name ?? '?')[0]}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {session.user?.name}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)', marginTop: 3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {session.user?.email}
                </div>
              </div>
            </div>

          ) : (
            /* 비로그인 상태 — 원형 SNS 버튼 */
            <div style={{
              padding: '20px 16px 18px',
              background: 'var(--surface)',
              border: '0.5px solid var(--border-color)',
              borderRadius: 16,
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                color: 'var(--text-muted)', textTransform: 'uppercase',
                marginBottom: 18,
              }}>
                간편 로그인
              </p>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                <SocialBtn
                  onClick={() => signIn('kakao', { callbackUrl: '/settings' })}
                  bg="#FEE500"
                  label="카카오"
                >
                  <KakaoIcon />
                </SocialBtn>
                <SocialBtn
                  onClick={() => signIn('google', { callbackUrl: '/settings' })}
                  bg="#ffffff"
                  border="1.5px solid #E8E8E8"
                  label="구글"
                >
                  <GoogleIcon />
                </SocialBtn>
              </div>
            </div>
          )}
        </div>

        {/* ── 화면 모드 ── */}
        <div className="settings-section">
          <div className="settings-section-title">화면 모드</div>
          <div className="settings-group">
            <div className="settings-cell">
              <span className="settings-cell-label">테마</span>
              <div className="segment-control" style={{ flexShrink: 0 }}>
                <button
                  className={`segment-btn${theme === 'dark' ? ' active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  다크
                </button>
                <button
                  className={`segment-btn${theme === 'light' ? ' active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  라이트
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 알림 ── */}
        <div className="settings-section">
          <div className="settings-section-title">알림</div>
          <div className="settings-group">
            <div className="settings-cell">
              <span className="settings-cell-label">신규 오픈 알림</span>
              <ToggleSwitch checked={notifNewOpen} onChange={setNotifNewOpen} label="신규 오픈 알림" />
            </div>
            <div className="settings-cell">
              <span className="settings-cell-label">그룹 매칭 알림</span>
              <ToggleSwitch checked={notifGroupMatch} onChange={setNotifGroupMatch} label="그룹 매칭 알림" />
            </div>
          </div>
        </div>

        {/* ── 계정 ── */}
        <div className="settings-section">
          <div className="settings-section-title">계정</div>
          <div className="settings-group">
            <div className="settings-cell" style={{ cursor: 'pointer' }}>
              <span className="settings-cell-label">FoodSwipe Plus</span>
              <span className="settings-cell-value">업그레이드</span>
              <i className="ti ti-chevron-right settings-cell-chevron" aria-hidden="true" />
            </div>
            {isLoggedIn && (
              <div className="settings-cell" style={{ cursor: 'pointer' }} onClick={handleLogout}>
                <span className="settings-cell-label settings-cell-danger">로그아웃</span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          textAlign: 'center', padding: '16px 0 8px',
          fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}>
          FoodSwipe v3.0.0
        </div>
      </div>

      <TabBar />
    </div>
  );
}
