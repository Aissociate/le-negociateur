// =====================================================================
// Le Négociateur — Types partagés (front)
// =====================================================================

// ---------------------------------------------------------------------
// Funnel : rapport d'écart & leads
// ---------------------------------------------------------------------
export interface GapReport {
  id: string;
  lead_id: string;
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  remuneration_actuelle: number;
  market_low: number;
  market_median: number;
  market_high: number;
  gap_annual: number;
  gap_percent: number;
  segment: string;
  analysis_md: string;
  source: string;
  annee: number;
  metier_en_tension: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  poste: string;
  secteur: string;
  seniorite: string;
  localisation: string;
  remuneration_actuelle: number;
  segment: string | null;
  gap_annual: number | null;
  gap_percent: number | null;
  statut: string;
  sequence_step: number;
  next_email_at: string | null;
  ab_variant: string | null;
  consent_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Référentiel salaires (actif n°1) — orienté CSP+ / métiers en tension
// ---------------------------------------------------------------------
export interface SalaryBenchmark {
  id: string;
  secteur: string;
  intitule: string;
  code_rome: string | null;
  seniorite: string;
  localisation: string;
  salaire_bas: number;
  salaire_median: number;
  salaire_haut: number;
  metier_en_tension: boolean;
  tension_score: number; // 0-100 : intensité de la tension / mobilité du marché
  source: string;
  annee: number;
  updated_at: string;
}

export interface BenchmarkUpdate {
  id: string;
  benchmark_id: string;
  proposed: {
    salaire_bas: number;
    salaire_median: number;
    salaire_haut: number;
    tension_score?: number;
    justification?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  salary_benchmarks?: SalaryBenchmark;
}

// ---------------------------------------------------------------------
// Produits & prix (Kit + upsell) — pilotables depuis le back-office
// ---------------------------------------------------------------------
export interface Product {
  id: string;
  slug: string;
  name: string;
  kind: 'kit' | 'upsell' | 'subscription';
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  stripe_price_id: string | null;
  description_md: string;
  active: boolean;
  position: number;
  updated_at: string;
}

// ---------------------------------------------------------------------
// IA : configuration & journal (OpenRouter)
// ---------------------------------------------------------------------
export interface AgentConfig {
  id: string;
  agent: string;
  label: string;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  max_tokens: number;
  enabled: boolean;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent: string;
  status: string;
  tokens_in: number;
  tokens_out: number;
  duration_ms: number;
  detail: string | null;
  created_at: string;
}

// File d'orchestration (jobs courts, idempotents, par lots)
export interface AgentJob {
  id: string;
  agent: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
  run_after: string;
  created_at: string;
}

// ---------------------------------------------------------------------
// Emails (séquences de nurturing)
// ---------------------------------------------------------------------
export interface EmailSequence {
  id: string;
  step: number;
  delay_hours: number;
  subject: string;
  body_html: string;
  active: boolean;
}

export interface EmailEvent {
  id: string;
  lead_id: string;
  step: number;
  status: string;
  error: string | null;
  sent_at: string;
}

// ---------------------------------------------------------------------
// Commandes & livrables
// ---------------------------------------------------------------------
export interface Order {
  id: string;
  lead_id: string | null;
  email: string;
  amount: number;
  product_slugs: string[];
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface Deliverable {
  id: string;
  order_id: string | null;
  lead_id: string | null;
  type: string;
  content_md: string;
  access_token: string;
  created_at: string;
}

// ---------------------------------------------------------------------
// A/B testing du copywriting de capture
// ---------------------------------------------------------------------
export interface ABExperiment {
  id: string;
  key: string;
  label: string;
  active: boolean;
  variants: ABVariant[];
  created_at: string;
}

export interface ABVariant {
  key: string;
  weight: number;
  // Contenu copywriting de la variante (hero, sous-titre, CTA, etc.)
  content: Record<string, string>;
}

export interface ABStat {
  experiment_key: string;
  variant_key: string;
  views: number;
  captures: number;
  purchases: number;
}

// ---------------------------------------------------------------------
// CRM prospection (agent commercial Apollo + enrichissement web)
// ---------------------------------------------------------------------
export interface ProspectList {
  id: string;
  name: string;
  description: string | null;
  criteria: Record<string, unknown>; // critères Apollo (titres, secteurs, effectifs, géo...)
  source: 'apollo' | 'web' | 'manual';
  status: 'draft' | 'enriching' | 'ready' | 'archived';
  count: number;
  created_at: string;
}

export interface Prospect {
  id: string;
  list_id: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  company_domain: string | null;
  email: string | null;
  email_status: 'unknown' | 'verified' | 'guessed' | 'invalid';
  linkedin_url: string | null;
  secteur: string | null;
  localisation: string | null;
  seniority: string | null;
  apollo_id: string | null;
  enrichment: Record<string, unknown>; // données enrichies (web + IA)
  score: number; // 0-100 : pertinence "sous-payé probable"
  stage: 'new' | 'enriched' | 'queued' | 'contacted' | 'replied' | 'won' | 'lost' | 'unsubscribed';
  consent_basis: string | null; // base légale RGPD (ex: intérêt légitime B2B)
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------
// Constantes du questionnaire (alignées CSP+ cadres)
// ---------------------------------------------------------------------
export const SENIORITES = [
  'Junior (0-3 ans)',
  'Confirmé (3-8 ans)',
  'Senior (8-15 ans)',
  'Expert / Direction (15+ ans)',
];

export const LOCALISATIONS = [
  'Île-de-France',
  'Grande métropole régionale',
  'Autre région',
];

export const SECTEURS = [
  'Tech / Numérique',
  'Industrie',
  'Banque / Assurance',
  'Conseil',
  'Santé / Pharma',
  'Énergie / Environnement',
  'Distribution / Retail',
  'BTP / Immobilier',
  'Médias / Communication',
  'Secteur public / Parapublic',
];
