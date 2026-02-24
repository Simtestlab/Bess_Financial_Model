'use client';

import { useMemo, memo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { runTornadoSensitivity } from '@/lib/engine';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = {
    emerald: 'rgba(52, 211, 153, ##)',
    rose: 'rgba(251, 113, 133, ##)',
};
function c(name: string, opacity = 1) {
    return COLORS[name].replace('##', String(opacity));
}

function TornadoChart({ params }: any) {
    const chartData = useMemo(() => {
        if (!params) return null;
        const results = runTornadoSensitivity(params);
        const baseIRR = results[0].baseIRR;
        const labels = results.map((r: any) => r.label);
        const lowDeltas = results.map((r: any) => (r.irrLow - baseIRR) * 100);
        const highDeltas = results.map((r: any) => (r.irrHigh - baseIRR) * 100);

        // Sort by total range (largest first)
        const indices = labels.map((_: any, i: number) => i);
        indices.sort((a: number, b: number) => {
            const rangeA = Math.abs(highDeltas[a] - lowDeltas[a]);
            const rangeB = Math.abs(highDeltas[b] - lowDeltas[b]);
            return rangeB - rangeA;
        });

        return {
            baseIRR,
            data: {
                labels: indices.map((i: number) => labels[i]),
                datasets: [
                    { label: '-10%', data: indices.map((i: number) => lowDeltas[i]), backgroundColor: c('rose', 0.7), borderColor: c('rose'), borderWidth: 1 },
                    { label: '+10%', data: indices.map((i: number) => highDeltas[i]), backgroundColor: c('emerald', 0.7), borderColor: c('emerald'), borderWidth: 1 },
                ]
            }
        };
    }, [params]);

    const options = useMemo(() => {
        if (!chartData) return {};
        return {
            indexAxis: 'y' as const,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: '#94a3b8',
                        callback: (v: any) => {
                            const val = typeof v === 'number' ? v : parseFloat(v);
                            return (val >= 0 ? '+' : '') + val.toFixed(1) + ' pp';
                        }
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    title: { display: true, text: 'IRR Change (percentage points)', color: '#94a3b8' }
                },
                y: { ticks: { color: '#e2e8f0', font: { weight: 500 as const } }, grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                tooltip: {
                    callbacks: {
                        label: (ctx: any) => {
                            const sign = ctx.parsed.x >= 0 ? '+' : '';
                            return `${ctx.dataset.label}: ${sign}${ctx.parsed.x.toFixed(2)} pp → IRR ${((chartData.baseIRR + ctx.parsed.x / 100) * 100).toFixed(1)}%`;
                        }
                    }
                }
            }
        };
    }, [chartData]);

    if (!chartData) return null;

    return (
        <Bar data={chartData.data} options={options} />
    );
}

export default memo(TornadoChart);
