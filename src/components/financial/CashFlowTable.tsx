'use client';

import { memo } from 'react';
import { fmtDollar } from '@/lib/formatters';

function CashFlowTable({ model, currencySymbol = '$', exchangeRate = 1 }: any) {
    const displayN = Math.min(model.N, 10);

    const withY0 = (y0val: number, arr: number[]) => [y0val, ...arr.slice(0, displayN)];

    const rows = [
        { label: 'Unlevered (Project)', cls: 'row-header', data: null },
        { label: '  EBIT × (1 – Tax)', cls: '', data: withY0(0, model.unlNI) },
        { label: '  + Depreciation', cls: '', data: withY0(0, model.totalDepr) },
        { label: 'Unlevered OCF', cls: 'row-subtotal', data: withY0(0, model.unlOCF) },
        { label: '  Battery Replacement', cls: 'row-negative', data: withY0(0, model.batRepl) },
        {
            label: '  Initial CAPEX', cls: 'row-negative',
            data: [model.projectCF[0], ...Array(displayN).fill(0)]
        },
        { label: 'Free Cash Flow (FCF)', cls: 'row-total', data: model.projectCF.slice(0, displayN + 1) },
        { label: 'Cumulative CF', cls: 'row-subtotal', data: model.cumCF.slice(0, displayN + 1) },
        { label: '', cls: '', data: null },
        { label: 'Levered (Equity)', cls: 'row-header', data: null },
        { label: '  Net Income + Depr', cls: '', data: withY0(0, model.levOCF) },
        { label: '  – Principal', cls: 'row-negative', data: withY0(0, model.debtPrincipal) },
        { label: '  – CapEx Items', cls: 'row-negative', data: withY0(0, model.totalCapex) },
        { label: 'Equity Cash Flow', cls: 'row-total', data: model.equityCF.slice(0, displayN + 1) },
    ];

    return (
        <div className="table-wrapper">
            <table id="tbl-cashflow" className="fin-table">
                <thead>
                    <tr id="cf-header">
                        <th>Line Item</th>
                        <th>Year 0</th>
                        {Array.from({ length: displayN }, (_, y) => (
                            <th key={y}>Year {y + 1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody id="cf-body">
                    {rows.map((row, idx) => {
                        if (row.label === '' && row.data === null) {
                            return (
                                <tr key={idx}>
                                    <td colSpan={displayN + 2} style={{ height: '8px', border: 'none' }}></td>
                                </tr>
                            );
                        }
                        return (
                            <tr key={idx} className={row.cls || undefined}>
                                <td>{row.label}</td>
                                {row.data
                                    ? Array.from({ length: displayN + 1 }, (_, i) => (
                                        <td key={i}>{fmtDollar(row.data[i] || 0, currencySymbol, exchangeRate)}</td>
                                    ))
                                    : Array.from({ length: displayN + 1 }, (_, i) => <td key={i}></td>)
                                }
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default memo(CashFlowTable);
