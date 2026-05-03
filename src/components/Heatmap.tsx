"use client";

import { useMemo } from 'react';

interface HeatmapProps {
  history: Record<string, number>;
}

export function Heatmap({ history }: HeatmapProps) {
  const { grid, maxSolved } = useMemo(() => {
    const today = new Date();
    // Get past 112 days (16 weeks * 7 days) to fill a nice grid
    const days = 112; 
    const dates = [];
    let mx = 1;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = history[dateStr] || 0;
      if (count > mx) mx = count;
      dates.push({ date: dateStr, count });
    }

    // Pad beginning to align with Sunday
    const firstDate = new Date(dates[0].date);
    const dayOfWeek = firstDate.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      dates.unshift({ date: '', count: 0 });
    }

    return { grid: dates, maxSolved: mx };
  }, [history]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-zinc-800 border-zinc-700';
    if (count === 1) return 'bg-emerald-900/50 border-emerald-900';
    if (count <= 3) return 'bg-emerald-800 border-emerald-700';
    if (count <= 6) return 'bg-emerald-600 border-emerald-500';
    return 'bg-emerald-400 border-emerald-300';
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-wrap gap-1 max-w-full overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-1">
          {grid.map((cell, idx) => (
            <div
              key={idx}
              title={cell.date ? `${cell.count} problems on ${cell.date}` : ''}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] border ${cell.date ? getColor(cell.count) : 'bg-transparent border-transparent'}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500 justify-end w-full">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] border bg-zinc-800 border-zinc-700" />
          <div className="w-3 h-3 rounded-[2px] border bg-emerald-900/50 border-emerald-900" />
          <div className="w-3 h-3 rounded-[2px] border bg-emerald-800 border-emerald-700" />
          <div className="w-3 h-3 rounded-[2px] border bg-emerald-600 border-emerald-500" />
          <div className="w-3 h-3 rounded-[2px] border bg-emerald-400 border-emerald-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
