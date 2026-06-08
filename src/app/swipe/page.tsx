'use client';

import { useState, useCallback } from 'react';
import TabBar from '@/components/TabBar';
import SwipeCard from '@/components/SwipeCard';
import { RESTAURANTS } from '@/data/restaurants';
import { useApp } from '@/contexts/AppContext';

function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
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
  const [deck, setDeck] = useState([...RESTAURANTS]);
  const [history, setHistory] = useState<{ id: string; dir: string }[]>([]);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    setDeck(prev => {
      const [top, ...rest] = prev;
      if (direction === 'right' || direction === 'up') {
        addToWishlist(top);
      }
      setHistory(h => [{ id: top.id, dir: direction }, ...h]);
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

      {/* Logo / Title */}
      <div style={{
        padding: '0 20px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: 'var(--accent)',
        }}>FoodSwipe</span>
        <button
          className="icon-btn"
          aria-label="위치 설정"
          style={{ background: 'transparent', border: '0.5px solid var(--border-color)' }}
        >
          <i className="ti ti-map-pin" aria-hidden="true" />
        </button>
      </div>

      {/* Card Stack */}
      <div className="card-stack">
        {deck.length === 0 ? (
          <div className="swipe-done">
            <i className="ti ti-check-circle" aria-hidden="true" />
            <h3>모두 탐색했어요!</h3>
            <p>오늘의 음식 탐색을 완료했어요.<br />찜 목록에서 저장된 가게를 확인해 보세요.</p>
            <button
              className="accent-cta"
              style={{ maxWidth: 240, marginTop: 8 }}
              onClick={() => setDeck([...RESTAURANTS])}
            >
              <i className="ti ti-refresh" aria-hidden="true" />
              다시 탐색하기
            </button>
          </div>
        ) : (
          /* Render in reverse so top card is on top */
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

      {/* Action Buttons */}
      {deck.length > 0 && (
        <div className="action-area">
          <button
            className="action-btn btn-nope"
            aria-label="건너뜀"
            onClick={handleNope}
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
          <button
            className="action-btn btn-super"
            aria-label="슈퍼 좋아요"
            onClick={handleSuper}
          >
            <i className="ti ti-star" aria-hidden="true" />
          </button>
          <button
            className="action-btn btn-like"
            aria-label="좋아요"
            onClick={handleLike}
          >
            <i className="ti ti-heart" aria-hidden="true" />
          </button>
        </div>
      )}

      <TabBar />
    </div>
  );
}
