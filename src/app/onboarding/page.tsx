'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CUISINES = [
  { key: 'korean',   emoji: '🍚', label: '한식'   },
  { key: 'japanese', emoji: '🍣', label: '일식'   },
  { key: 'western',  emoji: '🍝', label: '양식'   },
  { key: 'chinese',  emoji: '🥟', label: '중식'   },
  { key: 'cafe',     emoji: '☕', label: '카페'   },
  { key: 'snack',    emoji: '🌮', label: '분식'   },
  { key: 'chicken',  emoji: '🍗', label: '치킨'   },
  { key: 'seafood',  emoji: '🦞', label: '해산물' },
  { key: 'dessert',  emoji: '🍰', label: '디저트' },
];

const DIST_OPTIONS = [
  { key: 'walk',    icon: 'ti-walk',  label: '도보'    },
  { key: 'transit', icon: 'ti-bus',   label: '대중교통' },
  { key: 'car',     icon: 'ti-car',   label: '차량'    },
];

/* 이름 끝 받침 여부에 따라 아/야 결정 */
function nameParticle(name: string): string {
  if (!name) return '아';
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return '아';
  return (code - 0xAC00) % 28 === 0 ? '야' : '아';
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [nickname, setNickname] = useState('');
  const [cuisine, setCuisine]   = useState<string[]>([]);
  const [budget, setBudget]     = useState(30000);
  const [dist, setDist]         = useState<string>('');

  const canNext = () => {
    if (step === 0) return nickname.trim().length > 0;
    if (step === 1) return cuisine.length > 0;
    if (step === 2) return true;
    return dist !== '';
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) { setStep(s => s + 1); return; }
    localStorage.setItem('fs-onboarding-done', 'true');
    localStorage.setItem('fs-nickname', nickname.trim());
    localStorage.setItem('fs-taste', JSON.stringify({ cuisine, budget, dist }));
    router.replace('/swipe');
  };

  const toggleCuisine = (key: string) => {
    setCuisine(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const budgetPercent = ((budget - 10000) / (100000 - 10000)) * 100;

  return (
    <div className="onboarding-root">
      {/* 진행 바 */}
      <div className="progress-bars">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div className="progress-bar" key={i}>
            <div
              className="progress-fill"
              style={{ width: i < step ? '100%' : i === step ? '50%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, fontWeight: 500 }}>
        {step + 1} / {TOTAL_STEPS}
      </p>

      {/* Step 0: 닉네임 */}
      {step === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            어떻게 불러드릴까요?
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
            나중에 언제든지 바꿀 수 있어요
          </p>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="닉네임 입력 (최대 8자)"
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
              maxLength={8}
              autoFocus
              style={{
                width: '100%', padding: '18px 52px 18px 20px',
                borderRadius: 16, border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 18, fontWeight: 600,
                fontFamily: 'inherit', outline: 'none',
                letterSpacing: '-0.02em',
              }}
            />
            <span style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }}>
              {nickname.length}/8
            </span>
          </div>
          {nickname.trim().length > 0 && (
            <div style={{ marginTop: 18, fontSize: 15, color: 'rgba(255,255,255,0.65)', letterSpacing: '-0.02em' }}>
              안녕하세요,{' '}
              <span style={{ color: '#FF5C1A', fontWeight: 700 }}>
                {nickname.trim()}
              </span>
              {nameParticle(nickname.trim())}! 👋
            </div>
          )}
        </div>
      )}

      {/* Step 1: 음식 취향 */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            어떤 음식 좋아해요?
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
            최대 3개 선택
          </p>
          <div className="chip-grid" style={{ flex: 1 }}>
            {CUISINES.map(c => (
              <button
                key={c.key}
                className={`category-chip${cuisine.includes(c.key) ? ' selected' : ''}`}
                onClick={() => toggleCuisine(c.key)}
              >
                <span className="chip-emoji">{c.emoji}</span>
                <span className="chip-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: 예산 */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            한 끼 예산은요?
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 40 }}>
            슬라이더를 움직여 설정하세요
          </p>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em' }}>
              {budget.toLocaleString()}
            </span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>원</span>
          </div>
          <div className="price-slider-track">
            <div className="price-slider-fill" style={{ width: `${budgetPercent}%` }} />
            <input
              type="range" className="price-slider"
              min={10000} max={100000} step={5000}
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            <span>1만원</span><span>10만원</span>
          </div>
        </div>
      )}

      {/* Step 3: 거리 */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
            얼마나 가까운 곳을?
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
            이동 방법을 선택하세요
          </p>
          <div style={{ display: 'flex', gap: 10, flex: 1, alignItems: 'flex-start' }}>
            {DIST_OPTIONS.map(d => (
              <button
                key={d.key}
                className={`dist-btn${dist === d.key ? ' selected' : ''}`}
                onClick={() => setDist(d.key)}
              >
                <i className={`ti ${d.icon}`} aria-hidden="true" />
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="cta-btn"
        disabled={!canNext()}
        onClick={handleNext}
        style={{ marginTop: 24 }}
      >
        {step < TOTAL_STEPS - 1 ? '다음' : '시작하기'}
      </button>
    </div>
  );
}
