import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CropListing {
  id: string;
  cropName: string;
  cropNameHi?: string;
  category: string;
  quantity: number;
  price: string;
  description?: string;
  images: string[];
  organic: boolean;
  farmer: string;
  farmerLocation?: string;
  distance?: string;
  rating: number;
  ratingCount: number;
  reviews?: { rating: number; review: string; date: string }[];
  createdAt: string;
}

interface CropStoreState {
  crops: CropListing[];
  isLoading: boolean;
  error: string | null;
  fetchCrops: () => Promise<void>;
  addCrop: (crop: CropListing) => void;
  rateCrop: (cropId: string, rating: number, review?: string) => Promise<boolean>;
}

const CropStoreContext = createContext<CropStoreState | null>(null);

export function CropStoreProvider({ children }: { children: ReactNode }) {
  const [crops, setCrops] = useState<CropListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/crops");
      const data = await res.json();
      if (data.success) {
        setCrops(data.data);
      } else {
        setError("Failed to load crops");
      }
    } catch {
      setError("Server unavailable");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const addCrop = useCallback((crop: CropListing) => {
    setCrops(prev => [crop, ...prev]);
  }, []);

  const rateCrop = useCallback(async (cropId: string, rating: number, review?: string): Promise<boolean> => {
    try {
      const res = await fetch(`http://localhost:3001/api/crops/${cropId}/rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review }),
      });
      const data = await res.json();
      if (data.success) {
        setCrops(prev =>
          prev.map(c => (c.id === cropId ? { ...c, rating: data.data.rating, ratingCount: data.data.ratingCount } : c))
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <CropStoreContext.Provider value={{ crops, isLoading, error, fetchCrops, addCrop, rateCrop }}>
      {children}
    </CropStoreContext.Provider>
  );
}

export function useCropStore() {
  const ctx = useContext(CropStoreContext);
  if (!ctx) throw new Error("useCropStore must be used inside CropStoreProvider");
  return ctx;
}
