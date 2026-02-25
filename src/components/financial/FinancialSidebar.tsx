'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';

interface NumInputProps {
    id: string;
    label: string;
    value: number;
    unit: string;
    onChange: (val: number) => void;
    step?: number;
    min?: number;
    max?: number;
    readOnly?: boolean;
}

const NumInput = memo(function NumInput({ id, label, value, unit, onChange, step, min, max, readOnly }: NumInputProps) {
    const formatValue = (v: number) => {
        if (v == null || isNaN(v)) return '';
        const rounded = Math.round(v * 100) / 100;
        return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
    };
    const [text, setText] = useState<string>(formatValue(value));
    const commitTimerRef = useRef<any>(null);

    useEffect(() => {
        setText(formatValue(value));
    }, [value]);

    // Cleanup timer on unmount
    useEffect(() => () => clearTimeout(commitTimerRef.current), []);

    const commit = () => {
        const parsed = parseFloat(text);
        if (!isNaN(parsed)) {
            onChange(parsed);
        } else if (text === '' || text === '-') {
            // Allow empty/minus while typing
        } else {
            onChange(0);
            setText('0');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newText = e.target.value;
        setText(newText);

        // Auto-commit valid numbers after 300ms of no typing
        clearTimeout(commitTimerRef.current);
        const parsed = parseFloat(newText);
        if (!isNaN(parsed)) {
            commitTimerRef.current = setTimeout(() => {
                onChange(parsed);
            }, 300);
        }
    };

    return (
        <div className="param">
            <label htmlFor={id}>{label}</label>
            <div className="input-row">
                <input
                    id={id}
                    type="number"
                    step={step || 1}
                    min={min}
                    max={max}
                    value={text}
                    readOnly={readOnly}
                    onChange={handleChange}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                />
                <span className="unit">{unit}</span>
            </div>
        </div>
    );
});

interface SliderInputProps {
    id: string;
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
}

const SliderInput = memo(function SliderInput({ id, label, value, onChange, min, max, step }: SliderInputProps) {
    return (
        <div className="param">
            <label htmlFor={id}>{label}</label>
            <div className="slider-row">
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step || 1}
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                />
                <span className="slider-val">{value.toFixed(1)}%</span>
            </div>
        </div>
    );
});

interface FinancialSidebarProps {
    inputs: any;
    onInputChange: (key: string, val: number) => void;
    onReset: () => void;
    collapsed: boolean;
    ppaVolume: number | null;
    ppaPrice: number | null;
    currencySymbol: string;
    exchangeRate: number;
}

function FinancialSidebar({ inputs, onInputChange, onReset, collapsed, ppaVolume, ppaPrice, currencySymbol, exchangeRate }: FinancialSidebarProps) {
    // Stable callback factories that don't recreate every render
    const c = useCallback((key: string) => (val: number) => onInputChange(key, val), [onInputChange]);

    // Currency callback: convert from selected currency back to USD before storing
    const cc = useCallback((key: string) => (val: number) => onInputChange(key, val / exchangeRate), [onInputChange, exchangeRate]);

    return (
        <aside id="sidebar" className={`sidebar ${collapsed ? 'collapsed' : ''} ${!collapsed ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="2" y="6" width="6" height="16" rx="2" fill="#6ee7b7" />
                        <rect x="11" y="3" width="6" height="22" rx="2" fill="#34d399" />
                        <rect x="20" y="9" width="6" height="13" rx="2" fill="#10b981" />
                    </svg>
                    <h1>BESS Model</h1>
                </div>
                <button id="btn-reset" className="btn-reset" title="Reset to defaults" onClick={onReset}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.05 10A6 6 0 1 0 4.2 4.2L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Reset
                </button>
            </div>

            <div className="sidebar-scroll">
                {/* Technical Parameters */}
                <details className="param-group" open>
                    <summary><span className="group-icon">⚡</span> Technical Parameters</summary>
                    <div className="param-grid">
                        <NumInput id="inp-capacity" label="Usable Capacity" value={inputs.capacity} unit="MWh" step={0.1} min={0.1} readOnly onChange={() => { }} />
                        <NumInput id="inp-arb-days" label="Arbitrage Days / Year" value={inputs.arbDays} unit="days" step={1} min={1} max={365} onChange={c('arbDays')} />
                        <NumInput id="inp-cycles-per-day" label="Cycles per Day" value={inputs.cyclesPerDay} unit="cycles/day" step={0.1} min={0.1} onChange={c('cyclesPerDay')} />
                        <SliderInput id="inp-availability" label="Availability" value={inputs.availability} min={50} max={100} step={1} onChange={c('availability')} />
                        <SliderInput id="inp-rte" label="Round-Trip Efficiency" value={inputs.rte} min={50} max={100} step={1} onChange={c('rte')} />
                        <SliderInput id="inp-degradation" label="Annual Degradation" value={inputs.degradation} min={0} max={10} step={0.1} onChange={c('degradation')} />

                        <h4 className="sub-heading">Energy Pricing</h4>
                        <NumInput id="inp-charge-price" label="Charge Price" value={inputs.chargePrice * exchangeRate} unit={`${currencySymbol}/kWh`} step={exchangeRate >= 50 ? 0.01 : 0.001} min={0} onChange={cc('chargePrice')} />
                        <NumInput id="inp-discharge-price" label="Discharge Price" value={inputs.dischargePrice * exchangeRate} unit={`${currencySymbol}/kWh`} step={exchangeRate >= 50 ? 0.01 : 0.001} min={0} onChange={cc('dischargePrice')} />
                    </div>
                </details>

                {/* Revenue Parameters */}
                <details className="param-group" open>
                    <summary><span className="group-icon">💰</span> Revenue Parameters</summary>
                    <div className="param-grid">
                        <h4 className="sub-heading">PPA Contract</h4>
                        <NumInput id="inp-ppa-vol" label="PPA Volume" value={ppaVolume || 0} unit="MWh/yr" readOnly onChange={() => { }} />
                        <NumInput id="inp-ppa-rate" label="PPA Rate" value={inputs.ppaRate * exchangeRate} unit={`${currencySymbol}/kWh`} step={exchangeRate >= 50 ? 0.01 : 0.001} min={0} onChange={cc('ppaRate')} />
                        <SliderInput id="inp-ppa-esc" label="PPA Escalation" value={inputs.ppaEsc} min={0} max={10} step={0.1} onChange={c('ppaEsc')} />

                        <h4 className="sub-heading">Other Revenue</h4>
                        <NumInput id="inp-ancillary" label="Ancillary Services" value={inputs.ancillary * exchangeRate} unit={`${currencySymbol}/yr`} step={exchangeRate >= 50 ? 10000 : 1000} min={0} onChange={cc('ancillary')} />
                        <NumInput id="inp-other-rev" label="Other Services" value={inputs.otherRev * exchangeRate} unit={`${currencySymbol}/yr`} step={exchangeRate >= 50 ? 10000 : 1000} min={0} onChange={cc('otherRev')} />
                    </div>
                </details>

                {/* Cost & Investment */}
                <details className="param-group">
                    <summary><span className="group-icon">🏗️</span> Cost &amp; Investment</summary>
                    <div className="param-grid">
                        <NumInput id="inp-capex" label="Total CAPEX" value={inputs.capex * exchangeRate} unit={currencySymbol} step={exchangeRate >= 50 ? 100000 : 10000} onChange={cc('capex')} />
                        <NumInput id="inp-project-life" label="Project Life" value={inputs.projectLife} unit="years" step={1} min={5} max={40} onChange={c('projectLife')} />
                        <SliderInput id="inp-insurance" label="Insurance Rate (fixed % of CAPEX)" value={inputs.insurance} min={0} max={3} step={0.1} onChange={c('insurance')} />
                        <NumInput id="inp-var-om" label="Variable O&M" value={inputs.varOm * exchangeRate} unit={`${currencySymbol}/MWh`} step={exchangeRate >= 50 ? 0.1 : 0.01} min={0} onChange={cc('varOm')} />
                        <NumInput id="inp-fixed-om" label="Fixed O&M" value={inputs.fixedOm * exchangeRate} unit={`${currencySymbol}/yr`} step={exchangeRate >= 50 ? 10000 : 1000} onChange={cc('fixedOm')} />
                        <SliderInput id="inp-inflation" label="Inflation Rate" value={inputs.inflation} min={0} max={10} step={0.1} onChange={c('inflation')} />

                        <h4 className="sub-heading">OPEX Additions</h4>
                        <NumInput id="inp-admin-cost" label="Admin Cost" value={inputs.adminCost * exchangeRate} unit={`${currencySymbol}/yr`} step={exchangeRate >= 50 ? 10000 : 1000} onChange={cc('adminCost')} />
                        <NumInput id="inp-preventive-maintenance" label="Preventive Maintenance" value={inputs.preventiveMaintenance * exchangeRate} unit={`${currencySymbol}/yr`} step={exchangeRate >= 50 ? 10000 : 1000} onChange={cc('preventiveMaintenance')} />
                    </div>
                </details>

                {/* Debt Financing */}
                <details className="param-group">
                    <summary><span className="group-icon">💳</span> Debt Financing</summary>
                    <div className="param-grid">
                        <NumInput id="inp-debt-amount" label="Debt Amount" value={inputs.debtAmount * exchangeRate} unit={currencySymbol} step={exchangeRate >= 50 ? 100000 : 10000} onChange={cc('debtAmount')} />
                        <SliderInput id="inp-debt-rate" label="Interest Rate" value={inputs.debtRate} min={0} max={15} step={0.1} onChange={c('debtRate')} />
                        <NumInput id="inp-loan-term" label="Loan Term" value={inputs.loanTerm} unit="years" step={1} min={1} max={30} onChange={c('loanTerm')} />

                        <h4 className="sub-heading">Tax</h4>
                        <SliderInput id="inp-tax-rate" label="Tax Rate" value={inputs.taxRate} min={0} max={40} step={0.1} onChange={c('taxRate')} />
                    </div>
                </details>
            </div>
        </aside>
    );
}

export default memo(FinancialSidebar);
