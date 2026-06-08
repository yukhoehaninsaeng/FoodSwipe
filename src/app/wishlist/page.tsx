'use client';

import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { FALLBACK_IMAGES } from '@/data/restaurants';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useApp();

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">찜 목록</h1>
        <button className="icon-btn" aria-label="정렬">
          <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
        </button>
      </div>

      {/* List */}
      <div className="scroll-content">
        {wishlist.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-heart" aria-hidden="true" />
            <p>아직 찜한 가게가 없어요.<br />탐색 화면에서 마음에 드는 가게를 찜해 보세요!</p>
          </div>
        ) : (
          wishlist.map(r => (
            <div key={r.id} className="wishlist-item">
              <img
                src={r.imageUrl}
                alt={r.name}
                className="wishlist-thumb"
                loading="lazy"
                onError={e => {
                  const fb = FALLBACK_IMAGES[r.category];
                  if (fb) (e.currentTarget as HTMLImageElement).src = fb;
                }}
              />
              <div className="wishlist-info">
                <div className="wishlist-name">{r.name}</div>
                <div className="wishlist-meta">
                  {r.category} · {r.distance} · {r.priceLevel}
                </div>
                <div className="wishlist-meta" style={{ marginTop: 2 }}>
                  <i className="ti ti-star-filled" style={{ color: 'var(--star)', fontSize: 10, marginRight: 2 }} aria-hidden="true" />
                  {r.rating}
                </div>
              </div>
              <button
                className="wishlist-heart"
                aria-label={`${r.name} 찜 해제`}
                onClick={() => removeFromWishlist(r.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <i className="ti ti-heart-filled" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      <TabBar />
    </div>
  );
}
