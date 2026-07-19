import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">404</h1>
      <p className="mt-2 text-lg text-slate-600">Page not found</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Go Home
      </Link>
    </div>
  );
}
