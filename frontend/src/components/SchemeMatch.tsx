import type { Scheme } from '../types';
import { Building2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  scheme: Scheme | null;
  cofundingLakhs: number;
  totalCostLakhs: number;
  netCostLakhs: number;
}

export default function SchemeMatch({ scheme, cofundingLakhs, totalCostLakhs, netCostLakhs }: Props) {
  if (!scheme) {
    return (
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(148, 163, 184, 0.06)', border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <XCircle size={16} color="var(--text-muted)" />
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Scheme Match
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            No eligible government scheme found. Project is 100% MPLADS funded.
          </div>
        </div>
      </div>
    );
  }

  const pct = totalCostLakhs > 0 ? (cofundingLakhs / totalCostLakhs) * 100 : 0;

  return (
    <div style={{
      borderRadius: 12,
      background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.25)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Building2 size={16} color="#8b5cf6" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>
            {scheme.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {scheme.ministry} · {scheme.short_name}
          </div>
        </div>
        <CheckCircle2 size={18} color="#8b5cf6" />
      </div>

      {/* Funding breakdown */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          {scheme.description}
        </div>

        {/* Cost split visual */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>
            <span>Scheme co-funding: <strong style={{ color: '#a78bfa' }}>₹{cofundingLakhs}L ({pct.toFixed(0)}%)</strong></span>
            <span>Total: <strong style={{ color: 'var(--text-primary)' }}>₹{totalCostLakhs}L</strong></span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
              }}
            />
          </div>
        </div>

        {/* Cost cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CostCard label="Scheme Contribution" value={`₹${cofundingLakhs}L`} color="#8b5cf6" sub={`${pct.toFixed(0)}% of total`} />
          <CostCard label="MPLADS Net Cost" value={`₹${netCostLakhs}L`} color="var(--accent-blue)" sub="After scheme offset" highlight />
        </div>

        <div style={{
          marginTop: 12, fontSize: '0.68rem', color: 'var(--text-muted)',
          padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)',
          lineHeight: 1.5,
        }}>
          ℹ️ Scheme match determined by rule-based eligibility checker (category + ward demographics). Data: {scheme.data_source}
        </div>
      </div>
    </div>
  );
}

function CostCard({ label, value, color, sub, highlight = false }: {
  label: string; value: string; color: string; sub: string; highlight?: boolean;
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: highlight ? 'rgba(79, 142, 247, 0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${highlight ? 'rgba(79,142,247,0.2)' : 'var(--border-subtle)'}`,
    }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}
