import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPestAlerts,
  createPestAlert,
  upvotePestAlert,
  resolvePestAlert,
  connectAlertStream,
  type PestAlert,
  type AlertStats,
  type SSEEvent,
  type NewAlertPayload,
} from '../services/alertService';

interface Notification {
  id: number;
  message: string;
  messageHi: string;
  type: 'new_alert' | 'severity_escalated' | 'resolved' | 'upvote';
  timestamp: Date;
  severity?: string;
}

interface UsePestAlertsReturn {
  alerts: PestAlert[];
  stats: AlertStats | null;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  submitAlert: (payload: NewAlertPayload) => Promise<PestAlert | null>;
  confirmAlert: (alertId: number) => Promise<void>;
  resolveAlert: (alertId: number) => Promise<void>;
  refresh: () => Promise<void>;
  dismissNotification: (id: number) => void;
  clearNotifications: () => void;
}

let notificationIdCounter = 1;

export function usePestAlerts(): UsePestAlertsReturn {
  const [alerts, setAlerts] = useState<PestAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const disconnectRef = useRef<(() => void) | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchPestAlerts();
      setAlerts(result.alerts);
      setStats(result.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load pest alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    if (event.type === 'connected') {
      setIsConnected(true);
      return;
    }

    if (event.type === 'new_alert' && event.alert) {
      setAlerts((prev) => {
        // Check if already exists
        if (prev.find((a) => a.id === event.alert!.id)) return prev;
        return [event.alert!, ...prev];
      });

      setNotifications((prev) => [
        {
          id: notificationIdCounter++,
          message: event.message || `New pest alert: ${event.alert.pest}`,
          messageHi: event.messageHi || '',
          type: 'new_alert',
          timestamp: new Date(),
          severity: event.alert.severity,
        },
        ...prev,
      ].slice(0, 20));
    }

    if (event.type === 'severity_escalated' && event.alert) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === event.alert!.id ? event.alert! : a))
      );

      setNotifications((prev) => [
        {
          id: notificationIdCounter++,
          message: event.message || 'Alert severity escalated',
          messageHi: event.messageHi || '',
          type: 'severity_escalated',
          timestamp: new Date(),
          severity: event.alert.severity,
        },
        ...prev,
      ].slice(0, 20));
    }

    if (event.type === 'upvote' && event.alertId) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === event.alertId ? { ...a, upvotes: event.upvotes || a.upvotes + 1 } : a
        )
      );
    }

    if (event.type === 'resolved' && event.alertId) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === event.alertId ? { ...a, status: 'resolved' as const } : a
        )
      );

      setNotifications((prev) => [
        {
          id: notificationIdCounter++,
          message: event.message || 'Alert resolved',
          messageHi: event.messageHi || '',
          type: 'resolved',
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 20));
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    disconnectRef.current = connectAlertStream(handleSSEEvent);

    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, [handleSSEEvent]);

  // Initial load
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const submitAlert = useCallback(async (payload: NewAlertPayload): Promise<PestAlert | null> => {
    try {
      const newAlert = await createPestAlert(payload);
      return newAlert;
    } catch (err: any) {
      setError(err.message || 'Failed to submit alert');
      return null;
    }
  }, []);

  const confirmAlert = useCallback(async (alertId: number) => {
    try {
      await upvotePestAlert(alertId, `Farmer_${Date.now()}`);
    } catch (err: any) {
      // Silently handle "already upvoted"
      console.warn('Upvote failed:', err.message);
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: number) => {
    try {
      await resolvePestAlert(alertId);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve alert');
    }
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    alerts: alerts.filter((a) => a.status === 'active'),
    stats,
    notifications,
    isLoading,
    error,
    isConnected,
    submitAlert,
    confirmAlert,
    resolveAlert,
    refresh: loadAlerts,
    dismissNotification,
    clearNotifications,
  };
}
