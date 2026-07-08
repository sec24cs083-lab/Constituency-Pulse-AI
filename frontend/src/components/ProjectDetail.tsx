import { useState } from 'react';
import { X, Users, IndianRupee, MapPin, FileText, AlertTriangle, Shield } from 'lucide-react';
import type { Project } from '../types';
import ScoreBreakdownChart from './ScoreBreakdown';
import AISummary from './AISummary';
import SchemeMatch from './SchemeMatch';
import DelaySimulator from './DelaySimulator';

interface Props {
  project: Project;
  onClose: () => void;
}

const TABS = ['Overview', 'Why This Score?', 'Scheme & Budget', 'Delay Simulation', 'Complaints'] as const;
type Tab = typeof TABS[number];

export default function ProjectDetail({ project, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <div className="drawer" role="dialog" aria-label={`Project details: ${project.name}`}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '20px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className={`category-chip chip-${project.category}`}>{project.category}</span>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
                  fontWeight: 600,
                }} className={`risk-${project.delay_risk}`}>
                  {project.delay_risk} delay risk
                </span>
              </div>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
                {project.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <MapPin size={12} />
                {project.ward_name}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: project.priority_score >= 70
                  ? 'conic-gradient(#10b981 0%, rgba(16,185,129,0.15) 0%)'
                  : project.priority_score >= 50
                    ? 'conic-gradient(#f59e0b 0%, rgba(245,158,11,0.15) 0%)'
                    : 'conic-gradient(#f43f5e 0%, rgba(244,63,94,0.15) 0%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `3px solid ${project.priority_score >= 70 ? '#10b981' : project.priority_score >= 50 ? '#f59e0b' : '#f43f5e'}`,
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                  {Math.round(project.priority_score)}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '4px', borderRadius: 6,
                transition: 'color 0.15s',
              }}
              aria-label="Close detail"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 14px', fontSize: '0.8rem', fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
                aria-selected={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StatCard icon={<Users size={16} color="var(--accent-blue)" />}
                  label="Population Affected"
                  value={project.population_affected.toLocaleString()} />
                <StatCard icon={<IndianRupee size={16} color="var(--accent-emerald)" />}
                  label="Net MPLADS Cost"
                  value={`₹${project.net_cost_lakhs}L`}
                  sub={project.scheme_name ? `after ${project.scheme_short_name} co-funding` : 'No scheme match'} />
                <StatCard icon={<AlertTriangle size={16} color="var(--accent-amber)" />}
                  label="Delay Risk"
                  value={project.delay_risk.toUpperCase()}
                  valueColor={project.delay_risk === 'high' ? 'var(--accent-rose)' : project.delay_risk === 'medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)'} />
                <StatCard icon={<FileText size={16} color="var(--accent-violet)" />}
                  label="Linked Complaints"
                  value={`${project.complaint_count}`} />
              </div>

              {/* Description */}
              <div>
                <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project Description</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {project.description}
                </p>
              </div>

              {/* Evidence */}
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(79, 142, 247, 0.06)', border: '1px solid rgba(79, 142, 247, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Shield size={14} color="var(--accent-blue)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Infrastructure Evidence</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {project.infra_evidence}
                </p>
                <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Source: {project.infra_evidence_source}
                </div>
              </div>

              {/* AI Summary */}
              <AISummary project={project} />
            </div>
          )}

          {activeTab === 'Why This Score?' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                Every point below is traceable to a specific data input. No black-box outputs.
              </p>
              {project.score_breakdown && (
                <ScoreBreakdownChart
                  breakdown={project.score_breakdown}
                  totalScore={project.priority_score}
                />
              )}
            </div>
          )}

          {activeTab === 'Scheme & Budget' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SchemeMatch
                scheme={project.matched_scheme_id ? ({
                  id: project.matched_scheme_id,
                  name: project.scheme_name || '',
                  short_name: project.scheme_short_name || '',
                  cofunding_pct: project.scheme_cofunding_pct,
                } as any) : null}
                cofundingLakhs={project.scheme_cofunding_lakhs}
                totalCostLakhs={project.estimated_cost_lakhs}
                netCostLakhs={project.net_cost_lakhs}
              />
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                  MPLADS Budget Note
                </strong>
                Net cost to MPLADS: <strong style={{ color: 'var(--accent-emerald)' }}>₹{project.net_cost_lakhs}L</strong>.
                The budget optimizer (PuLP ILP solver) uses this net cost when selecting the project mix
                to maximize total priority score within available funds.
              </div>
            </div>
          )}

          {activeTab === 'Delay Simulation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Adjust the slider to see how cost and priority change if this project is delayed.
                Uses deterministic rule-based modeling — not ML or LLM.
              </p>
              <DelaySimulator
                projectId={project.id}
                projectName={project.name}
                currentScore={project.priority_score}
                currentCost={project.net_cost_lakhs}
                delayRisk={project.delay_risk}
              />
            </div>
          )}

          {activeTab === 'Complaints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {project.complaints && project.complaints.length > 0 ? (
                project.complaints.map(c => (
                  <div key={c.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <UrgencyBadge urgency={c.urgency} />
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {c.channel}
                      </span>
                      {c.location_name && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} />{c.location_name}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      "{c.translated_text}"
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No linked complaints for this project.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub, valueColor }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; valueColor?: string;
}) {
  return (
    <div style={{
      padding: '14px', borderRadius: 12,
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>{icon}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: valueColor || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
    high: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  };
  const s = map[urgency] || map.medium;
  return (
    <span style={{
      fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
      background: s.bg, color: s.color, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.04em', border: `1px solid ${s.color}40`,
    }}>
      {urgency}
    </span>
  );
}
