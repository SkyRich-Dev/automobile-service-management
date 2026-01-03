import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocalization } from '@/lib/currency-context';
import { Globe, DollarSign, Check, Languages } from 'lucide-react';
import i18n from 'i18next';

export function LocalizationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    currency,
    language,
    currencies,
    languages,
    isLoading,
    setCurrency,
    setLanguage,
  } = useLocalization();

  const [selectedCurrency, setSelectedCurrency] = useState(currency?.code || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language?.code || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCurrency = async () => {
    if (!selectedCurrency) return;
    setIsSaving(true);
    try {
      await setCurrency(selectedCurrency);
      toast({ title: t('messages.updateSuccess'), description: `Currency set to ${selectedCurrency}` });
    } catch {
      toast({ title: t('messages.updateError'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLanguage = async () => {
    if (!selectedLanguage) return;
    setIsSaving(true);
    try {
      await setLanguage(selectedLanguage);
      i18n.changeLanguage(selectedLanguage);
      toast({ title: t('messages.updateSuccess'), description: `Language set to ${selectedLanguage}` });
    } catch {
      toast({ title: t('messages.updateError'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.currency')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.selectCurrency')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="currency-select">{t('settings.baseCurrency')}</Label>
              <Select
                value={selectedCurrency || currency?.code || ''}
                onValueChange={setSelectedCurrency}
              >
                <SelectTrigger id="currency-select" data-testid="select-currency">
                  <SelectValue placeholder={t('settings.selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code} data-testid={`currency-option-${curr.code}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{curr.symbol}</span>
                        <span>{curr.name}</span>
                        <span className="text-muted-foreground">({curr.code})</span>
                        {curr.is_base_currency && (
                          <Badge variant="secondary" className="ml-2">Base</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveCurrency}
              disabled={isSaving || !selectedCurrency || selectedCurrency === currency?.code}
              data-testid="button-save-currency"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
          {currency && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Current:</span>
              <Badge variant="outline">{currency.symbol} {currency.name} ({currency.code})</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <CardTitle>{t('settings.language')}</CardTitle>
          </div>
          <CardDescription>
            {t('settings.selectLanguage')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="language-select">{t('settings.defaultLanguage')}</Label>
              <Select
                value={selectedLanguage || language?.code || ''}
                onValueChange={(code) => {
                  setSelectedLanguage(code);
                  i18n.changeLanguage(code);
                }}
              >
                <SelectTrigger id="language-select" data-testid="select-language">
                  <SelectValue placeholder={t('settings.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} data-testid={`language-option-${lang.code}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lang.native_name}</span>
                        <span className="text-muted-foreground">({lang.name})</span>
                        {lang.direction === 'rtl' && (
                          <Badge variant="outline" className="ml-1">RTL</Badge>
                        )}
                        {lang.is_default && (
                          <Badge variant="secondary" className="ml-1">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSaveLanguage}
              disabled={isSaving || !selectedLanguage || selectedLanguage === language?.code}
              data-testid="button-save-language"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </div>
          {language && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Current:</span>
              <Badge variant="outline">
                {language.native_name} ({language.code})
                {language.direction === 'rtl' && ' - RTL'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Currency Conversion Preview</CardTitle>
          </div>
          <CardDescription>
            Sample amount formatting for selected currency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currencies.slice(0, 4).map((curr) => (
              <div key={curr.code} className="p-3 rounded-md bg-muted/50">
                <div className="text-xs text-muted-foreground mb-1">{curr.name}</div>
                <div className="font-medium">
                  {curr.symbol} 1,000.00
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Rate: {curr.exchange_rate}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
