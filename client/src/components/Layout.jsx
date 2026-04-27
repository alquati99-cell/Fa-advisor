import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/clienti', label: 'Clienti', icon: '◉' },
  { to: '/calcolatore', label: 'Simulazione', icon: '⚡' },
  { to: '/storico', label: 'Storico', icon: '◷' },
  { to: '/chat', label: 'Assistente AI', icon: '✦' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [dark, setDark] = useDarkMode();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] dark:bg-[#111111]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#171717] border-r border-[#222]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#222]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">FA</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-tight">FA Advisor</div>
              <div className="text-[#666] text-[11px]">Analisi Assicurativa</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={active ? 'nav-item-active' : 'nav-item'}
              >
                <span className="w-5 text-center text-base opacity-80">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-[#222] space-y-0.5">
          <button
            onClick={() => setDark(!dark)}
            className="nav-item w-full"
          >
            <span className="w-5 text-center text-base">{dark ? '○' : '●'}</span>
            <span>{dark ? 'Tema chiaro' : 'Tema scuro'}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
