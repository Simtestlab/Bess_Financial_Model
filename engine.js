/* ============================================================
   BESS Financial Model — Calculation Engine (v2)
   ============================================================
   Implements the revised formula set with:
     • Separate charge / discharge pricing
     • Insurance, Variable O&M, Fixed O&M with inflation
     • Tax computation
     • Debt amortisation schedule
     • Unlevered & levered cash flows
   ============================================================ */

'use strict';

// ── Collect parameters from the DOM ─────────────────────────
function collectParams() {
    const v = (id) => parseFloat(document.getElementById(id).value) || 0;
    return {
        // Technical
        capacity: v('inp-capacity'),       // MWh usable
        arbDays: v('inp-arb-days'),        // days/yr
        availability: v('inp-availability') / 100,
        // cyclesPerDay removed — energyCharged no longer uses cycles per day
        rte: v('inp-rte') / 100,       // round-trip efficiency
        chargePrice: v('inp-charge-price'),    // $/MWh
        dischargePrice: v('inp-discharge-price'), // $/MWh

        // Revenue
        ppaVolume: v('inp-ppa-vol'),
        ppaPrice: v('inp-ppa-price'),
        ppaEsc: v('inp-ppa-esc') / 100,
        ancillaryRev: v('inp-ancillary'),
        otherRev: v('inp-other-rev'),

        // Cost
        capex: v('inp-capex'),
        insuranceRate: v('inp-insurance') / 100,
        varOmRate: v('inp-var-om') / 100,
        fixedOm: v('inp-fixed-om'),
        adminCost: v('inp-admin-cost'),
        preventiveMaintenance: v('inp-preventive-maintenance'),
        inflationRate: v('inp-inflation') / 100,

        // Financial
        projectLife: Math.max(5, Math.round(v('inp-project-life'))),
        // deprPeriod removed - now using projectLife for depreciation
        // Tax and discount rates hardcoded since UI inputs removed
        taxRate: 0.25,  // 25%
        discountRate: 0.08,  // 8%

        // Debt
        debtAmount: v('inp-debt-amount'),
        debtRate: v('inp-debt-rate') / 100,
        loanTerm: Math.max(1, Math.round(v('inp-loan-term'))),

        // Replacement & Degradation (commented out)
        // batReplYear: Math.max(1, Math.round(v('inp-repl-year'))),
        // batReplCost: v('inp-repl-cost'),
            degradation: (document.getElementById('inp-degradation') ? (v('inp-degradation') / 100) : 0.025),
    };
}

// ── Run the full financial model ────────────────────────────
function runModel(p) {
    const N = p.projectLife;
    const years = Array.from({ length: N }, (_, i) => i + 1);

    // ── Effective capacity (constant — degradation & replacement commented out) ──
        const effCapacity = [p.capacity];
        for (let y = 1; y < N; y++) {
            // Apply annual degradation to effective capacity
            effCapacity[y] = effCapacity[y - 1] * (1 - p.degradation);
        }
    // Original code with degradation:
    // const effCapacity = [p.capacity];
    // for (let y = 1; y < N; y++) {
    //     if (y + 1 === p.batReplYear) {
    //         effCapacity[y] = p.capacity; // reset at replacement
    //     } else {
    //         effCapacity[y] = effCapacity[y - 1] * (1 - p.degradation);
    //     }
    // }

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
        p.capex * p.insuranceRate * Math.pow(1 + p.inflationRate, y)
    );
    const varOm = years.map((_, y) =>
        totalRevenue[y] * p.varOmRate * Math.pow(1 + p.inflationRate, y)
    );
    const baseFixed = p.fixedOm + p.adminCost + p.preventiveMaintenance;
    const fixedOm = years.map((_, y) =>
        baseFixed * Math.pow(1 + p.inflationRate, y)
    );
    const totalOpex = years.map((_, y) =>
        insurance[y] + varOm[y] + fixedOm[y]
    );

    // ── Depreciation (straight-line over project life)
    // Changed to spread initial CAPEX evenly across the full project life
    const annualDepr = p.capex / p.projectLife;
    const depreciation = years.map((_, y) => y < p.projectLife ? annualDepr : 0);

    // Replacement battery depreciation (commented out)
    // const replDeprAnnual = p.batReplCost / p.deprPeriod;
    // const replDepr = years.map((_, y) => {
    //     const replIdx = p.batReplYear - 1;
    //     if (y >= replIdx && y < replIdx + p.deprPeriod) return replDeprAnnual;
    //     return 0;
    // });
    const totalDepr = depreciation;
    // Original: const totalDepr = years.map((_, y) => depreciation[y] + replDepr[y]);

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
    // Battery replacement (commented out)
    const batRepl = years.map(() => 0);
    // Original: const batRepl = years.map((_, y) => (y + 1 === p.batReplYear) ? p.batReplCost : 0);
    // Equipment replacement reserve removed; battery replacement also commented out.
    const totalCapex = years.map(() => 0);
    // Original: const totalCapex = years.map((_, y) => batRepl[y]);

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
        // Revenue
        sellRevenue, chargeCost, arbRevenue, ppaRevenue,
        ancillaryRev, otherRevenue, totalRevenue,
        // OPEX
        insurance, varOm, fixedOm, totalOpex,
        // Income Statement
        ebitda, totalDepr, ebit, debtInterest,
        ebt, tax, netIncome,
        // Cash Flow
        batRepl, totalCapex,
        unlNI, unlOCF, unlFCF, projectCF, cumCF,
        levOCF, levFCF, equityCF,
        // Debt
        debtOpening, debtPrincipal, debtClosing,
        // Metrics
        irr, npv, payback, equityIRR, equityNPV,
    };
}


/* ──────────────────────────────────────────────────────────────
   Financial Functions
   ────────────────────────────────────────────────────────────── */

function calcIRR(cashFlows, guess = 0.1, maxIter = 1000, tol = 1e-8) {
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

function calcNPV(rate, cashFlows) {
    let npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
        npv += cashFlows[t] / Math.pow(1 + rate, t);
    }
    return npv;
}

function calcPayback(cashFlows) {
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

function runSensitivity(baseParams, paramKey, multipliers) {
    return multipliers.map(m => {
        const p = { ...baseParams };
        p[paramKey] = baseParams[paramKey] * m;
        const model = runModel(p);
        return { multiplier: m, value: p[paramKey], model };
    });
}

function runDegradationSensitivity(baseParams, rates) {
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

function runEfficiencySensitivity(baseParams, efficiencies) {
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

// Tornado: vary each key param ±10% and measure IRR impact
function runTornadoSensitivity(baseParams) {
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
