'use client';

import { useState, useRef, useCallback, CSSProperties } from 'react';
import { Restaurant, FALLBACK_IMAGES } from '@/data/restaurants';

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  stackIndex: number; // 0 = top, 1 = behind-1, 2 = behind-2
}

const SWIPE_THRESHOLD = 90;
const ROTATION_FACTOR = 0.08;

export default function SwipeCard({ restaurant, onSwipe, stackIndex }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyDir, setFlyDir] = useState<'left' | 'right' | 'up' | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const isTop = stackIndex === 0;

  /* --- Pointer Events --- */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
  }, [isTop]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startRef.current.x);
    setDragY(e.clientY - startRef.current.y);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

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

  /* --- Transform calculation --- */
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
  } else if (isTop) {
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
    background: stackIndex === 1
      ? 'var(--stack-card-1)'
      : stackIndex === 2
      ? 'var(--stack-card-2)'
      : undefined,
  };

  /* --- Overlay opacity --- */
  const likeOpacity  = Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1);
  const nopeOpacity  = Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1);
  const superOpacity = isTop && dragY < 0 && Math.abs(dragX) < 60
    ? Math.min(Math.max(-dragY / SWIPE_THRESHOLD, 0), 1)
    : 0;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const fallback = FALLBACK_IMAGES[restaurant.category];
    if (fallback && e.currentTarget.src !== fallback) {
      e.currentTarget.src = fallback;
    }
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
      {/* Food photo */}
      {stackIndex === 0 && (
        <>
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="card-image"
            loading={stackIndex === 0 ? 'eager' : 'lazy'}
            onError={handleImgError}
            draggable={false}
          />
          <div className="card-vignette-top" />
          <div className="card-vignette-bottom" />

          {/* Sponsor badge */}
          {restaurant.isSponsored && (
            <div className="card-sponsor-badge">SPONSORED</div>
          )}

          {/* Swipe direction labels */}
          <div className="swipe-label swipe-label-like" style={{ opacity: likeOpacity }}>
            LIKE
          </div>
          <div className="swipe-label swipe-label-nope" style={{ opacity: nopeOpacity }}>
            NOPE
          </div>
          {superOpacity > 0 && (
            <div className="swipe-label swipe-label-super" style={{ opacity: superOpacity }}>
              SUPER
            </div>
          )}

          {/* Card info */}
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
          </div>
        </>
      )}
    </div>
  );
}
