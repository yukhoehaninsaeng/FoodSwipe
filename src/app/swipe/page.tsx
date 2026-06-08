'use client';

import { useState, useCallback, useEffect } from 'react';
import TabBar from '@/components/TabBar';
import SwipeCard from '@/components/SwipeCard';
import { RESTAURANTS, Restaurant } from '@/data/restaurants';
import { useApp } from '@/contexts/AppContext';

function StatusBar() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="status-bar">
      <span>{time}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <i className="ti ti-wifi" aria-hidden="true" style={{ fontSize: 13 }} />
        <i className="ti ti-battery-2" aria-hidden="true" style={{ fontSize: 13 }} />
      </div>
    </div>
  );
}

export default function SwipePage() {
  const { addToWishlist } = useApp();
  const [deck, setDeck] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const taste = localStorage.getItem('fs-taste');
        const parsed = taste ? JSON.parse(taste) : {};
        const cats = parsed.cuisine?.join(',') ?? '';

        let lat = process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '37.5434';
        let lng = process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '126.9076';

        // 브라우저 위치 요청 (허용 시)
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
          );
          lat = String(pos.coords.latitude);
          lng = String(pos.coords.longitude);
        } catch {
          // 위치 거부 시 기본값 사용
        }

        const params = new URLSearchParams({ lat, lng, cats });
        const res = await fetch(`/api/restaurants?${params}`);
        const data = await res.json();

        if (data.restaurants?.length > 0) {
          setDeck(data.restaurants);
        } else {
          setDeck([...RESTAURANTS]);
        }
      } catch {
        setDeck([...RESTAURANTS]);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    setDeck(prev => {
      const [top, ...rest] = prev;
      if (direction === 'right' || direction === 'up') {
        addToWishlist(top);
      }
      return rest;
    });
  }, [addToWishlist]);

  const handleNope  = () => deck.length > 0 && handleSwipe('left');
  const handleLike  = () => deck.length > 0 && handleSwipe('right');
  const handleSuper = () => deck.length > 0 && handleSwipe('up');

  const visibleCards = deck.slice(0, 3);

  return (
    <div className="app-shell">
      <StatusBar />

      <div style={{
        padding: '0 20px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent)' }}>
          FoodSwipe
        </span>
        <button className="icon-btn" aria-label="위치 설정"
          style={{ background: 'transparent', border: '0.5px solid var(--border-color)' }}>
          <i className="ti ti-map-pin" aria-hidden="true" />
        </button>
      </div>

      <div className="card-stack">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(255,92,26,0.2)',
              borderTopColor: 'var(--accent)',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
          </div>
        ) : deck.length === 0 ? (
          <div className="swipe-done">
            <i className="ti ti-check-circle" aria-hidden="true" />
            <h3>모두 탐색했어요!</h3>
            <p>오늘의 음식 탐색을 완료했어요.<br />찜 목록에서 저장된 가게를 확인해 보세요.</p>
            <button className="accent-cta" style={{ maxWidth: 240, marginTop: 8 }}
              onClick={() => setDeck([...RESTAURANTS])}>
              <i className="ti ti-refresh" aria-hidden="true" />
              다시 탐색하기
            </button>
          </div>
        ) : (
          [...visibleCards].reverse().map((restaurant, reversedIdx) => {
            const stackIndex = visibleCards.length - 1 - reversedIdx;
            return (
              <SwipeCard
                key={restaurant.id}
                restaurant={restaurant}
                onSwipe={handleSwipe}
                stackIndex={stackIndex}
              />
            );
          })
        )}
      </div>

      {!loading && deck.length > 0 && (
        <div className="action-area">
          <button className="action-btn btn-nope" aria-label="건너뜀" onClick={handleNope}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
          <button className="action-btn btn-super" aria-label="슈퍼 좋아요" onClick={handleSuper}>
            <i className="ti ti-star" aria-hidden="true" />
          </button>
          <button className="action-btn btn-like" aria-label="좋아요" onClick={handleLike}>
            <i className="ti ti-heart" aria-hidden="true" />
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}
