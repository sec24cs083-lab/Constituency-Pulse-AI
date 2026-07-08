import { useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
import { simulationApi } from '../api/client';
import type { DelaySimulation } from '../types';

interface Props {
  projectId: number;
  projectName?: string;
  currentScore?: number;
  currentCost?: number;
  delayRisk?: string;
}

export default function DelaySimulator({ projectId }: Props) {
  const [months, setMonths] = useState(3);
  const [result, setResult] = useState<DelaySimulation | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await simulationApi.delayProject(projectId, months);
      setResult(res.data);
    } catch (e) {
      console.error('Simulation error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(245, 158, 11, 0.06)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: 12, padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Clock size={16} color="var(--accent-amber)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Delay Impact Simulation
        </span>
        <span style={{
          fontSize: '0.65rem', padding: '2px 6px', borderRadius: 99,
          background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24',
          fontWeight: 600, letterSpacing: '0.05em',
        }}>RULE-BASED</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
            Delay by: <strong style={{ color: 'var(--accent-amber)' }}>{months} month{months > 1 ? 's' : ''}</strong>
          </label>
          <input
            type="range"
            min={1} max={24} value={months}
            onChange={e => { setMonths(Number(e.target.value)); setResult(null); }}
            style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
            aria-label="Delay months slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>1 mo</span><span>12 mo</span><span>24 mo</span>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={simulate}
          disabled={loading}
          style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', whiteSpace: 'nowrap' }}
          aria-label="Run delay simulation"
        >
          {loading ? '…' : 'Simulate'}
        </button>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeInUp 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SimStat
              label="Cost Escalation"
              before={`₹${result.current_cost_lakhs}L`}
              after={`₹${result.projected_cost_lakhs.toFixed(1)}L`}
              delta={`+${result.cost_increase_pct.toFixed(1)}%`}
              color="var(--accent-rose)"
              icon={<AlertTriangle size={14} />}
            />
            <SimStat
              label="Priority Score"
              before={`${result.current_score}`}
              after={`${result.projected_score.toFixed(1)}`}
              delta={`+${result.score_increase.toFixed(1)} pts`}
              color="var(--accent-amber)"
              icon={<TrendingUp size={14} />}
            />
          </div>
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6,
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
          }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              Why does cost escalate?
            </strong>
            {result.narrative.split('\n').filter(Boolean).slice(1, 3).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {result.model_type}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimStat({
  label, before, after, delta, color, icon,
}: {
  label: string; before: string; after: string; delta: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{before}</span>
        <ChevronDown size={12} color="var(--text-muted)" style={{ transform: 'rotate(-90deg)' }} />
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{after}</span>
      </div>
      <div style={{ fontSize: '0.72rem', color, marginTop: 2, fontWeight: 600 }}>{delta}</div>
    </div>
  );
}
