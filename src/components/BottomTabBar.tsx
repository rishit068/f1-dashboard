import { useState } from 'react';

export type TabId = 'live' | 'drivers' | 'teams' | 'calendar' | 'next';

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { id: 'live',     icon: '●',  label: 'LIVE'    },
  { id: 'drivers',  icon: '🏆', label: 'DRIVERS' },
  { id: 'teams',    icon: '🔧', label: 'TEAMS'   },
  { id: 'calendar', icon: '📅', label: 'CAL'     },
  { id: 'next',     icon: '🏁', label: 'NEXT'    },
];

interface Props {
  active: TabId;
  isLive: boolean;
  onTab: (id: TabId) => void;
}

export default function BottomTabBar({ active, isLive, onTab }: Props) {
  const [flashId, setFlashId] = useState<TabId | null>(null);

  const handleTap = (id: TabId) => {
    setFlashId(id);
    setTimeout(() => setFlashId(null), 300);
    onTab(id);
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 64,
      background: '#15151e',
      borderTop: '1px solid #2a2a35',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 1000,
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const isLiveTab = tab.id === 'live';
        const flashing = flashId === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTap(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, border: 'none', cursor: 'pointer',
              background: flashing ? 'rgba(255,255,255,0.05)' : 'transparent',
              minHeight: 44,
              transition: 'background 0.15s',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: '6px 4px',
            }}
            aria-label={tab.label}
          >
            {/* Icon */}
            <span style={{
              fontSize: isLiveTab ? 14 : 20,
              lineHeight: 1,
              color: isLiveTab
                ? (isLive ? '#e8002d' : '#555')
                : isActive ? '#e8002d' : '#666',
              animation: isLiveTab && isLive ? 'livePulse 1.2s ease-in-out infinite' : 'none',
            }}>
              {tab.icon}
            </span>

            {/* Label */}
            <span style={{
              fontSize: 9,
              letterSpacing: 0.5,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#e8002d' : '#666',
              fontFamily: "'Titillium Web', sans-serif",
              textTransform: 'uppercase',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
