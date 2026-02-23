/* ============================================================
   BESS Financial Model — Application Controller (v2)
   ============================================================ */

'use strict';

/* ── Formatting Helpers ─────────────────────────────────────── */
function fmtDollar(val) {
    if (val == null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    return sign + '$' + Math.round(abs).toLocaleString('en-US');
}
function fmtPct(val) {
    if (val == null || isNaN(val)) return '—';
    return (val * 100).toFixed(1) + '%';
}
function fmtYears(val) {
    if (val == null || isNaN(val) || val > 100) return 'N/A';
    return val.toFixed(1) + ' yrs';
}
function fmtMWh(val) {
    if (val == null || isNaN(val)) return '—';
    return Math.round(val).toLocaleString('en-US') + ' MWh';
}

/* ── DOM Helpers ─────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ── Section Navigation (Top-Level) ────────────────────────── */
function initSectionNav() {
    $$('.section-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update tab buttons
            $$('.section-tab').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            // Show/hide section panels
            $$('.section-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(btn.dataset.section);
            if (panel) panel.classList.add('active');
        });
    });
}

/* ── Slider Value Displays ──────────────────────────────────── */
function initSliders() {
    $$('.slider-val').forEach(span => {
        const inputId = span.dataset.for;
        const input = document.getElementById(inputId);
        if (!input) return;
        const update = () => {
            span.textContent = parseFloat(input.value).toFixed(1) + '%';
        };
        input.addEventListener('input', update);
        update();
    });
}

/* ── Tab Navigation ─────────────────────────────────────────── */
function initTabs() {
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            $$('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(btn.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });
}

/* ── Sidebar Toggle ─────────────────────────────────────────── */
function initSidebarToggle() {
    const sidebar = $('#sidebar');
    const main = $('#main-content');
    const btn = $('#btn-sidebar-toggle');
    btn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('open');
        main.classList.toggle('expanded');
    });
    if (window.innerWidth <= 1024) {
        sidebar.classList.add('collapsed');
        main.classList.add('expanded');
    }
}

/* ── Reset to Defaults ──────────────────────────────────────── */
const DEFAULTS = {
    'inp-capacity': 8.5, 'inp-arb-days': 280,
    'inp-availability': 98,
    'inp-rte': 90, 'inp-charge-price': 30, 'inp-discharge-price': 75,
    'inp-ppa-vol': 3500, 'inp-ppa-price': 80, 'inp-ppa-esc': 3,
    'inp-ancillary': 120000, 'inp-other-rev': 50000,
    'inp-capex': 2750000, 'inp-insurance': 1, 'inp-var-om': 1,
    'inp-fixed-om': 120000, 'inp-inflation': 3,
    'inp-admin-cost': 20000, 'inp-preventive-maintenance': 30000,
    'inp-project-life': 25,
    'inp-degradation': 2.5,
    'inp-cycles-per-day': 1.5,
    'inp-debt-amount': 1500000, 'inp-debt-rate': 5, 'inp-loan-term': 10,
    'inp-tax-rate': 25, 'inp-discount-rate': 8,
};

function resetDefaults() {
    for (const [id, val] of Object.entries(DEFAULTS)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    $$('.slider-val').forEach(span => {
        const input = document.getElementById(span.dataset.for);
        if (input) span.textContent = parseFloat(input.value).toFixed(1) + '%';
    });
    recalculate();
}

/* ── Table Renderers ────────────────────────────────────────── */
function renderIncomeTable(model) {
    const displayN = Math.min(model.N, 10);
    const header = document.getElementById('income-header');
    const body = document.getElementById('income-body');

    let hhtml = '<th>Line Item</th>';
    for (let y = 0; y < displayN; y++) hhtml += `<th>Year ${y + 1}</th>`;
    header.innerHTML = hhtml;

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

    let bhtml = '';
    for (const row of rows) {
        if (row.label === '' && row.data === null) {
            bhtml += '<tr><td colspan="' + (displayN + 1) + '" style="height:8px;border:none;"></td></tr>';
            continue;
        }
        const cls = row.cls ? ` class="${row.cls}"` : '';
        bhtml += `<tr${cls}><td>${row.label}</td>`;
        if (row.data) {
            for (let y = 0; y < displayN; y++) {
                const v = row.data[y];
                const cell = row.format === 'mwh' ? fmtMWh(v) : fmtDollar(v);
                bhtml += `<td>${cell}</td>`;
            }
        } else {
            for (let y = 0; y < displayN; y++) bhtml += '<td></td>';
        }
        bhtml += '</tr>';
    }
    body.innerHTML = bhtml;
}

function renderCashFlowTable(model) {
    const displayN = Math.min(model.N, 10);
    const header = document.getElementById('cf-header');
    const body = document.getElementById('cf-body');

    let hhtml = '<th>Line Item</th><th>Year 0</th>';
    for (let y = 0; y < displayN; y++) hhtml += `<th>Year ${y + 1}</th>`;
    header.innerHTML = hhtml;

    // Helper to prepend Year 0 value
    const withY0 = (y0val, arr) => [y0val, ...arr.slice(0, displayN)];

    const rows = [
        { label: 'Unlevered (Project)', cls: 'row-header', data: null },
        { label: '  EBIT × (1 – Tax)', cls: '', data: withY0(0, model.unlNI) },
        { label: '  + Depreciation', cls: '', data: withY0(0, model.totalDepr) },
        { label: 'Unlevered OCF', cls: 'row-subtotal', data: withY0(0, model.unlOCF) },
        { label: '  Battery Replacement', cls: 'row-negative', data: withY0(0, model.batRepl) },
        { label: '  Initial CAPEX', cls: 'row-negative', data: withY0(-model.projectCF[0] * -1, Array(displayN).fill(0)).map((v, i) => i === 0 ? model.projectCF[0] : 0) },
        { label: 'Free Cash Flow (FCF)', cls: 'row-total', data: model.projectCF.slice(0, displayN + 1) },
        { label: 'Cumulative CF', cls: 'row-subtotal', data: model.cumCF.slice(0, displayN + 1) },
        { label: '', cls: '', data: null },
        { label: 'Levered (Equity)', cls: 'row-header', data: null },
        { label: '  Net Income + Depr', cls: '', data: withY0(0, model.levOCF) },
        { label: '  – Principal', cls: 'row-negative', data: withY0(0, model.debtPrincipal) },
        { label: '  – CapEx Items', cls: 'row-negative', data: withY0(0, model.totalCapex) },
        { label: 'Equity Cash Flow', cls: 'row-total', data: model.equityCF.slice(0, displayN + 1) },
    ];

    let bhtml = '';
    for (const row of rows) {
        if (row.label === '' && row.data === null) {
            bhtml += '<tr><td colspan="' + (displayN + 2) + '" style="height:8px;border:none;"></td></tr>';
            continue;
        }
        const cls = row.cls ? ` class="${row.cls}"` : '';
        bhtml += `<tr${cls}><td>${row.label}</td>`;
        if (row.data) {
            for (let i = 0; i < displayN + 1; i++) {
                bhtml += `<td>${fmtDollar(row.data[i] || 0)}</td>`;
            }
        } else {
            for (let i = 0; i < displayN + 1; i++) bhtml += '<td></td>';
        }
        bhtml += '</tr>';
    }
    body.innerHTML = bhtml;
}

/* ── Sensitivity Tables ─────────────────────────────────────── */
function renderSensitivityTables(params) {
    // Spread sensitivity — vary discharge price to change spread
    const spreadLabels = ['-20%', 'Base', '+20%'];
    const spreadMults = [0.8, 1.0, 1.2];
    let html = '';
    spreadMults.forEach((m, i) => {
        const p = { ...params, dischargePrice: params.dischargePrice * m };
        const spread = p.dischargePrice - p.chargePrice;
        const model = runModel(p);
        const cls = i === 1 ? ' class="base-row"' : '';
        html += `<tr${cls}><td>${spreadLabels[i]}</td><td>$${spread.toFixed(0)}/MWh</td><td>${fmtPct(model.irr)}</td><td>${fmtDollar(model.npv)}</td></tr>`;
    });
    document.getElementById('sens-spread-body').innerHTML = html;

    // CAPEX sensitivity
    const capexResults = runSensitivity(params, 'capex', [0.8, 1.0, 1.2]);
    html = '';
    capexResults.forEach((r, i) => {
        const cls = i === 1 ? ' class="base-row"' : '';
        html += `<tr${cls}><td>${spreadLabels[i]}</td><td>${fmtDollar(r.value)}</td><td>${fmtPct(r.model.irr)}</td><td>${fmtDollar(r.model.npv)}</td></tr>`;
    });
    document.getElementById('sens-capex-body').innerHTML = html;

    // Efficiency
    const effLabels = ['-5%', 'Base', '+5%'];
    const effs = [params.rte * 0.95, params.rte, Math.min(1, params.rte * 1.05)];
    const effResults = runEfficiencySensitivity(params, effs);
    html = '';
    effResults.forEach((r, i) => {
        const cls = i === 1 ? ' class="base-row"' : '';
        html += `<tr${cls}><td>${effLabels[i]}</td><td>${(r.efficiency * 100).toFixed(1)}%</td><td>${fmtDollar(r.yr1Revenue)}</td><td>${fmtPct(r.model.irr)}</td></tr>`;
    });
    document.getElementById('sens-eff-body').innerHTML = html;

    // Degradation
    const degRates = [0.015, 0.025, 0.035];
    const degResults = runDegradationSensitivity(params, degRates);
    html = '';
    degResults.forEach((r, i) => {
        const cls = i === 1 ? ' class="base-row"' : '';
        html += `<tr${cls}><td>${(r.rate * 100).toFixed(1)}%</td><td>${r.yr10Cap.toFixed(2)} MWh</td><td>${fmtPct(r.model.irr)}</td><td>${fmtDollar(r.model.npv)}</td></tr>`;
    });
    document.getElementById('sens-degrad-body').innerHTML = html;
}

/* ── KPI Update ─────────────────────────────────────────────── */
function updateKPIs(model, params) {
    document.getElementById('kpi-irr').textContent = fmtPct(model.irr);
    document.getElementById('kpi-npv').textContent = fmtDollar(model.npv);
    document.getElementById('kpi-npv-rate').textContent = (params.discountRate * 100).toFixed(0);
    document.getElementById('kpi-payback').textContent = fmtYears(model.payback);
    document.getElementById('kpi-rev').textContent = fmtDollar(model.totalRevenue[0]);
}

/* ── CSV Export ──────────────────────────────────────────────── */
function exportCSV(model) {
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

/* ── Main Recalculation ─────────────────────────────────────── */
let recalcTimer = null;

function recalculate() {
    let params = collectParams();
    if (typeof finalizeParams === 'function') params = finalizeParams(params);
    const model = runModel(params);
    updateKPIs(model, params);
    renderIncomeTable(model);
    renderCashFlowTable(model);
    renderSensitivityTables(params);
    renderCharts(model);
    renderTornadoChart(params);
}

function debouncedRecalc() {
    clearTimeout(recalcTimer);
    recalcTimer = setTimeout(recalculate, 80);
}

/* ── Initialisation ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initSectionNav();
    initSliders();
    initTabs();
    initSidebarToggle();

    $$('#sidebar input').forEach(input => {
        input.addEventListener('input', debouncedRecalc);
        input.addEventListener('change', recalculate);
    });

    document.getElementById('btn-reset').addEventListener('click', resetDefaults);
    document.getElementById('btn-export').addEventListener('click', () => {
        const params = collectParams();
        const model = runModel(params);
        exportCSV(model);
    });

    recalculate();
});
