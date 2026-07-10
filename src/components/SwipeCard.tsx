'use client';

import { useState, useRef, useCallback, useEffect, CSSProperties } from 'react';
import { Restaurant, FALLBACK_IMAGES, MenuItem, BusinessHours } from '@/data/restaurants';

interface ExtraInfo {
  menus: MenuItem[] | null;
  hours: BusinessHours | null;
  photos: string[];
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
  const [photoIdx, setPhotoIdx] = useState(0);
  const startRef = useRef({ x: 0, y: 0 });
  const isDraggedRef = useRef(false);
  const velocityRef = useRef({ vx: 0, vy: 0, prevX: 0, prevY: 0, time: 0 });
  const isTop = stackIndex === 0;

  // Prefetch place detail via server proxy + test extra CDN photo paths client-side
  useEffect(() => {
    if (!isTop || extraInfo !== null || !restaurant.id || !/^\d+$/.test(restaurant.id)) return;
    // Note: do NOT skip when restaurant has mock menus — we still need real photos

    const testCdn = (path: string): Promise<string | null> =>
      new Promise(resolve => {
        if (typeof window === 'undefined') { resolve(null); return; }
        const img = new window.Image();
        const url = `https://t1.kakaocdn.net/thumb/C900x1350.q90/?fname=https://t1.kakaocdn.net/shop/info/v2/${restaurant.id}/${path}`;
        const timer = setTimeout(() => { img.src = ''; resolve(null); }, 3000);
        img.onload = () => { clearTimeout(timer); resolve(url); };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
        img.src = url;
      });

    const apiCall = fetch(`/api/place?id=${restaurant.id}`)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);

    // Test photo/1~8 in parallel (Image() requests bypass CORS)
    const cdnTests = [
      testCdn('photo/1'), testCdn('photo/2'), testCdn('photo/3'),
      testCdn('photo/4'), testCdn('photo/5'), testCdn('photo/6'),
      testCdn('photo/7'), testCdn('photo/8'),
    ];

    Promise.all([apiCall, ...cdnTests]).then(([apiData, ...cdnResults]) => {
      const extraCdn = (cdnResults as (string | null)[]).filter(Boolean) as string[];
      const apiPhotos: string[] = apiData?.photos ?? [];

      // Merge: API photos first, then CDN extras (de-duped, max 5)
      const merged = [...apiPhotos];
      for (const url of extraCdn) {
        if (!merged.includes(url) && merged.length < 5) merged.push(url);
      }
      // Always ensure the thumbnail is in the list
      if (merged.length === 0) merged.push(restaurant.imageUrl);

      setExtraInfo({
        menus: apiData?.menus ?? null,
        hours: apiData?.hours ?? null,
        photos: merged,
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  // Photo array: extraInfo photos > restaurant.photos (mock) > single CDN thumb
  const allPhotos: string[] = (() => {
    if (extraInfo?.photos?.length) return extraInfo.photos;
    if (restaurant.photos?.length) return restaurant.photos;
    return [restaurant.imageUrl];
  })();

  const clampedIdx = Math.min(photoIdx, allPhotos.length - 1);
  const currentPhoto = allPhotos[clampedIdx];

  // Convenience aliases for render
  const dragX = dragPos.x;
  const dragY = dragPos.y;

  const pointerOnInteractiveRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTop) return;
    // Track whether pointer started on an interactive element (button, link, input)
    const target = e.target as HTMLElement;
    pointerOnInteractiveRef.current = !!target.closest('button, a, input, textarea, select');
    // Capture pointer only on front face — back face needs pan-y scroll to work
    if (!flipped) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
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
    // Visual drag only on front face
    if (!flipped) setDragPos({ x: dx, y: dy });
  }, [flipped]);

  const onPointerUp = useCallback((e?: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const dx = dragXRef.current;
    const dy = dragYRef.current;
    const { vx, vy } = velocityRef.current;

    if (!isDraggedRef.current) {
      // Tap: toggle flip only if not on an interactive element
      if (!pointerOnInteractiveRef.current) {
        setFlipped(f => !f);
      }
      dragXRef.current = 0;
      dragYRef.current = 0;
      setDragPos({ x: 0, y: 0 });
      return;
    }

    const goRight = dx > SWIPE_THRESHOLD || (vx > VELOCITY_THRESHOLD && dx > 20);
    const goLeft  = dx < -SWIPE_THRESHOLD || (vx < -VELOCITY_THRESHOLD && dx < -20);
    // Up-swipe only from front face
    const goUp = !flipped && (dy < -SWIPE_THRESHOLD || vy < -VELOCITY_THRESHOLD) && Math.abs(dx) < 60;

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
  }, [onSwipe, flipped]);

  const onPointerCancel = useCallback(() => {
    // Browser took over (e.g. scroll) — just reset tracking without firing swipe/flip
    isDraggingRef.current = false;
    isDraggedRef.current = false;
    dragXRef.current = 0;
    dragYRef.current = 0;
    setDragPos({ x: 0, y: 0 });
  }, []);

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
    // pan-y when flipped: lets back face scroll vertically, our handler captures horizontal swipes
    touchAction: isTop ? (flipped ? 'pan-y' : 'none') : undefined,
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
    if (clampedIdx === 0) {
      // First photo: swap to category fallback
      const fallback = FALLBACK_IMAGES[restaurant.category];
      if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
    } else {
      // Later photos: go back to previous photo
      setPhotoIdx(i => Math.max(0, i - 1));
    }
  };

  return (
    <div
      className={`swipe-card-wrapper${isTop ? ' is-top' : ''}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {stackIndex === 0 && (
        <div className="card-flip-container">
          <div className={`card-flip-inner${flipped ? ' flipped' : ''}`}>

            {/* ── Front face ── */}
            <div className="card-face card-face-front">
              <img
                key={currentPhoto}
                src={currentPhoto}
                alt={restaurant.name}
                className="card-image"
                loading="eager"
                onError={handleImgError}
                draggable={false}
              />
              <div className="card-vignette-top" />
              <div className="card-vignette-bottom" />

              {/* Photo progress bar + count badge */}
              {allPhotos.length > 1 && (
                <>
                  <div className="photo-progress-bar">
                    {allPhotos.slice(0, 5).map((_, i) => (
                      <div
                        key={i}
                        className={`photo-progress-segment${i === clampedIdx ? ' active' : i < clampedIdx ? ' done' : ''}`}
                      />
                    ))}
                  </div>
                  <div style={{
                    position: 'absolute', top: 22, right: 10,
                    background: 'rgba(0,0,0,0.40)',
                    borderRadius: 10, padding: '2px 7px',
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,0.90)',
                    pointerEvents: 'none', zIndex: 4,
                  }}>
                    {clampedIdx + 1} / {Math.min(allPhotos.length, 5)}
                  </div>
                </>
              )}

              {/* Tap zones (full height L/R 30%) + visible arrow buttons */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    className="photo-nav-btn photo-nav-prev"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      setPhotoIdx(i => Math.max(0, i - 1));
                    }}
                    aria-label="이전 사진"
                  />
                  <button
                    className="photo-nav-btn photo-nav-next"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      setPhotoIdx(i => Math.min(allPhotos.length - 1, i + 1));
                    }}
                    aria-label="다음 사진"
                  />

                  {/* Visible arrow indicators */}
                  {clampedIdx > 0 && (
                    <span style={{
                      position: 'absolute', left: 8, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.38)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.92)', fontSize: 15,
                      pointerEvents: 'none', zIndex: 4,
                    }}>
                      <i className="ti ti-chevron-left" />
                    </span>
                  )}
                  {clampedIdx < allPhotos.length - 1 && (
                    <span style={{
                      position: 'absolute', right: 8, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.38)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.92)', fontSize: 15,
                      pointerEvents: 'none', zIndex: 4,
                    }}>
                      <i className="ti ti-chevron-right" />
                    </span>
                  )}
                </>
              )}

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
                <div className="card-back-section-title">메뉴</div>

                {/* 2-1. 메뉴 항목 (extraInfo 우선, 없으면 mock 데이터) */}
                {(() => {
                  const menuList = extraInfo?.menus ?? restaurant.menus;
                  if (!menuList || menuList.length === 0) return null;
                  return menuList.map((item, i) => (
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

                {/* 2-2. 메뉴 로딩 중 표시 */}
                {!extraInfo && isTop && !/^\d+$/.test(restaurant.id ?? '') === false && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0' }}>
                    메뉴 불러오는 중…
                  </div>
                )}

                {/* 2-3. 카카오맵에서 메뉴보기 */}
                <a
                  href={restaurant.placeUrl ?? `https://place.map.kakao.com/${restaurant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 600,
                    color: '#1A1300', background: '#FFDA00',
                    padding: '8px 12px', borderRadius: 10,
                    marginTop: (extraInfo?.menus ?? restaurant.menus)?.length ? 10 : 0,
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
                    color: '#fff', background: '#03C75A',
                    padding: '8px 12px', borderRadius: 10, marginTop: 8,
                    textDecoration: 'none',
                  }}
                >
                  <i className="ti ti-map-2" style={{ fontSize: 13 }} />
                  네이버맵에서 메뉴보기
                </a>
              </div>

              {/* Hours — extraInfo 우선, 없으면 mock 데이터 */}
              {(extraInfo?.hours ?? restaurant.hours) && (() => {
                const hours = (extraInfo?.hours ?? restaurant.hours)!;
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
