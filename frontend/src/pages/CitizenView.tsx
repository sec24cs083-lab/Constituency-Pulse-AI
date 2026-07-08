import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { projectsApi, budgetApi } from '../api/client';
import type { Project, Budget } from '../types';
import { Eye, CheckCircle2, IndianRupee, Users, Shield, ExternalLink, Database } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  water: '#06b6d4', roads: '#8b5cf6', health: '#f43f5e',
  education: '#f59e0b', sanitation: '#10b981', electricity: '#fbbf24',
  housing: '#a78bfa', other: '#94a3b8',
};

export default function CitizenView() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    Promise.all([projectsApi.list(), budgetApi.get()])
      .then(([p, b]) => {
        setProjects(p.data.projects);
        setBudget(b.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const funded = projects.filter(p => p.is_funded);
  const proposed = projects.filter(p => !p.is_funded);

  return (
    <div style={{ flex: 1, width: '100%', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-brand) 0%, #114a29 50%, #0c381f 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '40px 32px 32px',
        position: 'relative', overflow: 'hidden',
        color: '#fff'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Eye size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {t('citizen.title')}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk' }}>
                People's Priorities
              </div>
            </div>
            <a href="/" style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
              padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
              transition: 'all 0.15s',
            }}>
              <ExternalLink size={12} />
              {t('sidebar.dashboard')}
            </a>
          </div>

          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
            Constituency Development<br />
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Transparency Dashboard</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', lineHeight: 1.7, maxWidth: 640 }}>
            {t('citizen.subtitle')} <strong style={{ color: '#fff' }}>Pune Urban</strong>.
          </p>

          {/* Budget summary */}
          {budget && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <HeroBudgetStat label="MP" value={budget.mp_name} />
              <HeroBudgetStat label="FY" value={budget.fiscal_year} />
              <HeroBudgetStat label="Total MPLADS" value={`₹${budget.total_allocation_lakhs}L`} />
              <HeroBudgetStat label={t('citizen.budgetUsed')} value={`₹${budget.amount_used_lakhs}L`} color="rgba(255,255,255,0.9)" />
              <HeroBudgetStat label={t('dashboard.availableBudget')} value={`₹${budget.amount_remaining_lakhs}L`} color="#fff" />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px' }}>

        {/* Data sources panel */}
        <div style={{
          display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12, marginBottom: 28,
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Database size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>Data Transparency Note</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All demographic, infrastructure, and scheme data shown is <strong>synthetic</strong> — structured to mirror real datasets
              (Census 2011 ward data, PMGSY road coverage, Jal Jeevan Mission, MPLADS guidelines ₹5 Cr/year).
              Priority scores are computed by a <strong>deterministic weighted formula</strong>, not an AI model.
              Budget allocation uses an <strong>integer linear programming solver (PuLP)</strong>.
              AI (Claude) is used only for complaint classification and plain-language summaries, not for scoring.
            </div>
          </div>
        </div>

        {/* Funded projects */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Funded Projects ({funded.length})
            </h2>
            <span style={{
              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99,
              background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600,
              border: '1px solid rgba(16,185,129,0.3)',
            }}>APPROVED</span>
          </div>

          {loading ? (
            [1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 100, marginBottom: 12 }} />)
          ) : funded.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: '0.875rem',
              border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
              No projects funded yet. Use the MP Dashboard to run the budget optimizer.
            </div>
          ) : (
            funded.map(p => <CitizenProjectCard key={p.id} project={p} funded onClick={() => setSelected(p)} />)
          )}
        </div>

        {/* Proposed projects */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Shield size={18} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Under Review ({proposed.length})
            </h2>
            <span style={{
              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 99,
              background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)', fontWeight: 600,
              border: '1px solid rgba(79,142,247,0.3)',
            }}>PROPOSED</span>
          </div>
          {loading
            ? [1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 100, marginBottom: 12 }} />)
            : proposed.map(p => <CitizenProjectCard key={p.id} project={p} onClick={() => setSelected(p)} />)
          }
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 40 }}
            onClick={() => setSelected(null)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(580px, 92vw)', maxHeight: '80vh', overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 16, padding: 24, zIndex: 50,
            animation: 'fadeInUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', flex: 1, paddingRight: 12 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{selected.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Priority Score', value: `${selected.priority_score}/100`, color: 'var(--accent-blue)' },
                { label: 'Population Affected', value: selected.population_affected.toLocaleString(), color: 'var(--accent-violet)' },
                { label: 'Net MPLADS Cost', value: `₹${selected.net_cost_lakhs}L`, color: 'var(--accent-emerald)' },
                { label: 'Delay Risk', value: selected.delay_risk, color: selected.delay_risk === 'high' ? 'var(--accent-rose)' : 'var(--accent-amber)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '10px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)', marginBottom: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Evidence Base</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.infra_evidence}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Source: {selected.infra_evidence_source}</div>
            </div>

            {selected.ai_summary && (
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>✨ AI Summary</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{selected.ai_summary}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CitizenProjectCard({ project, funded = false, onClick }: { project: Project; funded?: boolean; onClick: () => void }) {
  const color = CATEGORY_COLORS[project.category] || '#94a3b8';
  return (
    <div
      onClick={onClick}
      className="glass-card glass-card-hover"
      style={{
        padding: '16px', marginBottom: 12, cursor: 'pointer',
        borderLeft: `3px solid ${funded ? 'var(--accent-emerald)' : color}`,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-label={`View details for ${project.name}`}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`category-chip chip-${project.category}`}>{project.category}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{project.ward_name}</span>
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>{project.name}</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} />{project.population_affected.toLocaleString()} residents
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <IndianRupee size={11} />₹{project.net_cost_lakhs}L net MPLADS
            </span>
            {project.scheme_name && (
              <span style={{ fontSize: '0.72rem', color: '#a78bfa' }}>🏛 {project.scheme_short_name}</span>
            )}
          </div>
        </div>
        <div style={{
          width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${funded ? 'var(--accent-emerald)' : color}40`,
          background: `${funded ? '#10b981' : color}10`,
          fontSize: '0.9rem', fontWeight: 700, color: funded ? 'var(--accent-emerald)' : color,
          fontFamily: 'Space Grotesk',
        }}>
          {Math.round(project.priority_score)}
        </div>
      </div>
    </div>
  );
}

function HeroBudgetStat({ label, value, color = 'var(--text-primary)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color, fontFamily: 'Space Grotesk' }}>{value}</div>
    </div>
  );
}
