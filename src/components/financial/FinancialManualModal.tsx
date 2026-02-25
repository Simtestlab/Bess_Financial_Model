'use client';

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';

/* ----------------------------------------------------------------
   FINANCIAL MANUAL DATA
   Covers all inputs, formulas, intermediates, and outputs
   for the BESS Financial Model engine
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
        id: 'technical',
        icon: '\u26A1',
        title: 'Technical Parameters',
        subtitle: 'System capacity, efficiency, and operational settings',
        color: '#34d399',
        entries: [
            {
                name: 'Usable Capacity',
                unit: 'MWh',
                defaultValue: '1.8',
                description: "The net usable energy capacity of the BESS system in MWh. This is auto-synced from the BESS Sizing calculator as: System Power (MW) x Round-Trip Efficiency. It represents the actual deliverable energy after efficiency losses.",
                type: 'input',
            },
            {
                name: 'Arbitrage Days / Year',
                unit: 'days',
                defaultValue: '280',
                description: 'Number of operating days per year when the BESS performs energy arbitrage (buy low, sell high). Accounts for planned maintenance, grid downtime, and non-dispatch days. Typical range: 250-330 days.',
                type: 'input',
            },
            {
                name: 'Cycles per Day',
                unit: 'cycles/day',
                defaultValue: '1',
                description: 'Number of full charge-discharge cycles performed per operating day. More cycles increase revenue but accelerate degradation. Typical values: 1-2 cycles/day for arbitrage applications.',
                type: 'input',
            },
            {
                name: 'Availability',
                unit: '%',
                defaultValue: '98',
                description: 'Percentage of time the BESS system is available for operation. Accounts for unplanned outages and maintenance downtime. Industry benchmark for BESS: 95-99%. Used as a fraction (e.g., 0.98) in energy calculations.',
                type: 'input',
            },
            {
                name: 'Round-Trip Efficiency (RTE)',
                unit: '%',
                defaultValue: '90',
                description: 'The ratio of energy discharged to energy charged, expressed as a percentage. Accounts for all conversion losses (battery, PCS, transformer). LFP systems typically achieve 85-92% RTE. Energy Sold = Energy Charged x RTE.',
                type: 'input',
            },
            {
                name: 'Annual Degradation',
                unit: '%',
                defaultValue: '3.0',
                description: "Annual capacity degradation rate of the battery system. Each year, the effective capacity reduces: Capacity(y) = Capacity(y-1) x (1 - degradation). At 3%/yr, after 10 years the system retains ~74% of original capacity.",
                type: 'input',
            },
            {
                name: 'Effective Capacity (per year)',
                formula: 'Capacity(y) = Capacity(y-1) x (1 - degradation)',
                description: 'The degraded usable capacity for each project year. Year 0 = full capacity, then reduces annually by the degradation rate. This directly impacts energy output and revenue in later years.',
                type: 'formula',
            },
            {
                name: 'Energy Charged (per year)',
                unit: 'MWh',
                formula: 'Effective Capacity x Arb Days x Availability',
                description: 'Total energy charged into the BESS per year. Depends on the degraded capacity, number of operating days, and system availability.',
                type: 'output',
            },
            {
                name: 'Energy Sold (per year)',
                unit: 'MWh',
                formula: 'Energy Charged x RTE',
                description: 'Total energy discharged and sold to the grid per year. Lower than energy charged due to round-trip efficiency losses.',
                type: 'output',
            },
        ],
    },
    {
        id: 'pricing',
        icon: '\uD83D\uDCB0',
        title: 'Energy Pricing',
        subtitle: 'Charge and discharge electricity rates',
        color: '#f59e0b',
        entries: [
            {
                name: 'Charge Price',
                unit: '\u20B9/kWh',
                defaultValue: '3.0',
                description: "The cost of electricity purchased to charge the BESS. This is the off-peak or low-price period rate. Stored internally in \u20B9/kWh and converted to \u20B9/MWh (x1000) for calculation. Lower charge prices improve arbitrage margins.",
                type: 'input',
            },
            {
                name: 'Discharge Price',
                unit: '\u20B9/kWh',
                defaultValue: '4.5',
                description: "The selling price of electricity discharged from the BESS. This is the peak or high-price period rate. The spread between discharge and charge price (net of efficiency losses) drives arbitrage revenue.",
                type: 'input',
            },
            {
                name: 'Sell Revenue (per year)',
                formula: 'Energy Sold x Discharge Price (per MWh)',
                description: 'Gross revenue from selling discharged energy at the discharge price. This is the top-line revenue before subtracting charging costs.',
                type: 'output',
            },
            {
                name: 'Charge Cost (per year)',
                formula: 'Energy Charged x Charge Price (per MWh)',
                description: 'Total cost of purchasing electricity to charge the BESS. This is the primary variable cost of arbitrage operations.',
                type: 'output',
            },
            {
                name: 'Arbitrage Revenue',
                formula: 'Sell Revenue - Charge Cost',
                description: 'Net revenue from energy arbitrage = revenue from selling at peak minus cost of buying at off-peak. This is the core business case for the BESS.',
                type: 'output',
            },
        ],
    },
    {
        id: 'revenue',
        icon: '\uD83D\uDCC8',
        title: 'Revenue Parameters',
        subtitle: 'PPA contracts, ancillary services, and other income',
        color: '#22d3ee',
        entries: [
            {
                name: 'PPA Volume',
                unit: 'MWh/yr',
                formula: 'Capacity x Cycles/Day x Arb Days x RTE x Availability',
                description: 'Auto-calculated annual PPA volume based on system capacity and operational parameters. Represents the committed energy delivery under the Power Purchase Agreement. Read-only field.',
                type: 'output',
            },
            {
                name: 'PPA Rate',
                unit: '\u20B9/kWh',
                defaultValue: '6.0',
                description: 'The contracted rate per kWh under the PPA. Internally converted to \u20B9/MWh (x1000) for calculations. PPA Price = PPA Rate x 1000.',
                type: 'input',
            },
            {
                name: 'PPA Escalation',
                unit: '%',
                defaultValue: '0',
                description: 'Annual escalation rate for PPA revenue. Revenue grows by this percentage compounding: PPA Revenue(y) = PPA Volume x PPA Price x (1 + escalation)^y. A 2% escalation provides inflation protection.',
                type: 'input',
            },
            {
                name: 'PPA Revenue (per year)',
                formula: 'PPA Volume x PPA Price x (1 + PPA Escalation)^year',
                description: 'Annual revenue from the PPA contract. Grows with the escalation rate each year, providing predictable and increasing cash flows over the project life.',
                type: 'output',
            },
            {
                name: 'Ancillary Services',
                unit: '\u20B9/yr',
                defaultValue: '1,20,000',
                description: 'Annual revenue from grid ancillary services such as frequency regulation, spinning reserve, voltage support, and black start capability. These are typically contracted separately from energy arbitrage.',
                type: 'input',
            },
            {
                name: 'Other Revenue',
                unit: '\u20B9/yr',
                defaultValue: '0',
                description: 'Any additional revenue streams not covered by arbitrage, PPA, or ancillary services. Examples: capacity payments, demand response programs, or renewable energy certificates.',
                type: 'input',
            },
            {
                name: 'Total Revenue (per year)',
                formula: 'Arbitrage Revenue + PPA Revenue + Ancillary + Other Revenue',
                description: 'Sum of all revenue streams for each project year. This is the top-line figure in the income statement before operating expenses.',
                type: 'output',
            },
        ],
    },
    {
        id: 'costs',
        icon: '\uD83C\uDFD7\uFE0F',
        title: 'Cost & Investment',
        subtitle: 'CAPEX, operating expenses, and inflation',
        color: '#a78bfa',
        entries: [
            {
                name: 'Total CAPEX',
                unit: '\u20B9',
                defaultValue: '25,09,671',
                description: 'Total capital expenditure for the BESS project. Can be auto-imported from the BESS Sizing section (Grand Total). This is the initial investment at Year 0 and the basis for depreciation and ROI calculations.',
                type: 'input',
            },
            {
                name: 'Project Life',
                unit: 'years',
                defaultValue: '20',
                description: 'Total project duration in years. Determines the financial model horizon, depreciation schedule, and cash flow projection period. Minimum 5 years, typical: 15-25 years for utility-scale BESS.',
                type: 'input',
            },
            {
                name: 'Insurance Rate',
                unit: '% of CAPEX',
                defaultValue: '0.3',
                description: 'Annual insurance premium as a fixed percentage of CAPEX. Insurance = CAPEX x Insurance Rate. Covers property, equipment, and liability risks. Typical range: 0.2-0.5% of CAPEX.',
                type: 'input',
            },
            {
                name: 'Insurance (per year)',
                formula: 'CAPEX x Insurance Rate',
                description: 'Annual insurance cost. Fixed amount each year based on original CAPEX (not inflation-adjusted). Included in total OPEX.',
                type: 'formula',
            },
            {
                name: 'Variable O&M',
                unit: '\u20B9/MWh',
                defaultValue: '90',
                description: 'Variable operations and maintenance cost per MWh of throughput. Covers consumables, minor repairs, and performance monitoring that scale with usage. Annual Variable O&M = Rate x Annual Throughput.',
                type: 'input',
            },
            {
                name: 'Annual Throughput',
                unit: 'MWh/yr',
                formula: 'Capacity x Cycles per Day x 365',
                description: 'Total annual energy throughput for variable O&M calculation. Based on nameplate capacity (not degraded) and daily cycle count.',
                type: 'formula',
            },
            {
                name: 'Variable O&M (per year)',
                formula: 'Annual Throughput x Variable O&M Rate',
                description: 'Total annual variable O&M cost. Scales with system throughput. Does not account for degradation in the throughput calculation.',
                type: 'output',
            },
            {
                name: 'Fixed O&M',
                unit: '\u20B9/yr',
                defaultValue: '3,00,000',
                description: 'Annual fixed operations and maintenance cost. Covers scheduled maintenance, staff, monitoring systems, and site upkeep. Escalates annually with inflation.',
                type: 'input',
            },
            {
                name: 'Admin Cost',
                unit: '\u20B9/yr',
                defaultValue: '0',
                description: 'Annual administrative costs including management overhead, legal, accounting, and compliance. Escalates with inflation as part of the fixed OPEX base.',
                type: 'input',
            },
            {
                name: 'Preventive Maintenance',
                unit: '\u20B9/yr',
                defaultValue: '0',
                description: 'Annual preventive maintenance budget for proactive equipment servicing, testing, and component replacement scheduling. Escalates with inflation.',
                type: 'input',
            },
            {
                name: 'Inflation Rate',
                unit: '%',
                defaultValue: '3.0',
                description: 'Annual inflation rate applied to fixed OPEX components (Fixed O&M + Admin Cost + Preventive Maintenance). These costs grow as: Base x (1 + inflation)^year. Does NOT apply to insurance or variable O&M.',
                type: 'input',
            },
            {
                name: 'Fixed O&M (per year, inflated)',
                formula: '(Fixed O&M + Admin Cost + Preventive Maintenance) x (1 + Inflation)^year',
                description: 'Total inflation-adjusted fixed operating costs for each year. The base amount (sum of three components) compounds annually at the inflation rate.',
                type: 'output',
            },
            {
                name: 'Total OPEX (per year)',
                formula: 'Insurance + Variable O&M + Fixed O&M (inflated)',
                description: 'Sum of all annual operating expenses. This is deducted from Total Revenue to calculate EBITDA.',
                type: 'output',
            },
        ],
    },
    {
        id: 'income',
        icon: '\uD83D\uDCCA',
        title: 'Income Statement',
        subtitle: 'Profitability calculations from revenue to net income',
        color: '#60a5fa',
        entries: [
            {
                name: 'EBITDA',
                formula: 'Total Revenue - Total OPEX',
                description: 'Earnings Before Interest, Taxes, Depreciation, and Amortization. The core operating profitability metric before non-cash charges and financing costs.',
                type: 'output',
            },
            {
                name: 'Depreciation',
                unit: '\u20B9/yr',
                formula: 'CAPEX / Project Life (straight-line)',
                description: 'Annual straight-line depreciation of the CAPEX over the full project life. Non-cash expense that reduces taxable income. For 20-year project: Annual Depreciation = CAPEX / 20.',
                type: 'formula',
            },
            {
                name: 'EBIT',
                formula: 'EBITDA - Depreciation',
                description: 'Earnings Before Interest and Taxes. Operating profit after accounting for asset depreciation. Used in both levered and unlevered cash flow calculations.',
                type: 'output',
            },
            {
                name: 'EBT (Earnings Before Tax)',
                formula: 'EBIT - Interest Expense',
                description: 'Profit before income tax. Calculated after deducting debt interest from EBIT. If EBT is negative, no tax is payable for that year.',
                type: 'output',
            },
            {
                name: 'Tax',
                formula: 'max(0, EBT x Tax Rate)',
                description: 'Income tax calculated on EBT. Only positive EBT is taxed; losses result in zero tax (no tax credits or carryforward modeled).',
                type: 'output',
            },
            {
                name: 'Net Income',
                formula: 'EBT - Tax',
                description: 'Bottom-line profit after all expenses, depreciation, interest, and taxes. This is the accounting profit available to equity holders.',
                type: 'output',
            },
        ],
    },
    {
        id: 'debt',
        icon: '\uD83D\uDCB3',
        title: 'Debt Financing',
        subtitle: 'Loan amortization and interest schedule',
        color: '#fb7185',
        entries: [
            {
                name: 'Debt Amount',
                unit: '\u20B9',
                defaultValue: '6,81,89,925',
                description: 'Total debt (loan) raised to finance the project. The equity portion = CAPEX - Debt Amount. Higher debt leverage increases equity returns but adds financial risk.',
                type: 'input',
            },
            {
                name: 'Interest Rate',
                unit: '%',
                defaultValue: '5.0',
                description: 'Annual interest rate on the debt. Interest is calculated on the opening balance each year: Interest = Opening Balance x Rate. Typical project finance rates: 4-8%.',
                type: 'input',
            },
            {
                name: 'Loan Term',
                unit: 'years',
                defaultValue: '10',
                description: 'Duration of the loan repayment period. Principal is repaid in equal annual installments over this term. Must be less than or equal to the project life.',
                type: 'input',
            },
            {
                name: 'Annual Principal Repayment',
                formula: 'Debt Amount / Loan Term',
                description: 'Equal annual principal repayment (straight-line amortization). The same amount of principal is repaid each year until the loan is fully paid off.',
                type: 'formula',
            },
            {
                name: 'Opening Balance (per year)',
                formula: 'Year 1: Debt Amount; Year n: Closing Balance(n-1)',
                description: "The outstanding loan balance at the start of each year. Reduces by the principal repayment each year. After the loan term, the balance is zero.",
                type: 'output',
            },
            {
                name: 'Interest Expense (per year)',
                formula: 'Opening Balance x Interest Rate',
                description: 'Annual interest payment calculated on the year-start outstanding balance. Decreases each year as principal is repaid, reducing the outstanding balance.',
                type: 'output',
            },
            {
                name: 'Closing Balance (per year)',
                formula: 'Opening Balance - Principal Repayment',
                description: 'Outstanding loan balance at year-end after principal repayment. Reaches zero at the end of the loan term.',
                type: 'output',
            },
            {
                name: 'Tax Rate',
                unit: '%',
                defaultValue: '30',
                description: 'Corporate income tax rate applied to positive Earnings Before Tax (EBT). Interest expense is tax-deductible, providing a tax shield benefit. Typical range: 25-35%.',
                type: 'input',
            },
        ],
    },
    {
        id: 'cashflow',
        icon: '\uD83D\uDCB5',
        title: 'Cash Flow Analysis',
        subtitle: 'Unlevered (project) and levered (equity) cash flows',
        color: '#f472b6',
        entries: [
            {
                name: 'Unlevered Net Income',
                formula: 'EBIT x (1 - Tax Rate)',
                description: 'After-tax operating income without considering debt. Represents the project-level profitability as if 100% equity-financed. Used for project IRR calculation.',
                type: 'output',
            },
            {
                name: 'Unlevered Operating Cash Flow',
                formula: 'Unlevered Net Income + Depreciation',
                description: 'Cash generated from operations at the project level. Adds back non-cash depreciation to unlevered net income. This is the cash available before capital expenditures.',
                type: 'output',
            },
            {
                name: 'Unlevered Free Cash Flow (FCF)',
                formula: 'Unlevered Operating CF - Capital Expenditures',
                description: 'Free cash flow available to all capital providers (debt + equity). Capital expenditures are zero after Year 0 in this model (no battery replacement modeled).',
                type: 'output',
            },
            {
                name: 'Project Cash Flow (for IRR)',
                formula: 'Year 0: -CAPEX; Year 1-N: Unlevered FCF',
                description: 'Complete project cash flow stream starting with the initial investment. Used to calculate Project IRR and NPV. Year 0 is the CAPEX outflow.',
                type: 'output',
            },
            {
                name: 'Cumulative Cash Flow',
                formula: 'Running sum of Project Cash Flow',
                description: 'Cumulative sum starting from Year 0 (-CAPEX). When this turns positive, the payback period is reached. Used to determine simple payback.',
                type: 'output',
            },
            {
                name: 'Levered Operating Cash Flow',
                formula: 'Net Income + Depreciation',
                description: 'Cash generated from operations at the equity level. Uses levered (after-interest, after-tax) net income plus depreciation add-back.',
                type: 'output',
            },
            {
                name: 'Levered Free Cash Flow',
                formula: 'Levered OCF - Capital Expenditures - Principal Repayment',
                description: 'Cash flow available to equity holders after debt service. Deducts principal repayment from operating cash flow. This is the actual cash distribution to equity investors.',
                type: 'output',
            },
            {
                name: 'Equity Cash Flow (for Equity IRR)',
                formula: 'Year 0: -(CAPEX - Debt Amount); Year 1-N: Levered FCF',
                description: 'Cash flows from the equity perspective. Year 0 outflow is only the equity portion (CAPEX minus debt). Used to calculate Equity IRR and Equity NPV.',
                type: 'output',
            },
        ],
    },
    {
        id: 'metrics',
        icon: '\uD83C\uDFAF',
        title: 'Investment Metrics',
        subtitle: 'Key performance and return indicators',
        color: '#818cf8',
        entries: [
            {
                name: 'Project IRR',
                formula: 'IRR of Project Cash Flow [-CAPEX, FCF1, FCF2, ..., FCFN]',
                description: "Internal Rate of Return on the total project investment. The discount rate at which NPV equals zero. Represents the project's unlevered return. Industry target for BESS: 8-15%.",
                type: 'output',
            },
            {
                name: 'Total Cash Flow (NPV)',
                formula: 'Sum of discounted Project Cash Flows at discount rate',
                description: 'Net Present Value of all project cash flows discounted at the WACC/hurdle rate. A positive NPV means the project creates value above the required return. Currently shows undiscounted total.',
                type: 'output',
            },
            {
                name: 'Payback Period',
                unit: 'years',
                formula: 'Year when Cumulative Cash Flow turns positive (interpolated)',
                description: 'Time required for cumulative cash flows to recover the initial CAPEX investment. Uses linear interpolation between the last negative and first positive cumulative year for fractional accuracy.',
                type: 'output',
            },
            {
                name: 'Equity IRR',
                formula: 'IRR of Equity Cash Flow [-(CAPEX-Debt), LevFCF1, ..., LevFCFN]',
                description: 'Internal Rate of Return on the equity portion of the investment. Typically higher than Project IRR due to debt leverage (financial leverage effect). Relevant for equity investors.',
                type: 'output',
            },
            {
                name: 'Equity NPV',
                formula: 'NPV of Equity Cash Flows at discount rate',
                description: 'Net Present Value of equity cash flows. Shows value creation from the equity perspective after debt service.',
                type: 'output',
            },
            {
                name: 'Year 1 Revenue',
                formula: 'Total Revenue for Year 1',
                description: 'First-year total revenue across all streams (arbitrage, PPA, ancillary, other). Serves as a baseline for revenue projections.',
                type: 'output',
            },
        ],
    },
    {
        id: 'sensitivity',
        icon: '\uD83D\uDD2C',
        title: 'Sensitivity Analysis',
        subtitle: 'Impact analysis and scenario testing',
        color: '#38bdf8',
        entries: [
            {
                name: 'CAPEX Sensitivity',
                formula: 'Vary CAPEX by 0.7x to 1.3x, recalculate IRR & NPV',
                description: 'Tests the impact of CAPEX variations on project returns. Shows how IRR and NPV change if actual costs are 30% lower to 30% higher than estimated.',
                type: 'formula',
            },
            {
                name: 'Discharge Price Sensitivity',
                formula: 'Vary Discharge Price by 0.7x to 1.3x, recalculate IRR & NPV',
                description: 'Tests revenue sensitivity to electricity selling prices. Higher discharge prices directly improve arbitrage margins and project returns.',
                type: 'formula',
            },
            {
                name: 'Degradation Sensitivity',
                formula: 'Test degradation rates 0.5% to 5%, track Year 10 capacity & IRR',
                description: 'Shows how different battery degradation rates affect long-term capacity and returns. Higher degradation reduces energy sold in later years, impacting lifetime revenue.',
                type: 'formula',
            },
            {
                name: 'Efficiency Sensitivity',
                formula: 'Test RTE from 75% to 98%, track Year 1 revenue & IRR',
                description: 'Analyzes impact of round-trip efficiency on revenue and returns. Even small efficiency improvements significantly affect energy sold and arbitrage margins.',
                type: 'formula',
            },
            {
                name: 'Tornado Chart',
                formula: 'Vary 6 key parameters +/-10%, compare IRR impact',
                description: 'Compares the relative impact of Discharge Price, Charge Price, CAPEX, Capacity, Fixed O&M, and PPA Price on Project IRR. Identifies which parameters most affect returns.',
                type: 'formula',
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
   FINANCIAL MANUAL MODAL COMPONENT
   ---------------------------------------------------------------- */
function FinancialManualModal({ onClose }: { onClose: () => void }) {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('technical');
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
        const el = document.getElementById(`fin-manual-section-${id}`);
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
                                <div className="manual-logo-title">Financial Manual</div>
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
                        <h2>BESS Financial Model &mdash; Reference Manual</h2>
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
                            <div key={section.id} id={`fin-manual-section-${section.id}`} className="manual-section">
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

                        {/* -- MODEL FLOW DIAGRAM -- */}
                        {!search.trim() && (
                            <div className="manual-section">
                                <div className="manual-section-head" style={{ borderLeftColor: '#60a5fa' }}>
                                    <span className="manual-section-icon">{'\uD83D\uDD04'}</span>
                                    <div>
                                        <h3 className="manual-section-title">Financial Model Flow</h3>
                                        <p className="manual-section-sub">How the engine processes inputs into financial statements</p>
                                    </div>
                                </div>
                                <div className="manual-flow">
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#34d399' }}>1</div>
                                        <div className="manual-flow-body">
                                            <strong>Capacity &amp; Energy</strong>
                                            <p>Apply annual degradation to capacity. Calculate Energy Charged = Capacity x Days x Availability. Energy Sold = Charged x RTE.</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#f59e0b' }}>2</div>
                                        <div className="manual-flow-body">
                                            <strong>Revenue Calculation</strong>
                                            <p>Arbitrage = (Sell - Buy) revenue. Add PPA revenue (with escalation), ancillary, and other income.</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#a78bfa' }}>3</div>
                                        <div className="manual-flow-body">
                                            <strong>Operating Expenses</strong>
                                            <p>Insurance (% of CAPEX) + Variable O&amp;M (throughput-based) + Fixed O&amp;M (inflation-adjusted).</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#60a5fa' }}>4</div>
                                        <div className="manual-flow-body">
                                            <strong>Income Statement</strong>
                                            <p>EBITDA &rarr; subtract Depreciation &rarr; EBIT &rarr; subtract Interest &rarr; EBT &rarr; Tax &rarr; Net Income.</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#fb7185' }}>5</div>
                                        <div className="manual-flow-body">
                                            <strong>Debt Schedule</strong>
                                            <p>Straight-line amortization: equal annual principal. Interest on opening balance. Closing = Opening - Principal.</p>
                                        </div>
                                    </div>
                                    <div className="manual-flow-arrow">{'\u2193'}</div>
                                    <div className="manual-flow-step">
                                        <div className="manual-flow-num" style={{ background: '#f472b6' }}>6</div>
                                        <div className="manual-flow-body">
                                            <strong>Cash Flows &amp; Metrics</strong>
                                            <p>Unlevered FCF (project-level) and Levered FCF (equity-level). Compute IRR, NPV, Payback, Equity IRR.</p>
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

export default memo(FinancialManualModal);
