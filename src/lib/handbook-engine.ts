/* ============================================================
    BESS Sizing — 5-Section Calculator Engine  (BOM edition)
    ============================================================
    Every component carries Quantity + Unit Cost.
    Sections: Cell → Module → Pack → System → BOP → Summary
    ============================================================ */

// ── Section 1: Cell ────────────────────────────────────────────
export const CELL_DEFAULTS = {
    cellChemistry: 'LFP',
    cellCapacity: 100,        // Ah
    nominalVoltage: 3.2,      // V
    cellCost: 2700,           // cost per cell
    dod: 0.9,
    efficiency: 0.98,
    eol: 0.8,
};

export function calcCell(c: typeof CELL_DEFAULTS) {
    const cellEnergy = c.cellCapacity * c.nominalVoltage;   // Wh
    const cellEnergyKWh = cellEnergy / 1000;
    return { cellEnergy, cellEnergyKWh };
}

// ── Section 2: Module ──────────────────────────────────────────
export const MODULE_DEFAULTS = {
    cellsPerModule: 12,
    // Qty + Unit Cost pairs  (cost is always PER UNIT)
    housingQty: 1, housingCost: 10000,
    busbarQty: 13, busbarCost: 250,
    cscQty: 1, cscCost: 10000,
    connectorsQty: 2, connectorsCost: 100,
    insulationQty: 1, insulationCost: 200,
    fastenersQty: 1, fastenersCost: 300,
    cellAdaptorQty: 1, cellAdaptorCost: 19000,
    labourQty: 2, labourCost: 400,
};

export interface ModuleLineItem {
    label: string;
    qty: number;
    unitCost: number;
    total: number;
}

export function calcModule(
    cell: typeof CELL_DEFAULTS,
    mod: typeof MODULE_DEFAULTS,
    cellOut: ReturnType<typeof calcCell>,
) {
    const moduleVoltage = mod.cellsPerModule * cell.nominalVoltage;
    const moduleEnergy = mod.cellsPerModule * cellOut.cellEnergy;       // Wh
    const moduleEnergyKWh = moduleEnergy / 1000;

    // Line items: each = qty × unitCost
    const items: ModuleLineItem[] = [
        { label: 'LFP Cells', qty: mod.cellsPerModule, unitCost: cell.cellCost, total: mod.cellsPerModule * cell.cellCost },
        { label: 'Mechanical Housing', qty: mod.housingQty, unitCost: mod.housingCost, total: mod.housingQty * mod.housingCost },
        { label: 'Busbar', qty: mod.busbarQty, unitCost: mod.busbarCost, total: mod.busbarQty * mod.busbarCost },
        { label: 'CSC', qty: mod.cscQty, unitCost: mod.cscCost, total: mod.cscQty * mod.cscCost },
        { label: 'Connectors', qty: mod.connectorsQty, unitCost: mod.connectorsCost, total: mod.connectorsQty * mod.connectorsCost },
        { label: 'Insulation & Spacers', qty: mod.insulationQty, unitCost: mod.insulationCost, total: mod.insulationQty * mod.insulationCost },
        { label: 'Fasteners & Hardware', qty: mod.fastenersQty, unitCost: mod.fastenersCost, total: mod.fastenersQty * mod.fastenersCost },
        { label: 'Cell Adaptor', qty: mod.cellAdaptorQty, unitCost: mod.cellAdaptorCost, total: mod.cellAdaptorQty * mod.cellAdaptorCost },
        { label: 'Labour (assembly)', qty: mod.labourQty, unitCost: mod.labourCost, total: mod.labourQty * mod.labourCost },
    ];
    const totalModuleCost = items.reduce((s, i) => s + i.total, 0);

    return { moduleVoltage, moduleEnergy, moduleEnergyKWh, items, totalModuleCost };
}

// ── Section 3: Pack (Rack) ─────────────────────────────────────
export const PACK_DEFAULTS = {
    modulesPerRack: 20,
    // Qty + Unit Cost pairs
    rackFrameQty: 1, rackFrameCost: 120000,
    packMonitorQty: 1, packMonitorCost: 28000,
    contactorQty: 3, contactorCost: 3500,
    dcBreakerQty: 1, dcBreakerCost: 6000,
    dcFuseQty: 1, dcFuseCost: 3000,
    mountingRailsQty: 1, mountingRailsCost: 3000,
    rackLabourQty: 1, rackLabourCost: 6000,
    // Cables (length × price/m)
    cableRedPricePerM: 680,
    cableBlackPricePerM: 680,
    cableLengthPerRack: 50,         // metres per colour
    // BMS / Daisy chain
    bmsControllerQty: 1, bmsControllerCost: 10000,
    daisyChainConverterQty: 1, daisyChainConverterCost: 3000,
    daisyChainCableCostPerM: 250,
    daisyChainCableLengthPerRack: 19,
};

export interface PackLineItem {
    label: string;
    qty: number | string;
    unitCost: number | string;
    total: number;
}

export function calcPack(
    mod: typeof MODULE_DEFAULTS,
    pack: typeof PACK_DEFAULTS,
    modOut: ReturnType<typeof calcModule>,
) {
    const rackVoltage = pack.modulesPerRack * modOut.moduleVoltage;
    const rackEnergy = pack.modulesPerRack * modOut.moduleEnergyKWh;  // kWh
    const modulesCostPerRack = pack.modulesPerRack * modOut.totalModuleCost;

    const cableCostRed = pack.cableRedPricePerM * pack.cableLengthPerRack;
    const cableCostBlack = pack.cableBlackPricePerM * pack.cableLengthPerRack;
    const totalCableCost = cableCostRed + cableCostBlack;
    const daisyChainCableCost = pack.daisyChainCableCostPerM * pack.daisyChainCableLengthPerRack;

    const items: PackLineItem[] = [
        { label: `Modules (${pack.modulesPerRack})`, qty: pack.modulesPerRack, unitCost: modOut.totalModuleCost, total: modulesCostPerRack },
        { label: 'Rack Frame', qty: pack.rackFrameQty, unitCost: pack.rackFrameCost, total: pack.rackFrameQty * pack.rackFrameCost },
        { label: 'Pack Monitor', qty: pack.packMonitorQty, unitCost: pack.packMonitorCost, total: pack.packMonitorQty * pack.packMonitorCost },
        { label: 'Contactors', qty: pack.contactorQty, unitCost: pack.contactorCost, total: pack.contactorQty * pack.contactorCost },
        { label: 'DC Breaker', qty: pack.dcBreakerQty, unitCost: pack.dcBreakerCost, total: pack.dcBreakerQty * pack.dcBreakerCost },
        { label: 'DC Fuse', qty: pack.dcFuseQty, unitCost: pack.dcFuseCost, total: pack.dcFuseQty * pack.dcFuseCost },
        { label: 'Mounting Rails & Insulation', qty: pack.mountingRailsQty, unitCost: pack.mountingRailsCost, total: pack.mountingRailsQty * pack.mountingRailsCost },
        { label: 'Rack Assembly Labour', qty: pack.rackLabourQty, unitCost: pack.rackLabourCost, total: pack.rackLabourQty * pack.rackLabourCost },
        { label: `Cable – Red (${pack.cableLengthPerRack}m)`, qty: `${pack.cableLengthPerRack} m`, unitCost: pack.cableRedPricePerM, total: cableCostRed },
        { label: `Cable – Black (${pack.cableLengthPerRack}m)`, qty: `${pack.cableLengthPerRack} m`, unitCost: pack.cableBlackPricePerM, total: cableCostBlack },
        { label: 'BMS Controller', qty: pack.bmsControllerQty, unitCost: pack.bmsControllerCost, total: pack.bmsControllerQty * pack.bmsControllerCost },
        { label: 'Daisy Chain Converter', qty: pack.daisyChainConverterQty, unitCost: pack.daisyChainConverterCost, total: pack.daisyChainConverterQty * pack.daisyChainConverterCost },
        { label: `Daisy Chain Cable (${pack.daisyChainCableLengthPerRack}m)`, qty: `${pack.daisyChainCableLengthPerRack} m`, unitCost: pack.daisyChainCableCostPerM, total: daisyChainCableCost },
    ];
    const packComponentsCost = items.slice(1).reduce((s, i) => s + i.total, 0); // exclude modules row
    const totalRackCost = modulesCostPerRack + packComponentsCost;

    return { rackVoltage, rackEnergy, items, modulesCostPerRack, packComponentsCost, totalCableCost, daisyChainCableCost, totalRackCost };
}

// ── Section 4: System ──────────────────────────────────────────
export const SYSTEM_DEFAULTS = {
    systemMW: 2,
    cRate: 1,
    masterBMSCost: 200000,
    bmsHousingCost: 10000,
    safetySystemsCost: 100000,
    pcsCost: 200000,           // per MW
};

export function calcSystem(
    cell: typeof CELL_DEFAULTS,
    mod: typeof MODULE_DEFAULTS,
    pack: typeof PACK_DEFAULTS,
    sys: typeof SYSTEM_DEFAULTS,
    modOut: ReturnType<typeof calcModule>,
    packOut: ReturnType<typeof calcPack>,
) {
    const duration = 1 / sys.cRate;
    const requiredACEnergy = sys.systemMW * duration * 1000;
    const grossDCEnergy = requiredACEnergy / (cell.dod * cell.efficiency * cell.eol);
    const numberOfRacks = Math.ceil(grossDCEnergy / packOut.rackEnergy);
    const totalDCEnergy = numberOfRacks * packOut.rackEnergy;
    const totalDCEnergyMWh = totalDCEnergy / 1000;
    const totalCells = numberOfRacks * pack.modulesPerRack * mod.cellsPerModule;
    const totalModules = numberOfRacks * pack.modulesPerRack;
    const deliveredACEnergy = totalDCEnergy * cell.dod * cell.efficiency;

    const totalRacksCost = numberOfRacks * packOut.totalRackCost;
    const pcsCostTotal = sys.pcsCost * sys.systemMW;
    const totalBatterySystemCost =
        totalRacksCost + sys.masterBMSCost + sys.bmsHousingCost + sys.safetySystemsCost + pcsCostTotal;

    // ── System-level BOM totals ────────────────────────────────
    const bomTotals = {
        cells: totalCells,
        modules: totalModules,
        racks: numberOfRacks,
        busbars: totalModules * mod.busbarQty,
        housings: totalModules * mod.housingQty,
        cscs: totalModules * mod.cscQty,
        connectors: totalModules * mod.connectorsQty,
        insulation: totalModules * mod.insulationQty,
        fasteners: totalModules * mod.fastenersQty,
        cellAdaptors: totalModules * mod.cellAdaptorQty,
        labourModuleUnits: totalModules * mod.labourQty,
        packMonitors: numberOfRacks * pack.packMonitorQty,
        contactors: numberOfRacks * pack.contactorQty,
        dcBreakers: numberOfRacks * pack.dcBreakerQty,
        dcFuses: numberOfRacks * pack.dcFuseQty,
        rackFrames: numberOfRacks * pack.rackFrameQty,
        mountingRails: numberOfRacks * pack.mountingRailsQty,
        rackLabourUnits: numberOfRacks * pack.rackLabourQty,
        cableRedMetres: numberOfRacks * pack.cableLengthPerRack,
        cableBlackMetres: numberOfRacks * pack.cableLengthPerRack,
        bmsControllers: numberOfRacks * pack.bmsControllerQty,
        daisyChainConverters: numberOfRacks * pack.daisyChainConverterQty,
        daisyChainCableMetres: numberOfRacks * pack.daisyChainCableLengthPerRack,
    };

    return {
        duration, requiredACEnergy, grossDCEnergy,
        numberOfRacks, totalDCEnergy, totalDCEnergyMWh,
        totalCells, totalModules, deliveredACEnergy,
        totalRacksCost, pcsCostTotal, totalBatterySystemCost,
        bomTotals,
    };
}

// ── Section 5: BOP ─────────────────────────────────────────────
export const BOP_DEFAULTS = {
    civilWorks: 1500000,
    acCabling: 100000,
    earthing: 500000,
    installationLabour: 200000,
    communication: 200000,
};

export function calcBOP(bop: typeof BOP_DEFAULTS) {
    const totalBOPCost =
        bop.civilWorks + bop.acCabling + bop.earthing + bop.installationLabour + bop.communication;
    return { totalBOPCost };
}

// ── Summary ────────────────────────────────────────────────────
export function calcSummary(
    sysOut: ReturnType<typeof calcSystem>,
    bopOut: ReturnType<typeof calcBOP>,
) {
    const totalSystemCost = sysOut.totalBatterySystemCost + bopOut.totalBOPCost;
    const costPerKWh = sysOut.totalDCEnergy > 0 ? totalSystemCost / sysOut.totalDCEnergy : 0;
    const costPerKW = sysOut.requiredACEnergy > 0
        ? totalSystemCost / (sysOut.requiredACEnergy / (sysOut.duration || 1))
        : 0;
    return { totalSystemCost, costPerKWh, costPerKW };
}

// ── Combined defaults ──────────────────────────────────────────
export const ALL_DEFAULTS = {
    ...CELL_DEFAULTS,
    ...MODULE_DEFAULTS,
    ...PACK_DEFAULTS,
    ...SYSTEM_DEFAULTS,
    ...BOP_DEFAULTS,
};

// ── One-shot full calculation ──────────────────────────────────
export function calculateAll(inp: typeof ALL_DEFAULTS) {
    const cell: typeof CELL_DEFAULTS = {
        cellChemistry: inp.cellChemistry,
        cellCapacity: inp.cellCapacity,
        nominalVoltage: inp.nominalVoltage,
        cellCost: inp.cellCost,
        dod: inp.dod,
        efficiency: inp.efficiency,
        eol: inp.eol,
    };
    const mod: typeof MODULE_DEFAULTS = {
        cellsPerModule: inp.cellsPerModule,
        housingQty: inp.housingQty, housingCost: inp.housingCost,
        busbarQty: inp.busbarQty, busbarCost: inp.busbarCost,
        cscQty: inp.cscQty, cscCost: inp.cscCost,
        connectorsQty: inp.connectorsQty, connectorsCost: inp.connectorsCost,
        insulationQty: inp.insulationQty, insulationCost: inp.insulationCost,
        fastenersQty: inp.fastenersQty, fastenersCost: inp.fastenersCost,
        cellAdaptorQty: inp.cellAdaptorQty, cellAdaptorCost: inp.cellAdaptorCost,
        labourQty: inp.labourQty, labourCost: inp.labourCost,
    };
    const pack: typeof PACK_DEFAULTS = {
        modulesPerRack: inp.modulesPerRack,
        rackFrameQty: inp.rackFrameQty, rackFrameCost: inp.rackFrameCost,
        packMonitorQty: inp.packMonitorQty, packMonitorCost: inp.packMonitorCost,
        contactorQty: inp.contactorQty, contactorCost: inp.contactorCost,
        dcBreakerQty: inp.dcBreakerQty, dcBreakerCost: inp.dcBreakerCost,
        dcFuseQty: inp.dcFuseQty, dcFuseCost: inp.dcFuseCost,
        mountingRailsQty: inp.mountingRailsQty, mountingRailsCost: inp.mountingRailsCost,
        rackLabourQty: inp.rackLabourQty, rackLabourCost: inp.rackLabourCost,
        cableRedPricePerM: inp.cableRedPricePerM,
        cableBlackPricePerM: inp.cableBlackPricePerM,
        cableLengthPerRack: inp.cableLengthPerRack,
        bmsControllerQty: inp.bmsControllerQty, bmsControllerCost: inp.bmsControllerCost,
        daisyChainConverterQty: inp.daisyChainConverterQty, daisyChainConverterCost: inp.daisyChainConverterCost,
        daisyChainCableCostPerM: inp.daisyChainCableCostPerM,
        daisyChainCableLengthPerRack: inp.daisyChainCableLengthPerRack,
    };
    const sys: typeof SYSTEM_DEFAULTS = {
        systemMW: inp.systemMW,
        cRate: inp.cRate,
        masterBMSCost: inp.masterBMSCost,
        bmsHousingCost: inp.bmsHousingCost,
        safetySystemsCost: inp.safetySystemsCost,
        pcsCost: inp.pcsCost,
    };
    const bop: typeof BOP_DEFAULTS = {
        civilWorks: inp.civilWorks,
        acCabling: inp.acCabling,
        earthing: inp.earthing,
        installationLabour: inp.installationLabour,
        communication: inp.communication,
    };

    const cellOut = calcCell(cell);
    const modOut = calcModule(cell, mod, cellOut);
    const packOut = calcPack(mod, pack, modOut);
    const sysOut = calcSystem(cell, mod, pack, sys, modOut, packOut);
    const bopOut = calcBOP(bop);
    const summary = calcSummary(sysOut, bopOut);

    return { cellOut, modOut, packOut, sysOut, bopOut, summary };
}
