'use client';

function NumInput({ id, label, value, unit, onChange, step, min, max }) {
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
                    value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                />
                <span className="unit">{unit}</span>
            </div>
        </div>
    );
}

export default function HandbookSidebar({ inputs, onInputChange, onReset }) {
    const c = (key) => (val) => onInputChange(key, val);

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
                    <h1>BESS Calculator</h1>
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
                            <label htmlFor="hb-cellChemistry">Chemistry</label>
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
                        <NumInput id="hb-cellVoltage" label="Nominal Voltage" value={inputs.cellVoltage} unit="V" step={0.1} min={0.1} onChange={c('cellVoltage')} />
                        <NumInput id="hb-cellCapacity" label="Cell Capacity" value={inputs.cellCapacity} unit="Ah" step={1} min={1} onChange={c('cellCapacity')} />
                        <NumInput id="hb-cellMaxVoltage" label="Max Voltage" value={inputs.cellMaxVoltage} unit="V" step={0.01} min={0.1} onChange={c('cellMaxVoltage')} />
                        <NumInput id="hb-cellMinVoltage" label="Min Voltage" value={inputs.cellMinVoltage} unit="V" step={0.01} min={0.1} onChange={c('cellMinVoltage')} />
                    </div>
                </details>

                {/* Module Topology */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🧩</span> Module Topology</summary>
                    <div className="param-grid">
                        <NumInput id="hb-seriesCells" label="Series Cells" value={inputs.seriesCells} unit="cells" step={1} min={1} onChange={c('seriesCells')} />
                        <NumInput id="hb-parallelCells" label="Parallel Cells" value={inputs.parallelCells} unit="cells" step={1} min={1} onChange={c('parallelCells')} />
                    </div>
                </details>

                {/* System Topology */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🏗️</span> System Topology</summary>
                    <div className="param-grid">
                        <NumInput id="hb-seriesModules" label="Series Modules" value={inputs.seriesModules} unit="modules" step={1} min={1} onChange={c('seriesModules')} />
                        <NumInput id="hb-parallelModules" label="Parallel Modules" value={inputs.parallelModules} unit="modules" step={1} min={1} onChange={c('parallelModules')} />
                    </div>
                </details>

                {/* Targets & Performance */}
                <details className="param-group" open>
                    <summary><span className="group-icon">🎯</span> Targets &amp; Performance</summary>
                    <div className="param-grid">
                        <NumInput id="hb-targetEnergy" label="Target Energy" value={inputs.targetEnergy} unit="kWh" step={1} min={1} onChange={c('targetEnergy')} />
                        <NumInput id="hb-targetRackEnergy" label="Target Rack Energy" value={inputs.targetRackEnergy} unit="kWh" step={1} min={1} onChange={c('targetRackEnergy')} />
                        <NumInput id="hb-dod" label="Depth of Discharge" value={inputs.dod} unit="0-1" step={0.01} min={0.01} max={1} onChange={c('dod')} />
                        <NumInput id="hb-cRate" label="C-Rate" value={inputs.cRate} unit="C" step={0.1} min={0.1} onChange={c('cRate')} />
                        <NumInput id="hb-efficiency" label="Round-Trip Efficiency" value={inputs.efficiency} unit="0-1" step={0.01} min={0.5} max={1} onChange={c('efficiency')} />
                    </div>
                </details>

                {/* BMS & Protection */}
                <details className="param-group">
                    <summary><span className="group-icon">🛡️</span> BMS &amp; Protection</summary>
                    <div className="param-grid">
                        <NumInput id="hb-cellsPerIC" label="Cells per IC" value={inputs.cellsPerIC} unit="cells" step={1} min={1} onChange={c('cellsPerIC')} />
                        <NumInput id="hb-maxICPerChain" label="Max IC per Chain" value={inputs.maxICPerChain} unit="ICs" step={1} min={1} onChange={c('maxICPerChain')} />
                        <NumInput id="hb-protectionMargin" label="Protection Margin" value={inputs.protectionMargin} unit="%" step={1} min={100} onChange={c('protectionMargin')} />
                        <NumInput id="hb-peakMultiplier" label="Peak Multiplier" value={inputs.peakMultiplier} unit="x" step={0.1} min={1} onChange={c('peakMultiplier')} />
                        <NumInput id="hb-packResistanceMilliOhm" label="Pack Resistance" value={inputs.packResistanceMilliOhm} unit="mΩ" step={1} min={1} onChange={c('packResistanceMilliOhm')} />
                    </div>
                </details>
            </div>
        </aside>
    );
}
