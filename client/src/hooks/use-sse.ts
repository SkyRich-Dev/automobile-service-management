import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = () => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource('/api/events/stream/', { withCredentials: true } as any);
    esRef.current = es;
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'job_card_updated':
            queryClient.invalidateQueries({ queryKey: ['job-cards'] });
            queryClient.invalidateQueries({ queryKey: ['customer-job-cards'] });
            break;
          case 'inventory_alert':
            queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
            break;
          case 'notification_created':
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            break;
        }
      } catch (e) {}
    };
    es.onerror = () => {
      es.close();
      reconnectTimer.current = setTimeout(connect, 5000);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);
}
