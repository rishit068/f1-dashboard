import { useState } from 'react';
import { getSessionShortLabel, getSessionColors } from '../utils/sessionHelpers';
import type { OpenF1Session } from '../types';

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
  liveSession?: OpenF1Session | null;
  onTab: (id: TabId) => void;
}

export default function BottomTabBar({ active, isLive, liveSession = null, onTab }: Props) {
  const liveLabel = isLive ? getSessionShortLabel(liveSession) : 'LIVE';
  const liveColor = isLive ? getSessionColors(liveSession).primary : '#e8002d';
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
      // Frosted mobile tab bar — floats over content
      background: 'rgba(4,6,13,0.75)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 1000,
    } as React.CSSProperties}>
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
            {/* Icon — wrapped in cyan glass pill when active */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 26, borderRadius: 10,
              background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(0,212,255,0.20)' : '1px solid transparent',
              backdropFilter: isActive ? 'blur(8px)' : 'none',
              WebkitBackdropFilter: isActive ? 'blur(8px)' : 'none',
              transition: 'background 0.2s, border-color 0.2s',
            } as React.CSSProperties}>
              <span style={{
                fontSize: isLiveTab ? 14 : 18,
                lineHeight: 1,
                color: isLiveTab
                  ? (isLive ? liveColor : '#555')
                  : isActive ? '#e8002d' : '#666',
                animation: isLiveTab && isLive ? 'livePulse 1.2s ease-in-out infinite' : 'none',
              }}>
                {tab.icon}
              </span>
            </span>

            {/* Label */}
            <span style={{
              fontSize: 9,
              letterSpacing: 0.5,
              fontWeight: isActive ? 700 : 500,
              color: isLiveTab && isLive ? liveColor : isActive ? '#e8002d' : '#666',
              fontFamily: "'Titillium Web', sans-serif",
              textTransform: 'uppercase',
            }}>
              {isLiveTab ? liveLabel : tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
