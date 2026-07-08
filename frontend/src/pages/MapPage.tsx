import { useEffect, useState } from 'react';
import { wardsApi } from '../api/client';
import type { Ward, HotspotCluster } from '../types';
import MapView from '../components/MapView';
import { MapPin, AlertCircle, Layers, Info } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  water: '#06b6d4', roads: '#8b5cf6', health: '#f43f5e',
  education: '#f59e0b', sanitation: '#10b981', electricity: '#fbbf24',
  housing: '#a78bfa', other: '#94a3b8',
};

export default function MapPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [clusters, setClusters] = useState<HotspotCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [wardRes, hotRes] = await Promise.all([
          wardsApi.list(),
          wardsApi.allHotspots(),
        ]);
        setWards(wardRes.data.wards);
        setClusters(hotRes.data.clusters);
        setAlgorithm(hotRes.data.algorithm);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ padding: '32px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Layers size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: '0.05em' }}>HOTSPOT MAP</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 4 }}>Complaint Hotspot Detection</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Geographic demand clusters detected using scikit-learn DBSCAN — not an LLM.
          Ward boundaries shaded by complaint intensity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Map */}
        <div>
          {loading ? (
            <div className="shimmer" style={{ height: 480, borderRadius: 16 }} />
          ) : (
            <MapView wards={wards} clusters={clusters} height={480} />
          )}

          {/* Algorithm badge */}
          {algorithm && (
            <div style={{
              marginTop: 10, padding: '8px 14px', borderRadius: 8,
              background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Info size={13} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Algorithm: <strong>{algorithm}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Legend */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 14 }}>Category Legend</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'other').map(([cat, color]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cat}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Severity (circle size)</h4>
              {['high', 'medium', 'low'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: [22, 16, 10][i], height: [22, 16, 10][i],
                    borderRadius: '50%', background: 'rgba(79,142,247,0.4)',
                    border: '2px solid rgba(79,142,247,0.6)', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cluster list */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 12 }}>
              Detected Clusters ({clusters.length})
            </h3>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 60, marginBottom: 8 }} />)
            ) : clusters.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
                No clusters detected
              </div>
            ) : (
              clusters.map(cl => (
                <div key={cl.cluster_id} style={{
                  padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cl.dominant_category] }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {cl.dominant_category}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.68rem', padding: '1px 6px', borderRadius: 99,
                      background: cl.severity === 'high' ? 'rgba(244,63,94,0.15)' : cl.severity === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      color: cl.severity === 'high' ? '#f43f5e' : cl.severity === 'medium' ? '#f59e0b' : '#10b981',
                      fontWeight: 600,
                    }}>
                      {cl.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                    <span><AlertCircle size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{cl.complaint_count} complaints</span>
                    <span><MapPin size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {cl.center_lat.toFixed(3)}, {cl.center_lng.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ward table */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 12 }}>Ward Demand Heat</h3>
            {wards.map(w => (
              <div key={w.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{w.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {w.heatmap?.complaint_count ?? 0} complaints
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${(w.heatmap?.heat_intensity ?? 0) * 100}%`,
                    background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-violet))',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
