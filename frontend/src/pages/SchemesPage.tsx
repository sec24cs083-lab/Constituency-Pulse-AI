import { useEffect, useState } from 'react';
import { schemesApi } from '../api/client';
import type { Scheme } from '../types';
import { BookOpen, Building2, CheckCircle2, Database } from 'lucide-react';

const CAT_COLORS: Record<string, string> = {
  water: '#06b6d4', roads: '#8b5cf6', health: '#f43f5e', education: '#f59e0b',
  sanitation: '#10b981', electricity: '#fbbf24', housing: '#a78bfa',
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schemesApi.list().then(r => { setSchemes(r.data.schemes); setLoading(false); }).catch(console.error);
  }, []);

  const totalCofunding = schemes.reduce((s, sc) => s + sc.funding_ceiling_lakhs, 0);

  return (
    <div style={{ padding: '32px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <BookOpen size={16} color="var(--accent-violet)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-violet)', fontWeight: 600, letterSpacing: '0.05em' }}>SCHEME CATALOG</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 4 }}>Government Scheme Matching</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Rule-based eligibility matching against {schemes.length} schemes.
          Reduces MPLADS outlay by leveraging central co-funding.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Schemes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-violet)', fontFamily: 'Space Grotesk' }}>{schemes.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max Ceiling (Sum)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'Space Grotesk' }}>₹{totalCofunding.toFixed(0)}L</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Co-funding</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'Space Grotesk' }}>
            {schemes.length ? `${(schemes.reduce((s,sc)=>s+sc.cofunding_pct,0)/schemes.length).toFixed(0)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Data disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderRadius: 8, marginBottom: 20,
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
        fontSize: '0.78rem', color: '#fbbf24',
      }}>
        <Database size={14} />
        <span>
          <strong>Data transparency:</strong> All scheme data is synthetic — structured like real GoI schemes
          (JJM, PMGSY, PMAY, SBM, RSBY, SSA, DDUGJY) for demonstration purposes only. Not live government data.
        </span>
      </div>

      {/* Scheme cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading
          ? [1,2,3,4,5,6].map(i => <div key={i} className="shimmer" style={{ height: 200 }} />)
          : schemes.map(scheme => (
            <div key={scheme.id} className="glass-card glass-card-hover" style={{ padding: '18px', overflow: 'hidden' }}>
              {/* Colored top strip */}
              <div style={{
                height: 4, margin: '-18px -18px 16px',
                background: `linear-gradient(90deg, ${CAT_COLORS[scheme.category] || '#4f8ef7'}, transparent)`,
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${CAT_COLORS[scheme.category] || '#4f8ef7'}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={18} color={CAT_COLORS[scheme.category] || '#4f8ef7'} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>
                    {scheme.name}
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{scheme.ministry}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                {scheme.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Co-Funding Rate</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: CAT_COLORS[scheme.category] || 'var(--accent-blue)' }}>
                    {scheme.cofunding_pct}%
                  </div>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3 }}>Funding Ceiling</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    ₹{scheme.funding_ceiling_lakhs}L
                  </div>
                </div>
              </div>

              {/* Eligibility chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className={`category-chip chip-${scheme.category}`}>{scheme.category}</span>
                {Object.entries(scheme.eligibility_criteria || {}).slice(0, 2).map(([k, v]) => (
                  <span key={k} style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: '0.65rem',
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {k.replace(/_/g, ' ')}: {String(v)}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={10} />
                {scheme.data_source}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
