'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CurrencyContextType {
    selectedCurrency: string;
    exchangeRate: number;
    onCurrencyChange: (currency: string) => void;
    onRateChange: (rate: number) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
    children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
    const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    const handleCurrencyChange = useCallback((currency: string) => {
        setSelectedCurrency(currency);
    }, []);

    const handleRateChange = useCallback((rate: number) => {
        setExchangeRate(rate);
    }, []);

    return (
        <CurrencyContext.Provider
            value={{
                selectedCurrency,
                exchangeRate,
                onCurrencyChange: handleCurrencyChange,
                onRateChange: handleRateChange,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency(): CurrencyContextType {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
}
