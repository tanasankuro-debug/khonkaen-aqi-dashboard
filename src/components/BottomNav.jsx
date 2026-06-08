import { FaHome, FaMap, FaFireAlt, FaExclamationTriangle, FaWater, FaCommentDots } from 'react-icons/fa';

const TABS = [
  { id: 'home',        label: 'หน้าหลัก',  icon: FaHome },
  { id: 'map',         label: 'แผนที่',     icon: FaMap },
  { id: 'simulation',  label: 'แบบจำลอง',  icon: FaFireAlt },
  { id: 'risk-areas',  label: 'เสี่ยงภัย', icon: FaExclamationTriangle },
  { id: 'recurring',   label: 'ท่วมซ้ำ',   icon: FaWater },
  { id: 'chatbot',     label: 'แชทบอท',    icon: FaCommentDots },
];

const TAB_COLORS = {
  home:         ['#60a5fa', '#3b82f6'],
  map:          ['#34d399', '#10b981'],
  simulation:   ['#fb923c', '#ef4444'],
  'risk-areas': ['#fbbf24', '#f97316'],
  recurring:    ['#38bdf8', '#0ea5e9'],
  chatbot:      ['#a78bfa', '#8b5cf6'],
};

const BUBBLE_ANIM = 'bubblePop 0.22s cubic-bezier(0.34,1.56,0.64,1)';

const styles = `
  @keyframes bubblePop {
    0%   { transform: scale(0.5); opacity: 0.6; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1;   }
  }
`;

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <>
      <style>{styles}</style>

      {/* ══ MOBILE ══ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[1001]"
        style={{
          height: '64px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #e0eaff',
          boxShadow: '0 -4px 24px rgba(59,130,246,0.08)',
          overflow: 'visible',
        }}
      >
        <div className="flex h-full">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const [c1, c2] = TAB_COLORS[tab.id] ?? ['#60a5fa', '#3b82f6'];
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-end pb-2 flex-1 h-full min-w-0 transition-opacity duration-150"
                style={{ opacity: isActive ? 1 : 0.65 }}
              >
                {isActive && (
                  <div className="absolute left-1/2"
                    style={{ top: 0, transform: 'translate(-50%,-50%)', zIndex: 10 }}>
                    <div className="absolute inset-0 rounded-full opacity-20 scale-125"
                      style={{ background: `radial-gradient(circle,${c1},transparent 70%)` }} />
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(145deg,${c1},${c2})`,
                        boxShadow: `0 4px 14px ${c2}55`,
                        animation: BUBBLE_ANIM,
                      }}>
                      <Icon size={16} color="white" />
                    </div>
                  </div>
                )}
                {!isActive && (
                  <div className="flex items-center justify-center mb-1" style={{ width: 28, height: 20 }}>
                    <Icon size={13} color="#94a3b8" />
                  </div>
                )}
                <span
                  className="text-[9px] font-medium leading-none truncate max-w-full px-0.5"
                  style={{ color: isActive ? c2 : '#94a3b8' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ DESKTOP ══ */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-[1001] flex-col"
        style={{
          width: '80px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid #e0eaff',
          boxShadow: '2px 0 20px rgba(59,130,246,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center flex-shrink-0"
          style={{ height: '68px', borderBottom: '1px solid #e0eaff' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg,#34d399,#10b981)' }}>
            <span className="text-white font-black text-sm select-none">KK</span>
          </div>
        </div>

        {/* Tab items */}
        <div className="flex-1 flex flex-col items-center justify-evenly py-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const [c1, c2] = TAB_COLORS[tab.id] ?? ['#60a5fa', '#3b82f6'];
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center gap-1.5 w-full py-2 px-2 transition-all duration-200"
                title={tab.label}
              >
                <div
                  className="flex items-center justify-center rounded-2xl transition-all duration-200"
                  style={{
                    width:      isActive ? '48px' : '38px',
                    height:     isActive ? '36px' : '32px',
                    background: isActive ? `linear-gradient(145deg,${c1},${c2})` : 'transparent',
                    boxShadow:  isActive ? `0 4px 14px ${c2}45` : 'none',
                    animation:  isActive ? BUBBLE_ANIM : 'none',
                  }}
                >
                  <Icon
                    size={isActive ? 18 : 16}
                    color={isActive ? 'white' : '#94a3b8'}
                    style={{ transition: 'color 0.15s' }}
                  />
                </div>
                <span
                  className="text-[9px] font-medium leading-none text-center transition-colors duration-200"
                  style={{ color: isActive ? c2 : '#b0bdcc' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
