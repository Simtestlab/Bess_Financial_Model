'use client';

import { useMemo } from 'react';
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
function c(name, opacity = 1) {
    return COLORS[name].replace('##', opacity);
}

export default function TornadoChart({ params }) {
    const chartData = useMemo(() => {
        if (!params) return null;
        const results = runTornadoSensitivity(params);
        const baseIRR = results[0].baseIRR;
        const labels = results.map(r => r.label);
        const lowDeltas = results.map(r => (r.irrLow - baseIRR) * 100);
        const highDeltas = results.map(r => (r.irrHigh - baseIRR) * 100);

        // Sort by total range (largest first)
        const indices = labels.map((_, i) => i);
        indices.sort((a, b) => {
            const rangeA = Math.abs(highDeltas[a] - lowDeltas[a]);
            const rangeB = Math.abs(highDeltas[b] - lowDeltas[b]);
            return rangeB - rangeA;
        });

        return {
            baseIRR,
            data: {
                labels: indices.map(i => labels[i]),
                datasets: [
                    { label: '-10%', data: indices.map(i => lowDeltas[i]), backgroundColor: c('rose', 0.7), borderColor: c('rose'), borderWidth: 1 },
                    { label: '+10%', data: indices.map(i => highDeltas[i]), backgroundColor: c('emerald', 0.7), borderColor: c('emerald'), borderWidth: 1 },
                ]
            }
        };
    }, [params]);

    if (!chartData) return null;

    return (
        <Bar
            data={chartData.data}
            options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' pp' },
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        title: { display: true, text: 'IRR Change (percentage points)', color: '#94a3b8' }
                    },
                    y: { ticks: { color: '#e2e8f0', font: { weight: 500 } }, grid: { display: false } }
                },
                plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { family: 'Inter' } } },
                    tooltip: {
                        callbacks: {
                            label: ctx => {
                                const sign = ctx.parsed.x >= 0 ? '+' : '';
                                return `${ctx.dataset.label}: ${sign}${ctx.parsed.x.toFixed(2)} pp → IRR ${((chartData.baseIRR + ctx.parsed.x / 100) * 100).toFixed(1)}%`;
                            }
                        }
                    }
                }
            }}
        />
    );
}
