'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TabBar from '@/components/TabBar';
import ToggleSwitch from '@/components/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';

/* ── 이름 받침 → 아/야 ── */
function nameParticle(name: string): string {
  if (!name) return '아';
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return '아';
  return (code - 0xAC00) % 28 === 0 ? '야' : '아';
}

/* ── 서비스 메뉴 정의 ── */
const SERVICES = [
  { emoji: '🍽️', label: '식사 추천', sub: '오늘 점심 뭐 먹지?', href: '/swipe?mode=food',           bg: 'rgba(255,92,26,0.14)'  },
  { emoji: '☕',  label: '카페 추천', sub: '커피 한잔 하러',      href: '/swipe?mode=cafe',           bg: 'rgba(108,60,20,0.14)'  },
  { emoji: '🍺',  label: '안주 추천', sub: '오늘 한잔 할 때',     href: '/swipe?mode=food&focus=anju',    bg: 'rgba(230,160,0,0.14)'  },
  { emoji: '🍰',  label: '디저트 추천', sub: '달달한게 당길 때', href: '/swipe?mode=cafe&focus=dessert', bg: 'rgba(220,50,100,0.12)' },
  { emoji: '🍜',  label: '라면 추천', sub: '국물 떙기는 날',      href: '/swipe?mode=food&focus=ramen',   bg: 'rgba(200,30,30,0.12)'  },
  { emoji: '🍗',  label: '치킨 추천', sub: '오늘은 치킨이지',     href: '/swipe?mode=food&focus=chicken', bg: 'rgba(235,140,0,0.14)'  },
];

/* ── 카카오 아이콘 ── */
function KakaoIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 24 22" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M12 0C5.373 0 0 4.163 0 9.3c0 3.274 2.133 6.148 5.367 7.8l-1.37 5.102a.4.4 0 0 0 .591.44L10.7 19.35A13.8 13.8 0 0 0 12 19.44c6.627 0 12-4.163 12-9.14C24 4.163 18.627 0 12 0z"
        fill="#391B1B"
      />
    </svg>
  );
}

/* ── 구글 아이콘 ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── 카드 래퍼 ── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '0.5px solid var(--border-color)',
      borderRadius: 18,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── 설정 섹션 카드 ── */
function SettingsCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '0.5px solid var(--border-color)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </div>
      </div>
      <div style={{ padding: '6px 16px 14px' }}>
        {children}
      </div>
    </div>
  );
}

/* ── 환경설정 바텀시트 ── */
function PreferencesSheet({
  visible,
  onClose,
  nickname,
  onNicknameChange,
}: {
  visible: boolean;
  onClose: () => void;
  nickname: string;
  onNicknameChange: (n: string) => void;
}) {
  const { theme, setTheme } = useTheme();
  const { notifNewOpen, setNotifNewOpen, notifGroupMatch, setNotifGroupMatch } = useApp();
  const { data: session } = useSession();
  const router = useRouter();

  const [editing, setEditing]       = useState(false);
  const [inputVal, setInputVal]     = useState(nickname);

  useEffect(() => { setInputVal(nickname); }, [nickname]);

  const saveNickname = () => {
    const t = inputVal.trim();
    if (t) { localStorage.setItem('fs-nickname', t); onNicknameChange(t); }
    setEditing(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('fs-onboarding-done');
    localStorage.removeItem('fs-taste');
    localStorage.removeItem('fs-wishlist');
    localStorage.removeItem('fs-nickname');
    await signOut({ redirect: false });
    onClose();
    router.replace('/');
  };

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.22s',
          zIndex: 60,
        }}
      />

      {/* 시트 */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: `translateX(-50%) translateY(${visible ? 0 : 100}%)`,
          width: '100%', maxWidth: 430,
          background: 'var(--bg)',
          borderRadius: '22px 22px 0 0',
          transition: 'transform 0.34s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 61,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-color)' }} />
        </div>

        {/* 타이틀 */}
        <div style={{
          padding: '10px 16px 8px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
            앱 설정
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--surface)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: 14,
            }}
            aria-label="닫기"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* 스크롤 컨텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ padding: '4px 16px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* 닉네임 */}
            <SettingsCard label="닉네임">
              {editing ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    autoFocus
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value.slice(0, 8))}
                    onKeyDown={e => e.key === 'Enter' && saveNickname()}
                    maxLength={8}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid var(--accent)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontSize: 14, fontFamily: 'inherit',
                      outline: 'none', letterSpacing: '-0.02em',
                    }}
                  />
                  <button
                    onClick={saveNickname}
                    style={{
                      padding: '10px 16px', borderRadius: 10, border: 'none',
                      background: 'var(--accent)', color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {nickname || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>닉네임 없음</span>}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      padding: '6px 14px', borderRadius: 10,
                      border: '0.5px solid var(--border-color)',
                      background: 'var(--surface)',
                      color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    변경
                  </button>
                </div>
              )}
            </SettingsCard>

            {/* 화면 모드 */}
            <SettingsCard label="화면 모드">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>테마</span>
                <div className="segment-control">
                  <button className={`segment-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>다크</button>
                  <button className={`segment-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>라이트</button>
                </div>
              </div>
            </SettingsCard>

            {/* 알림 */}
            <SettingsCard label="알림">
              {[
                { label: '신규 오픈 알림', checked: notifNewOpen, onChange: setNotifNewOpen },
                { label: '그룹 매칭 알림', checked: notifGroupMatch, onChange: setNotifGroupMatch },
              ].map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i === 0 ? '0.5px solid var(--border-color)' : 'none',
                  marginTop: i === 0 ? 4 : 0,
                }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
                  <ToggleSwitch checked={item.checked} onChange={item.onChange} label={item.label} />
                </div>
              ))}
            </SettingsCard>

            {/* 계정 */}
            <SettingsCard label="계정">
              <div style={{ marginTop: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '0.5px solid var(--border-color)',
                  cursor: 'pointer',
                }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>FoodSwipe Plus</span>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginRight: 6 }}>업그레이드</span>
                  <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }} aria-hidden="true" />
                </div>
                {session && (
                  <div
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '8px 0',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#FF3B30' }}>로그아웃</span>
                  </div>
                )}
              </div>
            </SettingsCard>

          </div>
        </div>
      </div>
    </>
  );
}

/* ── 메인 페이지 ── */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('fs-nickname');
    if (stored) setNickname(stored);
  }, []);

  const isLoggedIn = status === 'authenticated';
  const isLoading  = status === 'loading';

  /* 인사말 생성 */
  const displayName = isLoggedIn
    ? (nickname || session?.user?.name?.split(' ')[0] || '')
    : nickname;
  const greeting = displayName
    ? `${displayName}${nameParticle(displayName)}, 오늘 뭐 먹을래?`
    : '오늘 뭐 먹을래?';

  return (
    <div className="app-shell" style={{ background: 'var(--page-bg)', position: 'relative' }}>

      {/* ── 헤더 ── */}
      <div style={{
        height: 52, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--page-bg)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>나</h1>
        <button
          className="icon-btn"
          style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border-color)' }}
          aria-label="앱 설정"
          onClick={() => setShowPrefs(true)}
        >
          <i className="ti ti-settings" aria-hidden="true" />
        </button>
      </div>

      {/* ── 스크롤 뷰포트 ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '4px 14px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── 인사 섹션 ── */}
          <div style={{ padding: '6px 2px 2px' }}>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em',
              color: 'var(--text-primary)', lineHeight: 1.35,
            }}>
              {displayName
                ? <>{displayName}{nameParticle(displayName)},</>
                : '안녕하세요!'}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em',
              color: 'var(--accent)', lineHeight: 1.35,
            }}>
              오늘 뭐 먹을래? 🍽️
            </div>
          </div>

          {/* ── 프로필 카드 ── */}
          <Card>
            {isLoading ? (
              <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: '2px solid rgba(255,92,26,0.2)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
              </div>

            ) : isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
                {session.user?.image ? (
                  <img src={session.user.image} alt=""
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(session.user?.name ?? '?')[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {session.user?.name}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {session.user?.email}
                  </div>
                </div>
                <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 16 }} aria-hidden="true" />
              </div>

            ) : (
              <div style={{ padding: '20px 16px' }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                  letterSpacing: '-0.03em', marginBottom: 4,
                }}>
                  로그인하고 더 많은 기능을 이용해보세요
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                  찜 목록 동기화, 그룹 매칭 등
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => signIn('kakao', { callbackUrl: '/settings' })}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12, border: 'none',
                      background: '#FEE500', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 13, fontWeight: 700, color: '#3A1D1D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    <KakaoIcon />카카오
                  </button>
                  <button
                    onClick={() => signIn('google', { callbackUrl: '/settings' })}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      border: '1px solid var(--border-color)',
                      background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    <GoogleIcon />구글
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* ── 서비스 ── */}
          <Card>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px 10px',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                장소 추천
              </span>
              <i className="ti ti-chevron-right" style={{ color: 'var(--text-muted)', fontSize: 14 }} aria-hidden="true" />
            </div>

            {/* 서비스 그리드 — 3행 하드코딩 */}
            {([[0, 1], [2, 3], [4, 5]] as [number, number][]).map(([a, b], rowIdx) => (
              <div
                key={rowIdx}
                style={{ display: 'flex', borderTop: '0.5px solid var(--border-color)' }}
              >
                {[SERVICES[a], SERVICES[b]].map((svc, colIdx) => (
                  <button
                    key={svc.label}
                    onClick={() => router.push(svc.href)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px', background: 'transparent',
                      fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
                      borderTop: 'none', borderBottom: 'none', borderRight: 'none',
                      borderLeft: colIdx === 1 ? '0.5px solid var(--border-color)' : 'none',
                    }}
                    onPointerDown={e => { (e.currentTarget as HTMLElement).style.background = 'var(--page-bg)'; }}
                    onPointerUp={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    onPointerLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: svc.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 23,
                    }}>
                      {svc.emoji}
                    </div>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                        letterSpacing: '-0.02em', lineHeight: 1.2,
                      }}>
                        {svc.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {svc.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            <div style={{ height: 6 }} />
          </Card>

          {/* 버전 */}
          <div style={{
            textAlign: 'center', padding: '4px 0 8px',
            fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.02em',
          }}>
            FoodSwipe v1.2.1
          </div>
        </div>
      </div>

      {/* ── 환경설정 바텀시트 ── */}
      <PreferencesSheet
        visible={showPrefs}
        onClose={() => setShowPrefs(false)}
        nickname={nickname}
        onNicknameChange={setNickname}
      />

      <TabBar />
    </div>
  );
}
