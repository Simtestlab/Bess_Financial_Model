'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ALL_DEFAULTS, calculateAll } from '@/lib/handbook-engine';
import { useCurrency } from '@/lib/CurrencyContext';
import { getCurrencyInfo } from '@/lib/currency';
import { fmtCurrency } from '@/lib/formatters';

const STORAGE_KEY = 'bess-sizing-inputs-v3';
const SECTIONS = [
    { id: 'cell', label: '🔬 Cell', icon: '🔬' },
    { id: 'module', label: '🧩 Module', icon: '🧩' },
    { id: 'pack', label: '📦 Pack / Rack', icon: '📦' },
    { id: 'system', label: '🏗️ System', icon: '🏗️' },
    { id: 'bop', label: '⚡ BOP', icon: '⚡' },
    { id: 'summary', label: '📊 Summary', icon: '📊' },
] as const;

function saveInputs(inputs: any) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { }
}
function loadInputs(): any | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

/* ── Formatting helpers ─────────────────────────────────────── */
function fmt(n: number | null | undefined, digits = 1): string {
    if (n == null || isNaN(n)) return '--';
    return n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtInt(n: number | null | undefined): string {
    if (n == null || isNaN(n)) return '--';
    return Math.round(n).toLocaleString('en-IN');
}

/* ── NumInput with debounced commit ─────────────────────────── */
interface NumInputProps {
    id: string; label: string; value: number; unit: string;
    onChange: (v: number) => void;
    step?: number; min?: number; max?: number;
}
function NumInput({ id, label, value, unit, onChange, step, min, max }: NumInputProps) {
    const [text, setText] = useState(value != null ? String(value) : '');
    const timer = useRef<any>(null);
    useEffect(() => { setText(value != null ? String(value) : ''); }, [value]);
    const commit = () => {
        const p = parseFloat(text);
        if (!isNaN(p)) onChange(p);
        else if (text !== '' && text !== '-') { onChange(0); setText('0'); }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value; setText(t);
        clearTimeout(timer.current);
        const p = parseFloat(t);
        if (!isNaN(p)) timer.current = setTimeout(() => onChange(p), 300);
    };
    return (
        <div className="bess-field">
            <label htmlFor={id}>{label}</label>
            <div className="bess-field-row">
                <input id={id} type="number" step={step || 1} min={min} max={max}
                    value={text} onChange={handleChange} onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    onWheel={e => (e.target as HTMLInputElement).blur()} />
                <span className="bess-unit">{unit}</span>
            </div>
        </div>
    );
}

/* ── CellInput — tiny input for inside table cells ──────────── */
interface CellInputProps {
    value: number; onChange: (v: number) => void;
    step?: number; min?: number; style?: React.CSSProperties;
}
function CellInput({ value, onChange, step, min, style }: CellInputProps) {
    const [text, setText] = useState(value != null ? String(value) : '');
    const timer = useRef<any>(null);
    useEffect(() => { setText(value != null ? String(value) : ''); }, [value]);
    const commit = () => {
        const p = parseFloat(text);
        if (!isNaN(p)) onChange(p);
        else { onChange(0); setText('0'); }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value; setText(t);
        clearTimeout(timer.current);
        const p = parseFloat(t);
        if (!isNaN(p)) timer.current = setTimeout(() => onChange(p), 300);
    };
    return (
        <input className="bom-cell-input" type="number" step={step || 1} min={min}
            value={text} onChange={handleChange} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            onWheel={e => (e.target as HTMLInputElement).blur()}
            style={style} />
    );
}

/* ── Result row helper ──────────────────────────────────────── */
function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <tr className={highlight ? 'row-total' : ''}>
            <td>{label}</td>
            <td>{value}</td>
        </tr>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function HandbookSection() {
    const [inputs, setInputs] = useState({ ...ALL_DEFAULTS });
    const [outputs, setOutputs] = useState<ReturnType<typeof calculateAll> | null>(null);
    const [activeTab, setActiveTab] = useState<string>('cell');
    const timerRef = useRef<any>(null);

    const { selectedCurrency, exchangeRate } = useCurrency();
    const cInfo = getCurrencyInfo(selectedCurrency);
    const sym = cInfo?.symbol || '$';
    const fc = (v: number) => fmtCurrency(v, sym, exchangeRate);

    useEffect(() => {
        const saved = loadInputs();
        const merged = saved ? { ...ALL_DEFAULTS, ...saved } : { ...ALL_DEFAULTS };
        setInputs(merged);
        setOutputs(calculateAll(merged));
    }, []);

    const recalc = useCallback((cur: typeof ALL_DEFAULTS) => {
        saveInputs(cur); setOutputs(calculateAll(cur));
    }, []);

    const set = useCallback((key: string, val: number | string) => {
        setInputs(prev => {
            const next = { ...prev, [key]: val };
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => recalc(next as any), 30);
            return next;
        });
    }, [recalc]);

    const c = (key: string) => (val: number) => set(key, val);

    const handleReset = useCallback(() => {
        const d = { ...ALL_DEFAULTS };
        setInputs(d); localStorage.removeItem(STORAGE_KEY); recalc(d);
    }, [recalc]);

    const o = outputs;

    /* ── Render ──────────────────────────────────────────────── */
    return (
        <main className="bess-layout">
            {/* Top KPI Strip */}
            <header className="bess-kpi-bar">
                <div className="kpi-strip">
                    <div className="kpi-card kpi-irr">
                        <span className="kpi-label">Total DC Energy</span>
                        <span className="kpi-value">{o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'}</span>
                    </div>
                    <div className="kpi-card kpi-npv">
                        <span className="kpi-label">Delivered AC</span>
                        <span className="kpi-value">{o ? fmt(o.sysOut.deliveredACEnergy, 1) + ' kWh' : '--'}</span>
                    </div>
                    <div className="kpi-card kpi-payback">
                        <span className="kpi-label">Total Racks</span>
                        <span className="kpi-value">{o ? fmtInt(o.sysOut.numberOfRacks) : '--'}</span>
                    </div>
                    <div className="kpi-card kpi-rev">
                        <span className="kpi-label">Total System Cost</span>
                        <span className="kpi-value">{o ? fc(o.summary.totalSystemCost) : '--'}</span>
                    </div>
                </div>
                <button className="btn-reset" title="Reset all to defaults" onClick={handleReset}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.05 10A6 6 0 1 0 4.2 4.2L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Reset
                </button>
            </header>

            {/* Section Tabs */}
            <nav className="bess-section-tabs" role="tablist">
                {SECTIONS.map(s => (
                    <button key={s.id} role="tab" aria-selected={activeTab === s.id}
                        className={`bess-tab ${activeTab === s.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(s.id)}>
                        {s.label}
                    </button>
                ))}
            </nav>

            {/* Section Content */}
            <div className="bess-section-content">

                {/* ═══ CELL ═══════════════════════════════════════ */}
                {activeTab === 'cell' && (
                    <div className="bess-section-panel" key="cell">
                        <div className="bess-split">
                            <div className="bess-inputs-card">
                                <h3>🔬 Cell Inputs</h3>
                                <div className="bess-field">
                                    <label htmlFor="hb-cellChemistry">Cell Chemistry</label>
                                    <div className="bess-field-row">
                                        <select id="hb-cellChemistry" value={inputs.cellChemistry}
                                            onChange={e => set('cellChemistry', e.target.value)}>
                                            <option value="LFP">LFP</option>
                                            <option value="NMC">NMC</option>
                                            <option value="NCA">NCA</option>
                                            <option value="LTO">LTO</option>
                                        </select>
                                    </div>
                                </div>
                                <NumInput id="cell-cap" label="Cell Capacity" value={inputs.cellCapacity} unit="Ah" step={1} min={1} onChange={c('cellCapacity')} />
                                <NumInput id="cell-volt" label="Nominal Voltage" value={inputs.nominalVoltage} unit="V" step={0.1} min={0.1} onChange={c('nominalVoltage')} />
                                <NumInput id="cell-cost" label="Cell Cost" value={inputs.cellCost} unit={sym} step={100} min={0} onChange={c('cellCost')} />
                                <NumInput id="cell-dod" label="Depth of Discharge" value={inputs.dod} unit="(0-1)" step={0.01} min={0.01} max={1} onChange={c('dod')} />
                                <NumInput id="cell-eff" label="Efficiency" value={inputs.efficiency} unit="(0-1)" step={0.01} min={0.5} max={1} onChange={c('efficiency')} />
                                <NumInput id="cell-eol" label="End of Life (EOL)" value={inputs.eol} unit="(0-1)" step={0.01} min={0.1} max={1} onChange={c('eol')} />
                            </div>
                            <div className="bess-results-card">
                                <h3>⚡ Calculated</h3>
                                <table className="bess-result-table">
                                    <tbody>
                                        <ResultRow label="Cell Energy" value={o ? fmt(o.cellOut.cellEnergy, 1) + ' Wh' : '--'} />
                                        <ResultRow label="Cell Energy (kWh)" value={o ? fmt(o.cellOut.cellEnergyKWh, 4) + ' kWh' : '--'} />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ MODULE (BOM) ══════════════════════════════ */}
                {activeTab === 'module' && (
                    <div className="bess-section-panel" key="module">
                        <div className="bess-split">
                            {/* LEFT: Quantity & Rate inputs */}
                            <div className="bess-inputs-card">
                                <h3>📋 Module — Quantity & Rate</h3>
                                <div className="bess-results-inline" style={{ marginBottom: 12 }}>
                                    <span><strong>Module Voltage:</strong> {o ? fmt(o.modOut.moduleVoltage, 1) + ' V' : '--'}</span>
                                    <span><strong>Module Energy:</strong> {o ? fmt(o.modOut.moduleEnergy, 1) + ' Wh' : '--'} ({o ? fmt(o.modOut.moduleEnergyKWh, 2) + ' kWh' : '--'})</span>
                                </div>
                                <table className="bom-table">
                                    <thead>
                                        <tr>
                                            <th className="bom-col-item">Component</th>
                                            <th className="bom-col-qty">Qty</th>
                                            <th className="bom-col-price">Rate ({sym})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>LFP Cells</td><td className="bom-td-qty"><CellInput value={inputs.cellsPerModule} onChange={c('cellsPerModule')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cellCost} onChange={c('cellCost')} step={100} min={0} /></td></tr>
                                        <tr><td>Mechanical Housing</td><td className="bom-td-qty"><CellInput value={inputs.housingQty} onChange={c('housingQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.housingCost} onChange={c('housingCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Busbar</td><td className="bom-td-qty"><CellInput value={inputs.busbarQty} onChange={c('busbarQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.busbarCost} onChange={c('busbarCost')} step={10} min={0} /></td></tr>
                                        <tr><td>CSC</td><td className="bom-td-qty"><CellInput value={inputs.cscQty} onChange={c('cscQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cscCost} onChange={c('cscCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Connectors</td><td className="bom-td-qty"><CellInput value={inputs.connectorsQty} onChange={c('connectorsQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.connectorsCost} onChange={c('connectorsCost')} step={10} min={0} /></td></tr>
                                        <tr><td>Insulation & Spacers</td><td className="bom-td-qty"><CellInput value={inputs.insulationQty} onChange={c('insulationQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.insulationCost} onChange={c('insulationCost')} step={50} min={0} /></td></tr>
                                        <tr><td>Fasteners & Hardware</td><td className="bom-td-qty"><CellInput value={inputs.fastenersQty} onChange={c('fastenersQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.fastenersCost} onChange={c('fastenersCost')} step={50} min={0} /></td></tr>
                                        <tr><td>Cell Adaptor</td><td className="bom-td-qty"><CellInput value={inputs.cellAdaptorQty} onChange={c('cellAdaptorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cellAdaptorCost} onChange={c('cellAdaptorCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Labour (assembly)</td><td className="bom-td-qty"><CellInput value={inputs.labourQty} onChange={c('labourQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.labourCost} onChange={c('labourCost')} step={50} min={0} /></td></tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* RIGHT: Cost breakdown */}
                            <div className="bess-results-card">
                                <h3>💰 Module — Cost Breakdown</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Component</th><th>Total ({sym})</th></tr></thead>
                                    <tbody>
                                        <ResultRow label="LFP Cells" value={fc(inputs.cellsPerModule * inputs.cellCost)} />
                                        <ResultRow label="Mechanical Housing" value={fc(inputs.housingQty * inputs.housingCost)} />
                                        <ResultRow label="Busbar" value={fc(inputs.busbarQty * inputs.busbarCost)} />
                                        <ResultRow label="CSC" value={fc(inputs.cscQty * inputs.cscCost)} />
                                        <ResultRow label="Connectors" value={fc(inputs.connectorsQty * inputs.connectorsCost)} />
                                        <ResultRow label="Insulation & Spacers" value={fc(inputs.insulationQty * inputs.insulationCost)} />
                                        <ResultRow label="Fasteners & Hardware" value={fc(inputs.fastenersQty * inputs.fastenersCost)} />
                                        <ResultRow label="Cell Adaptor" value={fc(inputs.cellAdaptorQty * inputs.cellAdaptorCost)} />
                                        <ResultRow label="Labour (assembly)" value={fc(inputs.labourQty * inputs.labourCost)} />
                                        <ResultRow label="Total Module Cost" value={o ? fc(o.modOut.totalModuleCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ PACK / RACK (BOM) ═════════════════════════ */}
                {activeTab === 'pack' && (
                    <div className="bess-section-panel" key="pack">
                        <div className="bess-split">
                            {/* LEFT: Quantity & Rate inputs */}
                            <div className="bess-inputs-card">
                                <h3>📋 Pack / Rack — Quantity & Rate</h3>
                                <div className="bess-results-inline" style={{ marginBottom: 12 }}>
                                    <span><strong>Rack Voltage:</strong> {o ? fmt(o.packOut.rackVoltage, 1) + ' V' : '--'}</span>
                                    <span><strong>Rack Energy:</strong> {o ? fmt(o.packOut.rackEnergy, 1) + ' kWh' : '--'}</span>
                                </div>
                                <table className="bom-table">
                                    <thead>
                                        <tr>
                                            <th className="bom-col-item">Component</th>
                                            <th className="bom-col-qty">Qty</th>
                                            <th className="bom-col-price">Rate ({sym})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Modules</td><td className="bom-td-qty"><CellInput value={inputs.modulesPerRack} onChange={c('modulesPerRack')} step={1} min={1} /></td><td className="bom-td-price">{o ? fc(o.modOut.totalModuleCost) : '--'}</td></tr>
                                        <tr><td>Rack Frame</td><td className="bom-td-qty"><CellInput value={inputs.rackFrameQty} onChange={c('rackFrameQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.rackFrameCost} onChange={c('rackFrameCost')} step={5000} min={0} /></td></tr>
                                        <tr><td>Pack Monitor</td><td className="bom-td-qty"><CellInput value={inputs.packMonitorQty} onChange={c('packMonitorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.packMonitorCost} onChange={c('packMonitorCost')} step={1000} min={0} /></td></tr>
                                        <tr><td>Contactors</td><td className="bom-td-qty"><CellInput value={inputs.contactorQty} onChange={c('contactorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.contactorCost} onChange={c('contactorCost')} step={500} min={0} /></td></tr>
                                        <tr><td>DC Breaker</td><td className="bom-td-qty"><CellInput value={inputs.dcBreakerQty} onChange={c('dcBreakerQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.dcBreakerCost} onChange={c('dcBreakerCost')} step={500} min={0} /></td></tr>
                                        <tr><td>DC Fuse</td><td className="bom-td-qty"><CellInput value={inputs.dcFuseQty} onChange={c('dcFuseQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.dcFuseCost} onChange={c('dcFuseCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Mounting Rails</td><td className="bom-td-qty"><CellInput value={inputs.mountingRailsQty} onChange={c('mountingRailsQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.mountingRailsCost} onChange={c('mountingRailsCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Rack Labour</td><td className="bom-td-qty"><CellInput value={inputs.rackLabourQty} onChange={c('rackLabourQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.rackLabourCost} onChange={c('rackLabourCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Cable – Red</td><td className="bom-td-qty"><CellInput value={inputs.cableLengthPerRack} onChange={c('cableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.cableRedPricePerM} onChange={c('cableRedPricePerM')} step={10} min={0} /><span className="bom-unit-hint">/m</span></td></tr>
                                        <tr><td>Cable – Black</td><td className="bom-td-qty"><CellInput value={inputs.cableLengthPerRack} onChange={c('cableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.cableBlackPricePerM} onChange={c('cableBlackPricePerM')} step={10} min={0} /><span className="bom-unit-hint">/m</span></td></tr>
                                        <tr><td>BMS Controller</td><td className="bom-td-qty"><CellInput value={inputs.bmsControllerQty} onChange={c('bmsControllerQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.bmsControllerCost} onChange={c('bmsControllerCost')} step={1000} min={0} /></td></tr>
                                        <tr><td>Daisy Chain Converter</td><td className="bom-td-qty"><CellInput value={inputs.daisyChainConverterQty} onChange={c('daisyChainConverterQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.daisyChainConverterCost} onChange={c('daisyChainConverterCost')} step={500} min={0} /></td></tr>
                                        <tr><td>Daisy Chain Cable</td><td className="bom-td-qty"><CellInput value={inputs.daisyChainCableLengthPerRack} onChange={c('daisyChainCableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.daisyChainCableCostPerM} onChange={c('daisyChainCableCostPerM')} step={10} min={0} /><span className="bom-unit-hint">/m</span></td></tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* RIGHT: Cost breakdown */}
                            <div className="bess-results-card">
                                <h3>💰 Pack / Rack — Cost Breakdown</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Component</th><th>Total ({sym})</th></tr></thead>
                                    <tbody>
                                        <ResultRow label="Modules" value={o ? fc(o.packOut.modulesCostPerRack) : '--'} />
                                        <ResultRow label="Rack Frame" value={fc(inputs.rackFrameQty * inputs.rackFrameCost)} />
                                        <ResultRow label="Pack Monitor" value={fc(inputs.packMonitorQty * inputs.packMonitorCost)} />
                                        <ResultRow label="Contactors" value={fc(inputs.contactorQty * inputs.contactorCost)} />
                                        <ResultRow label="DC Breaker" value={fc(inputs.dcBreakerQty * inputs.dcBreakerCost)} />
                                        <ResultRow label="DC Fuse" value={fc(inputs.dcFuseQty * inputs.dcFuseCost)} />
                                        <ResultRow label="Mounting Rails" value={fc(inputs.mountingRailsQty * inputs.mountingRailsCost)} />
                                        <ResultRow label="Rack Labour" value={fc(inputs.rackLabourQty * inputs.rackLabourCost)} />
                                        <ResultRow label="Cable – Red" value={fc(inputs.cableLengthPerRack * inputs.cableRedPricePerM)} />
                                        <ResultRow label="Cable – Black" value={fc(inputs.cableLengthPerRack * inputs.cableBlackPricePerM)} />
                                        <ResultRow label="BMS Controller" value={fc(inputs.bmsControllerQty * inputs.bmsControllerCost)} />
                                        <ResultRow label="Daisy Chain Converter" value={fc(inputs.daisyChainConverterQty * inputs.daisyChainConverterCost)} />
                                        <ResultRow label="Daisy Chain Cable" value={fc(inputs.daisyChainCableLengthPerRack * inputs.daisyChainCableCostPerM)} />
                                        <ResultRow label="Total Rack Cost" value={o ? fc(o.packOut.totalRackCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ SYSTEM ════════════════════════════════════ */}
                {activeTab === 'system' && (
                    <div className="bess-section-panel" key="system">
                        <div className="bess-split">
                            <div className="bess-inputs-card">
                                <h3>🏗️ System Inputs</h3>
                                <NumInput id="sys-mw" label="System Power (AC)" value={inputs.systemMW} unit="MW" step={0.1} min={0.1} onChange={c('systemMW')} />
                                <NumInput id="sys-crate" label="C-Rate" value={inputs.cRate} unit="C" step={0.1} min={0.1} onChange={c('cRate')} />
                                <NumInput id="sys-bms" label="Master BMS Cost" value={inputs.masterBMSCost} unit={sym} step={10000} min={0} onChange={c('masterBMSCost')} />
                                <NumInput id="sys-bms-h" label="BMS Housing Cost" value={inputs.bmsHousingCost} unit={sym} step={1000} min={0} onChange={c('bmsHousingCost')} />
                                <NumInput id="sys-safety" label="Safety Systems Cost" value={inputs.safetySystemsCost} unit={sym} step={10000} min={0} onChange={c('safetySystemsCost')} />
                                <NumInput id="sys-pcs" label="PCS Cost (per MW)" value={inputs.pcsCost} unit={`${sym}/MW`} step={10000} min={0} onChange={c('pcsCost')} />
                            </div>
                            <div className="bess-results-card">
                                <h3>⚡ Calculated</h3>
                                <table className="bess-result-table">
                                    <tbody>
                                        <ResultRow label="Duration" value={o ? fmt(o.sysOut.duration, 2) + ' h' : '--'} />
                                        <ResultRow label="Required AC Energy" value={o ? fmt(o.sysOut.requiredACEnergy, 1) + ' kWh' : '--'} />
                                        <ResultRow label="Gross DC Energy Required" value={o ? fmt(o.sysOut.grossDCEnergy, 1) + ' kWh' : '--'} />
                                        <ResultRow label="Number of Racks" value={o ? fmtInt(o.sysOut.numberOfRacks) + ' racks' : '--'} />
                                        <ResultRow label="Total DC Energy Installed" value={o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'} />
                                        <ResultRow label="Total DC Energy (MWh)" value={o ? fmt(o.sysOut.totalDCEnergyMWh, 4) + ' MWh' : '--'} />
                                        <ResultRow label="Total Cells" value={o ? fmtInt(o.sysOut.totalCells) + ' cells' : '--'} />
                                        <ResultRow label="Total Modules" value={o ? fmtInt(o.sysOut.totalModules) + ' modules' : '--'} />
                                        <ResultRow label="Delivered AC Energy" value={o ? fmt(o.sysOut.deliveredACEnergy, 1) + ' kWh' : '--'} />
                                    </tbody>
                                </table>
                                <h3 style={{ marginTop: 18 }}>💰 System Cost Breakdown</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Item</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        <ResultRow label={`Total Racks Cost (${o ? o.sysOut.numberOfRacks : '-'} racks)`} value={o ? fc(o.sysOut.totalRacksCost) : '--'} />
                                        <ResultRow label="Master BMS" value={o ? fc(inputs.masterBMSCost) : '--'} />
                                        <ResultRow label="BMS Housing" value={o ? fc(inputs.bmsHousingCost) : '--'} />
                                        <ResultRow label="Safety Systems" value={o ? fc(inputs.safetySystemsCost) : '--'} />
                                        <ResultRow label={`PCS (${inputs.systemMW} MW)`} value={o ? fc(o.sysOut.pcsCostTotal) : '--'} />
                                        <ResultRow label="Total Battery System Cost" value={o ? fc(o.sysOut.totalBatterySystemCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ BOP ═══════════════════════════════════════ */}
                {activeTab === 'bop' && (
                    <div className="bess-section-panel" key="bop">
                        <div className="bess-split">
                            <div className="bess-inputs-card">
                                <h3>⚡ Balance of Plant Inputs</h3>
                                <NumInput id="bop-civil" label="Civil Works" value={inputs.civilWorks} unit={sym} step={50000} min={0} onChange={c('civilWorks')} />
                                <NumInput id="bop-cable" label="AC Cabling" value={inputs.acCabling} unit={sym} step={10000} min={0} onChange={c('acCabling')} />
                                <NumInput id="bop-earth" label="Earthing" value={inputs.earthing} unit={sym} step={10000} min={0} onChange={c('earthing')} />
                                <NumInput id="bop-labour" label="Installation Labour" value={inputs.installationLabour} unit={sym} step={10000} min={0} onChange={c('installationLabour')} />
                                <NumInput id="bop-comm" label="Communication" value={inputs.communication} unit={sym} step={10000} min={0} onChange={c('communication')} />
                            </div>
                            <div className="bess-results-card">
                                <h3>💰 BOP Cost</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Item</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        <ResultRow label="Civil Works" value={o ? fc(inputs.civilWorks) : '--'} />
                                        <ResultRow label="AC Cabling" value={o ? fc(inputs.acCabling) : '--'} />
                                        <ResultRow label="Earthing" value={o ? fc(inputs.earthing) : '--'} />
                                        <ResultRow label="Installation Labour" value={o ? fc(inputs.installationLabour) : '--'} />
                                        <ResultRow label="Communication" value={o ? fc(inputs.communication) : '--'} />
                                        <ResultRow label="Total BOP Cost" value={o ? fc(o.bopOut.totalBOPCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ SUMMARY ═══════════════════════════════════ */}
                {activeTab === 'summary' && (
                    <div className="bess-section-panel" key="summary">
                        <div className="bess-summary-grid">
                            {/* Grand Cost Summary */}
                            <div className="bess-results-card bess-summary-wide">
                                <h3>📊 Total System Cost Summary</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Item</th><th>Amount</th></tr></thead>
                                    <tbody>
                                        <ResultRow label="Battery System Cost" value={o ? fc(o.sysOut.totalBatterySystemCost) : '--'} />
                                        <ResultRow label="BOP Cost" value={o ? fc(o.bopOut.totalBOPCost) : '--'} />
                                        <ResultRow label="Total System Cost" value={o ? fc(o.summary.totalSystemCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>

                            {/* Key Metrics */}
                            <div className="bess-results-card">
                                <h3>🔑 Key Metrics</h3>
                                <table className="bess-result-table">
                                    <tbody>
                                        <ResultRow label="Total DC Energy" value={o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'} />
                                        <ResultRow label="Total DC Energy (MWh)" value={o ? fmt(o.sysOut.totalDCEnergyMWh, 4) + ' MWh' : '--'} />
                                        <ResultRow label="Delivered AC Energy" value={o ? fmt(o.sysOut.deliveredACEnergy, 1) + ' kWh' : '--'} />
                                        <ResultRow label="Total Racks" value={o ? fmtInt(o.sysOut.numberOfRacks) : '--'} />
                                        <ResultRow label="Total Modules" value={o ? fmtInt(o.sysOut.totalModules) : '--'} />
                                        <ResultRow label="Total Cells" value={o ? fmtInt(o.sysOut.totalCells) : '--'} />
                                        <ResultRow label="Cost per kWh" value={o ? fc(o.summary.costPerKWh) : '--'} highlight />
                                        <ResultRow label="Cost per kW" value={o ? fc(o.summary.costPerKW) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>

                            {/* Cost Roll-Up */}
                            <div className="bess-results-card">
                                <h3>🏭 Cost Roll-Up</h3>
                                <table className="bess-result-table">
                                    <thead><tr><th style={{ textAlign: 'left' }}>Level</th><th>Cost</th></tr></thead>
                                    <tbody>
                                        <ResultRow label="Per Module" value={o ? fc(o.modOut.totalModuleCost) : '--'} />
                                        <ResultRow label="Per Rack" value={o ? fc(o.packOut.totalRackCost) : '--'} />
                                        <ResultRow label={`All Racks (${o ? o.sysOut.numberOfRacks : '-'})`} value={o ? fc(o.sysOut.totalRacksCost) : '--'} />
                                        <ResultRow label="System (Battery)" value={o ? fc(o.sysOut.totalBatterySystemCost) : '--'} />
                                        <ResultRow label="BOP" value={o ? fc(o.bopOut.totalBOPCost) : '--'} />
                                        <ResultRow label="Grand Total" value={o ? fc(o.summary.totalSystemCost) : '--'} highlight />
                                    </tbody>
                                </table>
                            </div>

                            {/* System-level BOM Totals */}
                            <div className="bess-results-card bess-summary-wide">
                                <h3>📦 Bill of Quantities — Entire System</h3>
                                <table className="bess-result-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>Item</th>
                                            <th style={{ textAlign: 'right' }}>Qty / Unit</th>
                                            <th style={{ textAlign: 'right' }}>Units</th>
                                            <th style={{ textAlign: 'right' }}>Total Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {o && <>
                                            <tr><td>LFP Cells</td><td style={{ textAlign: 'right' }}>{inputs.cellsPerModule}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.cells)}</strong></td></tr>
                                            <tr><td>Modules</td><td style={{ textAlign: 'right' }}>{inputs.modulesPerRack}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.modules)}</strong></td></tr>
                                            <tr><td>Racks</td><td style={{ textAlign: 'right' }}>—</td><td style={{ textAlign: 'right' }}>—</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.racks)}</strong></td></tr>
                                            <tr><td>Busbars</td><td style={{ textAlign: 'right' }}>{inputs.busbarQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.busbars)}</strong></td></tr>
                                            <tr><td>Housings</td><td style={{ textAlign: 'right' }}>{inputs.housingQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.housings)}</strong></td></tr>
                                            <tr><td>CSC</td><td style={{ textAlign: 'right' }}>{inputs.cscQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.cscs)}</strong></td></tr>
                                            <tr><td>Connectors</td><td style={{ textAlign: 'right' }}>{inputs.connectorsQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.connectors)}</strong></td></tr>
                                            <tr><td>Cell Adaptors</td><td style={{ textAlign: 'right' }}>{inputs.cellAdaptorQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.totalModules)} modules</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.cellAdaptors)}</strong></td></tr>
                                            <tr><td>Contactors</td><td style={{ textAlign: 'right' }}>{inputs.contactorQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.contactors)}</strong></td></tr>
                                            <tr><td>Pack Monitors</td><td style={{ textAlign: 'right' }}>{inputs.packMonitorQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.packMonitors)}</strong></td></tr>
                                            <tr><td>BMS Controllers</td><td style={{ textAlign: 'right' }}>{inputs.bmsControllerQty}</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.bmsControllers)}</strong></td></tr>
                                            <tr><td>Cable – Red</td><td style={{ textAlign: 'right' }}>{inputs.cableLengthPerRack} m</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.cableRedMetres)} m</strong></td></tr>
                                            <tr><td>Cable – Black</td><td style={{ textAlign: 'right' }}>{inputs.cableLengthPerRack} m</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.cableBlackMetres)} m</strong></td></tr>
                                            <tr><td>Daisy Chain Cable</td><td style={{ textAlign: 'right' }}>{inputs.daisyChainCableLengthPerRack} m</td><td style={{ textAlign: 'right' }}>{fmtInt(o.sysOut.numberOfRacks)} racks</td><td style={{ textAlign: 'right' }}><strong>{fmtInt(o.sysOut.bomTotals.daisyChainCableMetres)} m</strong></td></tr>
                                        </>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
