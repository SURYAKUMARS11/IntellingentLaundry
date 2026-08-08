import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WashingMachine, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('adminIL');
  const [password, setPassword] = useState('IL@112');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const success = await login({ username, password, rememberMe });
      if (success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid admin credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl p-8 relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30 mb-3">
            <WashingMachine className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
            IntelligentLaundry <Sparkles className="w-4 h-4 text-brand-400 fill-brand-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Laundry Shop Admin Management System
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-semibold text-center animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 transition-all font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 transition-all font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500"
              />
              <span>Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
