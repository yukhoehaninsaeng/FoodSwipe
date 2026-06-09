'use client';

import { useState, useRef, useCallback, useEffect, CSSProperties } from 'react';
import { Restaurant, FALLBACK_IMAGES, MenuItem, BusinessHours } from '@/data/restaurants';

interface ExtraInfo {
  menus: MenuItem[] | null;
  hours: BusinessHours | null;
}

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  stackIndex: number;
}

const SWIPE_THRESHOLD = 72;    // distance threshold (px)
const VELOCITY_THRESHOLD = 380; // quick-flick threshold (px/s)
const ROTATION_FACTOR = 0.08;
const FLIP_DRAG_LIMIT = 10;    // min drag to cancel tap→flip

function openKakaoMap(name: string, address: string) {
  const q = encodeURIComponent(name + (address ? ' ' + address : ''));
  window.open(`https://map.kakao.com/?q=${q}`, '_blank', 'noopener noreferrer');
}

function openNaverMap(name: string, address: string) {
  const q = encodeURIComponent(name + (address ? ' ' + address : ''));
  window.open(`https://map.naver.com/p/search/${q}`, '_blank', 'noopener noreferrer');
}

export default function SwipeCard({ restaurant, onSwipe, stackIndex }: SwipeCardProps) {
  // Use refs for drag values so onPointerUp always sees the latest position
  const dragXRef = useRef(0);
  const dragYRef = useRef(0);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [flyDir, setFlyDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [extraInfo, setExtraInfo] = useState<ExtraInfo | null>(null);
  const [extraLoading, setExtraLoading] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const isDraggedRef = useRef(false);
  const velocityRef = useRef({ vx: 0, vy: 0, prevX: 0, prevY: 0, time: 0 });
  const isTop = stackIndex === 0;

  // Prefetch place detail as soon as this card becomes the top card
  useEffect(() => {
    if (!isTop) return;
    if (restaurant.menus && restaurant.menus.length > 0) return;
    if (extraInfo !== null) return;
    if (!/^\d+$/.test(restaurant.id)) return; // mock data, skip
    setExtraLoading(true);
    fetch(`/api/place?id=${restaurant.id}`)
      .then(r => r.json())
      .then((d: ExtraInfo) => setExtraInfo(d))
      .catch(() => setExtraInfo({ menus: null, hours: null }))
      .finally(() => setExtraLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  // Convenience aliases for render
  const dragX = dragPos.x;
  const dragY = dragPos.y;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop || flipped) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    isDraggedRef.current = false;
    dragXRef.current = 0;
    dragYRef.current = 0;
    setDragPos({ x: 0, y: 0 });
    startRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { vx: 0, vy: 0, prevX: e.clientX, prevY: e.clientY, time: Date.now() };
  }, [isTop, flipped]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    // Update velocity
    const now = Date.now();
    const dt = now - velocityRef.current.time;
    if (dt > 0) {
      velocityRef.current = {
        vx: (e.clientX - velocityRef.current.prevX) / dt * 1000,
        vy: (e.clientY - velocityRef.current.prevY) / dt * 1000,
        prevX: e.clientX,
        prevY: e.clientY,
        time: now,
      };
    }

    if (Math.abs(dx) > FLIP_DRAG_LIMIT || Math.abs(dy) > FLIP_DRAG_LIMIT) {
      isDraggedRef.current = true;
    }
    dragXRef.current = dx;
    dragYRef.current = dy;
    setDragPos({ x: dx, y: dy });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const dx = dragXRef.current;
    const dy = dragYRef.current;
    const { vx, vy } = velocityRef.current;

    if (!isDraggedRef.current) {
      setFlipped(f => !f);
      dragXRef.current = 0;
      dragYRef.current = 0;
      setDragPos({ x: 0, y: 0 });
      return;
    }

    const goRight = dx > SWIPE_THRESHOLD || (vx > VELOCITY_THRESHOLD && dx > 20);
    const goLeft  = dx < -SWIPE_THRESHOLD || (vx < -VELOCITY_THRESHOLD && dx < -20);
    const goUp    = (dy < -SWIPE_THRESHOLD || vy < -VELOCITY_THRESHOLD) && Math.abs(dx) < 60;

    if (goRight) {
      setFlyDir('right');
      setTimeout(() => onSwipe('right'), 280);
    } else if (goLeft) {
      setFlyDir('left');
      setTimeout(() => onSwipe('left'), 280);
    } else if (goUp) {
      setFlyDir('up');
      setTimeout(() => onSwipe('up'), 280);
    } else {
      dragXRef.current = 0;
      dragYRef.current = 0;
      setDragPos({ x: 0, y: 0 });
    }
  }, [onSwipe]);

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
    transition = isDraggingRef.current ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
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

              {/* 1. 주소 */}
              {restaurant.address && (
                <div className="card-back-section">
                  <div className="card-back-section-title">주소</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {restaurant.address}
                  </div>
                </div>
              )}

              {/* 2. 메뉴 */}
              <div className="card-back-section">
                <div className="card-back-section-title">
                  메뉴
                  {extraLoading && (
                    <div style={{
                      display: 'inline-block', marginLeft: 8,
                      width: 10, height: 10, borderRadius: '50%',
                      border: '2px solid var(--border-color)',
                      borderTopColor: 'var(--accent)',
                      animation: 'spin 0.7s linear infinite',
                      verticalAlign: 'middle',
                    }} />
                  )}
                </div>

                {/* 2-1. 메뉴 항목 */}
                {(() => {
                  const menus = restaurant.menus ?? extraInfo?.menus ?? null;
                  if (!menus || menus.length === 0) return null;
                  return menus.map((item, i) => (
                    <div key={i} className="card-back-menu-item">
                      <span className="card-back-menu-emoji">{item.e}</span>
                      <div className="card-back-menu-info">
                        <span className="card-back-menu-name">{item.n}</span>
                        {item.d && <span className="card-back-menu-desc">{item.d}</span>}
                      </div>
                      {item.p && <span className="card-back-menu-price">{item.p}</span>}
                    </div>
                  ));
                })()}

                {/* 2-2. 카카오맵에서 메뉴보기 */}
                <a
                  href={restaurant.placeUrl ?? `https://place.map.kakao.com/${restaurant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600,
                    color: '#1A1300',
                    background: '#FFDA00',
                    padding: '8px 12px', borderRadius: 10, marginTop: 10,
                    textDecoration: 'none',
                  }}
                >
                  <i className="ti ti-map-2" style={{ fontSize: 13 }} />
                  카카오맵에서 메뉴보기
                </a>

                {/* 2-3. 네이버맵에서 메뉴보기 */}
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name + (restaurant.address ? ' ' + restaurant.address : ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600,
                    color: '#fff',
                    background: '#03C75A',
                    padding: '8px 12px', borderRadius: 10, marginTop: 8,
                    textDecoration: 'none',
                  }}
                >
                  <i className="ti ti-map-2" style={{ fontSize: 13 }} />
                  네이버맵에서 메뉴보기
                </a>
              </div>

              {/* Hours */}
              {(() => {
                const hours = restaurant.hours ?? extraInfo?.hours ?? null;
                if (!hours) return null;
                return (
                  <div className="card-back-section">
                    <div className="card-back-section-title">영업시간</div>
                    <div className="card-back-hours-row">
                      <span>평일</span><span>{hours.weekday}</span>
                    </div>
                    <div className="card-back-hours-row">
                      <span>주말</span><span>{hours.weekend}</span>
                    </div>
                    {hours.breakTime && (
                      <div className="card-back-hours-row">
                        <span>브레이크</span><span>{hours.breakTime}</span>
                      </div>
                    )}
                    {hours.closedDay && (
                      <div className="card-back-hours-row" style={{ color: 'var(--accent)' }}>
                        <span>정기휴무</span><span>{hours.closedDay}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Map navigation buttons */}
              <div className="card-back-map-btns">
                <button
                  className="card-back-map-btn"
                  style={{ background: '#FFDA00', color: '#1A1300' }}
                  onClick={() => openKakaoMap(restaurant.name, restaurant.address)}
                >
                  <i className="ti ti-navigation" />
                  카카오맵
                </button>
                <button
                  className="card-back-map-btn"
                  style={{ background: '#03C75A', color: '#fff' }}
                  onClick={() => openNaverMap(restaurant.name, restaurant.address)}
                >
                  <i className="ti ti-navigation" />
                  네이버 지도
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
