'use client';

import { useState } from 'react';
import TabBar from '@/components/TabBar';
import { useApp } from '@/contexts/AppContext';
import { FALLBACK_IMAGES } from '@/data/restaurants';

const ROOM_CODE = 'A3F8K2';

const MOCK_MEMBERS = [
  { name: '나', color: '#FF5C1A' },
  { name: '지현', color: '#32D264' },
  { name: '민준', color: '#5B8EFF' },
];
const EMPTY_SLOTS = [null, null, null];

const MEMBER_COLORS = ['#FF5C1A', '#32D264', '#5B8EFF'];

export default function MatchingPage() {
  const { wishlist } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ROOM_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commonItems = wishlist.slice(0, 5);

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">그룹 매칭</h1>
      </div>

      <div className="scroll-content">
        {/* Room code */}
        <div className="matching-card">
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            방 코드
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="room-code-display">{ROOM_CODE}</div>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'var(--accent)' : 'var(--surface)',
                border: '0.5px solid var(--border-color)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: copied ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Pretendard, -apple-system, sans-serif',
              }}
            >
              {copied ? '복사됨!' : '코드 복사'}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="matching-card">
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            멤버 ({MOCK_MEMBERS.length}/6)
          </div>
          <div className="member-avatars">
            {MOCK_MEMBERS.map((m, i) => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: m.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#ffffff',
                  flexShrink: 0,
                }}
                title={m.name}
              >
                {m.name[0]}
              </div>
            ))}
            {EMPTY_SLOTS.map((_, i) => (
              <div key={`empty-${i}`} className="member-slot-empty">
                <i className="ti ti-plus" aria-hidden="true" />
              </div>
            ))}
          </div>
          <button
            style={{
              marginTop: 16,
              width: '100%',
              padding: '10px',
              background: 'transparent',
              border: '0.5px dashed var(--border-color)',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'Pretendard, -apple-system, sans-serif',
            }}
          >
            <i className="ti ti-share" aria-hidden="true" style={{ marginRight: 6 }} />
            친구 초대
          </button>
        </div>

        {/* Common likes */}
        <div className="matching-card">
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            공통 좋아요
          </div>

          {commonItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              아직 공통 찜한 가게가 없어요
            </div>
          ) : (
            commonItems.map((r, idx) => (
              <div key={r.id} className="common-item">
                <span className="rank-number">{idx + 1}</span>
                <img
                  src={r.imageUrl}
                  alt={r.name}
                  className="common-thumb"
                  loading="lazy"
                  onError={e => {
                    const fb = FALLBACK_IMAGES[r.category];
                    if (fb) (e.currentTarget as HTMLImageElement).src = fb;
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {r.category} · {r.distance}
                  </div>
                </div>
                <div className="vote-dots">
                  {MOCK_MEMBERS.slice(0, Math.min(idx + 1, 3)).map((m, mi) => (
                    <div
                      key={mi}
                      className="vote-dot"
                      style={{ background: MEMBER_COLORS[mi] }}
                      title={m.name}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        {commonItems.length > 0 && (
          <button className="accent-cta" style={{ marginBottom: 8 }}>
            <i className="ti ti-map-pin" aria-hidden="true" />
            1위 가게 길찾기
          </button>
        )}
      </div>

      <TabBar />
    </div>
  );
}
