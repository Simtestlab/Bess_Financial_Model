/* ============================================================
    BESS Sizing — Calculator Engine  (matches BESS.xlsx exactly)
    ============================================================
    Pure computation module — no DOM dependencies.
    Implements the exact formulas from the Excel template.
    ============================================================ */

export const HANDBOOK_DEFAULTS = {
    cellChemistry: 'LFP',
    cellCapacity: 100,        // Ah
    nominalVoltage: 3.2,      // V
    systemMW: 2,              // MW
    cRate: 1,                 // C
    cellsPerModule: 12,       // cells
    modulesPerRack: 20,       // modules
    cellCost: 2700,           // INR per cell
    dod: 0.9,                 // 0-1
    efficiency: 0.98,         // 0-1
    moduleHousingCost: 10000, // INR
    eod: 0.8,                 // End-of-life factor 0-1
    rackCost: 120000,         // INR per rack
    busbarCost: 250,          // INR per busbar
    cscCost: 10000,           // INR per CSC
};

export function calculateBESS(inp: typeof HANDBOOK_DEFAULTS) {
    // ── Calculated Parameters (Column E in Excel) ──────────────

    // E2: Duration = 1 / C-rate
    const duration = 1 / inp.cRate;

    // E3: Required AC Energy = System(MW) × Duration × 1000  → kWh
    const requiredACEnergy = inp.systemMW * duration * 1000;

    // E4: Cell Energy = Nominal Voltage × Cell Capacity  → Wh
    const cellEnergy = inp.nominalVoltage * inp.cellCapacity;

    // E5: Cell Energy in kWh
    const cellEnergyKWh = cellEnergy / 1000;

    // E6: Total Cells Required (raw, before rack rounding)
    const totalCellsRequired = requiredACEnergy / cellEnergyKWh;

    // E7: Voltage of the Module = Cells per module × Nominal Voltage  → V
    const moduleVoltage = inp.cellsPerModule * inp.nominalVoltage;

    // E8: Energy per Module = Module Voltage × Cell Capacity  → Wh
    const moduleEnergy = moduleVoltage * inp.cellCapacity;

    // E9: Energy Module in kWh
    const moduleEnergyKWh = moduleEnergy / 1000;

    // E10: Rack Voltage = Modules per Rack × Module Voltage  → V
    const rackVoltage = inp.modulesPerRack * moduleVoltage;

    // E11: Energy per Rack = Modules per Rack × Module Energy kWh  → kWh
    const energyPerRack = inp.modulesPerRack * moduleEnergyKWh;

    // E12: Cells per Rack = Cells per Module × Modules per Rack
    const cellsPerRack = inp.cellsPerModule * inp.modulesPerRack;

    // E18: Required Gross Energy = Required AC Energy / (DOD × Efficiency × EOD)  → kWh
    const requiredGrossEnergy = requiredACEnergy / (inp.dod * inp.efficiency * inp.eod);

    // E13: Number of Required Racks = ROUNDUP(Required Gross Energy / Energy per Rack)
    const numberOfRacks = Math.ceil(requiredGrossEnergy / energyPerRack);

    // E14: Total Energy = Energy per Rack × Number of Racks  → kWh
    const totalEnergy = energyPerRack * numberOfRacks;

    // E15: Total Energy in MWh
    const totalEnergyMWh = totalEnergy / 1000;

    // E16: Total Cells = Cells per Rack × Number of Racks
    const totalCells = cellsPerRack * numberOfRacks;

    // E17: Total Cell Cost = Total Cells × Cell Cost  → INR
    const totalCellCost = totalCells * inp.cellCost;

    // E19: Delivered AC Energy = Total Energy × DOD × Efficiency  → kWh
    const deliveredACEnergy = totalEnergy * inp.dod * inp.efficiency;

    // E20: Total Modules Required = Total Cells / Cells per Module
    const totalModulesRequired = totalCells / inp.cellsPerModule;

    // ── Module Cost Breakdown (Columns H-J in Excel) ───────────

    // Mechanical Housing: qty 1, price = moduleHousingCost
    const housingQty = 1;
    const housingPrice = inp.moduleHousingCost;

    // LFP Cells: qty = cellsPerModule, price = cellsPerModule × cellCost
    const cellsQty = inp.cellsPerModule;
    const cellsPrice = cellsQty * inp.cellCost;

    // Busbar: qty = cellsPerModule − 1, price = (cellsPerModule − 1) × busbarCost
    const busbarQty = inp.cellsPerModule - 1;
    const busbarPrice = busbarQty * inp.busbarCost;

    // CSC: qty 1, price = cscCost
    const cscQty = 1;
    const cscPrice = inp.cscCost;

    // Total module cost
    const totalModuleCost = housingPrice + cellsPrice + busbarPrice + cscPrice;

    // Total system module cost
    const totalSystemModuleCost = totalModuleCost * totalModulesRequired;

    // Total rack cost
    const totalRackCost = numberOfRacks * inp.rackCost;

    // Grand total (cells + racks + all module components × modules)
    const grandTotal = totalCellCost + totalRackCost + (housingPrice + busbarPrice + cscPrice) * totalModulesRequired;

    return {
        // Calculated Parameters
        duration,
        requiredACEnergy,
        cellEnergy,
        cellEnergyKWh,
        totalCellsRequired,
        moduleVoltage,
        moduleEnergy,
        moduleEnergyKWh,
        rackVoltage,
        energyPerRack,
        cellsPerRack,
        requiredGrossEnergy,
        numberOfRacks,
        totalEnergy,
        totalEnergyMWh,
        totalCells,
        totalCellCost,
        deliveredACEnergy,
        totalModulesRequired,

        // Module Cost Breakdown
        housingQty,
        housingPrice,
        cellsQty,
        cellsPrice,
        busbarQty,
        busbarPrice,
        cscQty,
        cscPrice,
        totalModuleCost,
        totalSystemModuleCost,
        totalRackCost,
        grandTotal,
    };
}
