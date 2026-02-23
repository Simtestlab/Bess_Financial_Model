/* ============================================================
   Formatting Helpers
   ============================================================ */

export function fmtDollar(val) {
    if (val == null || isNaN(val)) return '—';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    return sign + '$' + Math.round(abs).toLocaleString('en-US');
}

export function fmtPct(val) {
    if (val == null || isNaN(val)) return '—';
    return (val * 100).toFixed(1) + '%';
}

export function fmtYears(val) {
    if (val == null || isNaN(val) || val > 100) return 'N/A';
    return val.toFixed(1) + ' yrs';
}

export function fmtMWh(val) {
    if (val == null || isNaN(val)) return '—';
    return Math.round(val).toLocaleString('en-US') + ' MWh';
}

export function fmtCurrency(val) {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    return sign + '$' + Math.round(abs).toLocaleString('en-US');
}
