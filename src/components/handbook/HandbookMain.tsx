'use client';

function fmt(n: number, digits = 1): string {
    if (n == null || isNaN(n)) return '--';
    return n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtInt(n: number): string {
    if (n == null || isNaN(n)) return '--';
    return Math.round(n).toLocaleString('en-IN');
}

function fmtCurrency(n: number): string {
    if (n == null || isNaN(n)) return '--';
    return '₹ ' + Math.round(n).toLocaleString('en-IN');
}

export default function HandbookMain({ outputs }: { outputs: any }) {
    const o = outputs;

    return (
        <main id="hb-main" className="main-content">
            {/* Top KPI Strip */}
            <header className="top-bar">
                <div className="kpi-strip">
                    <div className="kpi-card kpi-irr">
                        <span className="kpi-label">Total Energy</span>
                        <span id="out-totalEnergy" className="kpi-value">
                            {o ? fmt(o.totalEnergy, 1) + ' kWh' : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-npv">
                        <span className="kpi-label">Delivered AC Energy</span>
                        <span id="out-deliveredAC" className="kpi-value">
                            {o ? fmt(o.deliveredACEnergy, 1) + ' kWh' : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-payback">
                        <span className="kpi-label">Total Racks</span>
                        <span id="out-totalRacks" className="kpi-value">
                            {o ? fmtInt(o.numberOfRacks) : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-rev">
                        <span className="kpi-label">Total Cell Cost</span>
                        <span id="out-totalCellCost" className="kpi-value">
                            {o ? fmtCurrency(o.totalCellCost) : '--'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Results Grid */}
            <div className="tab-panels" style={{ padding: '24px' }}>
                <div className="sensitivity-grid" style={{ marginBottom: '20px' }}>

                    {/* Calculated Parameters */}
                    <div className="sens-card">
                        <h3>⚡ Calculated Parameters</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Duration</td><td id="out-duration">{o ? fmt(o.duration, 2) + ' h' : '--'}</td></tr>
                                <tr><td>Required AC Energy</td><td id="out-reqACEnergy">{o ? fmt(o.requiredACEnergy, 1) + ' kWh' : '--'}</td></tr>
                                <tr><td>Cell Energy</td><td id="out-cellEnergy">{o ? fmt(o.cellEnergy, 1) + ' Wh' : '--'}</td></tr>
                                <tr><td>Cell Energy (kWh)</td><td id="out-cellEnergyKWh">{o ? fmt(o.cellEnergyKWh, 2) + ' kWh' : '--'}</td></tr>
                                <tr><td>Total Cells Required</td><td id="out-totalCellsReq">{o ? fmtInt(o.totalCellsRequired) + ' cells' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Module Level */}
                    <div className="sens-card">
                        <h3>🧩 Module Level</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Voltage of the Module</td><td id="out-moduleVoltage">{o ? fmt(o.moduleVoltage, 1) + ' V' : '--'}</td></tr>
                                <tr><td>Energy per Module</td><td id="out-moduleEnergy">{o ? fmt(o.moduleEnergy, 1) + ' Wh' : '--'}</td></tr>
                                <tr><td>Energy per Module (kWh)</td><td id="out-moduleEnergyKWh">{o ? fmt(o.moduleEnergyKWh, 2) + ' kWh' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Rack Level */}
                    <div className="sens-card">
                        <h3>📦 Rack Level</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Rack Voltage</td><td id="out-rackVoltage">{o ? fmt(o.rackVoltage, 1) + ' V' : '--'}</td></tr>
                                <tr><td>Energy per Rack</td><td id="out-energyPerRack">{o ? fmt(o.energyPerRack, 1) + ' kWh' : '--'}</td></tr>
                                <tr><td>Cells per Rack</td><td id="out-cellsPerRack">{o ? fmtInt(o.cellsPerRack) + ' cells' : '--'}</td></tr>
                                <tr><td>Number of Required Racks</td><td id="out-numRacks">{o ? fmtInt(o.numberOfRacks) + ' racks' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* System Totals */}
                    <div className="sens-card">
                        <h3>🏗️ System Totals</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Total Energy</td><td id="out-totalEnergy2">{o ? fmt(o.totalEnergy, 1) + ' kWh' : '--'}</td></tr>
                                <tr><td>Total Energy (MWh)</td><td id="out-totalEnergyMWh">{o ? fmt(o.totalEnergyMWh, 4) + ' MWh' : '--'}</td></tr>
                                <tr><td>Total Cells</td><td id="out-totalCells">{o ? fmtInt(o.totalCells) + ' cells' : '--'}</td></tr>
                                <tr><td>Total Cell Cost</td><td id="out-totalCellCost2">{o ? fmtCurrency(o.totalCellCost) : '--'}</td></tr>
                                <tr><td>Required Gross Energy</td><td id="out-grossEnergy">{o ? fmt(o.requiredGrossEnergy, 1) + ' kWh' : '--'}</td></tr>
                                <tr><td>Delivered AC Energy</td><td id="out-deliveredAC2">{o ? fmt(o.deliveredACEnergy, 1) + ' kWh' : '--'}</td></tr>
                                <tr><td>Total Modules Required</td><td id="out-totalModules">{o ? fmtInt(o.totalModulesRequired) + ' modules' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Module Cost Breakdown */}
                <div className="sens-card" style={{ marginBottom: '20px' }}>
                    <h3>💰 Module Cost Breakdown</h3>
                    <table className="sens-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Item</th>
                                <th>Quantity</th>
                                <th>Price (INR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Mechanical Housing</td>
                                <td>{o ? fmtInt(o.housingQty) : '--'}</td>
                                <td>{o ? fmtCurrency(o.housingPrice) : '--'}</td>
                            </tr>
                            <tr>
                                <td>LFP Cells</td>
                                <td>{o ? fmtInt(o.cellsQty) : '--'}</td>
                                <td>{o ? fmtCurrency(o.cellsPrice) : '--'}</td>
                            </tr>
                            <tr>
                                <td>Busbar</td>
                                <td>{o ? fmtInt(o.busbarQty) : '--'}</td>
                                <td>{o ? fmtCurrency(o.busbarPrice) : '--'}</td>
                            </tr>
                            <tr>
                                <td>CSC</td>
                                <td>{o ? fmtInt(o.cscQty) : '--'}</td>
                                <td>{o ? fmtCurrency(o.cscPrice) : '--'}</td>
                            </tr>
                            <tr className="row-total">
                                <td>Total per Module</td>
                                <td></td>
                                <td>{o ? fmtCurrency(o.totalModuleCost) : '--'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* System Cost Summary */}
                <div className="sens-card">
                    <h3>📊 System Cost Summary</h3>
                    <table className="sens-table">
                        <tbody>
                            <tr><td>Total Cell Cost</td><td id="out-sysCellCost">{o ? fmtCurrency(o.totalCellCost) : '--'}</td></tr>
                            <tr><td>Total Rack Cost</td><td id="out-sysRackCost">{o ? fmtCurrency(o.totalRackCost) : '--'}</td></tr>
                            <tr><td>Total Module Cost (All Modules)</td><td id="out-sysModCost">{o ? fmtCurrency(o.totalSystemModuleCost) : '--'}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
