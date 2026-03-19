import { useContext } from 'react';
import { LocalizationContext } from './context';

const useLocalizationContext = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('Localization hooks must be used within LocalizationProvider.');
  }

  return context;
};

export const useLocale = () => useLocalizationContext().locale;
export const useLocalization = () => useLocalizationContext();
