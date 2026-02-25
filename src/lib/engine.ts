/* ============================================================
   BESS Financial Model — Calculation Engine (v2)
   ============================================================
   Pure computation module — no DOM dependencies.
   Implements the revised formula set with:
     • Separate charge / discharge pricing
     • Insurance, Variable O&M, Fixed O&M with inflation
     • Tax computation
     • Debt amortisation schedule
     • Unlevered & levered cash flows
   ============================================================ */

import costsConfig from '@/config/costs.json';

// ── Run the full financial model ────────────────────────────
export function runModel(p) {
    const N = p.projectLife;
    const years = Array.from({ length: N }, (_, i) => i + 1);

    // ── Effective capacity (with degradation) ──
    const effCapacity = [p.capacity];
    for (let y = 1; y < N; y++) {
        effCapacity[y] = effCapacity[y - 1] * (1 - p.degradation);
    }

    // ── Energy calculations ─────────────────────────────────
    const energyCharged = years.map((_, y) =>
        effCapacity[y] * p.arbDays * p.availability
    );
    const energySold = energyCharged.map(ec => ec * p.rte);

    // ── Revenue ─────────────────────────────────────────────
    const sellRevenue = energySold.map(es => es * p.dischargePrice);
    const chargeCost = energyCharged.map(ec => ec * p.chargePrice);
    const arbRevenue = sellRevenue.map((sr, y) => sr - chargeCost[y]);
    const ppaRevenue = years.map((_, y) =>
        p.ppaVolume * p.ppaPrice * Math.pow(1 + p.ppaEsc, y)
    );
    const ancillaryRev = years.map(() => p.ancillaryRev);
    const otherRevenue = years.map(() => p.otherRev);
    const totalRevenue = years.map((_, y) =>
        arbRevenue[y] + ppaRevenue[y] + ancillaryRev[y] + otherRevenue[y]
    );

    // ── Operating Expenses ──────────────────────────────────
    const insurance = years.map((_, y) =>
        p.capex * p.insuranceRate
    );
    // Variable O&M calculated as: variable O&M rate (currency/MWh) * annual throughput (MWh/yr)
    const annualThroughput = p.capacity * p.cyclesPerDay * 365; // MWh per year
    const varOm = years.map(() =>
        annualThroughput * p.varOmRate
    );
    const baseFixed = p.fixedOm + p.adminCost + p.preventiveMaintenance;
    const fixedOm = years.map((_, y) =>
        baseFixed * Math.pow(1 + p.inflationRate, y)
    );
    const totalOpex = years.map((_, y) =>
        insurance[y] + varOm[y] + fixedOm[y]
    );

    // ── Depreciation (straight-line over project life)
    const annualDepr = p.capex / p.projectLife;
    const depreciation = years.map((_, y) => y < p.projectLife ? annualDepr : 0);
    const totalDepr = depreciation;

    // ── Income Statement ────────────────────────────────────
    const ebitda = years.map((_, y) => totalRevenue[y] - totalOpex[y]);
    const ebit = years.map((_, y) => ebitda[y] - totalDepr[y]);

    // ── Debt Schedule ───────────────────────────────────────
    const principalAnnual = p.debtAmount / p.loanTerm;
    const debtOpening = [];
    const debtPrincipal = [];
    const debtInterest = [];
    const debtClosing = [];
    for (let y = 0; y < N; y++) {
        const opening = y === 0 ? p.debtAmount :
            debtClosing[y - 1] > 0 ? debtClosing[y - 1] : 0;
        const principal = opening > 0 && y < p.loanTerm ?
            Math.min(principalAnnual, opening) : 0;
        const interest = opening * p.debtRate;
        debtOpening.push(opening);
        debtPrincipal.push(principal);
        debtInterest.push(interest);
        debtClosing.push(opening - principal);
    }

    // ── Profitability ───────────────────────────────────────
    const ebt = years.map((_, y) => ebit[y] - debtInterest[y]);
    const tax = years.map((_, y) => ebt[y] > 0 ? ebt[y] * p.taxRate : 0);
    const netIncome = years.map((_, y) => ebt[y] - tax[y]);

    // ── Cash Flow — Investing Activities ────────────────────
    const batRepl = years.map(() => 0);
    const totalCapex = years.map(() => 0);

    // ── Unlevered (Project) Cash Flow ───────────────────────
    const unlNI = years.map((_, y) => ebit[y] * (1 - p.taxRate));
    const unlOCF = years.map((_, y) => unlNI[y] + totalDepr[y]);
    const unlFCF = years.map((_, y) => unlOCF[y] - totalCapex[y]);

    // Full FCF array including Year 0 (for IRR/NPV)
    const projectCF = [-p.capex, ...unlFCF];

    // Cumulative
    const cumCF = [];
    let cumSum = -p.capex;
    cumCF.push(cumSum);
    for (let y = 0; y < N; y++) {
        cumSum += unlFCF[y];
        cumCF.push(cumSum);
    }

    // ── Levered (Equity) Cash Flow ──────────────────────────
    const levOCF = years.map((_, y) => netIncome[y] + totalDepr[y]);
    const levFCF = years.map((_, y) =>
        levOCF[y] - totalCapex[y] - debtPrincipal[y]
    );
    const equityCF = [-(p.capex - p.debtAmount), ...levFCF];

    // ── Investment Metrics ──────────────────────────────────
    const irr = calcIRR(projectCF);
    const npv = calcNPV(p.discountRate, projectCF);
    const payback = calcPayback(projectCF);

    const equityIRR = calcIRR(equityCF);
    const equityNPV = calcNPV(p.discountRate, equityCF);

    return {
        N, years, effCapacity, energyCharged, energySold,
        sellRevenue, chargeCost, arbRevenue, ppaRevenue,
        ancillaryRev, otherRevenue, totalRevenue,
        insurance, varOm, fixedOm, totalOpex,
        ebitda, totalDepr, ebit, debtInterest,
        ebt, tax, netIncome,
        batRepl, totalCapex,
        unlNI, unlOCF, unlFCF, projectCF, cumCF,
        levOCF, levFCF, equityCF,
        debtOpening, debtPrincipal, debtClosing,
        irr, npv, payback, equityIRR, equityNPV,
    };
}


/* ──────────────────────────────────────────────────────────────
   Financial Functions
   ────────────────────────────────────────────────────────────── */

export function calcIRR(cashFlows, guess = 0.1, maxIter = 1000, tol = 1e-8) {
    let rate = guess;
    for (let i = 0; i < maxIter; i++) {
        let npv = 0, dnpv = 0;
        for (let t = 0; t < cashFlows.length; t++) {
            const factor = Math.pow(1 + rate, t);
            npv += cashFlows[t] / factor;
            dnpv -= t * cashFlows[t] / (factor * (1 + rate));
        }
        if (Math.abs(dnpv) < 1e-15) break;
        const newRate = rate - npv / dnpv;
        if (Math.abs(newRate - rate) < tol) return newRate;
        rate = newRate;
        if (rate < -0.99) rate = -0.5;
        if (rate > 10) rate = 1;
    }
    return rate;
}

export function calcNPV(rate, cashFlows) {
    let npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
    }
    return npv;
}

export function calcPayback(cashFlows) {
    let cum = 0;
    for (let t = 0; t < cashFlows.length; t++) {
        cum += cashFlows[t];
        if (cum >= 0 && t > 0) {
            const prev = cum - cashFlows[t];
            if (cashFlows[t] > 0) {
                return (t - 1) + (-prev / cashFlows[t]);
            }
            return t;
        }
    }
    return cashFlows.length;
}


/* ──────────────────────────────────────────────────────────────
   Sensitivity Analysis
   ────────────────────────────────────────────────────────────── */

export function runSensitivity(baseParams, paramKey, multipliers) {
    return multipliers.map(m => {
        const p = { ...baseParams };
        p[paramKey] = baseParams[paramKey] * m;
        const model = runModel(p);
        return { multiplier: m, value: p[paramKey], model };
    });
}

export function runDegradationSensitivity(baseParams, rates) {
    return rates.map(r => {
        const p = { ...baseParams, degradation: r };
        const model = runModel(p);
        return {
            rate: r,
            yr10Cap: p.capacity * Math.pow(1 - r, 9),
            model
        };
    });
}

export function runEfficiencySensitivity(baseParams, efficiencies) {
    return efficiencies.map(eff => {
        const p = { ...baseParams, rte: eff };
        const model = runModel(p);
        return {
            efficiency: eff,
            yr1Revenue: model.totalRevenue[0],
            model
        };
    });
}

export function runTornadoSensitivity(baseParams) {
    const baseModel = runModel(baseParams);
    const baseIRR = baseModel.irr;
    const params = [
        { key: 'dischargePrice', label: 'Discharge Price' },
        { key: 'chargePrice', label: 'Charge Price' },
        { key: 'capex', label: 'CAPEX' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'fixedOm', label: 'Fixed O&M' },
        { key: 'ppaPrice', label: 'PPA Price' },
    ];
    return params.map(({ key, label }) => {
        const pLow = { ...baseParams }; pLow[key] = baseParams[key] * 0.9;
        const pHigh = { ...baseParams }; pHigh[key] = baseParams[key] * 1.1;
        const irrLow = runModel(pLow).irr;
        const irrHigh = runModel(pHigh).irr;
        return { label, baseIRR, irrLow, irrHigh };
    });
}


/* ──────────────────────────────────────────────────────────────
   Parameter Helpers
   ────────────────────────────────────────────────────────────── */

export function computePPAVolume(params) {
    const cycles = params.cyclesPerDay || 0;
    return Math.round(params.capacity * cycles * params.arbDays * params.rte * params.availability);
}

export function computePPAPrice(ppaVolume, ppaRate) {
    // PPA Price = PPA Rate (₹/kWh) × 1000 (to convert to ₹/MWh)
    // This is the UNIT price, NOT annual revenue
    // Annual revenue = ppaVolume × ppaPrice is calculated in runModel
    return Math.round(ppaRate * 1000);
}

/* ──────────────────────────────────────────────────────────────
   DEFAULT INPUT VALUES
   NOTE: All monetary values are stored internally in INR (₹)
   The UI converts these to the selected currency for display
   Example: 1 INR ≈ 0.012 USD (rates fetched from API)
   ────────────────────────────────────────────────────────────── */
export const DEFAULTS = {
    // Technical Parameters
    capacity: 1.8,              // MWh (usable capacity)
    arbDays: 280,               // days
    availability: 98,           // %
    rte: 90,                    // % (Round-trip efficiency)
    
    // Energy Pricing (INR)
    // Note: UI accepts prices in ₹/kWh; defaults converted from config (which stores ₹/MWh)
    chargePrice: 3,               // ₹/kWh (UI)
    dischargePrice: 4.5,          // ₹/kWh (UI)
    
    // Revenue Parameters (INR)
    ppaVol: 3500,               // MWh/yr
    ppaRate: 6,                 // ₹/kWh (used to auto-calculate PPA Price)
    ppaPrice: costsConfig.financial.ppaPrice,                  // ₹/MWh (auto-calculated)
    ppaEsc: 0,                  // %
    ancillary: costsConfig.financial.ancillary,                // ₹/yr
    otherRev: costsConfig.financial.otherRev,                  // ₹/yr
    
    // Cost & Investment (INR)
    capex: costsConfig.financial.capex,                        // ₹ (Total CAPEX - can import from BESS Sizing)
    insurance: 0.3,             // %
    varOm: 90,                  // ₹/MWh (Variable O&M rate - currency per MWh)
    fixedOm: costsConfig.financial.fixedOm,                    // ₹/yr
    inflation: 3.0,             // %
    adminCost: 0,                // ₹/yr
    preventiveMaintenance: 0,    // ₹/yr
    projectLife: 20,            // years
    degradation: 3.0,           // %
    cyclesPerDay: 1,            // cycles/day
    
    // Debt Financing (INR)
    debtAmount: 24901850,                                      // ₹
    debtRate: 7,                // %
    loanTerm: 10,               // years
    
    // Tax
    taxRate: 30,                // %
};

export function buildParams(inputs: any): any {
    const p: any = {
        capacity: inputs.capacity,
        arbDays: inputs.arbDays,
        availability: inputs.availability / 100,
        cyclesPerDay: inputs.cyclesPerDay,
        rte: inputs.rte / 100,
        // Convert UI values (₹/kWh) to internal engine units (₹/MWh)
        chargePrice: inputs.chargePrice * 1000,
        dischargePrice: inputs.dischargePrice * 1000,
        ppaRate: inputs.ppaRate,
        ppaEsc: inputs.ppaEsc / 100,
        ancillaryRev: inputs.ancillary,
        otherRev: inputs.otherRev,
        capex: inputs.capex,
        insuranceRate: inputs.insurance / 100,
        varOmRate: inputs.varOm,
        fixedOm: inputs.fixedOm,
        adminCost: inputs.adminCost,
        preventiveMaintenance: inputs.preventiveMaintenance,
        inflationRate: inputs.inflation / 100,
        projectLife: Math.max(5, Math.round(inputs.projectLife)),
        taxRate: inputs.taxRate / 100,
        discountRate: 0,  // Discount rate removed - NPV shows undiscounted total cash flow
        debtAmount: inputs.debtAmount,
        debtRate: inputs.debtRate / 100,
        loanTerm: Math.max(1, Math.round(inputs.loanTerm)),
        degradation: inputs.degradation / 100,
    };
    p.ppaVolume = computePPAVolume(p);
    p.ppaPrice = computePPAPrice(p.ppaVolume, p.ppaRate);
    return p;
}
