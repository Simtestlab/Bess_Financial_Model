/* ============================================================
   Currency Conversion Module
   ============================================================ */

const API_KEY = 'c75f00e5850069770866ca78';
const API_BASE = 'https://v6.exchangerate-api.com/v6';

export interface CurrencyOption {
    code: string;
    country: string;
    symbol: string;
}

interface ExchangeRateResponse {
    result: string;
    'error-type'?: string;
    conversion_rates: Record<string, number>;
}

// Popular countries and their currencies
export const CURRENCY_OPTIONS: CurrencyOption[] = [
    { code: 'USD', country: 'United States', symbol: '$' },
    { code: 'EUR', country: 'Eurozone', symbol: '€' },
    { code: 'GBP', country: 'United Kingdom', symbol: '£' },
    { code: 'JPY', country: 'Japan', symbol: '¥' },
    { code: 'AUD', country: 'Australia', symbol: 'A$' },
    { code: 'CAD', country: 'Canada', symbol: 'C$' },
    { code: 'CHF', country: 'Switzerland', symbol: 'CHF' },
    { code: 'CNY', country: 'China', symbol: '¥' },
    { code: 'INR', country: 'India', symbol: '₹' },
    { code: 'MXN', country: 'Mexico', symbol: '$' },
    { code: 'SGD', country: 'Singapore', symbol: 'S$' },
    { code: 'HKD', country: 'Hong Kong', symbol: 'HK$' },
    { code: 'NZD', country: 'New Zealand', symbol: 'NZ$' },
    { code: 'SEK', country: 'Sweden', symbol: 'kr' },
    { code: 'NOK', country: 'Norway', symbol: 'kr' },
    { code: 'IDR', country: 'Indonesia', symbol: 'Rp' },
];

// ── Rate cache (avoids redundant API calls within same session) ──
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// In-flight request deduplication
const inflightRequests = new Map<string, Promise<number>>();

/**
 * Fetch exchange rate from the given base currency to target currency.
 * Cached for 10 minutes and deduplicates concurrent requests.
 */
export async function getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    if (baseCurrency === targetCurrency) {
        return 1;
    }

    const cacheKey = `${baseCurrency}:${targetCurrency}`;

    // Check cache
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.rate;
    }

    // Deduplicate in-flight requests
    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
        return inflight;
    }

    const fetchPromise = (async () => {
        try {
            const url = `${API_BASE}/${API_KEY}/latest/${baseCurrency}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data: ExchangeRateResponse = await response.json();

            if (data.result === 'error') {
                throw new Error(data['error-type']);
            }

            const rate = data.conversion_rates[targetCurrency];
            if (!rate) {
                throw new Error(`Currency ${targetCurrency} not found`);
            }

            // Cache the result
            rateCache.set(cacheKey, { rate, timestamp: Date.now() });

            // Also cache all other rates from this response
            for (const [code, r] of Object.entries(data.conversion_rates)) {
                if (code !== baseCurrency) {
                    rateCache.set(`${baseCurrency}:${code}`, { rate: r, timestamp: Date.now() });
                }
            }

            return rate;
        } catch (error) {
            console.error('Failed to fetch exchange rate:', error);
            return 1; // Fallback to 1:1 if API fails
        } finally {
            inflightRequests.delete(cacheKey);
        }
    })();

    inflightRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
}

/**
 * Find currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyOption | null {
    return CURRENCY_OPTIONS.find(c => c.code === code) || null;
}
