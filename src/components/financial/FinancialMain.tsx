'use client';

import { useState, useMemo } from 'react';
import { fmtDollar, fmtPct, fmtYears } from '@/lib/formatters';
import { exportCSV } from '@/lib/csv-export';
import { buildParams, runModel } from '@/lib/engine';
import IncomeTable from './IncomeTable';
import CashFlowTable from './CashFlowTable';
import SensitivityPanel from './SensitivityPanel';
import ChartsPanel from './ChartsPanel';

export default function FinancialMain({ 
    model, 
    params, 
    inputs, 
    collapsed, 
    onToggleSidebar,
    selectedCurrency,
    exchangeRate,
    currencySymbol
}) {
    const [activeTab, setActiveTab] = useState('tab-income');

    const tabs = [
        { id: 'tab-income', label: 'Income Statement' },
        { id: 'tab-cashflow', label: 'Cash Flow' },
        { id: 'tab-sensitivity', label: 'Sensitivity' },
        { id: 'tab-charts', label: 'Charts' },
    ];

    const handleExport = () => {
        if (model) {
            exportCSV(model);
        }
    };

    return (
        <main id="main-content" className={`main-content ${collapsed ? 'expanded' : ''}`}>
            {/* Top bar with KPI cards */}
            <header className="top-bar">
                <button id="btn-sidebar-toggle" className="btn-sidebar-toggle" title="Toggle sidebar" onClick={onToggleSidebar}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
                <div className="kpi-strip">
                    <div className="kpi-card kpi-irr">
                        <span className="kpi-label">Project IRR</span>
                        <span id="kpi-irr" className="kpi-value">{model ? fmtPct(model.irr) : '—'}</span>
                    </div>
                    <div className="kpi-card kpi-npv">
                        <span className="kpi-label">Total Cash Flow (NPV)</span>
                        <span id="kpi-npv" className="kpi-value">{model ? fmtDollar(model.npv, currencySymbol, exchangeRate) : '—'}</span>
                    </div>
                    <div className="kpi-card kpi-payback">
                        <span className="kpi-label">Payback Period</span>
                        <span id="kpi-payback" className="kpi-value">{model ? fmtYears(model.payback) : '—'}</span>
                    </div>
                    <div className="kpi-card kpi-rev">
                        <span className="kpi-label">Year 1 Revenue</span>
                        <span id="kpi-rev" className="kpi-value">{model ? fmtDollar(model.totalRevenue[0], currencySymbol, exchangeRate) : '—'}</span>
                    </div>
                </div>
                <button id="btn-export" className="btn-export" title="Export CSV" onClick={handleExport}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11v3h12v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Export CSV
                </button>
            </header>

            {/* Tabs */}
            <nav className="tab-nav" role="tablist">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        data-tab={tab.id}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Tab panels */}
            <div className="tab-panels">
                <section id="tab-income" className={`tab-panel ${activeTab === 'tab-income' ? 'active' : ''}`} role="tabpanel">
                    <h2>Income Statement <span className="subtitle">Projected Annual P&amp;L</span></h2>
                    {model && <IncomeTable model={model} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />}
                </section>

                <section id="tab-cashflow" className={`tab-panel ${activeTab === 'tab-cashflow' ? 'active' : ''}`} role="tabpanel">
                    <h2>Cash Flow Statement <span className="subtitle">Project &amp; Equity Cash Flows</span></h2>
                    {model && <CashFlowTable model={model} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />}
                </section>

                <section id="tab-sensitivity" className={`tab-panel ${activeTab === 'tab-sensitivity' ? 'active' : ''}`} role="tabpanel">
                    <h2>Sensitivity Analysis <span className="subtitle">Impact on Key Metrics</span></h2>
                    {params && <SensitivityPanel params={params} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />}
                </section>

                <section id="tab-charts" className={`tab-panel ${activeTab === 'tab-charts' ? 'active' : ''}`} role="tabpanel">
                    <h2>Financial Charts <span className="subtitle">Visual Analytics</span></h2>
                    {model && <ChartsPanel model={model} params={params} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />}
                </section>
            </div>
        </main>
    );
}
