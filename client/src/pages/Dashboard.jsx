import React from 'react';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p className="text-lg text-slate-600">
        Grid monitoring metrics and forecast comparison charts.
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Dashboard charts and peak indicators placeholder.
      </div>
    </div>
  );
}
