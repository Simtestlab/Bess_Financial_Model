'use client';

import { useMemo, memo, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { fmtCurrency } from '@/lib/formatters';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

/* ── Color Palette ────────────────────────────────────────── */
const COLORS = {
    emerald: 'rgba(52, 211, 153, ##)',
    cyan: 'rgba(34, 211, 238, ##)',
    amber: 'rgba(251, 191, 36, ##)',
    violet: 'rgba(167, 139, 250, ##)',
    rose: 'rgba(251, 113, 133, ##)',
    blue: 'rgba(96, 165, 250, ##)',
    teal: 'rgba(45, 212, 191, ##)',
    orange: 'rgba(251, 146, 60, ##)',
};
function c(name: string, opacity = 1) {
    return COLORS[name].replace('##', String(opacity));
}

function ChartsPanel({ model, params, currencySymbol = '$', exchangeRate = 1 }: any) {
    const displayN = model ? Math.min(model.N, 10) : 0;

    // Helper function for formatting currency in chart callbacks
    const formatChartCurrency = useCallback((val: number) => fmtCurrency(val, currencySymbol, exchangeRate), [currencySymbol, exchangeRate]);

    // Memoize labels
    const yearLabels = useMemo(() => Array.from({ length: displayN }, (_, i) => `Year ${i + 1}`), [displayN]);
    const cfLabels = useMemo(() => model ? ['Year 0', ...model.years.map((y: number) => `Year ${y}`)] : [], [model?.years]);

    // Memoize chart data to avoid recreating large objects on every render
    const revenueData = useMemo(() => {
        if (!model) return null;
        return {
            labels: yearLabels,
            datasets: [
                { label: 'Arbitrage', data: model.arbRevenue.slice(0, displayN), backgroundColor: c('emerald', 0.8), borderColor: c('emerald'), borderWidth: 1 },
                { label: 'PPA', data: model.ppaRevenue.slice(0, displayN), backgroundColor: c('cyan', 0.8), borderColor: c('cyan'), borderWidth: 1 },
                { label: 'Ancillary', data: model.ancillaryRev.slice(0, displayN), backgroundColor: c('amber', 0.8), borderColor: c('amber'), borderWidth: 1 },
                { label: 'Other', data: model.otherRevenue.slice(0, displayN), backgroundColor: c('violet', 0.8), borderColor: c('violet'), borderWidth: 1 },
            ]
        };
    }, [model?.arbRevenue, model?.ppaRevenue, model?.ancillaryRev, model?.otherRevenue, yearLabels, displayN]);

    const fcfData = useMemo(() => {
        if (!model) return null;
        return {
            labels: cfLabels,
            datasets: [
                { label: 'Unlevered FCF', data: model.projectCF, borderColor: c('emerald'), backgroundColor: c('emerald', 0.1), fill: true, tension: 0.3, pointRadius: 3 },
                { label: 'Equity CF', data: model.equityCF, borderColor: c('cyan'), backgroundColor: c('cyan', 0.05), fill: false, tension: 0.3, pointRadius: 3, borderDash: [5, 3] },
            ]
        };
    }, [model?.projectCF, model?.equityCF, cfLabels]);

    const cumData = useMemo(() => {
        if (!model) return null;
        return {
            labels: cfLabels,
            datasets: [{
                label: 'Cumulative CF',
                data: model.cumCF,
                borderColor: c('teal'),
                backgroundColor: model.cumCF.map((v: number) => v >= 0 ? c('emerald', 0.3) : c('rose', 0.3)),
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: model.cumCF.map((v: number) => v >= 0 ? c('emerald') : c('rose')),
            }]
        };
    }, [model?.cumCF, cfLabels]);

    const capacityData = useMemo(() => {
        if (!model) return null;
        return {
            labels: model.years.map((y: number) => `Year ${y}`),
            datasets: [{
                label: 'Effective Capacity (MWh)',
                data: model.effCapacity,
                borderColor: c('amber'),
                backgroundColor: c('amber', 0.1),
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: c('amber'),
            }]
        };
    }, [model?.years, model?.effCapacity]);

    // Memoize chart options to avoid recreating on every render
    const revenueOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { stacked: true, ticks: { color: '#94a3b8', callback: (v: any) => formatChartCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${formatChartCurrency(ctx.parsed.y)}` } }
        }
    }), [formatChartCurrency]);

    const lineOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94a3b8', callback: (v: any) => formatChartCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${formatChartCurrency(ctx.parsed.y)}` } }
        }
    }), [formatChartCurrency]);

    const cumOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94a3b8', callback: (v: any) => formatChartCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
            tooltip: { callbacks: { label: (ctx: any) => `Cumulative: ${formatChartCurrency(ctx.parsed.y)}` } }
        }
    }), [formatChartCurrency]);

    const capacityOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' }, suggestedMin: 0 }
        },
        plugins: {
            legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.parsed.y.toFixed(2)} MWh` } }
        }
    }), []);

    if (!model || !revenueData || !fcfData || !cumData || !capacityData) return null;

    return (
        <div className="charts-grid">
            {/* Revenue Breakdown */}
            <div className="chart-card">
                <h3>Revenue Breakdown (Years 1–10)</h3>
                <div className="chart-container">
                    <Bar data={revenueData} options={revenueOptions} />
                </div>
            </div>

            {/* Free Cash Flow */}
            <div className="chart-card">
                <h3>Free Cash Flow Over Time</h3>
                <div className="chart-container">
                    <Line data={fcfData} options={lineOptions} />
                </div>
            </div>

            {/* Cumulative Net Cash Flow */}
            <div className="chart-card">
                <h3>Cumulative Net Cash Flow</h3>
                <div className="chart-container">
                    <Line data={cumData} options={cumOptions} />
                </div>
            </div>

            {/* Usable Capacity */}
            <div className="chart-card">
                <h3>Usable Capacity Over Time</h3>
                <div className="chart-container">
                    <Line data={capacityData} options={capacityOptions} />
                </div>
            </div>
        </div>
    );
}

export default memo(ChartsPanel);
