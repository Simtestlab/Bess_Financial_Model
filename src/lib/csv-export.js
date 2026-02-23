/* CSV Export Utility */
import { fmtPct } from './formatters';

export function exportCSV(model) {
    const N = model.N;
    let csv = 'Line Item,Year 0';
    for (let y = 1; y <= N; y++) csv += `,Year ${y}`;
    csv += '\n\nINCOME STATEMENT\n';
    const addRow = (label, data) => {
        csv += label + ',';
        for (let y = 0; y < N; y++) csv += ',' + (data ? Math.round(data[y]) : '');
        csv += '\n';
    };
    addRow('Arbitrage Revenue', model.arbRevenue);
    addRow('PPA Revenue', model.ppaRevenue);
    addRow('Ancillary Services', model.ancillaryRev);
    addRow('Other Revenue', model.otherRevenue);
    addRow('Total Revenue', model.totalRevenue);
    addRow('Insurance', model.insurance);
    addRow('Variable O&M', model.varOm);
    addRow('Fixed O&M', model.fixedOm);
    addRow('Total OPEX', model.totalOpex);
    addRow('EBITDA', model.ebitda);
    addRow('Depreciation', model.totalDepr);
    addRow('EBIT', model.ebit);
    addRow('Interest', model.debtInterest);
    addRow('EBT', model.ebt);
    addRow('Tax', model.tax);
    addRow('Net Income', model.netIncome);

    csv += '\nCASH FLOW\n';
    const addRowCF = (label, data) => {
        csv += label;
        for (let i = 0; i < data.length; i++) csv += ',' + Math.round(data[i]);
        csv += '\n';
    };
    addRowCF('Free Cash Flow', model.projectCF);
    addRowCF('Cumulative CF', model.cumCF);
    addRowCF('Equity CF', model.equityCF);

    csv += `\nMETRICS\nProject IRR,${fmtPct(model.irr)}\n`;
    csv += `NPV,${Math.round(model.npv)}\nPayback,${model.payback.toFixed(1)} years\n`;
    csv += `Equity IRR,${fmtPct(model.equityIRR)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bess_financial_model.csv'; a.click();
    URL.revokeObjectURL(url);
}
