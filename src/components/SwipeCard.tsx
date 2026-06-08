'use client';

import { useState, useRef, useCallback, CSSProperties } from 'react';
import { Restaurant, FALLBACK_IMAGES } from '@/data/restaurants';

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  stackIndex: number;
}

const SWIPE_THRESHOLD = 90;
const ROTATION_FACTOR = 0.08;
const FLIP_DRAG_LIMIT = 6;

function openKakaoSearch(name: string) {
  window.open(`https://map.kakao.com/link/search/${encodeURIComponent(name)}`, '_blank');
}

function openKakaoNavi(name: string, address: string) {
  const dest = address || name;
  window.open(
    `https://map.kakao.com/link/to/${encodeURIComponent(name)},${encodeURIComponent(dest)}`,
    '_blank'
  );
}

export default function SwipeCard({ restaurant, onSwipe, stackIndex }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyDir, setFlyDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [flipped, setFlipped] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const isDraggedRef = useRef(false);
  const isTop = stackIndex === 0;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop || flipped) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    isDraggedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
  }, [isTop, flipped]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > FLIP_DRAG_LIMIT || Math.abs(dy) > FLIP_DRAG_LIMIT) {
      isDraggedRef.current = true;
    }
    setDragX(dx);
    setDragY(dy);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (!isDraggedRef.current) {
      setFlipped(f => !f);
      setDragX(0);
      setDragY(0);
      return;
    }

    if (dragX > SWIPE_THRESHOLD) {
      setFlyDir('right');
      setTimeout(() => onSwipe('right'), 280);
    } else if (dragX < -SWIPE_THRESHOLD) {
      setFlyDir('left');
      setTimeout(() => onSwipe('left'), 280);
    } else if (dragY < -SWIPE_THRESHOLD && Math.abs(dragX) < 60) {
      setFlyDir('up');
      setTimeout(() => onSwipe('up'), 280);
    } else {
      setDragX(0);
      setDragY(0);
    }
  }, [isDragging, dragX, dragY, onSwipe]);

  const getFlyTransform = () => {
    if (flyDir === 'right') return `translateX(120vw) rotate(25deg)`;
    if (flyDir === 'left')  return `translateX(-120vw) rotate(-25deg)`;
    if (flyDir === 'up')    return `translateY(-120vh)`;
    return '';
  };

  const getStackTransform = () => {
    if (stackIndex === 1) return `translateY(6px) scale(0.96)`;
    if (stackIndex === 2) return `translateY(12px) scale(0.92)`;
    return '';
  };

  let transform = '';
  let transition = '';

  if (flyDir) {
    transform = getFlyTransform();
    transition = 'transform 0.28s cubic-bezier(0.4,0,1,1)';
  } else if (isTop && !flipped) {
    const rot = dragX * ROTATION_FACTOR;
    transform = `translateX(${dragX}px) translateY(${dragY}px) rotate(${rot}deg)`;
    transition = isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
  } else {
    transform = getStackTransform();
    transition = 'transform 0.3s ease';
  }

  const style: CSSProperties = {
    transform,
    transition,
    zIndex: 3 - stackIndex,
    touchAction: isTop && flipped ? 'auto' : undefined,
    background: stackIndex === 1
      ? 'var(--stack-card-1)'
      : stackIndex === 2
      ? 'var(--stack-card-2)'
      : undefined,
  };

  const likeOpacity  = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity  = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);
  const superOpacity = isTop && dragY < 0 && Math.abs(dragX) < 60
    ? Math.min(Math.max(-dragY / SWIPE_THRESHOLD, 0), 1)
    : 0;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const fallback = FALLBACK_IMAGES[restaurant.category];
    if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
  };

  return (
    <div
      className={`swipe-card-wrapper${isTop ? ' is-top' : ''}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {stackIndex === 0 && (
        <div className="card-flip-container">
          <div className={`card-flip-inner${flipped ? ' flipped' : ''}`}>

            {/* ── Front face ── */}
            <div className="card-face card-face-front">
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="card-image"
                loading="eager"
                onError={handleImgError}
                draggable={false}
              />
              <div className="card-vignette-top" />
              <div className="card-vignette-bottom" />

              {restaurant.isSponsored && (
                <div className="card-sponsor-badge">SPONSORED</div>
              )}

              <div className="swipe-label swipe-label-like" style={{ opacity: likeOpacity }}>LIKE</div>
              <div className="swipe-label swipe-label-nope" style={{ opacity: nopeOpacity }}>NOPE</div>
              {superOpacity > 0 && (
                <div className="swipe-label swipe-label-super" style={{ opacity: superOpacity }}>SUPER</div>
              )}

              <div className="card-info">
                <div className="card-category-tag">{restaurant.category}</div>
                <div className="card-name">{restaurant.name}</div>
                <div className="card-meta">
                  <i className="ti ti-star-filled" style={{ color: 'var(--star)', fontSize: 12 }} aria-hidden="true" />
                  <span>{restaurant.rating}</span>
                  <span className="card-meta-dot">·</span>
                  <span>{restaurant.distance}</span>
                  <span className="card-meta-dot">·</span>
                  <span>{restaurant.priceLevel}</span>
                </div>
                {restaurant.aiHint && (
                  <div className="card-ai-hint">
                    <i className="ti ti-sparkles" aria-hidden="true" />
                    <span>{restaurant.aiHint}</span>
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
                  탭하면 메뉴 보기 →
                </div>
              </div>
            </div>

            {/* ── Back face ── */}
            <div
              className="card-face card-face-back"
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Sticky header */}
              <div className="card-back-header">
                <button
                  className="card-back-close"
                  onClick={() => setFlipped(false)}
                  aria-label="돌아가기"
                >
                  <i className="ti ti-x" />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                    letterSpacing: '-0.04em', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {restaurant.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {restaurant.category} · {restaurant.priceLevel} ·{' '}
                    <i className="ti ti-star-filled" style={{ color: 'var(--star)', fontSize: 10 }} />
                    {' '}{restaurant.rating}
                  </div>
                </div>
              </div>

              {/* Photo strip */}
              {restaurant.photos && restaurant.photos.length > 0 && (
                <div className="card-back-photos">
                  {restaurant.photos.map((url, i) => (
                    <img key={i} src={url} alt="" className="card-back-photo-thumb" draggable={false} />
                  ))}
                </div>
              )}

              {/* Menus */}
              {restaurant.menus && restaurant.menus.length > 0 && (
                <div className="card-back-section">
                  <div className="card-back-section-title">메뉴</div>
                  {restaurant.menus.map((item, i) => (
                    <div key={i} className="card-back-menu-item">
                      <span className="card-back-menu-emoji">{item.e}</span>
                      <div className="card-back-menu-info">
                        <span className="card-back-menu-name">{item.n}</span>
                        <span className="card-back-menu-desc">{item.d}</span>
                      </div>
                      <span className="card-back-menu-price">{item.p}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hours */}
              {restaurant.hours && (
                <div className="card-back-section">
                  <div className="card-back-section-title">영업시간</div>
                  <div className="card-back-hours-row">
                    <span>평일</span><span>{restaurant.hours.weekday}</span>
                  </div>
                  <div className="card-back-hours-row">
                    <span>주말</span><span>{restaurant.hours.weekend}</span>
                  </div>
                  {restaurant.hours.breakTime && (
                    <div className="card-back-hours-row">
                      <span>브레이크</span><span>{restaurant.hours.breakTime}</span>
                    </div>
                  )}
                  {restaurant.hours.closedDay && (
                    <div className="card-back-hours-row" style={{ color: 'var(--accent)' }}>
                      <span>정기휴무</span><span>{restaurant.hours.closedDay}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Address */}
              {restaurant.address && (
                <div className="card-back-section" style={{ borderBottom: 'none' }}>
                  <div className="card-back-section-title">주소</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {restaurant.address}
                  </div>
                </div>
              )}

              {/* Map buttons */}
              <div className="card-back-map-btns">
                <button
                  className="card-back-map-btn"
                  onClick={() => openKakaoSearch(restaurant.name)}
                >
                  <i className="ti ti-map-2" />
                  카카오맵
                </button>
                <button
                  className="card-back-map-btn card-back-map-btn-accent"
                  onClick={() => openKakaoNavi(restaurant.name, restaurant.address)}
                >
                  <i className="ti ti-navigation" />
                  길찾기
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
