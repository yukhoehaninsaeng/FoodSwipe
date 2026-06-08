'use client';

import { useState, useCallback, useEffect, useRef, CSSProperties, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TabBar from '@/components/TabBar';
import SwipeCard from '@/components/SwipeCard';
import { FOOD, CAFE, Restaurant, isOpen as checkIsOpen } from '@/data/restaurants';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

type SwipeMode = 'food' | 'cafe';

interface Filters {
  maxDistanceKm: number;
  minRating: number;
  excludeCuisines: string[];
  focusCuisines: string[];  // when set, only show these (overrides exclude)
  openNow: boolean;
}

const DEFAULT_FILTERS: Filters = {
  maxDistanceKm: 5,
  minRating: 0,
  excludeCuisines: [],
  focusCuisines: [],
  openNow: false,
};

// Maps URL `focus` param → cuisine categories to show
const FOCUS_MAP: Record<string, string[]> = {
  anju:    ['한식', '치킨', '분식'],
  dessert: ['디저트'],
  chicken: ['치킨'],
  ramen:   ['일식', '한식'],
};

const CUISINE_OPTIONS = ['한식', '일식', '양식', '중식', '분식', '치킨'];
const CAFE_CATEGORIES = ['카페', '디저트'];

function parseDistanceM(dist: string): number {
  if (dist.endsWith('km')) return parseFloat(dist) * 1000;
  return parseInt(dist) || 500;
}

function buildDeck(restaurants: Restaurant[], mode: SwipeMode, filters: Filters): Restaurant[] {
  const isFood = mode !== 'cafe';
  const base = restaurants.filter(r =>
    isFood ? !CAFE_CATEGORIES.includes(r.category) : CAFE_CATEGORIES.includes(r.category)
  );

  const filtered = base.filter(r => {
    const dm = r.distanceM ?? parseDistanceM(r.distance);
    if (dm > filters.maxDistanceKm * 1000) return false;
    if (filters.minRating > 0 && r.rating < filters.minRating) return false;
    // focus: whitelist takes priority over exclude
    if (filters.focusCuisines.length > 0) {
      if (!filters.focusCuisines.includes(r.category)) return false;
    } else if (filters.excludeCuisines.includes(r.category)) {
      return false;
    }
    if (filters.openNow && r.hours && !checkIsOpen(r.hours)) return false;
    return true;
  });

  const arr = [...filtered];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ── Toast ── */
function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        top: 58,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : -6}px)`,
        opacity: visible ? 1 : 0,
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        background: 'var(--text-primary)',
        color: 'var(--bg)',
        padding: '7px 16px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 100,
        letterSpacing: '-0.01em',
      }}
    >
      {msg}
    </div>
  );
}

/* ── Filter bottom sheet ── */
function FilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  mode: SwipeMode;
}) {
  const { theme, setTheme } = useTheme();
  const cuisines = mode === 'cafe' ? CAFE_CATEGORIES : CUISINE_OPTIONS;

  return (
    <>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.22s',
          zIndex: 50,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          padding: '0 16px 40px',
          transform: `translateY(${visible ? 0 : 100}%)`,
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 51,
          maxHeight: '82vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-color)' }} />
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 20px', letterSpacing: '-0.04em' }}>
          필터 설정
        </div>

        {/* Distance */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>최대 거리</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              {filters.maxDistanceKm < 1 ? `${filters.maxDistanceKm * 1000}m` : `${filters.maxDistanceKm}km`}
            </span>
          </div>
          <div
            className="dist-slider-track"
            style={{ '--pct': `${(filters.maxDistanceKm / 10) * 100}%` } as CSSProperties}
          >
            <div className="dist-slider-fill" />
            <input
              type="range" min="0.5" max="10" step="0.5"
              value={filters.maxDistanceKm}
              onChange={e => onChange({ ...filters, maxDistanceKm: parseFloat(e.target.value) })}
              className="dist-slider-input"
            />
          </div>
        </div>

        {/* Min rating */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>최소 별점</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              {filters.minRating === 0 ? '전체' : `${filters.minRating}+`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 3.5, 4.0, 4.5].map(r => (
              <button
                key={r}
                onClick={() => onChange({ ...filters, minRating: r })}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  background: filters.minRating === r ? 'var(--accent)' : 'var(--surface)',
                  color: filters.minRating === r ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {r === 0 ? '전체' : `${r}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Open now */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>영업중만 보기</span>
          <button
            onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: filters.openNow ? 'var(--accent)' : 'rgba(120,120,128,0.2)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
            }}
          >
            <div style={{
              position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#fff',
              top: 3, left: filters.openNow ? 19 : 3, transition: 'left 0.2s',
              pointerEvents: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>

        {/* Exclude cuisines */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            제외할 카테고리
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cuisines.map(c => {
              const excluded = filters.excludeCuisines.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    const next = excluded
                      ? filters.excludeCuisines.filter(x => x !== c)
                      : [...filters.excludeCuisines, c];
                    onChange({ ...filters, excludeCuisines: next });
                  }}
                  style={{
                    padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                    border: excluded ? '1px solid var(--accent)' : '0.5px solid var(--border-color)',
                    background: excluded ? 'rgba(255,92,26,0.08)' : 'var(--surface)',
                    color: excluded ? 'var(--accent)' : 'var(--text-secondary)',
                    textDecoration: excluded ? 'line-through' : 'none',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>테마</span>
          <div className="segment-control">
            <button className={`segment-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>다크</button>
            <button className={`segment-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>라이트</button>
          </div>
        </div>

        {/* Clear focus */}
        {filters.focusCuisines.length > 0 && (
          <div style={{
            padding: '8px 12px', borderRadius: 12, marginBottom: 12,
            background: 'rgba(255,92,26,0.08)', border: '0.5px solid rgba(255,92,26,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              {filters.focusCuisines.join(' · ')} 모드 적용 중
            </span>
            <button
              onClick={() => onChange({ ...filters, focusCuisines: [] })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}
            >
              해제
            </button>
          </div>
        )}

        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          style={{
            width: '100%', padding: '13px', borderRadius: 14, fontFamily: 'inherit',
            border: '0.5px solid var(--border-color)', background: 'var(--surface)',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          필터 초기화
        </button>
      </div>
    </>
  );
}

/* ── Main page (inner) ── */
function SwipePageInner() {
  const searchParams = useSearchParams();
  const { addToWishlist } = useApp();

  // Derive initial mode + filters from URL params (only on first render)
  const initMode = (() => {
    const m = searchParams.get('mode');
    return (m === 'food' || m === 'cafe') ? m as SwipeMode : 'food';
  })();
  const initFocus = (() => {
    const f = searchParams.get('focus');
    return f && FOCUS_MAP[f] ? FOCUS_MAP[f] : [];
  })();

  const [mode, setMode] = useState<SwipeMode>(initMode);
  const [deck, setDeck] = useState<Restaurant[]>([]);
  const [allFetched, setAllFetched] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    focusCuisines: initFocus,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [history, setHistory] = useState<Restaurant[]>([]);
  const [modeAnim, setModeAnim] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 1800);
  }, []);

  const loadRestaurants = useCallback(async (currentMode: SwipeMode, currentFilters: Filters) => {
    setLoading(true);
    setDeck([]);
    setHistory([]);

    try {
      const taste = localStorage.getItem('fs-taste');
      const parsed = taste ? JSON.parse(taste) : {};
      const cats = currentMode === 'cafe' ? 'cafe,dessert' : (parsed.cuisine?.join(',') ?? '');

      let lat = process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '37.5434';
      let lng = process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '126.9076';

      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        lat = String(pos.coords.latitude);
        lng = String(pos.coords.longitude);
      } catch { /* use default */ }

      const params = new URLSearchParams({ lat, lng, cats, mode: currentMode });
      const res = await fetch(`/api/restaurants?${params}`);
      const data = await res.json();

      const fetched: Restaurant[] = data.restaurants?.length > 0
        ? data.restaurants
        : (currentMode === 'cafe' ? CAFE : FOOD);

      setAllFetched(fetched);
      const built = buildDeck(fetched, currentMode, currentFilters);
      setDeck(built.length > 0 ? built : (currentMode === 'cafe' ? [...CAFE] : [...FOOD]));
    } catch {
      const local = currentMode === 'cafe' ? CAFE : FOOD;
      setAllFetched(local);
      setDeck(buildDeck(local, currentMode, currentFilters));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants(mode, filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleModeToggle = () => {
    const next: SwipeMode = mode === 'food' ? 'cafe' : 'food';
    setModeAnim(true);
    setTimeout(() => setModeAnim(false), 400);
    setMode(next);
    showToast(next === 'cafe' ? '☕ 카페 모드' : '🍽️ 음식 모드');
  };

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    setDeck(prev => {
      const [top, ...rest] = prev;
      if (top) {
        if (direction === 'right' || direction === 'up') addToWishlist(top);
        setHistory(h => [top, ...h]);
      }
      return rest;
    });
  }, [addToWishlist]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const [last, ...rest] = history;
    setDeck(prev => [last, ...prev]);
    setHistory(rest);
  };

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    const source = allFetched.length > 0 ? allFetched : (mode === 'cafe' ? CAFE : FOOD);
    const built = buildDeck(source, mode, newFilters);
    setDeck(built.length > 0 ? built : source);
  }, [mode, allFetched]);

  const hasActiveFilters =
    filters.maxDistanceKm !== DEFAULT_FILTERS.maxDistanceKm ||
    filters.minRating !== DEFAULT_FILTERS.minRating ||
    filters.excludeCuisines.length > 0 ||
    filters.openNow;

  const visibleCards = deck.slice(0, 3);

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <Toast msg={toast} visible={toastVisible} />

      {/* ── TopBar ── */}
      <div style={{
        height: 52, padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em' }}>
          <span style={{ color: 'var(--text-primary)' }}>Food</span>
          <span style={{ color: 'var(--accent)' }}>Swipe</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleModeToggle}
            aria-label={mode === 'food' ? '카페 모드로 전환' : '음식 모드로 전환'}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              border: '0.5px solid var(--border-color)',
              background: 'var(--surface)',
              cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: modeAnim ? 'scale(0.82) rotate(18deg)' : 'scale(1) rotate(0deg)',
              transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
              flexShrink: 0,
            }}
          >
            {mode === 'food' ? '🍽️' : '☕'}
          </button>

          <button
            className="icon-btn"
            onClick={() => setShowFilters(true)}
            aria-label="필터 설정"
            style={{
              background: hasActiveFilters ? 'rgba(255,92,26,0.08)' : 'var(--surface)',
              border: hasActiveFilters ? '0.5px solid var(--accent)' : '0.5px solid var(--border-color)',
              color: hasActiveFilters ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >
            <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Distance bar ── */}
      <div style={{ padding: '0 14px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="dist-filter-bar"
            style={{ '--pct': `${(filters.maxDistanceKm / 10) * 100}%` } as CSSProperties}
          >
            <div className="dist-filter-fill" />
            <input
              type="range" min="0.5" max="10" step="0.5"
              value={filters.maxDistanceKm}
              onChange={e => handleFilterChange({ ...filters, maxDistanceKm: parseFloat(e.target.value) })}
              className="dist-filter-input"
              aria-label="최대 거리"
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0, minWidth: 30, textAlign: 'right' }}>
            {filters.maxDistanceKm < 1 ? `${filters.maxDistanceKm * 1000}m` : `${filters.maxDistanceKm}km`}
          </span>
          <button
            onClick={() => handleFilterChange({ ...filters, openNow: !filters.openNow })}
            style={{
              padding: '4px 10px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, transition: 'all 0.15s',
              border: filters.openNow ? '0.5px solid var(--accent)' : '0.5px solid var(--border-color)',
              background: filters.openNow ? 'rgba(255,92,26,0.08)' : 'var(--surface)',
              color: filters.openNow ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: filters.openNow ? '#32D264' : 'var(--text-muted)',
              flexShrink: 0,
            }} />
            영업중
          </button>
        </div>
      </div>

      {/* ── Card Stack ── */}
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
              onClick={() => loadRestaurants(mode, filters)}
            >
              <i className="ti ti-refresh" aria-hidden="true" />
              다시 탐색하기
            </button>
            {hasActiveFilters && (
              <button
                style={{
                  maxWidth: 240, width: '100%', padding: '12px 16px', borderRadius: 14,
                  border: '0.5px solid var(--border-color)', background: 'var(--surface)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onClick={() => { handleFilterChange(DEFAULT_FILTERS); }}
              >
                필터 초기화 후 다시 보기
              </button>
            )}
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

      {/* ── Deck counter + Action buttons ── */}
      {!loading && deck.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, paddingTop: 6, flexShrink: 0,
          }}>
            {Array.from({ length: Math.min(5, deck.length) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 0 ? 18 : 5,
                  height: 4,
                  borderRadius: 2,
                  background: i === 0 ? 'var(--accent)' : 'var(--border-color)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
            {deck.length > 5 && (
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>
                +{deck.length - 5}
              </span>
            )}
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>
              {deck.length}곳 남음
            </span>
          </div>

          <div className="action-area">
            <button
              className="action-btn"
              aria-label="되돌리기"
              onClick={handleUndo}
              disabled={history.length === 0}
              style={{
                width: 38, height: 38, fontSize: 16,
                opacity: history.length > 0 ? 1 : 0.28,
                color: 'var(--text-secondary)',
              }}
            >
              <i className="ti ti-arrow-back-up" aria-hidden="true" />
            </button>
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
        </>
      )}

      {/* ── Filter sheet ── */}
      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={(f) => { handleFilterChange(f); }}
        mode={mode}
      />

      {/* Focus badge */}
      {filters.focusCuisines.length > 0 && !loading && (
        <div style={{
          position: 'absolute', top: 52, left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent)', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 12px',
          borderRadius: 20, pointerEvents: 'none', zIndex: 10,
          letterSpacing: '-0.01em',
        }}>
          {filters.focusCuisines.join(' · ')} 모드
        </div>
      )}

      <TabBar />
    </div>
  );
}

export default function SwipePage() {
  return (
    <Suspense>
      <SwipePageInner />
    </Suspense>
  );
}
