'use client';

import { useState, useEffect, useMemo } from 'react';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { FALLBACK_IMAGES, Restaurant } from '@/data/restaurants';

/* ── 주소에서 동 이름 추출 ── */
function extractNeighborhood(address: string): string {
  if (!address) return '기타';
  const parts = address.trim().split(/\s+/);
  // 동/읍/면 우선
  for (const p of parts) {
    if (/[동읍면]$/.test(p) && p.length >= 2 && !/^\d/.test(p)) return p;
  }
  // 없으면 구/군
  for (const p of parts) {
    if (/[구군]$/.test(p) && p.length >= 2) return p;
  }
  return parts[2] ?? parts[1] ?? '기타';
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
  onRemove,
}: {
  restaurant: Restaurant;
  onRemove: () => void;
}) {
  return (
    <div className="wishlist-item">
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
      <button
        aria-label={`${restaurant.name} 찜 해제`}
        onClick={onRemove}
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
    <div className="app-shell">
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
              {/* 첫 그룹 아닌 경우 구분선 */}
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
                  onRemove={() => removeFromWishlist(r.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <TabBar />
    </div>
  );
}
