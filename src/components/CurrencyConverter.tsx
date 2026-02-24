'use client';

import { useState, useEffect } from 'react';
import { CURRENCY_OPTIONS, getExchangeRate, getCurrencyInfo } from '@/lib/currency';

export default function CurrencyConverter({ baseCurrency, selectedCurrency, exchangeRate, onCurrencyChange, onRateChange }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Clear previous errors
        setError(null);

        // If switching back to base currency, reset rate to 1
        if (selectedCurrency === baseCurrency) {
            setLoading(false);
            onRateChange(1);
            return;
        }

        setLoading(true);
        getExchangeRate(baseCurrency, selectedCurrency)
            .then(rate => {
                onRateChange(rate);
                setLoading(false);
            })
            .catch(err => {
                console.error('Exchange rate error:', err);
                setError('Failed to load rate');
                setLoading(false);
            });
    }, [selectedCurrency, baseCurrency, onRateChange]);

    const handleCurrencyChange = (e) => {
        onCurrencyChange(e.target.value);
    };

    const currencyInfo = getCurrencyInfo(selectedCurrency);
    const baseInfo = getCurrencyInfo(baseCurrency);

    return (
        <div className="currency-converter">
            <div className="currency-select-wrapper">
                <label htmlFor="currency-select" className="currency-label">Currency:</label>
                <select
                    id="currency-select"
                    className="currency-select"
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    disabled={loading}
                >
                    {CURRENCY_OPTIONS.map(currency => (
                        <option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.country}
                        </option>
                    ))}
                </select>
                {loading && <span className="currency-indicator loading">Loading...</span>}
                {error && <span className="currency-indicator error" title={error}>⚠</span>}
                {!loading && !error && selectedCurrency !== baseCurrency && (
                    <span className="currency-rate" title={`1 ${baseInfo?.code} = ${exchangeRate.toFixed(4)} ${currencyInfo?.code}`}>
                        1:{ exchangeRate.toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    );
}
