import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WashingMachine, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-lg">
        <WashingMachine className="w-10 h-10 animate-spin" />
      </div>

      <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-sm">
        The page or laundry record you are looking for does not exist or has been moved.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 active:scale-95 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
