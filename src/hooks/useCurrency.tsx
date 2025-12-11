import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Currency, formatPriceWithConversion, detectUserCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';

interface UseCurrencyReturn {
  userCurrency: Currency;
  setUserCurrency: (currency: Currency) => Promise<void>;
  formatPrice: (price: number, productCurrency?: Currency) => string;
  isLoading: boolean;
}

/**
 * Hook for managing user currency preference
 */
export function useCurrency(): UseCurrencyReturn {
  const { user, profile } = useAuth();
  const [userCurrency, setUserCurrencyState] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(true);

  // Load user's currency preference
  useEffect(() => {
    const loadCurrencyPreference = async () => {
      if (!user) {
        // If not logged in, try to detect from browser or use default
        const detected = detectUserCurrency();
        setUserCurrencyState(detected);
        setIsLoading(false);
        return;
      }

      try {
        // Check if profile has currency preference
        if (profile?.currency_preference) {
          const currency = profile.currency_preference as Currency;
          if (SUPPORTED_CURRENCIES.includes(currency)) {
            setUserCurrencyState(currency);
            setIsLoading(false);
            return;
          }
        }

        // If no preference, try to detect or use default
        const detected = detectUserCurrency();
        setUserCurrencyState(detected);
        
        // Save detected currency as preference
        if (user && !profile?.currency_preference) {
          await supabase
            .from('profiles')
            .update({ currency_preference: detected })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Error loading currency preference:', error);
        setUserCurrencyState('USD');
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrencyPreference();
  }, [user, profile]);

  // Update user's currency preference
  const setUserCurrency = useCallback(async (currency: Currency) => {
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      console.error('Unsupported currency:', currency);
      return;
    }

    setUserCurrencyState(currency);

    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ currency_preference: currency })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating currency preference:', error);
          // Revert on error
          if (profile?.currency_preference) {
            setUserCurrencyState(profile.currency_preference as Currency);
          }
        }
      } catch (error) {
        console.error('Error updating currency preference:', error);
      }
    }
  }, [user, profile]);

  // Format price with automatic conversion
  const formatPrice = useCallback((price: number, productCurrency: Currency = 'USD'): string => {
    return formatPriceWithConversion(price, productCurrency, userCurrency);
  }, [userCurrency]);

  return {
    userCurrency,
    setUserCurrency,
    formatPrice,
    isLoading,
  };
}

