'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import HandbookSidebar from './HandbookSidebar';
import HandbookMain from './HandbookMain';
import { HANDBOOK_DEFAULTS, calculateBESS } from '@/lib/handbook-engine';

const STORAGE_KEY = 'bess-handbook-inputs';

function saveInputs(inputs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch (e) { }
}

function loadInputs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

export default function HandbookSection() {
    const [inputs, setInputs] = useState({ ...HANDBOOK_DEFAULTS });
    const [outputs, setOutputs] = useState(null);
    const timerRef = useRef(null);

    // Load saved inputs on mount
    useEffect(() => {
        const saved = loadInputs();
        if (saved) {
            const merged = { ...HANDBOOK_DEFAULTS, ...saved };
            setInputs(merged);
            setOutputs(calculateBESS(merged));
        } else {
            setOutputs(calculateBESS(HANDBOOK_DEFAULTS));
        }
    }, []);

    const recalculate = useCallback((currentInputs) => {
        saveInputs(currentInputs);
        const out = calculateBESS(currentInputs);
        setOutputs(out);
    }, []);

    const handleInputChange = useCallback((key, value) => {
        setInputs(prev => {
            const next = { ...prev, [key]: value };
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => recalculate(next), 60);
            return next;
        });
    }, [recalculate]);

    const handleReset = useCallback(() => {
        const defaults = { ...HANDBOOK_DEFAULTS };
        setInputs(defaults);
        localStorage.removeItem(STORAGE_KEY);
        recalculate(defaults);
    }, [recalculate]);

    return (
        <>
            <HandbookSidebar
                inputs={inputs}
                onInputChange={handleInputChange}
                onReset={handleReset}
            />
            <HandbookMain outputs={outputs} />
        </>
    );
}
