import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Map, BookOpen, MessageSquare, ExternalLink, Activity, Globe
} from 'lucide-react';

export default function Sidebar() {
  const { t, i18n } = useTranslation();

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { to: '/map', icon: Map, label: t('sidebar.map') },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { to: '/schemes', icon: BookOpen, label: 'Schemes' },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 flex-col z-30" style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-brand)', /* Using the new green theme */
      borderRight: '1px solid rgba(255,255,255,0.1)',
      padding: '0',
      color: 'var(--text-brand)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: '#fff' }}>
              People's
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: 'rgba(255,255,255,0.8)' }}>
              Priorities
            </div>
          </div>
        </div>

        {/* MP Badge */}
        <div style={{
          marginTop: 16,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Active MP
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Aditi Sharma</div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.7)' }}>Pune Urban · 2024-25</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 8px', marginBottom: 8 }}>
          Navigation
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              marginBottom: 4,
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Language Switcher */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
          <Globe size={14} /> Language
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { code: 'en', label: 'EN' },
            { code: 'hi', label: 'हिं' },
            { code: 'ta', label: 'தமிழ்' }
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 6,
                border: 'none',
                background: i18n.language === lang.code ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: i18n.language === lang.code ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom — citizen link */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <a
          href="/citizen"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10,
            fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.2)',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        >
          <ExternalLink size={14} />
          {t('sidebar.citizenPortal')}
        </a>
      </div>
    </aside>
  );
}
