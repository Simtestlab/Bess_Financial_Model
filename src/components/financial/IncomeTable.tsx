'use client';

import { fmtDollar, fmtMWh } from '@/lib/formatters';

export default function IncomeTable({ model, currencySymbol = '$', exchangeRate = 1 }) {
    const displayN = Math.min(model.N, 10);

    const rows = [
        { label: 'Revenue', cls: 'row-header', data: null },
        { label: '  Energy Charged', cls: '', data: model.energyCharged, format: 'mwh' },
        { label: '  Energy Sold', cls: '', data: model.energySold, format: 'mwh' },
        { label: '  Arbitrage Revenue', cls: '', data: model.arbRevenue },
        { label: '  PPA Revenue', cls: '', data: model.ppaRevenue },
        { label: '  Ancillary Services', cls: '', data: model.ancillaryRev },
        { label: '  Other Revenue', cls: '', data: model.otherRevenue },
        { label: 'Total Revenue', cls: 'row-total', data: model.totalRevenue },
        { label: '', cls: '', data: null },
        { label: 'Operating Expenses', cls: 'row-header', data: null },
        { label: '  Insurance', cls: 'row-negative', data: model.insurance },
        { label: '  Variable O&M', cls: 'row-negative', data: model.varOm },
        { label: '  Fixed O&M', cls: 'row-negative', data: model.fixedOm },
        { label: 'Total OPEX', cls: 'row-total', data: model.totalOpex },
        { label: '', cls: '', data: null },
        { label: 'EBITDA', cls: 'row-subtotal', data: model.ebitda },
        { label: '  Depreciation', cls: 'row-negative', data: model.totalDepr },
        { label: 'EBIT', cls: 'row-subtotal', data: model.ebit },
        { label: '  Interest Expense', cls: 'row-negative', data: model.debtInterest },
        { label: 'EBT', cls: 'row-subtotal', data: model.ebt },
        { label: '  Tax', cls: 'row-negative', data: model.tax },
        { label: 'Net Income', cls: 'row-total', data: model.netIncome },
    ];

    return (
        <div className="table-wrapper">
            <table id="tbl-income" className="fin-table">
                <thead>
                    <tr id="income-header">
                        <th>Line Item</th>
                        {Array.from({ length: displayN }, (_, y) => (
                            <th key={y}>Year {y + 1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody id="income-body">
                    {rows.map((row, idx) => {
                        if (row.label === '' && row.data === null) {
                            return (
                                <tr key={idx}>
                                    <td colSpan={displayN + 1} style={{ height: '8px', border: 'none' }}></td>
                                </tr>
                            );
                        }
                        return (
                            <tr key={idx} className={row.cls || undefined}>
                                <td>{row.label}</td>
                                {row.data
                                    ? Array.from({ length: displayN }, (_, y) => (
                                        <td key={y}>
                                            {row.format === 'mwh' ? fmtMWh(row.data[y]) : fmtDollar(row.data[y], currencySymbol, exchangeRate)}
                                        </td>
                                    ))
                                    : Array.from({ length: displayN }, (_, y) => <td key={y}></td>)
                                }
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
