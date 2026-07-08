import axios from 'axios';
import type {
  Project, Ward, Scheme, Budget, Complaint,
  OptimizationResult, DelaySimulation, HotspotResult, AISummaryResult,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (params?: { category?: string; ward_id?: number; status?: string }) =>
    api.get<{ projects: Project[]; total: number; scoring_weights: Record<string, number> }>('/projects/', { params }),

  get: (id: number) =>
    api.get<Project>(`/projects/${id}`),

  scoreBreakdown: (id: number) =>
    api.get(`/projects/${id}/score-breakdown`),
};

// ── Budget ────────────────────────────────────────────────────────────────────

export const budgetApi = {
  get: () =>
    api.get<Budget>('/budget/'),

  optimize: (available_budget_lakhs: number) =>
    api.post<OptimizationResult>('/budget/optimize', { available_budget_lakhs }),

  update: (amount_used_lakhs: number) =>
    api.put('/budget/', { amount_used_lakhs }),
};

// ── Simulation ────────────────────────────────────────────────────────────────

export const simulationApi = {
  delayProject: (projectId: number, delay_months: number) =>
    api.post<DelaySimulation>(`/simulation/delay/${projectId}`, { delay_months }),

  delayPortfolio: (project_ids: number[], delay_months: number) =>
    api.post('/simulation/delay/portfolio', { project_ids, delay_months }),
};

// ── Wards ─────────────────────────────────────────────────────────────────────

export const wardsApi = {
  list: () =>
    api.get<{ wards: Ward[]; total: number }>('/wards/'),

  get: (id: number) =>
    api.get<Ward>(`/wards/${id}`),

  hotspots: (wardId: number) =>
    api.get<HotspotResult>(`/wards/${wardId}/hotspots`),

  allHotspots: () =>
    api.get<HotspotResult>('/wards/hotspots/all'),
};

// ── Schemes ───────────────────────────────────────────────────────────────────

export const schemesApi = {
  list: () =>
    api.get<{ schemes: Scheme[]; total: number }>('/schemes/'),
};

// ── Complaints ────────────────────────────────────────────────────────────────

export const complaintsApi = {
  list: (params?: { ward_id?: number; category?: string; urgency?: string }) =>
    api.get<{ complaints: Complaint[]; total: number }>('/complaints/', { params }),

  submit: (data: {
    raw_text: string;
    channel?: string;
    ward_id?: number;
    lat?: number;
    lng?: number;
    location_name?: string;
  }) => api.post('/complaints/', data),
};

// ── AI Summary ────────────────────────────────────────────────────────────────

export const summaryApi = {
  generate: (projectId: number) =>
    api.post<AISummaryResult>(`/summary/${projectId}`),

  get: (projectId: number) =>
    api.get<{ project_id: number; summary: string | null; has_summary: boolean }>(`/summary/${projectId}`),
};

export default api;
