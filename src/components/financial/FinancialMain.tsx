'use client';

import { useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { fmtDollar, fmtPct, fmtYears } from '@/lib/formatters';
import { exportCSV } from '@/lib/csv-export';

// Lazy-load heavy tab panels so they only mount when needed
const IncomeTable = lazy(() => import('./IncomeTable'));
const CashFlowTable = lazy(() => import('./CashFlowTable'));
const SensitivityPanel = lazy(() => import('./SensitivityPanel'));
const ChartsPanel = lazy(() => import('./ChartsPanel'));
const FinancialManualModal = lazy(() => import('./FinancialManualModal'));

const TABS = [
    { id: 'tab-income', label: 'Income Statement' },
    { id: 'tab-cashflow', label: 'Cash Flow' },
    { id: 'tab-sensitivity', label: 'Sensitivity' },
    { id: 'tab-charts', label: 'Charts' },
] as const;

const TabFallback = () => (
    <div className="tab-loading">
        <div className="section-loading-spinner" />
        <span>Loading...</span>
    </div>
);

function FinancialMain({
    model,
    params,
    inputs,
    collapsed,
    onToggleSidebar,
    selectedCurrency,
    exchangeRate,
    currencySymbol
}: any) {
    const [activeTab, setActiveTab] = useState('tab-income');
    const [manualOpen, setManualOpen] = useState(false);

    const handleExport = useCallback(() => {
        if (model) {
            exportCSV(model);
        }
    }, [model]);

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
                <button className="btn-manual" title="Open Manual" onClick={() => setManualOpen(true)}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2h4.5l1.5 1.5L9.5 2H14v12H9.5l-1.5 1.5L6.5 14H2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 3.5V14" stroke="currentColor" strokeWidth="1.3" /></svg>
                    Manual
                </button>
                <button id="btn-export" className="btn-export" title="Export CSV" onClick={handleExport}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 11v3h12v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Export CSV
                </button>
            </header>

            {/* Tabs */}
            <nav className="tab-nav" role="tablist">
                {TABS.map(tab => (
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

            {/* Tab panels — only render the active one */}
            <div className="tab-panels">
                {activeTab === 'tab-income' && (
                    <section id="tab-income" className="tab-panel active" role="tabpanel">
                        <h2>Income Statement <span className="subtitle">Projected Annual P&amp;L</span></h2>
                        {model && (
                            <Suspense fallback={<TabFallback />}>
                                <IncomeTable model={model} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
                            </Suspense>
                        )}
                    </section>
                )}

                {activeTab === 'tab-cashflow' && (
                    <section id="tab-cashflow" className="tab-panel active" role="tabpanel">
                        <h2>Cash Flow Statement <span className="subtitle">Project &amp; Equity Cash Flows</span></h2>
                        {model && (
                            <Suspense fallback={<TabFallback />}>
                                <CashFlowTable model={model} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
                            </Suspense>
                        )}
                    </section>
                )}

                {activeTab === 'tab-sensitivity' && (
                    <section id="tab-sensitivity" className="tab-panel active" role="tabpanel">
                        <h2>Sensitivity Analysis <span className="subtitle">Impact on Key Metrics</span></h2>
                        {params && (
                            <Suspense fallback={<TabFallback />}>
                                <SensitivityPanel params={params} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
                            </Suspense>
                        )}
                    </section>
                )}

                {activeTab === 'tab-charts' && (
                    <section id="tab-charts" className="tab-panel active" role="tabpanel">
                        <h2>Financial Charts <span className="subtitle">Visual Analytics</span></h2>
                        {model && (
                            <Suspense fallback={<TabFallback />}>
                                <ChartsPanel model={model} params={params} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
                            </Suspense>
                        )}
                    </section>
                )}
            </div>

            {/* === FINANCIAL MANUAL MODAL === */}
            {manualOpen && (
                <Suspense fallback={null}>
                    <FinancialManualModal onClose={() => setManualOpen(false)} />
                </Suspense>
            )}
        </main>
    );
}

export default memo(FinancialMain);
