import { useEffect, useState } from 'react';
import { complaintsApi } from '../api/client';
import type { Complaint } from '../types';
import { MessageSquare, Filter, Clock, MapPin, Send } from 'lucide-react';

const URGENCY_COLOR: Record<string, string> = {
  critical: '#f43f5e', high: '#fb923c', medium: '#f59e0b', low: '#10b981',
};

const CHANNEL_ICON: Record<string, string> = {
  voice: '🎙️', text: '📝', whatsapp: '💬', social: '📱', email: '📧', portal: '🌐',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showSubmit, setShowSubmit] = useState(false);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [urgencyFilter, categoryFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.list({
        urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setComplaints(res.data.complaints);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      await complaintsApi.submit({ raw_text: newText, channel: 'portal' });
      setNewText('');
      setSubmitDone(true);
      setShowSubmit(false);
      setTimeout(() => setSubmitDone(false), 3000);
      fetchComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const urgencyCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  complaints.forEach(c => { if (c.urgency in urgencyCounts) urgencyCounts[c.urgency]++; });

  return (
    <div style={{ padding: '32px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MessageSquare size={16} color="var(--accent-blue)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, letterSpacing: '0.05em' }}>CITIZEN COMPLAINTS</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 4 }}>Complaint Feed</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Classified by Claude (category, urgency, entities). Linked to projects automatically.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowSubmit(!showSubmit)} aria-label="Submit new complaint">
          <Send size={14} />
          Submit Complaint
        </button>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 12 }}>
            Submit New Complaint — classified by Claude AI
          </h3>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Describe your issue in any language (Hindi, Marathi, English…)"
            rows={3}
            style={{
              width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
              fontSize: '0.875rem', resize: 'vertical', fontFamily: 'Inter',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !newText.trim()}>
              {submitting ? 'Processing…' : 'Submit & Classify with Claude'}
            </button>
            <button className="btn-ghost" onClick={() => setShowSubmit(false)}>Cancel</button>
          </div>
        </div>
      )}

      {submitDone && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          fontSize: '0.82rem', color: '#10b981',
        }}>
          ✓ Complaint submitted and classified successfully!
        </div>
      )}

      {/* Urgency stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(urgencyCounts).map(([u, count]) => (
          <div key={u} className="stat-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{u}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: URGENCY_COLOR[u], fontFamily: 'Space Grotesk' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />
        {['all', 'critical', 'high', 'medium', 'low'].map(u => (
          <button key={u} onClick={() => setUrgencyFilter(u)} style={{
            padding: '4px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer', border: '1px solid', textTransform: 'capitalize',
            borderColor: urgencyFilter === u ? (URGENCY_COLOR[u] || 'var(--accent-blue)') : 'var(--border-subtle)',
            color: urgencyFilter === u ? (URGENCY_COLOR[u] || 'var(--accent-blue)') : 'var(--text-muted)',
            background: urgencyFilter === u ? `${URGENCY_COLOR[u] || '#4f8ef7'}18` : 'transparent',
            transition: 'all 0.15s',
          }}>
            {u}
          </button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />
        {['all', 'water', 'roads', 'health', 'education', 'sanitation', 'electricity'].map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)} style={{
            padding: '4px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer', border: '1px solid', textTransform: 'capitalize',
            borderColor: categoryFilter === c ? 'var(--accent-violet)' : 'var(--border-subtle)',
            color: categoryFilter === c ? '#a78bfa' : 'var(--text-muted)',
            background: categoryFilter === c ? 'rgba(139,92,246,0.1)' : 'transparent',
            transition: 'all 0.15s',
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Complaint list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 110 }} />)
          : complaints.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
                  background: `${URGENCY_COLOR[c.urgency]}18`, color: URGENCY_COLOR[c.urgency],
                  fontWeight: 700, border: `1px solid ${URGENCY_COLOR[c.urgency]}40`, textTransform: 'uppercase',
                }}>
                  {c.urgency}
                </span>
                <span className={`category-chip chip-${c.issue_category}`}>{c.issue_category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {CHANNEL_ICON[c.channel]} {c.channel}
                </span>
                {c.location_name && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPin size={10} />{c.location_name}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} />{new Date(c.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>
                "{c.translated_text || c.raw_text}"
              </p>
              {c.language !== 'en' && c.raw_text !== c.translated_text && (
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Original ({c.language}): {c.raw_text}
                </div>
              )}
              {c.project_id && (
                <div style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.2)', fontSize: '0.68rem', color: '#a78bfa',
                }}>
                  🔗 Linked to Project #{c.project_id}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
