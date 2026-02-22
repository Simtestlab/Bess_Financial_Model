/* ============================================================
   BESS Financial Model — Chart Module (v2)
   ============================================================
   Uses Chart.js 4.x for all visualisations.
   ============================================================ */

'use strict';

/* ── Color Palette ───────────────────────────────────────────── */
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
function c(name, opacity = 1) {
    return COLORS[name].replace('##', opacity);
}

// Chart instances
let chartRevenue = null;
let chartCashflow = null;
let chartCumulative = null;
let chartCapacity = null;
let chartTornado = null;

function fmtCurrency(val) {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    return sign + '$' + Math.round(abs).toLocaleString('en-US');
}

/* ── Render all charts ───────────────────────────────────────── */
function renderCharts(model) {
    renderRevenueChart(model);
    renderCashflowChart(model);
    renderCumulativeChart(model);
    renderCapacityChart(model);
}

/* ── Revenue Breakdown (stacked bar) ─────────────────────────── */
function renderRevenueChart(model) {
    const displayN = Math.min(model.N, 10);
    const labels = Array.from({ length: displayN }, (_, i) => `Year ${i + 1}`);

    const data = {
        labels,
        datasets: [
            { label: 'Arbitrage', data: model.arbRevenue.slice(0, displayN), backgroundColor: c('emerald', 0.8), borderColor: c('emerald'), borderWidth: 1 },
            { label: 'PPA', data: model.ppaRevenue.slice(0, displayN), backgroundColor: c('cyan', 0.8), borderColor: c('cyan'), borderWidth: 1 },
            { label: 'Ancillary', data: model.ancillaryRev.slice(0, displayN), backgroundColor: c('amber', 0.8), borderColor: c('amber'), borderWidth: 1 },
            { label: 'Other', data: model.otherRevenue.slice(0, displayN), backgroundColor: c('violet', 0.8), borderColor: c('violet'), borderWidth: 1 },
        ]
    };

    const config = {
        type: 'bar',
        data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { stacked: true, ticks: { color: '#94a3b8', callback: v => fmtCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}` } }
            }
        }
    };

    const ctx = document.getElementById('chart-revenue');
    if (chartRevenue) chartRevenue.destroy();
    chartRevenue = new Chart(ctx, config);
}

/* ── Free Cash Flow line chart ───────────────────────────────── */
function renderCashflowChart(model) {
    const labels = ['Year 0', ...model.years.map(y => `Year ${y}`)];
    const data = {
        labels,
        datasets: [
            { label: 'Unlevered FCF', data: model.projectCF, borderColor: c('emerald'), backgroundColor: c('emerald', 0.1), fill: true, tension: 0.3, pointRadius: 3 },
            { label: 'Equity CF', data: model.equityCF, borderColor: c('cyan'), backgroundColor: c('cyan', 0.05), fill: false, tension: 0.3, pointRadius: 3, borderDash: [5, 3] },
        ]
    };

    const config = {
        type: 'line', data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#94a3b8', callback: v => fmtCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}` } }
            }
        }
    };

    const ctx = document.getElementById('chart-cashflow');
    if (chartCashflow) chartCashflow.destroy();
    chartCashflow = new Chart(ctx, config);
}

/* ── Cumulative Net Cash Flow ────────────────────────────────── */
function renderCumulativeChart(model) {
    const labels = ['Year 0', ...model.years.map(y => `Year ${y}`)];
    const colors = model.cumCF.map(v => v >= 0 ? c('emerald', 0.3) : c('rose', 0.3));

    const data = {
        labels,
        datasets: [{
            label: 'Cumulative CF',
            data: model.cumCF,
            borderColor: c('teal'),
            backgroundColor: colors,
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: model.cumCF.map(v => v >= 0 ? c('emerald') : c('rose')),
        }]
    };

    const config = {
        type: 'line', data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#94a3b8', callback: v => fmtCurrency(v) }, grid: { color: 'rgba(255,255,255,0.06)' } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => `Cumulative: ${fmtCurrency(ctx.parsed.y)}` } }
            }
        }
    };

    const ctx = document.getElementById('chart-cumulative');
    if (chartCumulative) chartCumulative.destroy();
    chartCumulative = new Chart(ctx, config);
}

/* ── Usable Capacity ─────────────────────────────────────────── */
function renderCapacityChart(model) {
    const labels = model.years.map(y => `Year ${y}`);
    const data = {
        labels,
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

    const config = {
        type: 'line', data,
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.06)' }, suggestedMin: 0 }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)} MWh` } }
            }
        }
    };

    const ctx = document.getElementById('chart-capacity');
    if (chartCapacity) chartCapacity.destroy();
    chartCapacity = new Chart(ctx, config);
}

/* ── Tornado Chart ───────────────────────────────────────────── */
function renderTornadoChart(params) {
    const results = runTornadoSensitivity(params);
    const baseIRR = results[0].baseIRR;
    const labels = results.map(r => r.label);

    // Compute deviations from base
    const lowDeltas = results.map(r => (r.irrLow - baseIRR) * 100);
    const highDeltas = results.map(r => (r.irrHigh - baseIRR) * 100);

    // Sort by total range (largest first)
    const indices = labels.map((_, i) => i);
    indices.sort((a, b) => {
        const rangeA = Math.abs(highDeltas[a] - lowDeltas[a]);
        const rangeB = Math.abs(highDeltas[b] - lowDeltas[b]);
        return rangeB - rangeA;
    });

    const sortedLabels = indices.map(i => labels[i]);
    const sortedLow = indices.map(i => lowDeltas[i]);
    const sortedHigh = indices.map(i => highDeltas[i]);

    const data = {
        labels: sortedLabels,
        datasets: [
            { label: '-10%', data: sortedLow, backgroundColor: c('rose', 0.7), borderColor: c('rose'), borderWidth: 1 },
            { label: '+10%', data: sortedHigh, backgroundColor: c('emerald', 0.7), borderColor: c('emerald'), borderWidth: 1 },
        ]
    };

    const config = {
        type: 'bar', data,
        options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#94a3b8', callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' pp' },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    title: { display: true, text: 'IRR Change (percentage points)', color: '#94a3b8' }
                },
                y: { ticks: { color: '#e2e8f0', font: { weight: 500 } }, grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const sign = ctx.parsed.x >= 0 ? '+' : '';
                            return `${ctx.dataset.label}: ${sign}${ctx.parsed.x.toFixed(2)} pp → IRR ${((baseIRR + ctx.parsed.x / 100) * 100).toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    };

    const ctx = document.getElementById('chart-tornado');
    if (chartTornado) chartTornado.destroy();
    chartTornado = new Chart(ctx, config);
}
