'use client';

import TabBar from '@/components/TabBar';
import ToggleSwitch from '@/components/ToggleSwitch';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { notifNewOpen, setNotifNewOpen, notifGroupMatch, setNotifGroupMatch } = useApp();

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">나</h1>
      </div>

      <div className="settings-scroll">
        {/* Theme */}
        <div className="settings-section">
          <div className="settings-section-title">화면 모드</div>
          <div className="settings-group">
            <div className="settings-cell">
              <span className="settings-cell-label">테마</span>
              <div className="segment-control">
                <button
                  className={`segment-btn${theme === 'dark' ? ' active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  🌙 다크
                </button>
                <button
                  className={`segment-btn${theme === 'light' ? ' active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  ☀️ 라이트
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">알림</div>
          <div className="settings-group">
            <div className="settings-cell">
              <span className="settings-cell-label">신규 오픈 알림</span>
              <ToggleSwitch
                checked={notifNewOpen}
                onChange={setNotifNewOpen}
                label="신규 오픈 알림"
              />
            </div>
            <div className="settings-cell">
              <span className="settings-cell-label">그룹 매칭 알림</span>
              <ToggleSwitch
                checked={notifGroupMatch}
                onChange={setNotifGroupMatch}
                label="그룹 매칭 알림"
              />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="settings-section">
          <div className="settings-section-title">계정</div>
          <div className="settings-group">
            <div className="settings-cell" style={{ cursor: 'pointer' }}>
              <span className="settings-cell-label">FoodSwipe Plus</span>
              <span className="settings-cell-value">업그레이드</span>
              <i className="ti ti-chevron-right settings-cell-chevron" aria-hidden="true" />
            </div>
            <div className="settings-cell" style={{ cursor: 'pointer' }}>
              <span
                className="settings-cell-label settings-cell-danger"
                onClick={() => {
                  localStorage.removeItem('fs-onboarding-done');
                  window.location.href = '/';
                }}
              >
                로그아웃
              </span>
            </div>
          </div>
        </div>

        {/* App info */}
        <div style={{
          textAlign: 'center',
          padding: '16px 0 8px',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          FoodSwipe v3.0.0
        </div>
      </div>

      <TabBar />
    </div>
  );
}
