import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/clienti', label: 'Clienti', icon: '👥' },
  { to: '/calcolatore', label: 'Calcolatore', icon: '⚡' },
  { to: '/storico', label: 'Storico Calcoli', icon: '📋' }
];

export default function Layout({ children }) {
  const location = useLocation();
  const [dark, setDark] = useDarkMode();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 dark:bg-gray-950 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">FA</div>
            <div>
              <div className="text-white font-semibold text-sm">FA Advisor</div>
              <div className="text-gray-400 text-xs">Analisi Sinistri</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => setDark(!dark)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors"
          >
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Modalità Chiara' : 'Modalità Scura'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}
