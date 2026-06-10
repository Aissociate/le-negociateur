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
  statut: string;
  sequence_step: number;
  next_email_at: string | null;
  created_at: string;
}

export interface SalaryBenchmark {
  id: string;
  secteur: string;
  intitule: string;
  seniorite: string;
  localisation: string;
  salaire_bas: number;
  salaire_median: number;
  salaire_haut: number;
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
    justification?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  salary_benchmarks?: SalaryBenchmark;
}

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

export interface Order {
  id: string;
  lead_id: string | null;
  email: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export const SENIORITES = ['Junior (0-3 ans)', 'Confirmé (3-8 ans)', 'Senior (8-15 ans)', 'Expert / Direction (15+ ans)'];

export const LOCALISATIONS = ['Île-de-France', 'Grande métropole régionale', 'Autre région'];

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
