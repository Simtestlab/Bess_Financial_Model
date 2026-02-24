'use client';

import { memo, useCallback } from 'react';
import { useCurrency } from '@/lib/CurrencyContext';
import CurrencyConverter from '@/components/CurrencyConverter';

function SectionNav({ activeSection, setActiveSection }: any) {
    const { selectedCurrency, exchangeRate, onCurrencyChange, onRateChange } = useCurrency();

    const goHandbook = useCallback(() => setActiveSection('section-handbook'), [setActiveSection]);
    const goFinancial = useCallback(() => setActiveSection('section-financial'), [setActiveSection]);

    return (
        <nav id="section-nav" className="section-nav">
            <div className="section-nav-inner">
                <div className="section-nav-brand">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="2" y="6" width="6" height="16" rx="2" fill="#6ee7b7" />
                        <rect x="11" y="3" width="6" height="22" rx="2" fill="#34d399" />
                        <rect x="20" y="9" width="6" height="13" rx="2" fill="#10b981" />
                    </svg>
                    <span className="section-nav-title">BESS Platform</span>
                </div>
                <div className="section-tabs" role="tablist">
                    <button
                        className={`section-tab ${activeSection === 'section-handbook' ? 'active' : ''}`}
                        onClick={goHandbook}
                        role="tab"
                        aria-selected={activeSection === 'section-handbook'}
                        id="section-tab-handbook"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M3 3h4l1.5 1.5L10 3h4v11h-4l-1.5 1.5L7 14H3z"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path d="M8.5 4.5V14" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                        BESS Sizing
                    </button>
                    <button
                        className={`section-tab ${activeSection === 'section-financial' ? 'active' : ''}`}
                        onClick={goFinancial}
                        role="tab"
                        aria-selected={activeSection === 'section-financial'}
                        id="section-tab-financial"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M2 14V4l4-2v12M6 14V6l4-2v10M10 14V8l4-2v8"
                                stroke="currentColor"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        BESS Financial Model
                    </button>
                </div>
                <CurrencyConverter
                    baseCurrency="INR"
                    selectedCurrency={selectedCurrency}
                    exchangeRate={exchangeRate}
                    onCurrencyChange={onCurrencyChange}
                    onRateChange={onRateChange}
                />
            </div>
        </nav>
    );
}

export default memo(SectionNav);
