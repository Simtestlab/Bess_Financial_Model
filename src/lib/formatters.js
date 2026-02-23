/* ============================================================
   Formatting Helpers
   ============================================================ */

/**
 * Format a value as currency with optional exchange rate
 * @param {number} val - Value to format
 * @param {string} symbol - Currency symbol (default: '$')
 * @param {number} exchangeRate - Exchange rate (default: 1)
 * @returns {string} Formatted currency string
 */
export function fmtDollar(val, symbol = '$', exchangeRate = 1) {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + Math.round(abs).toLocaleString('en-US');
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

/**
 * Format a value as currency with optional exchange rate
 * @param {number} val - Value to format
 * @param {string} symbol - Currency symbol (default: '$')
 * @param {number} exchangeRate - Exchange rate (default: 1)
 * @returns {string} Formatted currency string
 */
export function fmtCurrency(val, symbol = '$', exchangeRate = 1) {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + Math.round(abs).toLocaleString('en-US');
}
