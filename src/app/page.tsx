'use client';

import { useState, lazy, Suspense, memo } from 'react';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import { SizingProvider } from '@/lib/SizingContext';
import SectionNav from '@/components/SectionNav';

// Lazy-load heavy sections so the inactive one doesn't mount immediately
const HandbookSection = lazy(() => import('@/components/handbook/HandbookSection'));
const FinancialSection = lazy(() => import('@/components/financial/FinancialSection'));

const SectionFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
    <span>Loading…</span>
  </div>
);

export default function Home() {
  const [activeSection, setActiveSection] = useState('section-handbook');

  return (
    <CurrencyProvider>
      <SizingProvider>
        <SectionNav activeSection={activeSection} setActiveSection={setActiveSection} />
        {/* Only render the active section — prevents the hidden section
            from mounting, running useEffects, and burning CPU */}
        {activeSection === 'section-handbook' && (
          <div id="section-handbook" className="section-panel active">
            <Suspense fallback={<SectionFallback />}>
              <HandbookSection />
            </Suspense>
          </div>
        )}
        {activeSection === 'section-financial' && (
          <div id="section-financial" className="section-panel active">
            <Suspense fallback={<SectionFallback />}>
              <FinancialSection />
            </Suspense>
          </div>
        )}
      </SizingProvider>
    </CurrencyProvider>
  );
}
