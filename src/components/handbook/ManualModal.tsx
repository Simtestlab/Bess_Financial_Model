'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';

/* ----------------------------------------------------------------
   MANUAL DATA - All inputs, formulas, descriptions
   Each section mirrors the calculator engine
   ---------------------------------------------------------------- */

interface ManualEntry {
    name: string;
    unit?: string;
    defaultValue?: string;
    formula?: string;
    description: string;
    type: 'input' | 'formula' | 'output';
}

interface ManualSection {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    color: string;
    entries: ManualEntry[];
}

const MANUAL_DATA: ManualSection[] = [
    {
        id: 'cell',
        icon: '\u26A1',
        title: 'Cell Parameters',
        subtitle: 'Individual battery cell specifications',
        color: '#34d399',
        entries: [
            {
                name: 'Cell Chemistry',
                unit: '\u2014',
                defaultValue: 'LFP',
                description: 'Type of lithium-ion battery chemistry. Options: LFP (Lithium Iron Phosphate), NMC (Nickel Manganese Cobalt), NCA (Nickel Cobalt Aluminium), LTO (Lithium Titanate). LFP is preferred for stationary BESS due to longer cycle life and superior thermal stability.',
                type: 'input',
            },
            {
                name: 'Cell Capacity',
                unit: 'Ah',
                defaultValue: '314',
                description: 'The rated ampere-hour capacity of a single cell. This defines how much charge the cell can store. Typical LFP prismatic cells range from 50 Ah to 314 Ah.',
                type: 'input',
            },
            {
                name: 'Nominal Voltage',
                unit: 'V',
                defaultValue: '3.2',
                description: 'The nominal voltage of a single cell under standard conditions. LFP cells are typically 3.2 V, NMC cells are ~3.6\u20133.7 V.',
                type: 'input',
            },
            {
                name: 'Cell Cost',
                unit: '\u20B9 (INR)',
                defaultValue: '4,000',
                description: 'Cost per individual cell. This is the single largest cost driver in a BESS system. All cost inputs are stored in INR and converted to the selected display currency.',
                type: 'input',
            },
            {
                name: 'Depth of Discharge (DoD)',
                unit: '0\u20131',
                defaultValue: '0.90',
                description: 'Fraction of total cell capacity that is usable. A DoD of 0.9 means 90% of the total energy is usable. Higher DoD reduces cycle life but maximizes utilization.',
                type: 'input',
            },
            {
                name: 'Efficiency',
                unit: '0\u20131',
                defaultValue: '0.98',
                description: 'Round-trip energy efficiency of the cell (DC-to-DC). Accounts for losses during charge/discharge. Typical values: 0.95\u20130.98 for LFP.',
                type: 'input',
            },
            {
                name: 'End of Life (EOL)',
                unit: '0\u20131',
                defaultValue: '0.80',
                description: 'The fraction of original capacity remaining when the battery is considered at End-of-Life. EOL of 0.8 means the battery has degraded to 80% of its nameplate capacity.',
                type: 'input',
            },
            {
                name: 'Degradation Factor',
                formula: 'DoD \u00D7 Efficiency \u00D7 EOL',
                description: 'Combined derating factor that converts nameplate capacity to usable end-of-life capacity. Used to size the system with adequate margins.',
                type: 'formula',
            },
            {
                name: 'Cell Energy',
                unit: 'Wh',
                formula: 'Cell Capacity (Ah) \u00D7 Nominal Voltage (V)',
                description: 'Energy stored in a single cell. For a 314 Ah x 3.2 V cell: 1,004.8 Wh = 1.005 kWh.',
                type: 'output',
            },
        ],
    },
    {
        id: 'module',
        icon: '\uD83D\uDD0B',
        title: 'Module Parameters',
        subtitle: 'Battery module assembly (multiple cells)',
        color: '#22d3ee',
        entries: [
            {
                name: 'Cells per Module',
                unit: 'cells',
                defaultValue: '16',
                description: 'Number of cells connected in series within one module. Determines the module voltage. For 16 cells x 3.2 V = 51.2 V per module.',
                type: 'input',
            },
            {
                name: 'Module Voltage',
                unit: 'V',
                formula: 'Cells per Module \u00D7 Nominal Voltage',
                description: 'Total voltage of the module. Cells are connected in series, so voltages add up.',
                type: 'output',
            },
            {
                name: 'Module Energy',
                unit: 'kWh',
                formula: 'Cells per Module \u00D7 Cell Energy / 1000',
                description: 'Total energy capacity of the module in kWh.',
                type: 'output',
            },
            {
                name: 'Mechanical Housing',
                unit: '\u20B9 / unit',
                defaultValue: '5,000',
                description: 'Cost of the enclosure/case that holds all cells in the module. Provides structural support and protection.',
                type: 'input',
            },
            {
                name: 'Busbar',
                unit: '\u20B9 / unit',
                defaultValue: '200',
                description: 'Copper or aluminium busbars connecting cells in series. Quantity is typically cells+1 (17 busbars for 16 cells).',
                type: 'input',
            },
            {
                name: 'CSC (Cell Supervision Circuit)',
                unit: '\u20B9 / unit',
                defaultValue: '3,500',
                description: 'Electronics board that monitors individual cell voltages, temperatures, and balances cells within the module.',
                type: 'input',
            },
            {
                name: 'Connectors',
                unit: '\u20B9 / unit',
                defaultValue: '200',
                description: "Electrical connectors for the module's external power and communication interfaces.",
                type: 'input',
            },
            {
                name: 'Insulation & Spacers',
                unit: '\u20B9 / unit',
                defaultValue: '750',
                description: 'Insulation sheets and spacers between cells for thermal management and electrical isolation.',
                type: 'input',
            },
            {
                name: 'Fasteners & Hardware',
                unit: '\u20B9 / unit',
                defaultValue: '500',
                description: 'Bolts, nuts, brackets, and other mechanical hardware for module assembly.',
                type: 'input',
            },
            {
                name: 'Cell Adaptor',
                unit: '\u20B9 / unit',
                defaultValue: '2,000',
                description: 'Adapter plates or fixtures for mounting cells within the housing.',
                type: 'input',
            },
            {
                name: 'Labour (Assembly)',
                unit: '\u20B9 / unit',
                defaultValue: '250',
                description: 'Cost of manual or semi-automated assembly labour per module. Typically 2 labour units per module.',
                type: 'input',
            },
            {
                name: 'Total Module Cost',
                formula: '\u03A3 (Qty \u00D7 Unit Cost) for all components',
                description: 'Sum of all individual component costs: Cells + Housing + Busbars + CSC + Connectors + Insulation + Fasteners + Cell Adaptor + Labour.',
                type: 'output',
            },
        ],
    },
    {
        id: 'pack',
        icon: '\uD83D\uDCE6',
        title: 'Pack / Rack Parameters',
        subtitle: 'Battery rack containing multiple modules',
        color: '#f59e0b',
        entries: [
            {
                name: 'Modules per Rack',
                unit: 'modules',
                defaultValue: '20',
                description: 'Number of modules stacked into one battery rack (pack). Modules are connected in series to build the rack voltage string.',
                type: 'input',
            },
            {
                name: 'Rack Voltage',
                unit: 'V',
                formula: 'Modules per Rack \u00D7 Module Voltage',
                description: 'Total string voltage of the rack. For 20 modules x 51.2 V = 1,024 V.',
                type: 'output',
            },
            {
                name: 'Rack Energy',
                unit: 'kWh',
                formula: 'Modules per Rack \u00D7 Module Energy (kWh)',
                description: 'Total energy capacity of one rack. This is the building block for system-level sizing.',
                type: 'output',
            },
            {
                name: 'Rack Frame',
                unit: '\u20B9 / unit',
                defaultValue: '75,000',
                description: 'Structural steel frame that holds all modules. Includes mounting brackets and cable management.',
                type: 'input',
            },
            {
                name: 'Pack Monitor',
                unit: '\u20B9 / unit',
                defaultValue: '15,000',
                description: 'Pack-level monitoring unit that aggregates data from all CSCs in the rack and communicates with the Master BMS.',
                type: 'input',
            },
            {
                name: 'Contactors',
                unit: '\u20B9 / unit',
                defaultValue: '3,500',
                description: 'High-voltage DC contactors for connecting/disconnecting the rack from the DC bus. Typically 3 contactors per rack (positive, negative, pre-charge).',
                type: 'input',
            },
            {
                name: 'DC Breaker',
                unit: '\u20B9 / unit',
                defaultValue: '7,500',
                description: 'DC circuit breaker for overcurrent protection at the rack level.',
                type: 'input',
            },
            {
                name: 'DC Fuse',
                unit: '\u20B9 / unit',
                defaultValue: '3,000',
                description: 'Fast-acting fuse for short-circuit protection of the rack string.',
                type: 'input',
            },
            {
                name: 'Mounting Rails & Insulation',
                unit: '\u20B9 / unit',
                defaultValue: '5,000',
                description: 'DIN rails, insulation barriers, and related mounting hardware within the rack.',
                type: 'input',
            },
            {
                name: 'Rack Assembly Labour',
                unit: '\u20B9 / unit',
                defaultValue: '5,000',
                description: 'Cost of assembling all modules, wiring, and components into the rack.',
                type: 'input',
            },
            {
                name: 'Cable \u2013 Red',
                unit: '\u20B9/m',
                defaultValue: '350 (50m per rack)',
                description: 'Positive DC power cable. Priced per metre, with default length of 50m per rack.',
                type: 'input',
            },
            {
                name: 'Cable \u2013 Black',
                unit: '\u20B9/m',
                defaultValue: '350 (50m per rack)',
                description: 'Negative DC power cable. Same length as the red cable for balanced routing.',
                type: 'input',
            },
            {
                name: 'BMS Controller',
                unit: '\u20B9 / unit',
                defaultValue: '40,000',
                description: 'Rack-level BMS controller that manages battery protection, balancing, and thermal management.',
                type: 'input',
            },
            {
                name: 'Daisy Chain Converter',
                unit: '\u20B9 / unit',
                defaultValue: '4,000',
                description: 'Communication converter for daisy-chaining module-level CSCs to the rack BMS controller.',
                type: 'input',
            },
            {
                name: 'Daisy Chain Cable',
                unit: '\u20B9/m',
                defaultValue: '100 (19m per rack)',
                description: 'Communication cable connecting CSC modules in a daisy-chain topology.',
                type: 'input',
            },
            {
                name: 'Total Rack Cost',
                formula: 'Modules Cost + Frame + Monitor + Contactors + Breaker + Fuse + Rails + Labour + Cables + BMS + Daisy Chain',
                description: 'Total assembled cost of one rack, including all modules and rack-level components.',
                type: 'output',
            },
        ],
    },
    {
        id: 'system',
        icon: '\uD83C\uDFED',
        title: 'System Parameters',
        subtitle: 'Full BESS system sizing and costing',
        color: '#a78bfa',
        entries: [
            {
                name: 'System Power (AC)',
                unit: 'MW',
                defaultValue: '2',
                description: 'Target AC power output of the BESS system. This is the grid-side power rating. Combined with C-Rate to determine energy storage duration.',
                type: 'input',
            },
            {
                name: 'C-Rate',
                unit: 'C',
                defaultValue: '1',
                description: 'The rate at which the battery is charged/discharged relative to its capacity. C-Rate of 1 means the battery is fully discharged in 1 hour. C/2 = 0.5 means 2-hour discharge.',
                type: 'input',
            },
            {
                name: 'Duration',
                unit: 'hours',
                formula: '1 / C-Rate',
                description: 'Energy storage duration. A C-Rate of 0.5 gives 2 hours of discharge. This determines how much energy the system needs to store.',
                type: 'output',
            },
            {
                name: 'Required AC Energy',
                unit: 'kWh',
                formula: 'System Power (MW) \u00D7 Duration (h) \u00D7 1000',
                description: 'The amount of AC energy the system must deliver to the grid during one full discharge cycle.',
                type: 'output',
            },
            {
                name: 'Gross DC Energy Required',
                unit: 'kWh',
                formula: 'Required AC Energy / (DoD \u00D7 Efficiency \u00D7 EOL)',
                description: 'The total DC energy that must be installed to account for degradation (EOL), round-trip efficiency losses, and depth-of-discharge limits.',
                type: 'output',
            },
            {
                name: 'Number of Racks',
                unit: 'racks',
                formula: 'ceil( Gross DC Energy / Rack Energy )',
                description: 'Number of battery racks required. Calculated by dividing the gross DC energy needed by the energy per rack, then rounding up to the nearest whole number.',
                type: 'output',
            },
            {
                name: 'Total DC Energy',
                unit: 'kWh',
                formula: 'Number of Racks \u00D7 Rack Energy (kWh)',
                description: 'Actual installed DC energy capacity. May be slightly higher than the gross requirement due to rounding up the number of racks.',
                type: 'output',
            },
            {
                name: 'Delivered AC Energy',
                unit: 'kWh',
                formula: 'Total DC Energy \u00D7 DoD \u00D7 Efficiency',
                description: 'The actual AC energy delivered to the grid after accounting for DoD and round-trip efficiency (but not EOL, since that represents future degradation).',
                type: 'output',
            },
            {
                name: 'Total Cells',
                formula: 'Number of Racks \u00D7 Modules per Rack \u00D7 Cells per Module',
                description: 'Total number of individual battery cells in the entire system.',
                type: 'output',
            },
            {
                name: 'Total Modules',
                formula: 'Number of Racks \u00D7 Modules per Rack',
                description: 'Total number of battery modules in the entire system.',
                type: 'output',
            },
            {
                name: 'Master BMS Cost',
                unit: '\u20B9',
                defaultValue: '2,00,000',
                description: 'System-level Battery Management System that oversees all rack-level BMS controllers. Handles system-level protection, state estimation, and grid interface.',
                type: 'input',
            },
            {
                name: 'BMS Housing Cost',
                unit: '\u20B9',
                defaultValue: '25,000',
                description: 'Enclosure for the Master BMS hardware. Provides environmental protection and cooling.',
                type: 'input',
            },
            {
                name: 'Safety Systems Cost',
                unit: '\u20B9',
                defaultValue: '3,00,000',
                description: 'Fire suppression, gas detection, thermal runaway containment, and emergency shutdown systems.',
                type: 'input',
            },
            {
                name: 'PCS Capacity',
                unit: 'kW',
                defaultValue: '50 kW',
                description: 'Power Conversion System (inverter/converter) capacity per unit. Options: 50, 100, 150, 250, 500, 630 kW. Determines the cost per PCS unit.',
                type: 'input',
            },
            {
                name: 'PCS Quantity',
                unit: 'units',
                defaultValue: '1',
                description: 'Number of PCS (inverter) units. Total PCS cost = PCS Qty x Unit Cost (based on selected capacity).',
                type: 'input',
            },
            {
                name: 'Total Battery System Cost',
                formula: '(Number of Racks \u00D7 Rack Cost) + Master BMS + BMS Housing + Safety Systems + PCS Cost',
                description: 'Total cost of the battery system excluding Balance-of-Plant (BOP) components.',
                type: 'output',
            },
        ],
    },
    {
        id: 'bop',
        icon: '\uD83D\uDD27',
        title: 'Balance of Plant (BOP)',
        subtitle: 'Site infrastructure and installation',
        color: '#fb7185',
        entries: [
            {
                name: 'Civil Works',
                unit: '\u20B9',
                defaultValue: '10,00,000',
                description: 'Foundation, concrete pads, cable trenches, fencing, and site preparation works.',
                type: 'input',
            },
            {
                name: 'AC Cabling',
                unit: '\u20B9',
                defaultValue: '3,00,000',
                description: 'AC power cables from the PCS output to the grid connection point (transformer / switchgear).',
                type: 'input',
            },
            {
                name: 'Earthing',
                unit: '\u20B9',
                defaultValue: '2,00,000',
                description: 'Grounding / earthing system including earth pits, conductors, and connections per safety standards.',
                type: 'input',
            },
            {
                name: 'Installation Labour',
                unit: '\u20B9',
                defaultValue: '5,00,000',
                description: 'On-site installation labour for rack placement, cable termination, and commissioning support.',
                type: 'input',
            },
            {
                name: 'Communication',
                unit: '\u20B9',
                defaultValue: '1,50,000',
                description: 'SCADA, networking, fibre optic cables, and communication infrastructure for remote monitoring.',
                type: 'input',
            },
            {
                name: 'Total BOP Cost',
                formula: 'Civil Works + AC Cabling + Earthing + Installation Labour + Communication',
                description: 'Sum of all Balance-of-Plant costs.',
                type: 'output',
            },
        ],
    },
    {
        id: 'summary',
        icon: '\uD83D\uDCCA',
        title: 'Cost Summary',
        subtitle: 'Final system cost metrics',
        color: '#60a5fa',
        entries: [
            {
                name: 'Total System Cost (Grand Total)',
                formula: 'Total Battery System Cost + Total BOP Cost',
                description: 'The complete CAPEX for the BESS installation, including all battery components, PCS, safety systems, and site infrastructure.',
                type: 'output',
            },
            {
                name: 'Cost per kWh',
                unit: '\u20B9/kWh',
                formula: 'Total System Cost / Total DC Energy (kWh)',
                description: 'Levelized installed cost per unit of energy storage capacity. Key benchmark metric for utility-scale BESS.',
                type: 'output',
            },
            {
                name: 'Cost per kW',
                unit: '\u20B9/kW',
                formula: 'Total System Cost / (Required AC Energy / Duration)',
                description: "Installed cost per unit of power capacity. This normalizes cost by the system's power rating (MW).",
                type: 'output',
            },
        ],
    },
];

/* ----------------------------------------------------------------
   TYPE BADGE
   ---------------------------------------------------------------- */
function TypeBadge({ type }: { type: ManualEntry['type'] }) {
    const cls =
        type === 'input' ? 'manual-badge input' :
            type === 'formula' ? 'manual-badge formula' :
                'manual-badge output';
    const label =
        type === 'input' ? 'Input' :
            type === 'formula' ? 'Formula' :
                'Output';
    return <span className={cls}>{label}</span>;
}

/* ----------------------------------------------------------------
   MANUAL MODAL COMPONENT
   ---------------------------------------------------------------- */
function ManualModal({ onClose }: { onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('cell');
    const contentRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    // Filter entries based on search
    const filteredSections = useMemo(() => {
        if (!search.trim()) return MANUAL_DATA;
        const q = search.toLowerCase();
        return MANUAL_DATA.map(s => ({
            ...s,
            entries: s.entries.filter(e =>
                e.name.toLowerCase().includes(q) ||
                e.description.toLowerCase().includes(q) ||
                (e.formula && e.formula.toLowerCase().includes(q)) ||
                (e.unit && e.unit.toLowerCase().includes(q))
            ),
        })).filter(s => s.entries.length > 0);
    }, [search]);

    // Count totals
    const totalInputs = MANUAL_DATA.reduce((a, s) => a + s.entries.filter(e => e.type === 'input').length, 0);
    const totalFormulas = MANUAL_DATA.reduce((a, s) => a + s.entries.filter(e => e.type === 'formula' || e.type === 'output').length, 0);

    // Scroll to section
    const scrollToSection = useCallback((id: string) => {
        setActiveSection(id);
        const el = document.getElementById(`manual-section-${id}`);
        if (el && contentRef.current) {
            contentRef.current.scrollTo({ top: el.offsetTop - contentRef.current.offsetTop - 20, behavior: 'smooth' });
        }
    }, []);

    return (
        <div className="manual-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="manual-panel">
                {/* -- SIDEBAR -- */}
                <div className="manual-sidebar">
                    <div className="manual-sidebar-head">
                        <div className="manual-logo">
                            <span className="manual-logo-icon">{'\uD83D\uDCD6'}</span>
                            <div>
                                <div className="manual-logo-title">BESS Manual</div>
                                <div className="manual-logo-sub">{totalInputs} inputs &middot; {totalFormulas} formulas</div>
                            </div>
                        </div>
                    </div>
                    <div className="manual-search-wrap">
                        <svg className="manual-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                            className="manual-search"
                            type="text"
                            placeholder="Search inputs, formulas..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && (
                            <button className="manual-search-clear" onClick={() => setSearch('')}>{'\u2715'}</button>
                        )}
                    </div>
                    <nav className="manual-nav">
                        {MANUAL_DATA.map(s => {
                            const matchCount = search.trim()
                                ? (filteredSections.find(fs => fs.id === s.id)?.entries.length || 0)
                                : s.entries.length;
                            return (
                                <button
                                    key={s.id}
                                    className={`manual-nav-item ${activeSection === s.id ? 'active' : ''} ${matchCount === 0 ? 'dimmed' : ''}`}
                                    onClick={() => scrollToSection(s.id)}
                                    disabled={matchCount === 0}
                                >
                                    <span className="manual-nav-icon">{s.icon}</span>
                                    <span className="manual-nav-label">{s.title}</span>
                                    <span className="manual-nav-count">{matchCount}</span>
                                </button>
                            );
                        })}
                    </nav>
                    <div className="manual-sidebar-footer">
                        <div className="manual-legend">
                            <span className="manual-badge input">Input</span>
                            <span className="manual-badge formula">Formula</span>
                            <span className="manual-badge output">Output</span>
                        </div>
                    </div>
                </div>

                {/* -- CONTENT -- */}
                <div className="manual-content">
                    <div className="manual-content-head">
                        <h2>BESS Sizing Calculator &mdash; Reference Manual</h2>
                        <button className="btn-close" onClick={onClose}>{'\u2715'} Close</button>
                    </div>
                    <div className="manual-content-scroll" ref={contentRef}>
                        {filteredSections.length === 0 && (
                            <div className="manual-empty">
                                <span className="manual-empty-icon">{'\uD83D\uDD0D'}</span>
                                <p>No results found for <strong>&quot;{search}&quot;</strong></p>
                                <button className="manual-empty-btn" onClick={() => setSearch('')}>Clear search</button>
                            </div>
                        )}
                        {filteredSections.map(section => (
                            <div key={section.id} id={`manual-section-${section.id}`} className="manual-section">
                                <div className="manual-section-head" style={{ borderLeftColor: section.color }}>
                                    <span className="manual-section-icon">{section.icon}</span>
                                    <div>
                                        <h3 className="manual-section-title">{section.title}</h3>
                                        <p className="manual-section-sub">{section.subtitle}</p>
                                    </div>
                                </div>
                                <div className="manual-entries">
                                    {section.entries.map((entry, i) => (
                                        <div key={i} className={`manual-entry manual-entry-${entry.type}`}>
                                            <div className="manual-entry-header">
                                                <span className="manual-entry-name">{entry.name}</span>
                                                <div className="manual-entry-meta">
                                                    {entry.unit && <span className="manual-entry-unit">{entry.unit}</span>}
                                                    <TypeBadge type={entry.type} />
                                                </div>
                                            </div>
                                            {entry.formula && (
                                                <div className="manual-formula-block">
                                                    <span className="manual-formula-label">Formula:</span>
                                                    <code className="manual-formula-code">{entry.formula}</code>
                                                </div>
                                            )}
                                            {entry.defaultValue && (
                                                <div className="manual-default-block">
                                                    <span className="manual-default-label">Default:</span>
                                                    <span className="manual-default-value">{entry.defaultValue}</span>
                                                </div>
                                            )}
                                            <p className="manual-entry-desc">{entry.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* -- CALCULATION FLOW DIAGRAM -- */}
                        {!search.trim() && (
                            <div className="manual-section">
                                <div className="manual-section-head" style={{ borderLeftColor: '#60a5fa' }}>
                                    <span className="manual-section-icon">{'\uD83D\uDD04'}</span>
                                    <div>
                                        <h3 className="manual-section-title">Calculation Flow</h3>
                                        <p className="manual-section-sub">How the calculator engine processes inputs</p>
                                    </div>
                                </div>
                                <div className="manual-flow">
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#34d399' }}>1</div>
                                        <div className="manual-flow-body">
                                            <strong>Cell Calculation</strong>
                                            <p>Compute Cell Energy = Capacity x Voltage</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#22d3ee' }}>2</div>
                                        <div className="manual-flow-body">
                                            <strong>Module Calculation</strong>
                                            <p>Module Voltage = Cells x Cell Voltage, Module Energy = Cells x Cell Energy. Sum BOM costs.</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#f59e0b' }}>3</div>
                                        <div className="manual-flow-body">
                                            <strong>Rack Calculation</strong>
                                            <p>Rack Voltage/Energy from modules. Add rack-level BOM (frame, BMS, cables, etc.).</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#a78bfa' }}>4</div>
                                        <div className="manual-flow-body">
                                            <strong>System Sizing</strong>
                                            <p>Required energy &rarr; Gross DC (with derating) &rarr; Number of racks &rarr; Total costs (+ PCS, BMS, Safety).</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#fb7185' }}>5</div>
                                        <div className="manual-flow-body">
                                            <strong>BOP &amp; Summary</strong>
                                            <p>Add infrastructure costs. Compute Grand Total, Cost/kWh, Cost/kW.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ManualModal);
