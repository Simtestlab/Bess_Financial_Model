'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/* ============================================================
   Currency Management System
   ============================================================
   
   This context manages currency conversion across the app:
   
   1. All values are stored internally in INR
   2. When user selects a currency (e.g., USD), the exchange
      rate is fetched from the API (e.g., 1 INR = 0.012 USD)
   3. Display values = INR value × exchange rate
   4. When user edits an input, it's converted back to INR
      by dividing by the exchange rate
   
   Example flow when selecting USD:
   - User selects USD
   - API fetches rate: 0.012
   - CAPEX stored as: ₹2,50,96,710 (INR)
   - CAPEX displayed as: $30,237 (USD)
   - User edits to: $35,000
   - Stored back as: ₹2,91,66,667 (INR)
   ============================================================ */


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
    const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
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
