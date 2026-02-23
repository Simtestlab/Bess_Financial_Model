'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/* ============================================================
   Currency Management System
   ============================================================
   
   This context manages currency conversion across the app:
   
   1. All values are stored internally in USD
   2. When user selects a currency (e.g., INR), the exchange
      rate is fetched from the API (e.g., 1 USD = 90.90 INR)
   3. Display values = USD value × exchange rate
   4. When user edits an input, it's converted back to USD
      by dividing by the exchange rate
   
   Example flow when selecting INR:
   - User selects INR
   - API fetches rate: 90.90
   - CAPEX stored as: $2,750,000 (USD)
   - CAPEX displayed as: ₹249,22,500 (INR)
   - User edits to: ₹300,00,000
   - Stored back as: $3,300,330 (USD)
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
