'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TabBar from '@/components/TabBar';
import ToggleSwitch from '@/components/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';

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
        {/* Profile / Login */}
        <div className="settings-section">
          {isLoading ? (
            <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,92,26,0.2)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            </div>
          ) : isLoggedIn ? (
            /* 로그인 상태 */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px',
              background: 'var(--surface)',
              border: '0.5px solid var(--border-color)',
              borderRadius: 16,
              marginBottom: 4,
            }}>
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ''}
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
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
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.user?.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {session.user?.email}
                </div>
              </div>
            </div>
          ) : (
            /* 비로그인 상태 */
            <div style={{
              padding: '16px',
              background: 'var(--surface)',
              border: '0.5px solid var(--border-color)',
              borderRadius: 16,
              marginBottom: 4,
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                로그인하면 취향·찜 목록이 기기 간 동기화됩니다
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => signIn('kakao', { callbackUrl: '/settings' })}
                  style={{
                    flex: 1, padding: '11px 8px',
                    background: '#FEE500', color: '#000000CC',
                    border: 'none', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                  }}
                >
                  카카오 로그인
                </button>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/settings' })}
                  style={{
                    flex: 1, padding: '11px 8px',
                    background: '#ffffff', color: '#111111',
                    border: 'none', borderRadius: 10,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Pretendard, -apple-system, sans-serif',
                  }}
                >
                  Google 로그인
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme */}
        <div className="settings-section">
          <div className="settings-section-title">화면 모드</div>
          <div className="settings-group">
            <div className="settings-cell">
              <span className="settings-cell-label">테마</span>
              <div className="segment-control">
                <button className={`segment-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>
                  🌙 다크
                </button>
                <button className={`segment-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>
                  ☀️ 라이트
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
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

        {/* Account */}
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

        <div style={{ textAlign: 'center', padding: '16px 0 8px', fontSize: 11, color: 'var(--text-muted)' }}>
          FoodSwipe v3.0.0
        </div>
      </div>

      <TabBar />
    </div>
  );
}
