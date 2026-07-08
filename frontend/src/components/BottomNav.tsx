import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Map, MessageSquare, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/map', icon: Map, label: t('sidebar.map') },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { to: '/schemes', icon: BookOpen, label: 'Schemes' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 pb-safe">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-[#175e35]' : 'text-slate-500 hover:text-slate-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'stroke-2' : 'stroke-[1.5]'} />
              <span className="text-[0.65rem] font-medium leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
