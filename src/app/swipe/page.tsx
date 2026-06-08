'use client';

import { useState, useCallback, useEffect } from 'react';
import TabBar from '@/components/TabBar';
import SwipeCard from '@/components/SwipeCard';
import { RESTAURANTS, Restaurant } from '@/data/restaurants';
import { useApp } from '@/contexts/AppContext';

type SwipeMode = 'food' | 'cafe';

const MODE_CONFIG: Record<SwipeMode, { label: string; emoji: string; query: string }> = {
  food: { label: '음식',   emoji: '🍽️', query: 'food'   },
  cafe: { label: '카페',   emoji: '☕', query: 'cafe'   },
};

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
  const [mode, setMode] = useState<SwipeMode>('food');
  const [deck, setDeck] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRestaurants = useCallback(async (currentMode: SwipeMode) => {
    setLoading(true);
    setDeck([]);
    try {
      const taste = localStorage.getItem('fs-taste');
      const parsed = taste ? JSON.parse(taste) : {};
      const cats = currentMode === 'cafe'
        ? 'cafe,dessert'
        : (parsed.cuisine?.join(',') ?? '');

      let lat = process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '37.5434';
      let lng = process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '126.9076';

      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        lat = String(pos.coords.latitude);
        lng = String(pos.coords.longitude);
      } catch {
        // use default
      }

      const params = new URLSearchParams({ lat, lng, cats, mode: currentMode });
      const res = await fetch(`/api/restaurants?${params}`);
      const data = await res.json();

      setDeck(data.restaurants?.length > 0 ? data.restaurants : [...RESTAURANTS]);
    } catch {
      setDeck([...RESTAURANTS]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants(mode);
  }, [mode, loadRestaurants]);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    setDeck(prev => {
      const [top, ...rest] = prev;
      if (direction === 'right' || direction === 'up') addToWishlist(top);
      return rest;
    });
  }, [addToWishlist]);

  const visibleCards = deck.slice(0, 3);

  return (
    <div className="app-shell">
      <StatusBar />

      {/* Header */}
      <div style={{
        padding: '0 16px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        {/* App title */}
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--accent)', flexShrink: 0 }}>
          FoodSwipe
        </span>

        {/* Mode switcher */}
        <div style={{
          display: 'flex',
          flex: 1,
          background: 'var(--surface)',
          border: '0.5px solid var(--border-color)',
          borderRadius: 20,
          padding: '3px',
          gap: 2,
        }}>
          {(Object.entries(MODE_CONFIG) as [SwipeMode, typeof MODE_CONFIG[SwipeMode]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Pretendard, -apple-system, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                background: mode === key ? 'var(--accent)' : 'transparent',
                color: mode === key ? '#ffffff' : 'var(--text-muted)',
              }}
              aria-pressed={mode === key}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Location button */}
        <button
          className="icon-btn"
          aria-label="위치 설정"
          style={{ flexShrink: 0, background: 'transparent', border: '0.5px solid var(--border-color)' }}
        >
          <i className="ti ti-map-pin" aria-hidden="true" />
        </button>
      </div>

      {/* Card Stack */}
      <div className="card-stack">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
            <p>
              {mode === 'cafe' ? '근처 카페를' : '주변 맛집을'} 다 살펴봤어요.<br />
              찜 목록에서 저장한 곳을 확인해 보세요.
            </p>
            <button
              className="accent-cta"
              style={{ maxWidth: 240, marginTop: 8 }}
              onClick={() => loadRestaurants(mode)}
            >
              <i className="ti ti-refresh" aria-hidden="true" />
              다시 탐색하기
            </button>
          </div>
        ) : (
          [...visibleCards].reverse().map((restaurant, reversedIdx) => {
            const stackIndex = visibleCards.length - 1 - reversedIdx;
            return (
              <SwipeCard
                key={`${mode}-${restaurant.id}`}
                restaurant={restaurant}
                onSwipe={handleSwipe}
                stackIndex={stackIndex}
              />
            );
          })
        )}
      </div>

      {/* Action buttons */}
      {!loading && deck.length > 0 && (
        <div className="action-area">
          <button className="action-btn btn-nope" aria-label="건너뜀" onClick={() => handleSwipe('left')}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
          <button className="action-btn btn-super" aria-label="슈퍼 좋아요" onClick={() => handleSwipe('up')}>
            <i className="ti ti-star" aria-hidden="true" />
          </button>
          <button className="action-btn btn-like" aria-label="좋아요" onClick={() => handleSwipe('right')}>
            <i className="ti ti-heart" aria-hidden="true" />
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}
