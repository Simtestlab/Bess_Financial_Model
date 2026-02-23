 'use client';

import { useState, useEffect, useRef } from 'react';

interface NumInputProps {
    id: string;
    label: string;
    value: number;
    unit: string;
    onChange: (val: number) => void;
    step?: number;
    min?: number;
    max?: number;
}

function NumInput({ id, label, value, unit, onChange, step, min, max }: NumInputProps) {
    const [text, setText] = useState<string>(value != null ? String(value) : '');
    const commitTimerRef = useRef<any>(null);

    useEffect(() => {
        setText(value != null ? String(value) : '');
    }, [value]);

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
                    className="hb-input"
                    type="number"
                    step={step || 1}
                    min={min}
                    max={max}
                    value={text}
                    onChange={handleChange}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                />
                <span className="unit">{unit}</span>
            </div>
        </div>
    );
}

interface HandbookSidebarProps {
    inputs: any;
    onInputChange: (key: string, val: number | string) => void;
    onReset: () => void;
}

export default function HandbookSidebar({ inputs, onInputChange, onReset }: HandbookSidebarProps) {
    const c = (key: string) => (val: number) => onInputChange(key, val);

    return (
        <aside id="hb-sidebar" className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="2" y="8" width="24" height="12" rx="3" fill="#1a2235" stroke="#34d399" strokeWidth="1.5" />
                        <rect x="5" y="11" width="5" height="6" rx="1" fill="#34d399" opacity="0.8" />
                        <rect x="12" y="11" width="5" height="6" rx="1" fill="#22d3ee" opacity="0.8" />
                        <rect x="19" y="11" width="5" height="6" rx="1" fill="#a78bfa" opacity="0.8" />
                        <rect x="26" y="11" width="2" height="6" rx="1" fill="#6ee7b7" />
                        <rect x="0" y="11" width="2" height="6" rx="1" fill="#fb7185" />
                    </svg>
                    <h1>BESS Sizing</h1>
                </div>
                <button id="hb-btn-reset" className="btn-reset" title="Reset to defaults" onClick={onReset}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.05 10A6 6 0 1 0 4.2 4.2L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Reset
                </button>
            </div>

            <div className="sidebar-scroll">
                {/* Cell Specifications */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🔬</span> Cell Specifications</summary>
                    <div className="param-grid">
                        <div className="param">
                            <label htmlFor="hb-cellChemistry">Cell Chemistry</label>
                            <div className="input-row">
                                <select
                                    id="hb-cellChemistry"
                                    className="hb-input"
                                    value={inputs.cellChemistry}
                                    onChange={e => onInputChange('cellChemistry', e.target.value)}
                                >
                                    <option value="LFP">LFP</option>
                                    <option value="NMC">NMC</option>
                                    <option value="NCA">NCA</option>
                                    <option value="LTO">LTO</option>
                                </select>
                            </div>
                        </div>
                        <NumInput id="hb-cellCapacity" label="Cell Capacity" value={inputs.cellCapacity} unit="Ah" step={1} min={1} onChange={c('cellCapacity')} />
                        <NumInput id="hb-nominalVoltage" label="Nominal Voltage" value={inputs.nominalVoltage} unit="V" step={0.1} min={0.1} onChange={c('nominalVoltage')} />
                    </div>
                </details>

                {/* System Parameters */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🏗️</span> System Parameters</summary>
                    <div className="param-grid">
                        <NumInput id="hb-systemMW" label="System" value={inputs.systemMW} unit="MW" step={0.1} min={0.1} onChange={c('systemMW')} />
                        <NumInput id="hb-cRate" label="C-Rate" value={inputs.cRate} unit="C" step={0.1} min={0.1} onChange={c('cRate')} />
                        <NumInput id="hb-cellsPerModule" label="Cells per Module" value={inputs.cellsPerModule} unit="cells" step={1} min={1} onChange={c('cellsPerModule')} />
                        <NumInput id="hb-modulesPerRack" label="Modules per Rack" value={inputs.modulesPerRack} unit="modules" step={1} min={1} onChange={c('modulesPerRack')} />
                    </div>
                </details>

                {/* Performance Factors */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🎯</span> Performance Factors</summary>
                    <div className="param-grid">
                        <NumInput id="hb-dod" label="Depth of Discharge" value={inputs.dod} unit="%" step={0.01} min={0.01} max={1} onChange={c('dod')} />
                        <NumInput id="hb-efficiency" label="Efficiency" value={inputs.efficiency} unit="%" step={0.01} min={0.5} max={1} onChange={c('efficiency')} />
                        <NumInput id="hb-eod" label="EOD (End of Life)" value={inputs.eod} unit="%" step={0.01} min={0.1} max={1} onChange={c('eod')} />
                    </div>
                </details>

                {/* Cost Parameters */}
                <details className="param-group" open>
                    <summary><span className="group-icon">💰</span> Cost Parameters</summary>
                    <div className="param-grid">
                        <NumInput id="hb-cellCost" label="Cost per Cell" value={inputs.cellCost} unit="INR" step={100} min={0} onChange={c('cellCost')} />
                        <NumInput id="hb-moduleHousingCost" label="Module Housing Cost" value={inputs.moduleHousingCost} unit="INR" step={500} min={0} onChange={c('moduleHousingCost')} />
                        <NumInput id="hb-rackCost" label="Rack Cost" value={inputs.rackCost} unit="INR" step={1000} min={0} onChange={c('rackCost')} />
                        <NumInput id="hb-busbarCost" label="Busbar Cost" value={inputs.busbarCost} unit="INR" step={50} min={0} onChange={c('busbarCost')} />
                        <NumInput id="hb-cscCost" label="CSC Cost" value={inputs.cscCost} unit="INR" step={500} min={0} onChange={c('cscCost')} />
                    </div>
                </details>
            </div>
        </aside>
    );
}
