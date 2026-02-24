'use client';

import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { ALL_DEFAULTS, calculateAll } from '@/lib/handbook-engine';
import { useCurrency } from '@/lib/CurrencyContext';
import { getCurrencyInfo, getExchangeRate } from '@/lib/currency';
import { fmtCurrency } from '@/lib/formatters';

const STORAGE_KEY = 'bess-sizing-inputs-v4';

function saveInputs(inputs: any) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch { }
}
function loadInputs(): any | null {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function fmt(n: number | null | undefined, digits = 1): string {
    if (n == null || isNaN(n)) return '--';
    return n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtInt(n: number | null | undefined): string {
    if (n == null || isNaN(n)) return '--';
    return Math.round(n).toLocaleString('en-IN');
}

/* ── NumInput ───────────────────────────────────────────────── */
const NumInput = memo(function NumInput({ id, label, value, unit, onChange, step, min, max, displayRate }:
    { id: string; label: string; value: number; unit: string; onChange: (v: number) => void; step?: number; min?: number; max?: number; displayRate?: number }) {
    const r = displayRate || 1;
    const formatValue = useCallback((v: number) => {
        const rounded = Math.round(v * r * 100) / 100;
        return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
    }, [r]);
    const [text, setText] = useState(formatValue(value));
    const timer = useRef<any>(null);
    useEffect(() => { setText(formatValue(value)); }, [value, formatValue]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const commit = () => { const p = parseFloat(text); if (!isNaN(p)) onChange(p / r); else { onChange(0); setText('0'); } };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value; setText(t); clearTimeout(timer.current);
        const p = parseFloat(t); if (!isNaN(p)) timer.current = setTimeout(() => onChange(p / r), 300);
    };
    return (
        <div className="bess-field">
            <label htmlFor={id}>{label}</label>
            <div className="bess-field-row">
                <input id={id} type="number" step={step || 1} min={min} max={max} value={text}
                    onChange={handleChange} onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    onWheel={e => (e.target as HTMLInputElement).blur()} />
                <span className="bess-unit">{unit}</span>
            </div>
        </div>
    );
});

/* ── CellInput ──────────────────────────────────────────────── */
const CellInput = memo(function CellInput({ value, onChange, step, min, displayRate }:
    { value: number; onChange: (v: number) => void; step?: number; min?: number; displayRate?: number }) {
    const r = displayRate || 1;
    const formatValue = useCallback((v: number) => {
        const rounded = Math.round(v * r * 100) / 100;
        return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
    }, [r]);
    const [text, setText] = useState(formatValue(value));
    const timer = useRef<any>(null);
    useEffect(() => { setText(formatValue(value)); }, [value, formatValue]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const commit = () => { const p = parseFloat(text); if (!isNaN(p)) onChange(p / r); else { onChange(0); setText('0'); } };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value; setText(t); clearTimeout(timer.current);
        const p = parseFloat(t); if (!isNaN(p)) timer.current = setTimeout(() => onChange(p / r), 300);
    };
    return (
        <input className="bom-cell-input" type="number" step={step || 1} min={min} value={text}
            onChange={handleChange} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            onWheel={e => (e.target as HTMLInputElement).blur()} />
    );
});

/* ── Metric Row ─────────────────────────────────────────────── */
const MRow = memo(function MRow({ label, value, cls, total }: { label: string; value: string; cls?: string; total?: boolean }) {
    return (
        <div className={`metric-row${total ? ' total' : ''}`}>
            <span className="metric-label">{label}</span>
            <span className={`metric-val ${cls || ''}`}>{value}</span>
        </div>
    );
});

/* ── Section Card ───────────────────────────────────────────── */
const SCard = memo(function SCard({ title, children, detail, onEdit }:
    { title: string; children: React.ReactNode; detail?: React.ReactNode; onEdit?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="s-card">
            <div className="s-card-head">
                <span className="s-card-title">{title}</span>
                <div className="s-card-actions">
                    {onEdit && <button className="s-card-btn" title="Edit" onClick={onEdit}>✏️</button>}
                    {detail && <button className="s-card-btn" title={open ? 'Collapse' : 'Details'} onClick={() => setOpen(p => !p)}
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</button>}
                </div>
            </div>
            <div className="s-card-body">{children}</div>
            {detail && <div className={`s-expand${open ? ' open' : ''}`}><div className="s-expand-inner">{detail}</div></div>}
        </div>
    );
});

/* ── Edit Modal ─────────────────────────────────────────────── */
const EditModal = memo(function EditModal({ title, left, right, onClose }:
    { title: string; left: React.ReactNode; right: React.ReactNode; onClose: () => void }) {
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <div className="edit-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="edit-panel">
                <div className="edit-left">
                    <div className="edit-left-head"><h3>{title} — Inputs</h3></div>
                    <div className="edit-left-scroll">{left}</div>
                </div>
                <div className="edit-right">
                    <div className="edit-right-head"><h3>Live Preview</h3><button className="btn-close" onClick={onClose}>✕ Close</button></div>
                    <div className="edit-right-scroll">{right}</div>
                </div>
            </div>
        </div>
    );
});

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function HandbookSection() {
    const [inputs, setInputs] = useState({ ...ALL_DEFAULTS });
    const [outputs, setOutputs] = useState<ReturnType<typeof calculateAll> | null>(null);
    const [editSection, setEditSection] = useState<string | null>(null);
    const recalcTimerRef = useRef<any>(null);
    const inputsRef = useRef(inputs);

    const { selectedCurrency } = useCurrency();
    const cInfo = useMemo(() => getCurrencyInfo(selectedCurrency), [selectedCurrency]);
    const sym = cInfo?.symbol || '$';
    const [bessRate, setBessRate] = useState<number>(1);

    useEffect(() => {
        if (selectedCurrency === 'USD') { setBessRate(1); return; }
        let cancelled = false;
        getExchangeRate('USD', selectedCurrency)
            .then(rate => { if (!cancelled) setBessRate(rate); })
            .catch(() => { if (!cancelled) setBessRate(1); });
        return () => { cancelled = true; };
    }, [selectedCurrency]);

    const fc = useCallback((v: number) => fmtCurrency(v, sym, bessRate), [sym, bessRate]);

    useEffect(() => {
        const saved = loadInputs();
        const merged = saved ? { ...ALL_DEFAULTS, ...saved } : { ...ALL_DEFAULTS };
        setInputs(merged);
        inputsRef.current = merged;
        setOutputs(calculateAll(merged));
    }, []);

    // Cleanup timer on unmount
    useEffect(() => () => clearTimeout(recalcTimerRef.current), []);

    const recalc = useCallback((cur: typeof ALL_DEFAULTS) => {
        saveInputs(cur);
        setOutputs(calculateAll(cur));
    }, []);

    const set = useCallback((key: string, val: number | string) => {
        setInputs(prev => {
            const next = { ...prev, [key]: val };
            inputsRef.current = next;
            // Debounced recalculation using ref to avoid stale closures
            clearTimeout(recalcTimerRef.current);
            recalcTimerRef.current = setTimeout(() => recalc(inputsRef.current as any), 120);
            return next;
        });
    }, [recalc]);

    const c = useCallback((key: string) => (val: number) => set(key, val), [set]);

    const handleReset = useCallback(() => {
        const d = { ...ALL_DEFAULTS };
        setInputs(d);
        inputsRef.current = d;
        localStorage.removeItem(STORAGE_KEY);
        recalc(d);
    }, [recalc]);

    const o = outputs;

    return (
        <main className="bess-layout">
            {/* ═══ STICKY KPI HEADER ═══ */}
            <header className="bess-kpi-header">
                <div className="bess-kpi-inner">
                    <div className="bess-kpi-item">
                        <span className="bess-kpi-label">System Power</span>
                        <span className="bess-kpi-val">{fmt(inputs.systemMW, 1)} MW</span>
                    </div>
                    <div className="bess-kpi-item">
                        <span className="bess-kpi-label">Delivered AC</span>
                        <span className="bess-kpi-val">{o ? fmt(o.sysOut.deliveredACEnergy, 0) + ' kWh' : '--'}</span>
                    </div>
                    <div className="bess-kpi-item">
                        <span className="bess-kpi-label">Total System Cost</span>
                        <span className="bess-kpi-val green">{o ? fc(o.summary.totalSystemCost) : '--'}</span>
                    </div>
                    <div className="bess-kpi-item">
                        <span className="bess-kpi-label">Cost / kWh</span>
                        <span className="bess-kpi-val orange">{o ? fc(o.summary.costPerKWh) : '--'}</span>
                    </div>
                    <div className="bess-kpi-actions">
                        <button className="btn-reset" title="Reset all" onClick={handleReset}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.05 10A6 6 0 1 0 4.2 4.2L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Reset
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══ MAIN CONTENT ═══ */}
            <div className="bess-content">
                <div className="bess-content-inner">

                    {/* ── Row 1: Cell · Module · Rack ── */}
                    <div className="bess-row bess-row-3">
                        {/* CELL */}
                        <SCard title="Cell" onEdit={() => setEditSection('cell')}
                            detail={<>
                                <div className="s-expand-title">Technical Parameters</div>
                                <div className="metric-list">
                                    <MRow label="Depth of Discharge" value={fmt(inputs.dod, 2)} />
                                    <MRow label="Efficiency" value={fmt(inputs.efficiency, 2)} />
                                    <MRow label="End of Life (EOL)" value={fmt(inputs.eol, 2)} />
                                    <MRow label="Degradation Factor" value={fmt(inputs.dod * inputs.efficiency * inputs.eol, 4)} cls="dim" />
                                    <MRow label="Formula" value="Capacity × Voltage" cls="dim" />
                                </div>
                            </>}>
                            <div className="metric-list">
                                <MRow label="Chemistry" value={inputs.cellChemistry} />
                                <MRow label="Capacity" value={fmt(inputs.cellCapacity, 0) + ' Ah'} />
                                <MRow label="Nominal Voltage" value={fmt(inputs.nominalVoltage, 1) + ' V'} />
                                <MRow label="Cell Energy" value={o ? fmt(o.cellOut.cellEnergy, 1) + ' Wh' : '--'} cls="green" />
                                <MRow label="Cell Cost" value={fc(inputs.cellCost)} cls="orange" />
                            </div>
                        </SCard>

                        {/* MODULE */}
                        <SCard title="Module" onEdit={() => setEditSection('module')}
                            detail={<>
                                <div className="s-expand-title">Component Breakdown</div>
                                <table className="s-detail-table"><thead><tr><th>Component</th><th>Total</th></tr></thead><tbody>
                                    {o && o.modOut.items.map((it, i) => <tr key={i}><td>{it.label}</td><td>{fc(it.total)}</td></tr>)}
                                    <tr className="t-total"><td>Total Module Cost</td><td>{o ? fc(o.modOut.totalModuleCost) : '--'}</td></tr>
                                </tbody></table>
                            </>}>
                            <div className="metric-list">
                                <MRow label="Module Voltage" value={o ? fmt(o.modOut.moduleVoltage, 1) + ' V' : '--'} />
                                <MRow label="Module Energy" value={o ? fmt(o.modOut.moduleEnergyKWh, 2) + ' kWh' : '--'} />
                                <MRow label="Cells / Module" value={String(inputs.cellsPerModule)} />
                                <MRow label="Cost / kWh" value={o && o.modOut.moduleEnergyKWh > 0 ? fc(o.modOut.totalModuleCost / o.modOut.moduleEnergyKWh) : '--'} cls="dim" />
                                <MRow label="Total Cost" value={o ? fc(o.modOut.totalModuleCost) : '--'} cls="green" total />
                            </div>
                        </SCard>

                        {/* RACK */}
                        <SCard title="Pack / Rack" onEdit={() => setEditSection('pack')}
                            detail={<>
                                <div className="s-expand-title">Component Breakdown</div>
                                <table className="s-detail-table"><thead><tr><th>Component</th><th>Total</th></tr></thead><tbody>
                                    {o && o.packOut.items.map((it, i) => <tr key={i}><td>{it.label}</td><td>{fc(it.total)}</td></tr>)}
                                    <tr className="t-total"><td>Total Rack Cost</td><td>{o ? fc(o.packOut.totalRackCost) : '--'}</td></tr>
                                </tbody></table>
                            </>}>
                            <div className="metric-list">
                                <MRow label="Rack Voltage" value={o ? fmt(o.packOut.rackVoltage, 1) + ' V' : '--'} />
                                <MRow label="Rack Energy" value={o ? fmt(o.packOut.rackEnergy, 1) + ' kWh' : '--'} />
                                <MRow label="Modules / Rack" value={String(inputs.modulesPerRack)} />
                                <MRow label="BMS + Cables" value={o ? fc(o.packOut.daisyChainCableCost + inputs.bmsControllerQty * inputs.bmsControllerCost) : '--'} cls="dim" />
                                <MRow label="Total Rack Cost" value={o ? fc(o.packOut.totalRackCost) : '--'} cls="green" total />
                            </div>
                        </SCard>
                    </div>

                    {/* ── Row 2: System (wide) + BOP ── */}
                    <div className="bess-row bess-row-8-4">
                        {/* SYSTEM */}
                        <SCard title="System Overview" onEdit={() => setEditSection('system')}
                            detail={<>
                                <div className="s-expand-title">Energy Calculation Logic</div>
                                <div className="metric-list">
                                    <MRow label="Required AC Energy" value={o ? fmt(o.sysOut.requiredACEnergy, 1) + ' kWh' : '--'} />
                                    <MRow label="Gross DC Energy Req." value={o ? fmt(o.sysOut.grossDCEnergy, 1) + ' kWh' : '--'} />
                                    <MRow label="Total DC (MWh)" value={o ? fmt(o.sysOut.totalDCEnergyMWh, 4) + ' MWh' : '--'} />
                                </div>
                                <div className="s-expand-title" style={{ marginTop: 16 }}>PCS Cost Breakdown</div>
                                <table className="s-detail-table"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>
                                    <tr><td>Total Racks Cost ({o ? o.sysOut.numberOfRacks : '-'} racks)</td><td>{o ? fc(o.sysOut.totalRacksCost) : '--'}</td></tr>
                                    <tr><td>Master BMS</td><td>{fc(inputs.masterBMSCost)}</td></tr>
                                    <tr><td>BMS Housing</td><td>{fc(inputs.bmsHousingCost)}</td></tr>
                                    <tr><td>Safety Systems</td><td>{fc(inputs.safetySystemsCost)}</td></tr>
                                    <tr><td>PCS ({inputs.systemMW} MW)</td><td>{o ? fc(o.sysOut.pcsCostTotal) : '--'}</td></tr>
                                    <tr className="t-total"><td>Total Battery System</td><td>{o ? fc(o.sysOut.totalBatterySystemCost) : '--'}</td></tr>
                                </tbody></table>
                            </>}>
                            <div className="metric-list">
                                <MRow label="System Power" value={fmt(inputs.systemMW, 1) + ' MW'} />
                                <MRow label="Duration" value={o ? fmt(o.sysOut.duration, 2) + ' h' : '--'} />
                                <MRow label="Total DC Energy" value={o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'} cls="green" />
                                <MRow label="Delivered AC Energy" value={o ? fmt(o.sysOut.deliveredACEnergy, 1) + ' kWh' : '--'} />
                                <MRow label="Total Racks" value={o ? fmtInt(o.sysOut.numberOfRacks) + ' racks' : '--'} />
                                <MRow label="Total Cells" value={o ? fmtInt(o.sysOut.totalCells) : '--'} cls="dim" />
                                <MRow label="Total Modules" value={o ? fmtInt(o.sysOut.totalModules) : '--'} cls="dim" />
                                <MRow label="Battery System Cost" value={o ? fc(o.sysOut.totalBatterySystemCost) : '--'} cls="green" total />
                            </div>
                        </SCard>

                        {/* BOP */}
                        <SCard title="Balance of Plant" onEdit={() => setEditSection('bop')}>
                            <div className="metric-list">
                                <MRow label="Civil Works" value={fc(inputs.civilWorks)} />
                                <MRow label="AC Cabling" value={fc(inputs.acCabling)} />
                                <MRow label="Earthing" value={fc(inputs.earthing)} />
                                <MRow label="Installation Labour" value={fc(inputs.installationLabour)} />
                                <MRow label="Communication" value={fc(inputs.communication)} />
                                <MRow label="Total BOP Cost" value={o ? fc(o.bopOut.totalBOPCost) : '--'} cls="green" total />
                            </div>
                        </SCard>
                    </div>

                    {/* ── Row 3: Cost Summary (full width, premium) ── */}
                    <div className="bess-row bess-row-1">
                        <div className="cost-summary-card">
                            <div className="cost-summary-head">
                                <h2>Cost Summary</h2>
                            </div>
                            <div className="cost-summary-body">
                                <div className="cost-col">
                                    <MRow label="Battery System Cost" value={o ? fc(o.sysOut.totalBatterySystemCost) : '--'} />
                                    <MRow label="BOP Cost" value={o ? fc(o.bopOut.totalBOPCost) : '--'} />
                                    <div className="cost-grand">
                                        <MRow label="Grand Total" value={o ? fc(o.summary.totalSystemCost) : '--'} cls="green" />
                                    </div>
                                </div>
                                <div className="cost-summary-divider" />
                                <div className="cost-col">
                                    <MRow label="Cost / kWh" value={o ? fc(o.summary.costPerKWh) : '--'} cls="orange" />
                                    <MRow label="Cost / kW" value={o ? fc(o.summary.costPerKW) : '--'} />
                                    <MRow label="Total DC Energy" value={o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'} cls="dim" />
                                    <MRow label="Total Racks" value={o ? fmtInt(o.sysOut.numberOfRacks) : '--'} cls="dim" />
                                    <MRow label="Total Modules" value={o ? fmtInt(o.sysOut.totalModules) : '--'} cls="dim" />
                                    <MRow label="Total Cells" value={o ? fmtInt(o.sysOut.totalCells) : '--'} cls="dim" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ═══ EDIT MODALS ═══ */}
            {editSection === 'cell' && (
                <EditModal title="Cell" onClose={() => setEditSection(null)}
                    left={<>
                        <div className="bess-field"><label htmlFor="hb-chem">Cell Chemistry</label>
                            <div className="bess-field-row"><select id="hb-chem" value={inputs.cellChemistry} onChange={e => set('cellChemistry', e.target.value)}>
                                <option value="LFP">LFP</option><option value="NMC">NMC</option><option value="NCA">NCA</option><option value="LTO">LTO</option>
                            </select></div>
                        </div>
                        <NumInput id="e-cap" label="Cell Capacity" value={inputs.cellCapacity} unit="Ah" step={1} min={1} onChange={c('cellCapacity')} />
                        <NumInput id="e-volt" label="Nominal Voltage" value={inputs.nominalVoltage} unit="V" step={0.1} min={0.1} onChange={c('nominalVoltage')} />
                        <NumInput id="e-cost" label="Cell Cost" value={inputs.cellCost} unit={sym} step={100} min={0} onChange={c('cellCost')} displayRate={bessRate} />
                        <NumInput id="e-dod" label="Depth of Discharge" value={inputs.dod} unit="(0-1)" step={0.01} min={0.01} max={1} onChange={c('dod')} />
                        <NumInput id="e-eff" label="Efficiency" value={inputs.efficiency} unit="(0-1)" step={0.01} min={0.5} max={1} onChange={c('efficiency')} />
                        <NumInput id="e-eol" label="End of Life (EOL)" value={inputs.eol} unit="(0-1)" step={0.01} min={0.1} max={1} onChange={c('eol')} />
                    </>}
                    right={<>
                        <div className="live-section"><h4>Calculated Results</h4>
                            <div className="metric-list">
                                <MRow label="Chemistry" value={inputs.cellChemistry} />
                                <MRow label="Cell Energy" value={o ? fmt(o.cellOut.cellEnergy, 1) + ' Wh' : '--'} cls="green" />
                                <MRow label="Cell Energy (kWh)" value={o ? fmt(o.cellOut.cellEnergyKWh, 4) + ' kWh' : '--'} />
                                <MRow label="Cell Cost" value={fc(inputs.cellCost)} cls="orange" />
                                <MRow label="DOD" value={fmt(inputs.dod, 2)} />
                                <MRow label="Efficiency" value={fmt(inputs.efficiency, 2)} />
                                <MRow label="EOL" value={fmt(inputs.eol, 2)} />
                                <MRow label="Degradation Factor" value={fmt(inputs.dod * inputs.efficiency * inputs.eol, 4)} cls="dim" />
                            </div>
                        </div>
                    </>}
                />
            )}

            {editSection === 'module' && (
                <EditModal title="Module" onClose={() => setEditSection(null)}
                    left={
                        <table className="bom-table"><thead><tr><th className="bom-col-item">Component</th><th className="bom-col-qty">Qty</th><th className="bom-col-price">Rate ({sym})</th></tr></thead><tbody>
                            <tr><td>LFP Cells</td><td className="bom-td-qty"><CellInput value={inputs.cellsPerModule} onChange={c('cellsPerModule')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cellCost} onChange={c('cellCost')} step={100} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Housing</td><td className="bom-td-qty"><CellInput value={inputs.housingQty} onChange={c('housingQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.housingCost} onChange={c('housingCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Busbar</td><td className="bom-td-qty"><CellInput value={inputs.busbarQty} onChange={c('busbarQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.busbarCost} onChange={c('busbarCost')} step={10} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>CSC</td><td className="bom-td-qty"><CellInput value={inputs.cscQty} onChange={c('cscQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cscCost} onChange={c('cscCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Connectors</td><td className="bom-td-qty"><CellInput value={inputs.connectorsQty} onChange={c('connectorsQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.connectorsCost} onChange={c('connectorsCost')} step={10} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Insulation</td><td className="bom-td-qty"><CellInput value={inputs.insulationQty} onChange={c('insulationQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.insulationCost} onChange={c('insulationCost')} step={50} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Fasteners</td><td className="bom-td-qty"><CellInput value={inputs.fastenersQty} onChange={c('fastenersQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.fastenersCost} onChange={c('fastenersCost')} step={50} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Cell Adaptor</td><td className="bom-td-qty"><CellInput value={inputs.cellAdaptorQty} onChange={c('cellAdaptorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.cellAdaptorCost} onChange={c('cellAdaptorCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Labour</td><td className="bom-td-qty"><CellInput value={inputs.labourQty} onChange={c('labourQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.labourCost} onChange={c('labourCost')} step={50} min={0} displayRate={bessRate} /></td></tr>
                        </tbody></table>
                    }
                    right={<>
                        <div className="live-section"><h4>Module Specs</h4>
                            <div className="metric-list">
                                <MRow label="Module Voltage" value={o ? fmt(o.modOut.moduleVoltage, 1) + ' V' : '--'} />
                                <MRow label="Module Energy" value={o ? fmt(o.modOut.moduleEnergyKWh, 2) + ' kWh' : '--'} />
                                <MRow label="Total Module Cost" value={o ? fc(o.modOut.totalModuleCost) : '--'} cls="green" total />
                            </div>
                        </div>
                        <div className="live-section"><h4>Cost Breakdown</h4>
                            <table className="s-detail-table"><thead><tr><th>Component</th><th>Total</th></tr></thead><tbody>
                                {o && o.modOut.items.map((it, i) => <tr key={i}><td>{it.label}</td><td>{fc(it.total)}</td></tr>)}
                                <tr className="t-total"><td>Total</td><td>{o ? fc(o.modOut.totalModuleCost) : '--'}</td></tr>
                            </tbody></table>
                        </div>
                    </>}
                />
            )}

            {editSection === 'pack' && (
                <EditModal title="Pack / Rack" onClose={() => setEditSection(null)}
                    left={<>
                        <NumInput id="ep-mod" label="Modules per Rack" value={inputs.modulesPerRack} unit="modules" step={1} min={1} onChange={c('modulesPerRack')} />
                        <table className="bom-table"><thead><tr><th className="bom-col-item">Component</th><th className="bom-col-qty">Qty</th><th className="bom-col-price">Rate ({sym})</th></tr></thead><tbody>
                            <tr><td>Rack Frame</td><td className="bom-td-qty"><CellInput value={inputs.rackFrameQty} onChange={c('rackFrameQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.rackFrameCost} onChange={c('rackFrameCost')} step={5000} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Pack Monitor</td><td className="bom-td-qty"><CellInput value={inputs.packMonitorQty} onChange={c('packMonitorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.packMonitorCost} onChange={c('packMonitorCost')} step={1000} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Contactors</td><td className="bom-td-qty"><CellInput value={inputs.contactorQty} onChange={c('contactorQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.contactorCost} onChange={c('contactorCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>DC Breaker</td><td className="bom-td-qty"><CellInput value={inputs.dcBreakerQty} onChange={c('dcBreakerQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.dcBreakerCost} onChange={c('dcBreakerCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>DC Fuse</td><td className="bom-td-qty"><CellInput value={inputs.dcFuseQty} onChange={c('dcFuseQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.dcFuseCost} onChange={c('dcFuseCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Mounting Rails</td><td className="bom-td-qty"><CellInput value={inputs.mountingRailsQty} onChange={c('mountingRailsQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.mountingRailsCost} onChange={c('mountingRailsCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Rack Labour</td><td className="bom-td-qty"><CellInput value={inputs.rackLabourQty} onChange={c('rackLabourQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.rackLabourCost} onChange={c('rackLabourCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Cable – Red</td><td className="bom-td-qty"><CellInput value={inputs.cableLengthPerRack} onChange={c('cableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.cableRedPricePerM} onChange={c('cableRedPricePerM')} step={10} min={0} displayRate={bessRate} /><span className="bom-unit-hint">/m</span></td></tr>
                            <tr><td>Cable – Black</td><td className="bom-td-qty"><CellInput value={inputs.cableLengthPerRack} onChange={c('cableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.cableBlackPricePerM} onChange={c('cableBlackPricePerM')} step={10} min={0} displayRate={bessRate} /><span className="bom-unit-hint">/m</span></td></tr>
                            <tr><td>BMS Controller</td><td className="bom-td-qty"><CellInput value={inputs.bmsControllerQty} onChange={c('bmsControllerQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.bmsControllerCost} onChange={c('bmsControllerCost')} step={1000} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Daisy Chain Conv.</td><td className="bom-td-qty"><CellInput value={inputs.daisyChainConverterQty} onChange={c('daisyChainConverterQty')} step={1} min={1} /></td><td className="bom-td-price"><CellInput value={inputs.daisyChainConverterCost} onChange={c('daisyChainConverterCost')} step={500} min={0} displayRate={bessRate} /></td></tr>
                            <tr><td>Daisy Chain Cable</td><td className="bom-td-qty"><CellInput value={inputs.daisyChainCableLengthPerRack} onChange={c('daisyChainCableLengthPerRack')} step={1} min={0} /><span className="bom-unit-hint">m</span></td><td className="bom-td-price"><CellInput value={inputs.daisyChainCableCostPerM} onChange={c('daisyChainCableCostPerM')} step={10} min={0} displayRate={bessRate} /><span className="bom-unit-hint">/m</span></td></tr>
                        </tbody></table>
                    </>}
                    right={<>
                        <div className="live-section"><h4>Rack Specs</h4>
                            <div className="metric-list">
                                <MRow label="Rack Voltage" value={o ? fmt(o.packOut.rackVoltage, 1) + ' V' : '--'} />
                                <MRow label="Rack Energy" value={o ? fmt(o.packOut.rackEnergy, 1) + ' kWh' : '--'} />
                                <MRow label="Total Rack Cost" value={o ? fc(o.packOut.totalRackCost) : '--'} cls="green" total />
                            </div>
                        </div>
                        <div className="live-section"><h4>Cost Breakdown</h4>
                            <table className="s-detail-table"><thead><tr><th>Component</th><th>Total</th></tr></thead><tbody>
                                {o && o.packOut.items.map((it, i) => <tr key={i}><td>{it.label}</td><td>{fc(it.total)}</td></tr>)}
                                <tr className="t-total"><td>Total Rack Cost</td><td>{o ? fc(o.packOut.totalRackCost) : '--'}</td></tr>
                            </tbody></table>
                        </div>
                    </>}
                />
            )}

            {editSection === 'system' && (
                <EditModal title="System" onClose={() => setEditSection(null)}
                    left={<>
                        <NumInput id="es-mw" label="System Power (AC)" value={inputs.systemMW} unit="MW" step={0.1} min={0.1} onChange={c('systemMW')} />
                        <NumInput id="es-cr" label="C-Rate" value={inputs.cRate} unit="C" step={0.1} min={0.1} onChange={c('cRate')} />
                        <NumInput id="es-bms" label="Master BMS Cost" value={inputs.masterBMSCost} unit={sym} step={10000} min={0} onChange={c('masterBMSCost')} displayRate={bessRate} />
                        <NumInput id="es-bmsh" label="BMS Housing Cost" value={inputs.bmsHousingCost} unit={sym} step={1000} min={0} onChange={c('bmsHousingCost')} displayRate={bessRate} />
                        <NumInput id="es-safe" label="Safety Systems" value={inputs.safetySystemsCost} unit={sym} step={10000} min={0} onChange={c('safetySystemsCost')} displayRate={bessRate} />
                        <NumInput id="es-pcs" label="PCS Cost (per MW)" value={inputs.pcsCost} unit={`${sym}/MW`} step={10000} min={0} onChange={c('pcsCost')} displayRate={bessRate} />
                    </>}
                    right={<>
                        <div className="live-section"><h4>System Overview</h4>
                            <div className="metric-list">
                                <MRow label="Duration" value={o ? fmt(o.sysOut.duration, 2) + ' h' : '--'} />
                                <MRow label="Total DC Energy" value={o ? fmt(o.sysOut.totalDCEnergy, 1) + ' kWh' : '--'} cls="green" />
                                <MRow label="Delivered AC" value={o ? fmt(o.sysOut.deliveredACEnergy, 1) + ' kWh' : '--'} />
                                <MRow label="Total Racks" value={o ? fmtInt(o.sysOut.numberOfRacks) : '--'} />
                                <MRow label="Total Cells" value={o ? fmtInt(o.sysOut.totalCells) : '--'} cls="dim" />
                            </div>
                        </div>
                        <div className="live-section"><h4>Cost Breakdown</h4>
                            <table className="s-detail-table"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>
                                <tr><td>Racks ({o ? o.sysOut.numberOfRacks : '-'})</td><td>{o ? fc(o.sysOut.totalRacksCost) : '--'}</td></tr>
                                <tr><td>Master BMS</td><td>{fc(inputs.masterBMSCost)}</td></tr>
                                <tr><td>BMS Housing</td><td>{fc(inputs.bmsHousingCost)}</td></tr>
                                <tr><td>Safety Systems</td><td>{fc(inputs.safetySystemsCost)}</td></tr>
                                <tr><td>PCS ({inputs.systemMW} MW)</td><td>{o ? fc(o.sysOut.pcsCostTotal) : '--'}</td></tr>
                                <tr className="t-total"><td>Total Battery System</td><td>{o ? fc(o.sysOut.totalBatterySystemCost) : '--'}</td></tr>
                            </tbody></table>
                        </div>
                    </>}
                />
            )}

            {editSection === 'bop' && (
                <EditModal title="Balance of Plant" onClose={() => setEditSection(null)}
                    left={<>
                        <NumInput id="eb-civ" label="Civil Works" value={inputs.civilWorks} unit={sym} step={50000} min={0} onChange={c('civilWorks')} displayRate={bessRate} />
                        <NumInput id="eb-cab" label="AC Cabling" value={inputs.acCabling} unit={sym} step={10000} min={0} onChange={c('acCabling')} displayRate={bessRate} />
                        <NumInput id="eb-ear" label="Earthing" value={inputs.earthing} unit={sym} step={10000} min={0} onChange={c('earthing')} displayRate={bessRate} />
                        <NumInput id="eb-lab" label="Installation Labour" value={inputs.installationLabour} unit={sym} step={10000} min={0} onChange={c('installationLabour')} displayRate={bessRate} />
                        <NumInput id="eb-com" label="Communication" value={inputs.communication} unit={sym} step={10000} min={0} onChange={c('communication')} displayRate={bessRate} />
                    </>}
                    right={
                        <div className="live-section"><h4>BOP Cost Breakdown</h4>
                            <div className="metric-list">
                                <MRow label="Civil Works" value={fc(inputs.civilWorks)} />
                                <MRow label="AC Cabling" value={fc(inputs.acCabling)} />
                                <MRow label="Earthing" value={fc(inputs.earthing)} />
                                <MRow label="Installation Labour" value={fc(inputs.installationLabour)} />
                                <MRow label="Communication" value={fc(inputs.communication)} />
                                <MRow label="Total BOP" value={o ? fc(o.bopOut.totalBOPCost) : '--'} cls="green" total />
                            </div>
                        </div>
                    }
                />
            )}
        </main>
    );
}
