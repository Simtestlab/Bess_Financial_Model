'use client';

import { useState } from 'react';
import { CurrencyProvider } from '@/lib/CurrencyContext';
import SectionNav from '@/components/SectionNav';
import FinancialSection from '@/components/financial/FinancialSection';
import HandbookSection from '@/components/handbook/HandbookSection';

export default function Home() {
  const [activeSection, setActiveSection] = useState('section-financial');

  return (
    <CurrencyProvider>
      <SectionNav activeSection={activeSection} setActiveSection={setActiveSection} />
      <div
        id="section-financial"
        className={`section-panel ${activeSection === 'section-financial' ? 'active' : ''}`}
      >
        <FinancialSection />
      </div>
      <div
        id="section-handbook"
        className={`section-panel ${activeSection === 'section-handbook' ? 'active' : ''}`}
      >
        <HandbookSection />
      </div>
    </CurrencyProvider>
  );
}
