'use client';

import { useState, useEffect, useMemo } from 'react';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { FALLBACK_IMAGES, Restaurant, isOpen as checkIsOpen } from '@/data/restaurants';

/* ── 주소에서 동 이름 추출 ── */
function extractNeighborhood(address: string): string {
  if (!address) return '기타';
  const parts = address.trim().split(/\s+/);
  for (const p of parts) {
    if (/[동읍면]$/.test(p) && p.length >= 2 && !/^\d/.test(p)) return p;
  }
  for (const p of parts) {
    if (/[구군]$/.test(p) && p.length >= 2) return p;
  }
  return parts[2] ?? parts[1] ?? '기타';
}

/* ── 음식점 상세 바텀시트 ── */
function RestaurantDetailSheet({
  restaurant,
  visible,
  onClose,
  onRemove,
}: {
  restaurant: Restaurant | null;
  visible: boolean;
  onClose: () => void;
  onRemove: () => void;
}) {
  const r = restaurant;
  if (!r) return null;

  const isOpenNow = r.hours ? checkIsOpen(r.hours) : null;

  const openKakaoMap = () => {
    const q = encodeURIComponent(r.name + (r.address ? ' ' + r.address : ''));
    window.open(`https://map.kakao.com/?q=${q}`, '_blank', 'noopener noreferrer');
  };

  const openNaverMap = () => {
    const q = encodeURIComponent(r.name + (r.address ? ' ' + r.address : ''));
    window.open(`https://map.naver.com/v5/search/${q}`, '_blank', 'noopener noreferrer');
  };

  return (
    <>
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.25s',
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

        {/* 헤더 - 이름 + 닫기 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 0', flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isOpenNow === null ? 'var(--text-muted)' : isOpenNow ? '#32D264' : '#FF3B30',
                background: isOpenNow === null ? 'transparent'
                  : isOpenNow ? 'rgba(50,210,100,0.1)' : 'rgba(255,59,48,0.1)',
                padding: isOpenNow === null ? 0 : '2px 8px',
                borderRadius: 10,
              }}>
                {isOpenNow === null ? '' : isOpenNow ? '영업중' : '영업종료'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {r.category} · {r.distance} · {r.priceLevel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--surface)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: 12,
              color: 'var(--text-muted)', fontSize: 16,
            }}
            aria-label="닫기"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        {/* 스크롤 컨텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ padding: '12px 16px 16px' }}>

            {/* 대표 이미지 */}
            <div style={{
              width: '100%', height: 180, borderRadius: 16, overflow: 'hidden',
              background: 'var(--surface)', marginBottom: 16, flexShrink: 0,
            }}>
              <img
                src={r.imageUrl}
                alt={r.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  const fb = FALLBACK_IMAGES[r.category];
                  if (fb) (e.currentTarget as HTMLImageElement).src = fb;
                }}
              />
            </div>

            {/* 별점 + 태그 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-star-filled" style={{ color: 'var(--star)', fontSize: 14 }} aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{r.rating}</span>
              </div>
              {r.tags?.map(tag => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 500,
                  color: 'var(--text-secondary)',
                  background: 'var(--surface)',
                  border: '0.5px solid var(--border-color)',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* 주소 */}
            {r.address && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <i className="ti ti-map-pin" style={{ color: 'var(--accent)', fontSize: 15, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.address}</span>
              </div>
            )}

            {/* 전화번호 */}
            {r.phone && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <i className="ti ti-phone" style={{ color: 'var(--accent)', fontSize: 15, flexShrink: 0 }} aria-hidden="true" />
                <a href={`tel:${r.phone}`} style={{
                  fontSize: 13, color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}>
                  {r.phone}
                </a>
              </div>
            )}

            {/* 영업시간 */}
            {r.hours && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'flex-start' }}>
                <i className="ti ti-clock" style={{ color: 'var(--accent)', fontSize: 15, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <div>평일 {r.hours.weekday}</div>
                  <div>주말 {r.hours.weekend}</div>
                  {r.hours.breakTime && <div style={{ color: 'var(--text-muted)' }}>브레이크 {r.hours.breakTime}</div>}
                  {r.hours.closedDay && <div style={{ color: 'var(--text-muted)' }}>휴무 {r.hours.closedDay}</div>}
                </div>
              </div>
            )}

            {/* 메뉴 */}
            {r.menus && r.menus.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
                }}>
                  대표 메뉴
                </div>
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}>
                  {r.menus.map((menu, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px',
                        borderBottom: i < r.menus!.length - 1 ? '0.5px solid var(--border-color)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{menu.e}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                          {menu.n}
                        </div>
                        {menu.d && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                            {menu.d}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {menu.p}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 고정 버튼 영역 */}
        <div style={{
          padding: '12px 16px 32px',
          borderTop: '0.5px solid var(--border-color)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* 지도 버튼 2개 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={openKakaoMap}
              style={{
                flex: 1, padding: '13px 8px', borderRadius: 14, border: 'none',
                background: '#FFDA00', color: '#1A1300',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                letterSpacing: '-0.02em',
              }}
            >
              🗺️ 카카오맵
            </button>
            <button
              onClick={openNaverMap}
              style={{
                flex: 1, padding: '13px 8px', borderRadius: 14, border: 'none',
                background: '#03C75A', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                letterSpacing: '-0.02em',
              }}
            >
              🧭 네이버 지도
            </button>
          </div>

          {/* 찜 해제 버튼 */}
          <button
            onClick={() => { onRemove(); onClose(); }}
            style={{
              width: '100%', padding: '12px', borderRadius: 14,
              border: '0.5px solid var(--border-color)',
              background: 'var(--surface)', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <i className="ti ti-heart-off" aria-hidden="true" />
            찜 해제
          </button>
        </div>
      </div>
    </>
  );
}

/* ── 그룹 헤더 ── */
function GroupHeader({
  neighborhood,
  count,
  isCurrent,
}: {
  neighborhood: string;
  count: number;
  isCurrent: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '20px 4px 10px',
    }}>
      <i
        className="ti ti-map-pin-filled"
        aria-hidden="true"
        style={{
          fontSize: 14,
          color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
          flexShrink: 0,
        }}
      />
      <span style={{
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        flex: 1,
      }}>
        {neighborhood === '기타' ? '기타 지역' : neighborhood} 맛집
      </span>
      {isCurrent && (
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--accent)',
          background: 'rgba(255,92,26,0.08)',
          border: '0.5px solid rgba(255,92,26,0.22)',
          padding: '2px 8px',
          borderRadius: 20,
        }}>
          현재 위치
        </span>
      )}
      <span style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        fontWeight: 500,
      }}>
        {count}곳
      </span>
    </div>
  );
}

/* ── 찜 아이템 ── */
function WishlistItem({
  restaurant,
  onTap,
  onRemove,
}: {
  restaurant: Restaurant;
  onTap: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="wishlist-item" style={{ cursor: 'pointer' }}>
      {/* 탭 가능한 영역 (이미지 + 정보) */}
      <div
        role="button"
        tabIndex={0}
        onClick={onTap}
        onKeyDown={e => e.key === 'Enter' && onTap()}
        style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, minWidth: 0 }}
      >
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="wishlist-thumb"
          loading="lazy"
          onError={e => {
            const fb = FALLBACK_IMAGES[restaurant.category];
            if (fb) (e.currentTarget as HTMLImageElement).src = fb;
          }}
        />
        <div className="wishlist-info">
          <div className="wishlist-name">{restaurant.name}</div>
          <div className="wishlist-meta">
            {restaurant.category} · {restaurant.distance} · {restaurant.priceLevel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <i className="ti ti-star-filled" style={{ color: 'var(--star)', fontSize: 10 }} aria-hidden="true" />
            <span className="wishlist-meta">{restaurant.rating}</span>
            {restaurant.address && (
              <>
                <span className="wishlist-meta" style={{ opacity: 0.4 }}>·</span>
                <span className="wishlist-meta" style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                }}>
                  {restaurant.address}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 찜 해제 버튼 */}
      <button
        aria-label={`${restaurant.name} 찜 해제`}
        onClick={e => { e.stopPropagation(); onRemove(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 6,
          color: 'var(--accent)', fontSize: 20, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <i className="ti ti-heart-filled" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useApp();
  const [currentNeighborhood, setCurrentNeighborhood] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = (r: Restaurant) => {
    setSelected(r);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSelected(null), 380);
  };

  /* 현재 위치 → 역지오코딩 */
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLoading(false); return; }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(`/api/location?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          setCurrentNeighborhood(data.neighborhood ?? null);
        } catch {
          /* ignore */
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false),
      { timeout: 5000 }
    );
  }, []);

  /* 동네별 그룹핑 */
  const grouped = useMemo(() => {
    const map: Record<string, Restaurant[]> = {};
    for (const r of wishlist) {
      const n = extractNeighborhood(r.address ?? '');
      if (!map[n]) map[n] = [];
      map[n].push(r);
    }
    return map;
  }, [wishlist]);

  /* 정렬: 현재 위치 → 나머지 가나다순 */
  const sortedGroups = useMemo(() =>
    Object.keys(grouped).sort((a, b) => {
      if (a === currentNeighborhood) return -1;
      if (b === currentNeighborhood) return 1;
      return a.localeCompare(b, 'ko');
    }),
    [grouped, currentNeighborhood]
  );

  const total = wishlist.length;

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">찜 목록</h1>
          {total > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {total}곳 저장됨
              {currentNeighborhood && !locationLoading && (
                <> · 📍 {currentNeighborhood}</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="scroll-content">
        {wishlist.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-heart" aria-hidden="true" />
            <p>아직 찜한 가게가 없어요.<br />탐색 화면에서 마음에 드는 가게를 찜해 보세요!</p>
          </div>
        ) : (
          sortedGroups.map((neighborhood, groupIdx) => (
            <div key={neighborhood}>
              {groupIdx > 0 && (
                <div style={{
                  height: 0.5,
                  background: 'var(--border-color)',
                  margin: '4px 0',
                }} />
              )}

              <GroupHeader
                neighborhood={neighborhood}
                count={grouped[neighborhood].length}
                isCurrent={neighborhood === currentNeighborhood}
              />

              {grouped[neighborhood].map(r => (
                <WishlistItem
                  key={r.id}
                  restaurant={r}
                  onTap={() => openSheet(r)}
                  onRemove={() => removeFromWishlist(r.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* 음식점 상세 바텀시트 */}
      <RestaurantDetailSheet
        restaurant={selected}
        visible={sheetVisible}
        onClose={closeSheet}
        onRemove={() => { if (selected) removeFromWishlist(selected.id); }}
      />

      <TabBar />
    </div>
  );
}
