'use client';

import { useRouter, usePathname } from 'next/navigation';

const TABS = [
  { href: '/swipe',    icon: 'ti-cards',  label: '탐색'  },
  { href: '/wishlist', icon: 'ti-heart',  label: '찜'    },
  { href: '/matching', icon: 'ti-users',  label: '매칭'  },
  { href: '/settings', icon: 'ti-user',   label: '나'    },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="tab-bar" role="tablist">
      {TABS.map(tab => (
        <button
          key={tab.href}
          className={`tab-item${pathname === tab.href ? ' active' : ''}`}
          role="tab"
          aria-selected={pathname === tab.href}
          aria-label={tab.label}
          onClick={() => router.push(tab.href)}
        >
          <i className={`ti ${tab.icon}`} aria-hidden="true" />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
