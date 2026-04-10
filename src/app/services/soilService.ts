const API_BASE = 'http://localhost:3001/api';

export interface NutrientInfo {
  value: number;
  unit: string;
  status: 'low' | 'medium' | 'high';
  score: number;
}

export interface CropRecommendation {
  name: string;
  nameHi: string;
  season: string;
  suitability: number;
  waterNeed: string;
  N: number;
  P: number;
  K: number;
}

export interface FertilizerProduct {
  name: string;
  nameHi: string;
  nutrient: string;
  dose: string;
  link?: string;
}

export interface Deficiency {
  nutrient: string;
  nutrientHi: string;
  severity: 'high' | 'medium' | 'low';
  products: FertilizerProduct[];
}

export interface Improvement {
  term: string;
  termHi: string;
  action: string;
  actionHi: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SoilAnalysisResult {
  soilType: string;
  soilTypeHi: string;
  healthScore: number;
  healthLabel: string;
  healthLabelHi: string;
  nutrients: Record<string, NutrientInfo>;
  ph: { value: number; status: string; advice: string; adviceHi: string };
  ec: { value: number; status: string };
  cropRecommendations: CropRecommendation[];
  deficiencies: Deficiency[];
  irrigation: {
    type: string;
    typeHi: string;
    schedule: { day: string; action: string; actionHi: string }[];
  };
  improvements: Improvement[];
  confidence: number;
  analysisType: 'lab_report' | 'questionnaire';
  timestamp: string;
  inferredValues?: Record<string, number>;
}

export interface LabReportData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organicCarbon: number;
  ec?: number;
  sulphur?: number;
  zinc?: number;
  iron?: number;
  manganese?: number;
  copper?: number;
  boron?: number;
  region?: string;
  season?: string;
}

export interface QAAnswers {
  color: string;
  texture: string;
  drainage: string;
  organic: string;
  crops: string;
  ph: string;
  region?: string;
  season?: string;
}

export async function analyzeLabReport(data: LabReportData): Promise<SoilAnalysisResult> {
  const response = await fetch(`${API_BASE}/soil/analyze-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  return result.data;
}

export async function analyzeQA(answers: QAAnswers): Promise<SoilAnalysisResult> {
  const response = await fetch(`${API_BASE}/soil/analyze-qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  return result.data;
}

// Persist latest analysis in localStorage
export function saveAnalysis(result: SoilAnalysisResult): void {
  localStorage.setItem('lastSoilAnalysis', JSON.stringify(result));
}

export function getLastAnalysis(): SoilAnalysisResult | null {
  try {
    const stored = localStorage.getItem('lastSoilAnalysis');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
