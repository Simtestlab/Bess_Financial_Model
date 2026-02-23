'use client';

import { useMemo } from 'react';
import { fmtDollar, fmtPct } from '@/lib/formatters';
import {
    runModel,
    runSensitivity,
    runDegradationSensitivity,
    runEfficiencySensitivity,
    runTornadoSensitivity,
} from '@/lib/engine';
import TornadoChart from './TornadoChart';

export default function SensitivityPanel({ params, currencySymbol = '$', exchangeRate = 1 }) {
    const spreadLabels = ['-20%', 'Base', '+20%'];
    const spreadMults = [0.8, 1.0, 1.2];
    const capexLabels = ['-20%', 'Base', '+20%'];
    const effLabels = ['-5%', 'Base', '+5%'];

    // Spread sensitivity
    const spreadResults = useMemo(() => {
        return spreadMults.map((m) => {
            const p = { ...params, dischargePrice: params.dischargePrice * m };
            const spread = p.dischargePrice - p.chargePrice;
            const model = runModel(p);
            return { spread, model };
        });
    }, [params]);

    // CAPEX sensitivity
    const capexResults = useMemo(() => runSensitivity(params, 'capex', [0.8, 1.0, 1.2]), [params]);

    // Efficiency sensitivity
    const effResults = useMemo(() => {
        const effs = [params.rte * 0.95, params.rte, Math.min(1, params.rte * 1.05)];
        return runEfficiencySensitivity(params, effs);
    }, [params]);

    // Degradation sensitivity
    const degResults = useMemo(() => {
        return runDegradationSensitivity(params, [0.015, 0.025, 0.035]);
    }, [params]);

    return (
        <>
            <div className="sensitivity-grid">
                {/* Energy Price Spread */}
                <div className="sens-card">
                    <h3>Energy Price Spread</h3>
                    <table className="sens-table">
                        <thead>
                            <tr><th>Scenario</th><th>Spread</th><th>IRR</th><th>NPV</th></tr>
                        </thead>
                        <tbody id="sens-spread-body">
                            {spreadResults.map((r, i) => (
                                <tr key={i} className={i === 1 ? 'base-row' : ''}>
                                    <td>{spreadLabels[i]}</td>
                                    <td>${r.spread.toFixed(0)}/MWh</td>
                                    <td>{fmtPct(r.model.irr)}</td>
                                    <td>{fmtDollar(r.model.npv, currencySymbol, exchangeRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CAPEX Sensitivity */}
                <div className="sens-card">
                    <h3>CAPEX Sensitivity</h3>
                    <table className="sens-table">
                        <thead>
                            <tr><th>Scenario</th><th>CAPEX</th><th>IRR</th><th>NPV</th></tr>
                        </thead>
                        <tbody id="sens-capex-body">
                            {capexResults.map((r, i) => (
                                <tr key={i} className={i === 1 ? 'base-row' : ''}>
                                    <td>{capexLabels[i]}</td>
                                    <td>{fmtDollar(r.value, currencySymbol, exchangeRate)}</td>
                                    <td>{fmtPct(r.model.irr)}</td>
                                    <td>{fmtDollar(r.model.npv, currencySymbol, exchangeRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* System Efficiency */}
                <div className="sens-card">
                    <h3>System Efficiency</h3>
                    <table className="sens-table">
                        <thead>
                            <tr><th>Scenario</th><th>Efficiency</th><th>Yr 1 Revenue</th><th>IRR</th></tr>
                        </thead>
                        <tbody id="sens-eff-body">
                            {effResults.map((r, i) => (
                                <tr key={i} className={i === 1 ? 'base-row' : ''}>
                                    <td>{effLabels[i]}</td>
                                    <td>{(r.efficiency * 100).toFixed(1)}%</td>
                                    <td>{fmtDollar(r.yr1Revenue, currencySymbol, exchangeRate)}</td>
                                    <td>{fmtPct(r.model.irr)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Battery Degradation */}
                <div className="sens-card">
                    <h3>Battery Degradation</h3>
                    <table className="sens-table">
                        <thead>
                            <tr><th>Degradation</th><th>Yr 10 Capacity</th><th>IRR</th><th>NPV</th></tr>
                        </thead>
                        <tbody id="sens-degrad-body">
                            {degResults.map((r, i) => (
                                <tr key={i} className={i === 1 ? 'base-row' : ''}>
                                    <td>{(r.rate * 100).toFixed(1)}%</td>
                                    <td>{r.yr10Cap.toFixed(2)} MWh</td>
                                    <td>{fmtPct(r.model.irr)}</td>
                                    <td>{fmtDollar(r.model.npv, currencySymbol, exchangeRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="tornado-section">
                <h3>Tornado Chart — IRR Sensitivity (±10%)</h3>
                <div className="chart-container tornado-container">
                    <TornadoChart params={params} />
                </div>
            </div>
        </>
    );
}
