import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  exchange_rate: string;
  is_base_currency: boolean;
  is_active: boolean;
  display_order: number;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  is_default: boolean;
  is_active: boolean;
  display_order: number;
}

interface LocalizationContextType {
  currency: Currency | null;
  language: Language | null;
  currencies: Currency[];
  languages: Language[];
  isLoading: boolean;
  setCurrency: (code: string) => Promise<void>;
  setLanguage: (code: string) => Promise<void>;
  formatCurrency: (amount: number | string | null | undefined, currencyCode?: string) => string;
  formatDate: (dateStr: string | null | undefined) => string;
  convertCurrency: (amount: number, fromCode: string, toCode: string) => number;
}

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [currentCurrency, setCurrentCurrency] = useState<Currency | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language | null>(null);

  const { data: currencies = [], isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies/?active_only=true'],
  });

  const { data: languages = [], isLoading: languagesLoading } = useQuery<Language[]>({
    queryKey: ['/api/languages/?active_only=true'],
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery<{
    currency: Currency | null;
    language: Language | null;
  }>({
    queryKey: ['/api/system-preferences/current/'],
  });

  useEffect(() => {
    if (preferences?.currency) {
      setCurrentCurrency(preferences.currency);
    } else if (currencies.length > 0) {
      const baseCurrency = currencies.find(c => c.is_base_currency) || currencies[0];
      setCurrentCurrency(baseCurrency);
    }
  }, [preferences, currencies]);

  useEffect(() => {
    if (preferences?.language) {
      setCurrentLanguage(preferences.language);
      updateDocumentDirection(preferences.language.direction);
    } else if (languages.length > 0) {
      const defaultLang = languages.find(l => l.is_default) || languages[0];
      setCurrentLanguage(defaultLang);
      updateDocumentDirection(defaultLang.direction);
    }
  }, [preferences, languages]);

  const updateDocumentDirection = (direction: 'ltr' | 'rtl') => {
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage?.code || 'en';
  };

  const setCurrencyMutation = useMutation({
    mutationFn: async (currencyCode: string) => {
      await apiRequest('POST', '/api/system-preferences/set_currency/', { currency_code: currencyCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences/current/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/currencies/?active_only=true'] });
    },
  });

  const setLanguageMutation = useMutation({
    mutationFn: async (languageCode: string) => {
      await apiRequest('POST', '/api/system-preferences/set_language/', { language_code: languageCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences/current/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/languages/?active_only=true'] });
    },
  });

  const formatCurrency = (amount: number | string | null | undefined, currencyCode?: string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    const safeAmount = isNaN(numAmount) ? 0 : numAmount;
    
    const currency = currencyCode 
      ? currencies.find(c => c.code === currencyCode) 
      : currentCurrency;
    
    if (!currency) {
      return `${safeAmount.toFixed(2)}`;
    }

    const formattedAmount = safeAmount.toFixed(currency.decimal_places);
    
    const locale = getLocaleForCurrency(currency.code);
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.decimal_places,
        maximumFractionDigits: currency.decimal_places,
      }).format(safeAmount);
    } catch {
      return `${currency.symbol}${formattedAmount}`;
    }
  };

  const convertCurrency = (amount: number, fromCode: string, toCode: string): number => {
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);
    
    if (!fromCurrency || !toCurrency) return amount;

    const fromRate = parseFloat(fromCurrency.exchange_rate);
    const toRate = parseFloat(toCurrency.exchange_rate);
    
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString(currentLanguage?.code || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const setCurrency = async (code: string) => {
    await setCurrencyMutation.mutateAsync(code);
  };

  const setLanguage = async (code: string) => {
    await setLanguageMutation.mutateAsync(code);
  };

  const isLoading = currenciesLoading || languagesLoading || preferencesLoading;

  return (
    <LocalizationContext.Provider
      value={{
        currency: currentCurrency,
        language: currentLanguage,
        currencies,
        languages,
        isLoading,
        setCurrency,
        setLanguage,
        formatCurrency,
        formatDate,
        convertCurrency,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

function getLocaleForCurrency(currencyCode: string): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    AUD: 'en-AU',
    SSP: 'en-SS',
    INR: 'en-IN',
    THB: 'th-TH',
    MYR: 'ms-MY',
    SAR: 'ar-SA',
  };
  return localeMap[currencyCode] || 'en-US';
}
