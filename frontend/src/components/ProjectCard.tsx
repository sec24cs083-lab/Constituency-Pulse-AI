import { useState } from 'react';
import type { Project } from '../types';
import {
  Users, IndianRupee, TrendingUp, ChevronRight, Droplets,
  Route, Heart, BookOpen, Zap, Home, Trash2
} from 'lucide-react';
import ProjectDetail from './ProjectDetail';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  water: <Droplets size={14} />,
  roads: <Route size={14} />,
  health: <Heart size={14} />,
  education: <BookOpen size={14} />,
  sanitation: <Trash2 size={14} />,
  electricity: <Zap size={14} />,
  housing: <Home size={14} />,
};

function ScoreBadge({ score }: { score: number }) {
  const level = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
  return (
    <div className={`score-badge ${level}`}>
      {Math.round(score)}
    </div>
  );
}

function CategoryChip({ category }: { category: string }) {
  return (
    <span className={`category-chip chip-${category}`}>
      {CATEGORY_ICONS[category]}
      {category}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }} className={`risk-${risk}`}>
      {risk} risk
    </span>
  );
}

interface Props {
  project: Project;
  rank: number;
  isFunded?: boolean;
}

export default function ProjectCard({ project, rank, isFunded = false }: Props) {
  const [showDetail, setShowDetail] = useState(false);

  const cofundingPct = project.scheme_cofunding_pct || 0;

  return (
    <>
      <div
        className="glass-card glass-card-hover fade-in-up"
        style={{
          padding: '20px',
          cursor: 'pointer',
          borderColor: isFunded ? 'rgba(16, 185, 129, 0.3)' : undefined,
          animationDelay: `${rank * 0.05}s`,
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setShowDetail(true)}
        aria-label={`Open details for ${project.name}`}
      >
        {/* Funded ribbon */}
        {isFunded && (
          <div style={{
            position: 'absolute', top: 0, right: 0,
            background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
            color: 'white', fontSize: '0.65rem', fontWeight: 700,
            padding: '3px 12px', borderBottomLeftRadius: 8,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            ✓ FUNDED
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Rank + Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 52 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{rank}</div>
            <ScoreBadge score={project.priority_score} />
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>score</div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
                  {project.name}
                </h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <CategoryChip category={project.category} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {project.ward_name}
                  </span>
                  <RiskBadge risk={project.delay_risk} />
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
              <Stat icon={<Users size={12} />} value={`${(project.population_affected / 1000).toFixed(1)}K`} label="affected" />
              <Stat
                icon={<IndianRupee size={12} />}
                value={`₹${project.net_cost_lakhs}L`}
                label={cofundingPct > 0 ? `net (${cofundingPct}% cofunded)` : 'MPLADS only'}
                highlight={cofundingPct > 0}
              />
              <Stat icon={<TrendingUp size={12} />} value={`${project.complaint_count}`} label="complaints" />
            </div>

            {/* Scheme badge */}
            {project.scheme_name && (
              <div style={{
                marginTop: 10,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
                fontSize: '0.72rem', color: '#a78bfa',
              }}>
                🏛 {project.scheme_short_name} — saves ₹{project.scheme_cofunding_lakhs}L
              </div>
            )}

            {/* Mini score bar */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Priority Score</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {project.priority_score}/100
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${project.priority_score}%`,
                    background: project.priority_score >= 70
                      ? 'linear-gradient(90deg, var(--accent-emerald), #059669)'
                      : project.priority_score >= 50
                        ? 'linear-gradient(90deg, var(--accent-amber), #d97706)'
                        : 'linear-gradient(90deg, var(--accent-rose), #be123c)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDetail && (
        <ProjectDetail project={project} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}

function Stat({ icon, value, label, highlight = false }: {
  icon: React.ReactNode; value: string; label: string; highlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: highlight ? 'var(--accent-violet)' : 'var(--text-muted)' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: highlight ? '#a78bfa' : 'var(--text-primary)' }}>{value}</span>
      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
