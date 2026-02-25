'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SizingContextType {
    usableCapacityMWh: number | null;
    setUsableCapacityMWh: (value: number | null) => void;
    systemMW: number | null;
    setSystemMW: (value: number | null) => void;
    grandTotal: number | null;
    setGrandTotal: (value: number | null) => void;
}

const SizingContext = createContext<SizingContextType | undefined>(undefined);

export function SizingProvider({ children }: { children: ReactNode }) {
    const [usableCapacityMWh, setUsableCapacityMWh] = useState<number | null>(null);
    const [systemMW, setSystemMW] = useState<number | null>(null);
    const [grandTotal, setGrandTotal] = useState<number | null>(null);

    return (
        <SizingContext.Provider value={{ usableCapacityMWh, setUsableCapacityMWh, systemMW, setSystemMW, grandTotal, setGrandTotal }}>
            {children}
        </SizingContext.Provider>
    );
}

export function useSizing() {
    const context = useContext(SizingContext);
    if (context === undefined) {
        throw new Error('useSizing must be used within a SizingProvider');
    }
    return context;
}
