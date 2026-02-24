'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import FinancialSidebar from './FinancialSidebar';
import FinancialMain from './FinancialMain';
import { DEFAULTS, buildParams, runModel } from '@/lib/engine';
import { useCurrency } from '@/lib/CurrencyContext';
import { getCurrencyInfo } from '@/lib/currency';

export default function FinancialSection() {
    const [inputs, setInputs] = useState({ ...DEFAULTS });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { selectedCurrency, exchangeRate } = useCurrency();
    const recalcTimerRef = useRef<any>(null);
    const inputsRef = useRef(inputs);
    const [model, setModel] = useState<any>(null);
    const [params, setParams] = useState<any>(null);

    // Responsive: collapse sidebar on small screens
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            setSidebarCollapsed(true);
        }
    }, []);

    const recalculate = useCallback((currentInputs: any) => {
        const p = buildParams(currentInputs);
        const m = runModel(p);
        setParams(p);
        setModel(m);
    }, []);

    // Initial calculation
    useEffect(() => {
        recalculate(inputs);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup timer on unmount
    useEffect(() => () => clearTimeout(recalcTimerRef.current), []);

    const handleInputChange = useCallback((key: string, value: number) => {
        setInputs(prev => {
            const next = { ...prev, [key]: value };
            inputsRef.current = next;
            // Debounced recalculation using ref to avoid stale closures
            clearTimeout(recalcTimerRef.current);
            recalcTimerRef.current = setTimeout(() => recalculate(inputsRef.current), 120);
            return next;
        });
    }, [recalculate]);

    const handleReset = useCallback(() => {
        const defaults = { ...DEFAULTS };
        setInputs(defaults);
        inputsRef.current = defaults;
        recalculate(defaults);
    }, [recalculate]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const currencyInfo = useMemo(() => getCurrencyInfo(selectedCurrency), [selectedCurrency]);
    const currencySymbol = currencyInfo?.symbol || '$';

    // Memoize ppaVolume to avoid recalculating on every render
    const ppaVolume = useMemo(() => params ? params.ppaVolume : 0, [params]);

    return (
        <>
            <FinancialSidebar
                inputs={inputs}
                onInputChange={handleInputChange}
                onReset={handleReset}
                collapsed={sidebarCollapsed}
                ppaVolume={ppaVolume}
                currencySymbol={currencySymbol}
                exchangeRate={exchangeRate}
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
