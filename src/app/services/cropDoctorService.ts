const API_BASE = 'http://localhost:3001/api';

export interface TreatmentStep {
  step: string;
  stepHi: string;
}

export interface RecommendedProduct {
  name: string;
  nameHi: string;
  price: string;
  link: string;
}

export interface CropDiagnosisResult {
  diseaseName: string;
  diseaseNameHi: string;
  confidence: number;
  description: string;
  descriptionHi: string;
  actionPlan: TreatmentStep[];
  recommendedProducts: RecommendedProduct[];
}

export async function analyzeCropImage(file: File, cropType: string = 'general'): Promise<CropDiagnosisResult> {
  // Convert file to base64 for simulation
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const response = await fetch(`${API_BASE}/crop-doctor/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cropType,
            imageBase64: reader.result
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        resolve(result.data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = error => reject(error);
  });
}
