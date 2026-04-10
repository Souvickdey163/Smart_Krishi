// Pest Alert Service - Fetches, creates, and manages pest alerts with SSE notifications
const API_BASE = 'http://localhost:3001/api';

export interface PestAlert {
  id: number;
  pest: string;
  pestHi: string;
  crop: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  descriptionHi: string;
  remedy: string;
  remedyHi: string;
  farmerName: string;
  location: {
    lat: number;
    lng: number;
    district: string;
    state: string;
  };
  affectedArea: string;
  photoUrl: string;
  createdAt: string;
  upvotes: number;
  upvotedBy: string[];
  confirmed: boolean;
  status: 'active' | 'resolved';
}

export interface AlertStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  totalFarmersAffected: number;
}

export interface SSEEvent {
  type: 'new_alert' | 'upvote' | 'severity_escalated' | 'resolved' | 'connected';
  alert?: PestAlert;
  alertId?: number;
  upvotes?: number;
  farmerName?: string;
  message?: string;
  messageHi?: string;
}

export interface NewAlertPayload {
  pest: string;
  pestHi?: string;
  crop: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  descriptionHi?: string;
  remedy?: string;
  remedyHi?: string;
  farmerName: string;
  location?: {
    lat: number;
    lng: number;
    district: string;
    state: string;
  };
  affectedArea?: string;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchPestAlerts(
  state?: string,
  severity?: string
): Promise<{ alerts: PestAlert[]; stats: AlertStats }> {
  try {
    let url = `${API_BASE}/pest-alerts?`;
    if (state) url += `state=${encodeURIComponent(state)}&`;
    if (severity) url += `severity=${encodeURIComponent(severity)}&`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    return { alerts: result.data, stats: result.stats };
  } catch (error) {
    console.error('Failed to fetch pest alerts:', error);
    throw error;
  }
}

export async function createPestAlert(payload: NewAlertPayload): Promise<PestAlert> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/pest-alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to create pest alert:', error);
    throw error;
  }
}

export async function upvotePestAlert(
  alertId: number,
  farmerName: string
): Promise<PestAlert> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/pest-alerts/${alertId}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerName }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to upvote alert:', error);
    throw error;
  }
}

export async function resolvePestAlert(alertId: number): Promise<PestAlert> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/pest-alerts/${alertId}/resolve`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    throw error;
  }
}

export function connectAlertStream(onEvent: (event: SSEEvent) => void): () => void {
  const eventSource = new EventSource(`${API_BASE}/pest-alerts/stream`);

  eventSource.onmessage = (e) => {
    try {
      const event: SSEEvent = JSON.parse(e.data);
      onEvent(event);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = () => {
    console.warn('SSE connection error, will auto-reconnect...');
  };

  return () => eventSource.close();
}
