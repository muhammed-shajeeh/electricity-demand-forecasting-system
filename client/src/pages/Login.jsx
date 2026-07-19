import React from 'react';

export default function Login() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign In</h2>
        <p className="mt-2 text-sm text-slate-500">
          Enter credentials to access the electricity forecasting panel.
        </p>
        {/* Placeholder Form */}
        <form onSubmit={(e) => e.preventDefault()} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              disabled
              placeholder="operator@utility.com"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled
            className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Log In (Disabled)
          </button>
        </form>
      </div>
    </div>
  );
}
