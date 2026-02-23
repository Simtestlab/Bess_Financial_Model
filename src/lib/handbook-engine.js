/* ============================================================
    BESS Sizing — Calculator Engine
    ============================================================
    Pure computation module — no DOM dependencies.
    Implements the exact BESS design formulas from useBESSCalculator.
    ============================================================ */

export const HANDBOOK_DEFAULTS = {
    cellChemistry: 'LFP',
    cellVoltage: 3.2,
    cellCapacity: 280,
    cellMaxVoltage: 3.65,
    cellMinVoltage: 2.5,
    seriesCells: 16,
    parallelCells: 1,
    seriesModules: 1,
    parallelModules: 4,
    targetEnergy: 100,
    targetRackEnergy: 50,
    dod: 0.9,
    cRate: 0.5,
    efficiency: 0.95,
    cellsPerIC: 12,
    maxICPerChain: 8,
    protectionMargin: 125,
    peakMultiplier: 2,
    packResistanceMilliOhm: 50,
};

export function calculateBESS(inp) {
    // Cell & Module Level
    const cellEnergy = inp.cellVoltage * inp.cellCapacity; // Wh
    const moduleVoltage = inp.cellVoltage * inp.seriesCells;
    const moduleCapacity = inp.cellCapacity * inp.parallelCells; // Ah
    const moduleEnergy = (moduleVoltage * moduleCapacity) / 1000; // kWh
    const cellsPerModule = inp.seriesCells * inp.parallelCells;

    // Pack / System Level
    const packVoltage = moduleVoltage * inp.seriesModules;
    const packCapacity = moduleCapacity * inp.parallelModules; // Ah
    const packEnergy = (packVoltage * packCapacity) / 1000; // kWh
    const packMaxVoltage = inp.cellMaxVoltage * inp.seriesCells * inp.seriesModules;
    const packMinVoltage = inp.cellMinVoltage * inp.seriesCells * inp.seriesModules;
    const totalCells = inp.seriesCells * inp.parallelCells * inp.seriesModules * inp.parallelModules;

    // Usable Energy
    const usableEnergy = packEnergy * inp.dod;

    // Rack Architecture
    const numRacks = Math.max(1, Math.ceil(packEnergy / inp.targetRackEnergy));
    const energyPerRack = packEnergy / numRacks;
    const totalModules = inp.seriesModules * inp.parallelModules;
    const modulesPerRack = totalModules / numRacks;

    // Electrical Performance
    const maxCurrent = packCapacity * inp.cRate;
    const maxPower = (packVoltage * maxCurrent) / 1000; // kW
    const continuousPower = (packVoltage * packCapacity * 1) / 1000; // 1C convention
    const peakPower = (packVoltage * packCapacity * 3) / 1000; // 3C convention
    const dischargeTime = 1 / inp.cRate; // hours

    // Resistance & Heat Loss
    const packResistance = inp.packResistanceMilliOhm / 1000; // Ω
    const heatLoss = (maxCurrent * maxCurrent * packResistance) / 1000; // kW

    // BMS & Protection
    const totalCMU = totalModules;
    const packMonitors = numRacks;
    const icsPerRack = Math.ceil((totalCells / inp.cellsPerIC) / numRacks);
    const daisyChains = Math.ceil(icsPerRack / inp.maxICPerChain);
    const icsPerChain = Math.ceil(icsPerRack / daisyChains);
    const contactorRating = maxCurrent * (inp.protectionMargin / 100);
    const fuseRating = contactorRating * 1.2;
    const peakCurrent = maxCurrent * inp.peakMultiplier;

    // Design Checks
    const requiredModules = Math.ceil(inp.targetEnergy / moduleEnergy);
    let designStatus, designStatusClass;
    if (totalModules < requiredModules) {
        designStatus = '⚠️ Increase Modules';
        designStatusClass = 'status-warn';
    } else if (totalModules > requiredModules + 5) {
        designStatus = '📈 Over-designed';
        designStatusClass = 'status-over';
    } else {
        designStatus = '✅ Optimal';
        designStatusClass = 'status-ok';
    }

    let energyStatus, energyStatusClass;
    if (usableEnergy >= inp.targetEnergy) {
        energyStatus = '✅ Target Met';
        energyStatusClass = 'status-ok';
    } else {
        energyStatus = '⚠️ Below Target';
        energyStatusClass = 'status-warn';
    }

    return {
        cellEnergy, moduleVoltage, moduleCapacity, moduleEnergy, cellsPerModule,
        packVoltage, packCapacity, packEnergy, packMaxVoltage, packMinVoltage, totalCells,
        usableEnergy,
        numRacks, energyPerRack, totalModules, modulesPerRack,
        maxCurrent, maxPower, continuousPower, peakPower, dischargeTime,
        packResistance, heatLoss,
        totalCMU, packMonitors, icsPerRack, daisyChains, icsPerChain,
        contactorRating, fuseRating, peakCurrent,
        requiredModules, designStatus, designStatusClass, energyStatus, energyStatusClass
    };
}
