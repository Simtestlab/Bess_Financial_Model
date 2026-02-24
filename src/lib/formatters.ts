/* ============================================================
   Formatting Helpers
   ============================================================
   
   CURRENCY SYSTEM:
   ----------------
   All values are stored internally in USD ($).
   When displaying, values are multiplied by the exchange rate.
   
   Example:
   - Stored value: 1000 USD
   - Exchange rate: 90.90 (1 USD = 90.90 INR)
   - Display value: 90,900 INR
   
   The exchange rate is fetched from the API based on user selection.
   ============================================================ */

/**
 * Format a value as currency with optional exchange rate
 * @param val - Value in USD (base currency)
 * @param symbol - Currency symbol to display (e.g., '$', '₹', '€')
 * @param exchangeRate - Conversion rate from USD to target currency
 */
export function fmtDollar(val: number | null | undefined, symbol: string = '$', exchangeRate: number = 1): string {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(val: number | null | undefined): string {
    if (val == null || isNaN(val)) return '—';
    return (val * 100).toFixed(2) + '%';
}

export function fmtYears(val: number | null | undefined): string {
    if (val == null || isNaN(val) || val > 100) return 'N/A';
    return val.toFixed(2) + ' yrs';
}

export function fmtMWh(val: number | null | undefined): string {
    if (val == null || isNaN(val)) return '—';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MWh';
}

/**
 * Format a value as currency with optional exchange rate
 * @param val - Value in USD (base currency)
 * @param symbol - Currency symbol to display (e.g., '$', '₹', '€')
 * @param exchangeRate - Conversion rate from USD to target currency
 */
export function fmtCurrency(val: number | null | undefined, symbol: string = '$', exchangeRate: number = 1): string {
    if (val == null || isNaN(val)) return '—';
    const convertedVal = val * exchangeRate;
    const abs = Math.abs(convertedVal);
    const sign = convertedVal < 0 ? '-' : '';
    if (abs >= 1e6) return sign + symbol + (abs / 1e6).toFixed(2) + 'M';
    return sign + symbol + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
