/* ============================================================
   Formatting Helpers
   ============================================================ */

/**
 * Format a value as currency with optional exchange rate
 */
export function fmtDollar(val: number | null | undefined, symbol: string = '$', exchangeRate: number = 1): string {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + Math.round(abs).toLocaleString('en-US');
}

export function fmtPct(val: number | null | undefined): string {
    if (val == null || isNaN(val)) return '—';
    return (val * 100).toFixed(1) + '%';
}

export function fmtYears(val: number | null | undefined): string {
    if (val == null || isNaN(val) || val > 100) return 'N/A';
    return val.toFixed(1) + ' yrs';
}

export function fmtMWh(val: number | null | undefined): string {
    if (val == null || isNaN(val)) return '—';
    return Math.round(val).toLocaleString('en-US') + ' MWh';
}

/**
 * Format a value as currency with optional exchange rate
 */
export function fmtCurrency(val: number | null | undefined, symbol: string = '$', exchangeRate: number = 1): string {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + Math.round(abs).toLocaleString('en-US');
}
