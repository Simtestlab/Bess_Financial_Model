'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FinancialSidebar from './FinancialSidebar';
import FinancialMain from './FinancialMain';
import { DEFAULTS, buildParams, runModel } from '@/lib/engine';
import { useCurrency } from '@/lib/CurrencyContext';
import { getCurrencyInfo } from '@/lib/currency';
import {
    runSensitivity,
    runDegradationSensitivity,
    runEfficiencySensitivity,
    runTornadoSensitivity,
} from '@/lib/engine';

export default function FinancialSection() {
    const [inputs, setInputs] = useState({ ...DEFAULTS });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { selectedCurrency, exchangeRate } = useCurrency();
    const recalcTimerRef = useRef(null);
    const [model, setModel] = useState(null);
    const [params, setParams] = useState(null);

    // Responsive: collapse sidebar on small screens
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            setSidebarCollapsed(true);
        }
    }, []);

    const recalculate = useCallback((currentInputs) => {
        const p = buildParams(currentInputs);
        const m = runModel(p);
        setParams(p);
        setModel(m);
    }, []);

    // Initial calculation
    useEffect(() => {
        recalculate(inputs);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleInputChange = useCallback((key, value) => {
        setInputs(prev => {
            const next = { ...prev, [key]: value };
            // Debounced recalculation
            clearTimeout(recalcTimerRef.current);
            recalcTimerRef.current = setTimeout(() => recalculate(next), 30);
            return next;
        });
    }, [recalculate]);

    const handleReset = useCallback(() => {
        const defaults = { ...DEFAULTS };
        setInputs(defaults);
        recalculate(defaults);
    }, [recalculate]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const currencyInfo = getCurrencyInfo(selectedCurrency);
    const currencySymbol = currencyInfo?.symbol || '$';

    return (
        <>
            <FinancialSidebar
                inputs={inputs}
                onInputChange={handleInputChange}
                onReset={handleReset}
                collapsed={sidebarCollapsed}
                ppaVolume={params ? params.ppaVolume : 0}
            />
            <FinancialMain
                model={model}
                params={params}
                inputs={inputs}
                collapsed={sidebarCollapsed}
                onToggleSidebar={toggleSidebar}
                selectedCurrency={selectedCurrency}
                exchangeRate={exchangeRate}
                currencySymbol={currencySymbol}
            />
        </>
    );
}
