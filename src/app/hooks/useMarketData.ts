import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchMarketPrices,
  fetchCropNews,
  fetchMandis,
  fetchStates,
  fetchGovtPolicies,
  checkServerHealth,
  type CropPrice,
  type CropNews,
  type Mandi,
  type StateOption,
  type GovtPolicy,
} from '../services/marketService';

interface UseMarketDataReturn {
  prices: CropPrice[];
  news: CropNews[];
  mandis: Mandi[];
  states: StateOption[];
  policies: GovtPolicy[];
  selectedState: string;
  setSelectedState: (state: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataSource: string;
  serverOnline: boolean;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useMarketData(initialState = 'Delhi'): UseMarketDataReturn {
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [news, setNews] = useState<CropNews[]>([]);
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [policies, setPolicies] = useState<GovtPolicy[]>([]);
  const [selectedState, setSelectedState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Check server health first
      const online = await checkServerHealth();
      setServerOnline(online);

      if (!online) {
        throw new Error('Backend server is not running. Start it with: node server.js');
      }

      // Fetch all data in parallel
      const [pricesResult, newsResult, mandisResult, policiesResult] = await Promise.all([
        fetchMarketPrices(selectedState),
        fetchCropNews(selectedState),
        fetchMandis(selectedState),
        fetchGovtPolicies(),
      ]);

      setPrices(pricesResult.prices);
      setDataSource(pricesResult.source);
      setNews(newsResult.news);
      setMandis(mandisResult);
      setPolicies(policiesResult);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load market data');
      console.error('Market data error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedState]);

  // Initial load + when state changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load states list on mount
  useEffect(() => {
    fetchStates().then(setStates);
  }, []);

  // Auto-refresh
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    prices,
    news,
    mandis,
    states,
    policies,
    selectedState,
    setSelectedState,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    dataSource,
    serverOnline,
    refresh,
  };
}
