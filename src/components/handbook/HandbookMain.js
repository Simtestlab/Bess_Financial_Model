'use client';

export default function HandbookMain({ outputs }) {
    const o = outputs;

    return (
        <main id="hb-main" className="main-content">
            {/* Top KPI Strip */}
            <header className="top-bar">
                <div className="kpi-strip">
                    <div className="kpi-card kpi-irr">
                        <span className="kpi-label">Pack Energy</span>
                        <span id="out-packEnergy" className="kpi-value">
                            {o ? o.packEnergy.toFixed(2) + ' kWh' : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-npv">
                        <span className="kpi-label">Usable Energy</span>
                        <span id="out-usableEnergy" className="kpi-value">
                            {o ? o.usableEnergy.toFixed(2) + ' kWh' : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-payback">
                        <span className="kpi-label">Max Power</span>
                        <span id="out-maxPower" className="kpi-value">
                            {o ? o.maxPower.toFixed(2) + ' kW' : '--'}
                        </span>
                    </div>
                    <div className="kpi-card kpi-rev">
                        <span className="kpi-label">Design Status</span>
                        <span
                            id="out-designStatus"
                            className={`kpi-value hb-status-badge-live ${o ? o.designStatusClass : ''}`}
                        >
                            {o ? o.designStatus : '--'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Results Grid */}
            <div className="tab-panels" style={{ padding: '24px' }}>
                <div className="sensitivity-grid" style={{ marginBottom: '20px' }}>
                    {/* Cell & Module */}
                    <div className="sens-card">
                        <h3>🔬 Cell &amp; Module</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Cell Energy</td><td id="out-cellEnergy">{o ? o.cellEnergy.toFixed(1) + ' Wh' : '--'}</td></tr>
                                <tr><td>Module Voltage</td><td id="out-moduleVoltage">{o ? o.moduleVoltage.toFixed(1) + ' V' : '--'}</td></tr>
                                <tr><td>Module Capacity</td><td id="out-moduleCapacity">{o ? o.moduleCapacity.toFixed(1) + ' Ah' : '--'}</td></tr>
                                <tr><td>Module Energy</td><td id="out-moduleEnergy">{o ? o.moduleEnergy.toFixed(3) + ' kWh' : '--'}</td></tr>
                                <tr><td>Cells per Module</td><td id="out-cellsPerModule">{o ? o.cellsPerModule : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Pack / System */}
                    <div className="sens-card">
                        <h3>🏗️ Pack / System</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Pack Voltage</td><td id="out-packVoltage">{o ? o.packVoltage.toFixed(1) + ' V' : '--'}</td></tr>
                                <tr><td>Pack Capacity</td><td id="out-packCapacity">{o ? o.packCapacity.toFixed(1) + ' Ah' : '--'}</td></tr>
                                <tr><td>Pack Max Voltage</td><td id="out-packMaxVoltage">{o ? o.packMaxVoltage.toFixed(1) + ' V' : '--'}</td></tr>
                                <tr><td>Pack Min Voltage</td><td id="out-packMinVoltage">{o ? o.packMinVoltage.toFixed(1) + ' V' : '--'}</td></tr>
                                <tr><td>Total Cells</td><td id="out-totalCells">{o ? o.totalCells : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Rack Architecture */}
                    <div className="sens-card">
                        <h3>📦 Rack Architecture</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Number of Racks</td><td id="out-numRacks">{o ? o.numRacks : '--'}</td></tr>
                                <tr><td>Energy per Rack</td><td id="out-energyPerRack">{o ? o.energyPerRack.toFixed(2) + ' kWh' : '--'}</td></tr>
                                <tr><td>Total Modules</td><td id="out-totalModules">{o ? o.totalModules : '--'}</td></tr>
                                <tr><td>Modules per Rack</td><td id="out-modulesPerRack">{o ? o.modulesPerRack.toFixed(1) : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Electrical Performance */}
                    <div className="sens-card">
                        <h3>⚡ Electrical Performance</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Max Current</td><td id="out-maxCurrent">{o ? o.maxCurrent.toFixed(1) + ' A' : '--'}</td></tr>
                                <tr><td>Continuous Power</td><td id="out-continuousPower">{o ? o.continuousPower.toFixed(2) + ' kW' : '--'}</td></tr>
                                <tr><td>Peak Power</td><td id="out-peakPower">{o ? o.peakPower.toFixed(2) + ' kW' : '--'}</td></tr>
                                <tr><td>Discharge Time</td><td id="out-dischargeTime">{o ? o.dischargeTime.toFixed(2) + ' h' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Resistance & Heat */}
                    <div className="sens-card">
                        <h3>🔥 Resistance &amp; Heat</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Pack Resistance</td><td id="out-packResistance">{o ? o.packResistance.toFixed(4) + ' Ω' : '--'}</td></tr>
                                <tr><td>Heat Loss (I²R)</td><td id="out-heatLoss">{o ? o.heatLoss.toFixed(3) + ' kW' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* BMS & Protection */}
                    <div className="sens-card">
                        <h3>🛡️ BMS &amp; Protection</h3>
                        <table className="sens-table">
                            <tbody>
                                <tr><td>Total CMU</td><td id="out-totalCMU">{o ? o.totalCMU : '--'}</td></tr>
                                <tr><td>Pack Monitors</td><td id="out-packMonitors">{o ? o.packMonitors : '--'}</td></tr>
                                <tr><td>ICs per Rack</td><td id="out-icsPerRack">{o ? o.icsPerRack : '--'}</td></tr>
                                <tr><td>Daisy Chains</td><td id="out-daisyChains">{o ? o.daisyChains : '--'}</td></tr>
                                <tr><td>ICs per Chain</td><td id="out-icsPerChain">{o ? o.icsPerChain : '--'}</td></tr>
                                <tr><td>Contactor Rating</td><td id="out-contactorRating">{o ? o.contactorRating.toFixed(1) + ' A' : '--'}</td></tr>
                                <tr><td>Fuse Rating</td><td id="out-fuseRating">{o ? o.fuseRating.toFixed(1) + ' A' : '--'}</td></tr>
                                <tr><td>Peak Current</td><td id="out-peakCurrent">{o ? o.peakCurrent.toFixed(1) + ' A' : '--'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Design Checks */}
                <div className="sens-card" style={{ marginBottom: '20px' }}>
                    <h3>🚦 Design Checks</h3>
                    <table className="sens-table">
                        <tbody>
                            <tr>
                                <td>Required Modules</td>
                                <td id="out-requiredModules">{o ? o.requiredModules : '--'}</td>
                            </tr>
                            <tr>
                                <td>Module Status</td>
                                <td>
                                    <span
                                        id="out-designStatus2"
                                        className={`hb-status-badge-live ${o ? o.designStatusClass : ''}`}
                                    >
                                        {o ? o.designStatus : '--'}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td>Energy Status</td>
                                <td>
                                    <span
                                        id="out-energyStatus"
                                        className={`hb-status-badge-live ${o ? o.energyStatusClass : ''}`}
                                    >
                                        {o ? o.energyStatus : '--'}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
