// Market Data Service - Fetches live crop prices, news, and mandi data
const API_BASE = 'http://localhost:3001/api';

export interface CropPrice {
  commodity: string;
  commodityHi: string;
  emoji: string;
  price: number;
  minPrice?: number;
  maxPrice?: number;
  unit: string;
  change: number;
  trend: 'up' | 'down';
  state: string;
  market: string;
  lastUpdated: string;
  history: { date: string; price: number }[];
}

export interface CropNews {
  title: string;
  titleHi: string;
  crop: string;
  category: string;
  source: string;
  publishedAt: string;
  timeAgo: string;
  url: string;
  image?: string;
  description?: string;
}

export interface Mandi {
  name: string;
  nameHi: string;
  distance: string;
  rating: number;
  lat: number;
  lng: number;
  bestFor: string[];
  address: string;
  topPrices: { commodity: string; price: number; change: number }[];
}

export interface GovtPolicy {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  ministry: string;
  status: 'active' | 'announced' | 'upcoming';
  beneficiaries: string;
  amount: string;
  link: string;
  category: string;
  lastUpdated: string;
  isNew: boolean;
}

export interface StateOption {
  value: string;
  label: string;
  labelHi: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached: boolean;
  source: string;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchMarketPrices(
  state = 'Delhi',
  commodity?: string
): Promise<{ prices: CropPrice[]; source: string }> {
  try {
    let url = `${API_BASE}/market-prices?state=${encodeURIComponent(state)}`;
    if (commodity) {
      url += `&commodity=${encodeURIComponent(commodity)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result: ApiResponse<CropPrice[]> = await response.json();
    return { prices: result.data, source: result.source };
  } catch (error) {
    console.error('Failed to fetch market prices:', error);
    throw error;
  }
}

export async function fetchCropNews(
  state = 'Delhi',
  crop?: string
): Promise<{ news: CropNews[]; source: string }> {
  try {
    let url = `${API_BASE}/crop-news?state=${encodeURIComponent(state)}`;
    if (crop) {
      url += `&crop=${encodeURIComponent(crop)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result: ApiResponse<CropNews[]> = await response.json();
    return { news: result.data, source: result.source };
  } catch (error) {
    console.error('Failed to fetch crop news:', error);
    throw error;
  }
}

export async function fetchMandis(
  state = 'Delhi'
): Promise<Mandi[]> {
  try {
    const url = `${API_BASE}/mandis?state=${encodeURIComponent(state)}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result: ApiResponse<Mandi[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch mandis:', error);
    throw error;
  }
}

export async function fetchGovtPolicies(
  category?: string
): Promise<GovtPolicy[]> {
  try {
    let url = `${API_BASE}/govt-policies`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result: ApiResponse<GovtPolicy[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch govt policies:', error);
    return [];
  }
}

export async function fetchStates(): Promise<StateOption[]> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/states`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result: ApiResponse<StateOption[]> = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch states:', error);
    // Fallback states
    return [
      { value: 'Delhi', label: 'Delhi', labelHi: 'दिल्ली' },
      { value: 'Maharashtra', label: 'Maharashtra', labelHi: 'महाराष्ट्र' },
      { value: 'Punjab', label: 'Punjab', labelHi: 'पंजाब' },
    ];
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`, 3000);
    return response.ok;
  } catch {
    return false;
  }
}
