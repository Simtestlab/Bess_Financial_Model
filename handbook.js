/* ============================================================
   BESS Handbook — Interactive Calculator Engine
   ============================================================
   Implements the exact BESS design formulas from useBESSCalculator.
   All inputs are editable; outputs update in real-time.
   ============================================================ */

'use strict';

(function () {

    /* ── LocalStorage Persistence ─────────────────────────────── */
    const STORAGE_KEY = 'bess-handbook-inputs';

    function saveInputs(inputs) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch (e) { }
    }

    function loadInputs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    /* ── Default Values ───────────────────────────────────────── */
    const DEFAULTS = {
        // Cell Specs
        cellChemistry: 'LFP',
        cellVoltage: 3.2,
        cellCapacity: 280,
        cellMaxVoltage: 3.65,
        cellMinVoltage: 2.5,
        // Module Topology
        seriesCells: 16,
        parallelCells: 1,
        // System Topology
        seriesModules: 1,
        parallelModules: 4,
        // Targets
        targetEnergy: 100,
        targetRackEnergy: 50,
        // Performance
        dod: 0.9,
        cRate: 0.5,
        efficiency: 0.95,
        // BMS & Protection
        cellsPerIC: 12,
        maxICPerChain: 8,
        protectionMargin: 125,
        peakMultiplier: 2,
        packResistanceMilliOhm: 50
    };

    /* ── Collect Inputs from DOM ───────────────────────────────── */
    function collectHandbookInputs() {
        const v = (id, fallback) => {
            const el = document.getElementById(id);
            if (!el) return fallback;
            return parseFloat(el.value) || fallback;
        };
        const s = (id, fallback) => {
            const el = document.getElementById(id);
            return el ? el.value : fallback;
        };

        return {
            cellChemistry: s('hb-cellChemistry', DEFAULTS.cellChemistry),
            cellVoltage: v('hb-cellVoltage', DEFAULTS.cellVoltage),
            cellCapacity: v('hb-cellCapacity', DEFAULTS.cellCapacity),
            cellMaxVoltage: v('hb-cellMaxVoltage', DEFAULTS.cellMaxVoltage),
            cellMinVoltage: v('hb-cellMinVoltage', DEFAULTS.cellMinVoltage),
            seriesCells: v('hb-seriesCells', DEFAULTS.seriesCells),
            parallelCells: v('hb-parallelCells', DEFAULTS.parallelCells),
            seriesModules: v('hb-seriesModules', DEFAULTS.seriesModules),
            parallelModules: v('hb-parallelModules', DEFAULTS.parallelModules),
            targetEnergy: v('hb-targetEnergy', DEFAULTS.targetEnergy),
            targetRackEnergy: v('hb-targetRackEnergy', DEFAULTS.targetRackEnergy),
            dod: v('hb-dod', DEFAULTS.dod),
            cRate: v('hb-cRate', DEFAULTS.cRate),
            efficiency: v('hb-efficiency', DEFAULTS.efficiency),
            cellsPerIC: v('hb-cellsPerIC', DEFAULTS.cellsPerIC),
            maxICPerChain: v('hb-maxICPerChain', DEFAULTS.maxICPerChain),
            protectionMargin: v('hb-protectionMargin', DEFAULTS.protectionMargin),
            peakMultiplier: v('hb-peakMultiplier', DEFAULTS.peakMultiplier),
            packResistanceMilliOhm: v('hb-packResistanceMilliOhm', DEFAULTS.packResistanceMilliOhm),
        };
    }

    /* ── Calculate All Outputs ─────────────────────────────────── */
    function calculateBESS(inp) {
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
            // Cell & Module
            cellEnergy, moduleVoltage, moduleCapacity, moduleEnergy, cellsPerModule,
            // Pack / System
            packVoltage, packCapacity, packEnergy, packMaxVoltage, packMinVoltage, totalCells,
            // Usable
            usableEnergy,
            // Rack
            numRacks, energyPerRack, totalModules, modulesPerRack,
            // Electrical
            maxCurrent, maxPower, continuousPower, peakPower, dischargeTime,
            // Resistance & Heat
            packResistance, heatLoss,
            // BMS & Protection
            totalCMU, packMonitors, icsPerRack, daisyChains, icsPerChain,
            contactorRating, fuseRating, peakCurrent,
            // Design Checks
            requiredModules, designStatus, designStatusClass, energyStatus, energyStatusClass
        };
    }

    /* ── Render Outputs ────────────────────────────────────────── */
    function setOutput(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function setStatusBadge(id, text, cls) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = text;
        el.className = 'hb-status-badge-live ' + cls;
    }

    function renderOutputs(out) {
        // Cell & Module
        setOutput('out-cellEnergy', out.cellEnergy.toFixed(1) + ' Wh');
        setOutput('out-moduleVoltage', out.moduleVoltage.toFixed(1) + ' V');
        setOutput('out-moduleCapacity', out.moduleCapacity.toFixed(1) + ' Ah');
        setOutput('out-moduleEnergy', out.moduleEnergy.toFixed(3) + ' kWh');
        setOutput('out-cellsPerModule', out.cellsPerModule);

        // Pack / System
        setOutput('out-packVoltage', out.packVoltage.toFixed(1) + ' V');
        setOutput('out-packCapacity', out.packCapacity.toFixed(1) + ' Ah');
        setOutput('out-packEnergy', out.packEnergy.toFixed(2) + ' kWh');
        setOutput('out-packMaxVoltage', out.packMaxVoltage.toFixed(1) + ' V');
        setOutput('out-packMinVoltage', out.packMinVoltage.toFixed(1) + ' V');
        setOutput('out-totalCells', out.totalCells);

        // Usable
        setOutput('out-usableEnergy', out.usableEnergy.toFixed(2) + ' kWh');

        // Rack
        setOutput('out-numRacks', out.numRacks);
        setOutput('out-energyPerRack', out.energyPerRack.toFixed(2) + ' kWh');
        setOutput('out-totalModules', out.totalModules);
        setOutput('out-modulesPerRack', out.modulesPerRack.toFixed(1));

        // Electrical
        setOutput('out-maxCurrent', out.maxCurrent.toFixed(1) + ' A');
        setOutput('out-maxPower', out.maxPower.toFixed(2) + ' kW');
        setOutput('out-continuousPower', out.continuousPower.toFixed(2) + ' kW');
        setOutput('out-peakPower', out.peakPower.toFixed(2) + ' kW');
        setOutput('out-dischargeTime', out.dischargeTime.toFixed(2) + ' h');

        // Resistance & Heat
        setOutput('out-packResistance', out.packResistance.toFixed(4) + ' Ω');
        setOutput('out-heatLoss', out.heatLoss.toFixed(3) + ' kW');

        // BMS & Protection
        setOutput('out-totalCMU', out.totalCMU);
        setOutput('out-packMonitors', out.packMonitors);
        setOutput('out-icsPerRack', out.icsPerRack);
        setOutput('out-daisyChains', out.daisyChains);
        setOutput('out-icsPerChain', out.icsPerChain);
        setOutput('out-contactorRating', out.contactorRating.toFixed(1) + ' A');
        setOutput('out-fuseRating', out.fuseRating.toFixed(1) + ' A');
        setOutput('out-peakCurrent', out.peakCurrent.toFixed(1) + ' A');

        // Design checks
        setOutput('out-requiredModules', out.requiredModules);
        setStatusBadge('out-designStatus', out.designStatus, out.designStatusClass);
        setStatusBadge('out-designStatus2', out.designStatus, out.designStatusClass);
        setStatusBadge('out-energyStatus', out.energyStatus, out.energyStatusClass);
    }

    /* ── Main Recalculate ──────────────────────────────────────── */
    let hbTimer = null;

    function handbookRecalc() {
        const inputs = collectHandbookInputs();
        saveInputs(inputs);
        const outputs = calculateBESS(inputs);
        renderOutputs(outputs);
    }

    function debouncedHandbookRecalc() {
        clearTimeout(hbTimer);
        hbTimer = setTimeout(handbookRecalc, 60);
    }

    /* ── Reset to Defaults ─────────────────────────────────────── */
    window.resetHandbookDefaults = function () {
        for (const [key, val] of Object.entries(DEFAULTS)) {
            const el = document.getElementById('hb-' + key);
            if (el) el.value = val;
        }
        localStorage.removeItem(STORAGE_KEY);
        handbookRecalc();
    };

    /* ── Initialise ────────────────────────────────────────────── */
    function initHandbookCalculator() {
        // Load saved inputs
        const saved = loadInputs();
        if (saved) {
            for (const [key, val] of Object.entries(saved)) {
                const el = document.getElementById('hb-' + key);
                if (el) el.value = val;
            }
        }

        // Bind all handbook inputs
        document.querySelectorAll('#section-handbook .hb-input').forEach(input => {
            input.addEventListener('input', debouncedHandbookRecalc);
            input.addEventListener('change', handbookRecalc);
        });

        // Reset button
        const resetBtn = document.getElementById('hb-btn-reset');
        if (resetBtn) resetBtn.addEventListener('click', window.resetHandbookDefaults);

        // Initial calculation
        handbookRecalc();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHandbookCalculator);
    } else {
        initHandbookCalculator();
    }

})();
