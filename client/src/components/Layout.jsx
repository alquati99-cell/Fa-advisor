import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', icon: '▦', label: 'Dashboard' },
  { to: '/clienti', icon: '◉', label: 'Clienti' },
  { to: '/chat', icon: '◈', label: 'Analisi Guidata' },
  { to: '/storico', icon: '◷', label: 'Storico' },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <aside className="w-52 flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--bg1)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: 'var(--lime)', color: '#0a0a0a' }}>A</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>FA Advisor</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>simulatore</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ to, icon, label }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={active ? 'nav-link nav-link-active' : 'nav-link'}>
                <span className="text-base w-5 text-center">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="px-3 py-2 text-[11px]" style={{ color: 'var(--text3)' }}>FA Advisor v1.0</div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
