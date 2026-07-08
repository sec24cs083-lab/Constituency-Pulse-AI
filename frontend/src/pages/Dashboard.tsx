import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { projectsApi, budgetApi } from '../api/client';
import type { Project, Budget, OptimizationResult } from '../types';
import ProjectCard from '../components/ProjectCard';
import { IndianRupee, TrendingUp, Users, Zap, RefreshCw, Filter } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const CATEGORY_OPTIONS = ['all', 'water', 'roads', 'health', 'education', 'sanitation', 'electricity', 'housing'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [budgetSlider, setBudgetSlider] = useState(380);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fundedIds, setFundedIds] = useState<number[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, budgetRes] = await Promise.all([
        projectsApi.list(),
        budgetApi.get(),
      ]);
      setProjects(projRes.data.projects);
      setBudget(budgetRes.data);
      setBudgetSlider(budgetRes.data.amount_remaining_lakhs);
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runOptimizer = async () => {
    setOptimizing(true);
    try {
      const res = await budgetApi.optimize(budgetSlider);
      setOptResult(res.data);
      setFundedIds(res.data.funded_project_ids);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (e) {
      console.error('Optimization error', e);
    } finally {
      setOptimizing(false);
    }
  };

  const filtered = categoryFilter === 'all'
    ? projects
    : projects.filter(p => p.category === categoryFilter);

  const totalPop = projects.reduce((s, p) => s + p.population_affected, 0);
  const totalSchemeOffset = projects.reduce((s, p) => s + p.scheme_cofunding_lakhs, 0);
  const avgScore = projects.length ? (projects.reduce((s, p) => s + p.priority_score, 0) / projects.length) : 0;

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="pulse-dot" style={{ background: 'var(--accent-emerald)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, letterSpacing: '0.05em' }}>
            LIVE DASHBOARD
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: 6 }}>
          {t('dashboard.title')}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Pune Urban · MP: Aditi Sharma · FY 2024-25 · {projects.length} proposed projects
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="MPLADS Available"
          value={`₹${budget?.amount_remaining_lakhs ?? 0}L`}
          sub={`of ₹${budget?.total_allocation_lakhs ?? 0}L total`}
          icon={<IndianRupee size={18} color="var(--accent-blue)" />}
          color="var(--accent-blue)"
        />
        <StatCard
          label={t('dashboard.population')}
          value={`${(totalPop / 1000).toFixed(0)}K`}
          sub="across all proposed projects"
          icon={<Users size={18} color="var(--accent-violet)" />}
          color="var(--accent-violet)"
        />
        <StatCard
          label={t('dashboard.priorityScore')}
          value={`${avgScore.toFixed(1)}`}
          sub="deterministic formula score"
          icon={<TrendingUp size={18} color="var(--accent-emerald)" />}
          color="var(--accent-emerald)"
        />
        <StatCard
          label={t('dashboard.schemes')}
          value={`₹${totalSchemeOffset.toFixed(0)}L`}
          sub="saved from matching schemes"
          icon={<Zap size={18} color="var(--accent-amber)" />}
          color="var(--accent-amber)"
        />
      </div>

      {/* Budget Optimizer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-8 md:sticky top-4 z-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{t('dashboard.budgetOptimizer')}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              PuLP Integer Linear Program — maximizes priority score within MPLADS budget
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={runOptimizer}
            disabled={optimizing}
            style={{ marginLeft: 'auto', background: 'var(--bg-brand)', color: 'var(--text-brand)' }}
            aria-label="Run budget optimizer"
          >
            <RefreshCw size={14} style={{ animation: optimizing ? 'spin 1s linear infinite' : 'none' }} />
            {optimizing ? 'Optimizing…' : t('dashboard.reOptimize')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              {t('dashboard.availableBudget')}: <strong style={{ color: 'var(--bg-brand)' }}>₹{budgetSlider}L</strong>
            </label>
            <input
              type="range"
              min={50} max={budget?.amount_remaining_lakhs ?? 500} step={10}
              value={budgetSlider}
              onChange={e => { setBudgetSlider(Number(e.target.value)); setOptResult(null); setFundedIds([]); }}
              style={{ width: '100%', accentColor: 'var(--bg-brand)', cursor: 'pointer' }}
              aria-label="Budget slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>₹50L</span>
              <span>₹{budget?.amount_remaining_lakhs ?? 500}L (max)</span>
            </div>
          </div>

          {optResult && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <OptStat label="Projects Funded" value={`${optResult.funded_project_ids.length}`} color="var(--bg-brand)" />
              <OptStat label="Total Score" value={`${optResult.total_score.toFixed(0)}`} color="var(--accent-blue)" />
              <OptStat label="Budget Used" value={`₹${optResult.total_cost_lakhs}L`} color="var(--accent-violet)" />
              <OptStat label="Utilization" value={`${optResult.budget_utilization_pct}%`} color="var(--accent-amber)" />
            </div>
          )}
        </div>

        {optResult && (
          <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--bg-brand)', padding: '6px 10px', borderRadius: 6, background: 'rgba(23,94,53,0.06)', border: '1px solid rgba(23,94,53,0.15)' }}>
            ✓ Solver: {optResult.solver_method} · Status: {optResult.solver_status}
          </div>
        )}
      </div>

      {/* Project List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>
            {t('dashboard.projects')} ({filtered.length})
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
            <Filter size={14} color="var(--text-muted)" style={{ alignSelf: 'center' }} />
            {CATEGORY_OPTIONS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  textTransform: 'capitalize',
                  borderColor: categoryFilter === cat ? 'var(--bg-brand)' : 'var(--border-subtle)',
                  color: categoryFilter === cat ? 'var(--bg-brand)' : 'var(--text-muted)',
                  background: categoryFilter === cat ? 'rgba(23,94,53,0.05)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              rank={i + 1}
              isFunded={fundedIds.includes(p.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No projects match the selected filter.
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="stat-card" style={{ background: '#fff', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'Space Grotesk', color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function OptStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color, fontFamily: 'Space Grotesk' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <div className="shimmer rounded-md" style={{ height: 32, width: 280, marginBottom: 8 }} />
      <div className="shimmer rounded-md" style={{ height: 16, width: 200, marginBottom: 28 }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="shimmer rounded-2xl" style={{ height: 90 }} />)}
      </div>
      {[1,2,3,4,5].map(i => <div key={i} className="shimmer rounded-2xl" style={{ height: 140, marginBottom: 12 }} />)}
    </div>
  );
}
