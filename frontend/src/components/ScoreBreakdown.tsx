import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { ScoreBreakdown } from '../types';
import { Info } from 'lucide-react';

const FACTOR_LABELS: Record<string, string> = {
  urgency: 'Urgency',
  population_affected: 'Population',
  cost_efficiency: 'Cost Efficiency',
  delay_risk: 'Delay Risk',
  scheme_fundability: 'Scheme Match',
};

const FACTOR_COLORS: Record<string, string> = {
  urgency: '#f43f5e',
  population_affected: '#4f8ef7',
  cost_efficiency: '#10b981',
  delay_risk: '#f59e0b',
  scheme_fundability: '#8b5cf6',
};

interface Props {
  breakdown: ScoreBreakdown;
  totalScore: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
        borderRadius: 10, padding: '12px 16px', maxWidth: 260,
      }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          {d.label}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
          {d.description}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Weight: <b style={{ color: 'var(--text-primary)' }}>{(d.weight * 100).toFixed(0)}%</b></span>
          <span style={{ color: 'var(--text-muted)' }}>Points: <b style={{ color: d.color }}>{d.value.toFixed(1)}</b></span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ScoreBreakdownChart({ breakdown, totalScore }: Props) {
  const entries = Object.entries(breakdown);

  const chartData = entries.map(([key, factor]) => ({
    key,
    label: FACTOR_LABELS[key] || key,
    value: factor.weighted_score,
    weight: factor.weight,
    description: factor.description,
    color: FACTOR_COLORS[key] || '#4f8ef7',
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Info size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Score computed by deterministic weighted formula — not an LLM. Hover bars for factor details.
        </span>
      </div>

      {/* Formula pill */}
      <div style={{
        background: 'rgba(79, 142, 247, 0.08)', border: '1px solid rgba(79, 142, 247, 0.2)',
        borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.75rem',
        color: 'var(--text-secondary)', fontFamily: 'monospace',
      }}>
        score = Σ(weight<sub>i</sub> × normalized_factor<sub>i</sub>) × 100 = <strong style={{ color: 'var(--accent-blue)' }}>{totalScore.toFixed(1)}</strong>
      </div>

      {/* Chart */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={32}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 25]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor details table */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(([key, factor]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: FACTOR_COLORS[key],
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {FACTOR_LABELS[key]}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: FACTOR_COLORS[key] }}>
                  {factor.weighted_score.toFixed(1)} pts
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${(factor.weighted_score / 25) * 100}%`,
                    background: FACTOR_COLORS[key],
                  }}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                {factor.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
