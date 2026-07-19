import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, LineChart, LogIn } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/login', label: 'Sign In', icon: LogIn },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50 p-4">
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
