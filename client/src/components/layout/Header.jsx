import React from 'react';
import { Bolt, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-2">
        <Bolt className="h-6 w-6 text-indigo-600 animate-pulse" />
        <span className="text-lg font-bold tracking-tight text-slate-900">
          SmartGrid DSS
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <span className="sr-only">Notifications</span>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
        </button>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="h-8 w-8 rounded-full bg-slate-200" />
          <span className="text-sm font-medium text-slate-700">Grid Operator</span>
        </div>
      </div>
    </header>
  );
}
