import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SystemSetting {
  key: string;
  value: string;
  category: string;
}

interface SettingsContextType {
  settings: Record<string, string>;
  getSetting: (key: string, defaultValue?: string) => string;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  getSetting: (_key: string, defaultValue = '') => defaultValue,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: publicData } = useQuery<SystemSetting[]>({
    queryKey: ['/api/system-settings/public/'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { data: fullData, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/system-settings/'],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const settings = useMemo(() => {
    const map: Record<string, string> = {};
    if (publicData) {
      publicData.forEach((s) => { map[s.key] = s.value; });
    }
    if (fullData) {
      fullData.forEach((s) => { map[s.key] = s.value; });
    }
    return map;
  }, [publicData, fullData]);

  const getSetting = (key: string, defaultValue = ''): string => {
    return settings[key] ?? defaultValue;
  };

  return (
    <SettingsContext.Provider value={{ settings, getSetting, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
