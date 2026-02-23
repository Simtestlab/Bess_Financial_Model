'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState(1);

    const handleCurrencyChange = useCallback((currency) => {
        setSelectedCurrency(currency);
    }, []);

    const handleRateChange = useCallback((rate) => {
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

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
}
