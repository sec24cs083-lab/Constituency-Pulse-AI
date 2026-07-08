// ── Core Domain Types ─────────────────────────────────────────────────────────

export type IssueCategory =
  | 'water' | 'roads' | 'health' | 'education'
  | 'sanitation' | 'electricity' | 'housing' | 'other';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type DelayRisk = 'low' | 'medium' | 'high';
export type ProjectStatus = 'proposed' | 'funded' | 'in_progress' | 'completed';
export type ComplaintChannel = 'voice' | 'text' | 'whatsapp' | 'social' | 'email' | 'portal';

// ── Score Breakdown ───────────────────────────────────────────────────────────

export interface ScoreFactor {
  raw_value: number;
  normalized_value: number;
  weight: number;
  weighted_score: number;
  description: string;
}

export interface ScoreBreakdown {
  urgency: ScoreFactor;
  population_affected: ScoreFactor;
  cost_efficiency: ScoreFactor;
  delay_risk: ScoreFactor;
  scheme_fundability: ScoreFactor;
}

// ── Ward ─────────────────────────────────────────────────────────────────────

export interface WardHeatmap {
  ward_id: number;
  ward_name: string;
  complaint_count: number;
  avg_urgency_score: number;
  top_categories: Record<string, number>;
  heat_intensity: number; // 0-1
}

export interface Ward {
  id: number;
  name: string;
  constituency_name: string;
  population: number;
  households: number;
  literacy_rate: number;
  sc_st_percentage: number;
  road_coverage_pct: number;
  water_access_pct: number;
  electricity_pct: number;
  school_count: number;
  health_centre_count: number;
  drainage_coverage_pct: number;
  lat: number;
  lng: number;
  boundary_geojson?: GeoJSON.Geometry;
  complaint_count: number;
  project_count: number;
  heatmap?: WardHeatmap;
}

// ── Scheme ────────────────────────────────────────────────────────────────────

export interface Scheme {
  id: number;
  name: string;
  short_name: string;
  ministry: string;
  description: string;
  category: IssueCategory;
  funding_ceiling_lakhs: number;
  cofunding_pct: number;
  eligibility_criteria: Record<string, unknown>;
  data_source: string;
}

// ── Project ───────────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  name: string;
  description: string;
  ward_id: number;
  ward_name: string;
  category: IssueCategory;
  estimated_cost_lakhs: number;
  matched_scheme_id: number | null;
  scheme_name: string | null;
  scheme_short_name: string | null;
  scheme_cofunding_lakhs: number;
  scheme_cofunding_pct: number;
  net_cost_lakhs: number;
  population_affected: number;
  infra_evidence: string;
  infra_evidence_source: string;
  delay_risk: DelayRisk;
  priority_score: number;
  score_breakdown: ScoreBreakdown;
  status: ProjectStatus;
  is_funded: boolean;
  ai_summary: string | null;
  complaint_count: number;
  complaints?: ComplaintSummary[];
  created_at: string;
}

// ── Complaint ─────────────────────────────────────────────────────────────────

export interface ComplaintSummary {
  id: number;
  translated_text: string;
  urgency: UrgencyLevel;
  channel: ComplaintChannel;
  location_name: string;
}

export interface Complaint {
  id: number;
  raw_text: string;
  language: string;
  channel: ComplaintChannel;
  translated_text: string;
  issue_category: IssueCategory;
  urgency: UrgencyLevel;
  sentiment: number;
  ward_id: number;
  ward_name: string;
  lat: number;
  lng: number;
  location_name: string;
  entities: Record<string, unknown>;
  project_id: number | null;
  created_at: string;
}

// ── Budget ────────────────────────────────────────────────────────────────────

export interface Budget {
  id: number;
  mp_name: string;
  constituency: string;
  fiscal_year: string;
  total_allocation_lakhs: number;
  amount_used_lakhs: number;
  amount_remaining_lakhs: number;
  notes: string;
  data_source: string;
}

// ── Optimization Result ───────────────────────────────────────────────────────

export interface OptimizationResult {
  funded_project_ids: number[];
  total_cost_lakhs: number;
  total_score: number;
  budget_remaining_lakhs: number;
  budget_utilization_pct: number;
  solver_status: string;
  solver_method: string;
  unfunded_project_ids: number[];
  funded_projects: {
    id: number;
    name: string;
    category: IssueCategory;
    net_cost_lakhs: number;
    priority_score: number;
    ward_name: string;
  }[];
}

// ── Delay Simulation ─────────────────────────────────────────────────────────

export interface DelaySimulation {
  project_id: number;
  project_name: string;
  delay_months: number;
  current_cost_lakhs: number;
  projected_cost_lakhs: number;
  cost_increase_pct: number;
  current_score: number;
  projected_score: number;
  score_increase: number;
  escalation_rate_pct_per_month: number;
  delay_risk: DelayRisk;
  narrative: string;
  model_type: string;
}

// ── Hotspot Cluster ───────────────────────────────────────────────────────────

export interface HotspotCluster {
  cluster_id: number;
  complaint_ids: number[];
  center_lat: number;
  center_lng: number;
  dominant_category: IssueCategory;
  complaint_count: number;
  ward_ids: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface HotspotResult {
  clusters: HotspotCluster[];
  noise_complaint_ids: number[];
  total_complaints_analyzed: number;
  algorithm: string;
}

// ── AI Summary ────────────────────────────────────────────────────────────────

export interface AISummaryResult {
  project_id: number;
  summary: string;
  model_used: string;
  source: string;
  audit_log_stored: boolean;
  note: string;
}
