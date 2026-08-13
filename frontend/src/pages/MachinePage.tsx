import React, { useState, useEffect } from 'react';
import {
  fetchMachineLogsApi,
  logMachineCycleApi,
  fetchGasCylinderLogsApi,
  logGasCylinderApi,
  fetchMachineUtilityAnalyticsApi,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  WashingMachine,
  Zap,
  Flame,
  BarChart2,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MachinePage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'washer' | 'dryer' | 'analytics'>('washer');

  // Unified Date Filter State (today, month, year, custom)
  const [dateFilter, setDateFilter] = useState<'today' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Core State
  const [washerLogs, setWasherLogs] = useState<any[]>([]);
  const [dryerLogs, setDryerLogs] = useState<any[]>([]);
  const [cylinderLogs, setCylinderLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Washer Form State (Program 1 to Program 5, Running Duration in minutes, Optional Operator)
  const [washerForm, setWasherForm] = useState({
    programName: 'Program 1',
    durationMinutes: 45,
    operatorName: '',
    notes: '',
  });

  // Dryer Form State (Fixed 30-min cycles, Number of Runs, Optional Operator)
  const [dryerForm, setDryerForm] = useState({
    programName: 'Dryer Standard Cycle (30m)',
    cyclesCount: 1,
    operatorName: '',
    notes: '',
  });

  // LPG Cylinder Form State
  const [cylinderForm, setCylinderForm] = useState({
    cost: 1850,
    vendorName: 'LPG Gas Agency',
    cylinderSize: '19kg Commercial',
    notes: '',
  });

  const loadMachineData = async () => {
    setIsLoading(true);
    try {
      const filterParams = {
        period: dateFilter,
        startDate: dateFilter === 'custom' ? startDate : undefined,
        endDate: dateFilter === 'custom' ? endDate : undefined,
      };

      const [washerRes, dryerRes, cylinderRes, analyticsRes] = await Promise.all([
        fetchMachineLogsApi({ ...filterParams, machineType: 'Washer Extractor' }),
        fetchMachineLogsApi({ ...filterParams, machineType: 'Dryer' }),
        fetchGasCylinderLogsApi(filterParams),
        fetchMachineUtilityAnalyticsApi(filterParams),
      ]);

      if (washerRes.success) setWasherLogs(washerRes.logs || []);
      if (dryerRes.success) setDryerLogs(dryerRes.logs || []);
      if (cylinderRes.success) setCylinderLogs(cylinderRes.logs || []);
      if (analyticsRes.success) setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load machine data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMachineData();
  }, [dateFilter, startDate, endDate]);

  // Handle Washer Log Submit
  const handleLogWasher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await logMachineCycleApi({
        machineType: 'Washer Extractor',
        programName: washerForm.programName,
        durationMinutes: washerForm.durationMinutes,
        cyclesCount: 1,
        operatorName: washerForm.operatorName,
        notes: washerForm.notes,
      });

      if (res.success) {
        showToast(`Logged ${washerForm.programName} (${washerForm.durationMinutes} mins run)!`, 'success');
        setWasherForm({ programName: 'Program 1', durationMinutes: 45, operatorName: '', notes: '' });
        loadMachineData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error logging washer cycle', 'error');
    }
  };

  // Handle Dryer Log Submit
  const handleLogDryer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await logMachineCycleApi({
        machineType: 'Dryer',
        programName: 'Dryer Standard Cycle (30m)',
        durationMinutes: 30,
        cyclesCount: dryerForm.cyclesCount,
        operatorName: dryerForm.operatorName,
        notes: dryerForm.notes,
      });

      if (res.success) {
        showToast(`Logged ${dryerForm.cyclesCount} dryer run(s)!`, 'success');
        setDryerForm({ programName: 'Dryer Standard Cycle (30m)', cyclesCount: 1, operatorName: '', notes: '' });
        loadMachineData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error logging dryer cycle', 'error');
    }
  };

  // Handle Cylinder Log Submit
  const handleLogCylinder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cylinderForm.cost) {
      showToast('Please enter cylinder cost', 'error');
      return;
    }
    try {
      const res = await logGasCylinderApi(cylinderForm);
      if (res.success) {
        showToast('LPG Gas Cylinder replacement recorded!', 'success');
        setCylinderForm({ cost: 1850, vendorName: 'LPG Gas Agency', cylinderSize: '19kg Commercial', notes: '' });
        loadMachineData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error logging cylinder change', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-600 text-white shadow-md">
            <WashingMachine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Machine Performance & Utility Tracking
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Track Washer Extractor (EB Power) & Dryer (LPG Gas Cylinder) performance & utility expenses
            </p>
          </div>
        </div>

        <button
          onClick={loadMachineData}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Unified Date Filter Bar for All 3 Sections */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-extrabold text-slate-900 dark:text-white">Filter Date Range:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'Current Month' },
              { id: 'year', label: 'Current Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  dateFilter === f.id
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 glass-card p-1.5">
        {[
          { id: 'washer', label: '1. Washer Extractor (EB Power)', icon: WashingMachine },
          { id: 'dryer', label: '2. Dryer Machine (LPG Gas)', icon: Flame },
          { id: 'analytics', label: '3. Utility Cost & Performance Analytics', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Banner */}
      {isLoading && (
        <div className="glass-card p-6 flex items-center justify-center gap-3 text-cyan-600 dark:text-cyan-400 animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-xs font-black tracking-wide uppercase">Fetching Machine Logs & Utility Analytics...</span>
        </div>
      )}

      {/* TAB 1: WASHER EXTRACTOR */}
      {activeTab === 'washer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <WashingMachine className="w-5 h-5 text-cyan-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Log Washer Extractor Run</h3>
            </div>

            <form onSubmit={handleLogWasher} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Washing Program:</label>
                <select
                  value={washerForm.programName}
                  onChange={(e) => setWasherForm({ ...washerForm, programName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Program 1">Program 1</option>
                  <option value="Program 2">Program 2</option>
                  <option value="Program 3">Program 3</option>
                  <option value="Program 4">Program 4</option>
                  <option value="Program 5">Program 5</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Washer Running Time (Minutes):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={washerForm.durationMinutes}
                  onChange={(e) => setWasherForm({ ...washerForm, durationMinutes: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-sm"
                  placeholder="e.g. 40 or 45"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Operator Name (Optional):</label>
                <input
                  type="text"
                  value={washerForm.operatorName}
                  onChange={(e) => setWasherForm({ ...washerForm, operatorName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  placeholder="e.g. Manickam (Optional)"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Notes (Optional):</label>
                <input
                  type="text"
                  value={washerForm.notes}
                  onChange={(e) => setWasherForm({ ...washerForm, notes: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  placeholder="e.g. White linens strain treatment"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Save Washer Run Entry
              </button>
            </form>
          </div>

          {/* Right Log History */}
          <div className="lg:col-span-7 glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Washer Extractor History Log</h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto">
              {washerLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {log.programName} <span className="text-cyan-600">({log.durationMinutes || 45} mins run)</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Operator: <strong className="text-slate-700 dark:text-slate-300">{log.operatorName || 'N/A'}</strong> • {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="font-bold text-xs text-cyan-700 bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-lg">
                    {log.durationMinutes || 45} mins
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRYER MACHINE */}
      {activeTab === 'dryer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Dryer Run & Gas Replacement */}
          <div className="lg:col-span-5 space-y-6">
            {/* Log Dryer Run Form */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Log Dryer Machine Run</h3>
              </div>

              <form onSubmit={handleLogDryer} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Number of Runs / Cycles:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={dryerForm.cyclesCount}
                    onChange={(e) => setDryerForm({ ...dryerForm, cyclesCount: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Operator Name (Optional):</label>
                  <input
                    type="text"
                    value={dryerForm.operatorName}
                    onChange={(e) => setDryerForm({ ...dryerForm, operatorName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    placeholder="e.g. Selvam (Optional)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Save Dryer Run Entry
                </button>
              </form>
            </div>

            {/* Log LPG Cylinder Change Form */}
            <div className="glass-card p-6 space-y-4 border-t-4 border-t-rose-500">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Log LPG Gas Cylinder Replacement</h3>
              <form onSubmit={handleLogCylinder} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Cylinder Cost (₹):</label>
                  <input
                    type="number"
                    required
                    value={cylinderForm.cost}
                    onChange={(e) => setCylinderForm({ ...cylinderForm, cost: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Vendor / Supplier Name:</label>
                  <input
                    type="text"
                    value={cylinderForm.vendorName}
                    onChange={(e) => setCylinderForm({ ...cylinderForm, vendorName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs"
                >
                  Record Cylinder Replacement (₹{cylinderForm.cost})
                </button>
              </form>
            </div>
          </div>

          {/* Right Dryer History */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Dryer Run History Log</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[220px] overflow-y-auto">
                {dryerLogs.map((log) => (
                  <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{log.programName}</p>
                      <p className="text-[10px] text-slate-500">
                        Operator: <strong className="text-slate-700 dark:text-slate-300">{log.operatorName || 'N/A'}</strong> • {new Date(log.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-black text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg">
                      {log.cyclesCount} run{log.cyclesCount > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">LPG Gas Cylinder Replacement History</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[200px] overflow-y-auto">
                {cylinderLogs.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{c.vendorName || 'LPG Supplier'}</p>
                      <p className="text-[10px] text-slate-500">
                        Replaced on: {new Date(c.changeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-black text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg">
                      ₹{c.cost}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UTILITY COST & PERFORMANCE ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-t-4 border-t-cyan-500 space-y-1">
              <p className="text-xs font-bold text-slate-500">Washer Total Runs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.washerExtractor?.totalCycles || 0} Runs</p>
              <p className="text-[10px] text-cyan-600 font-bold">{analytics.washerExtractor?.totalHours || 0} Total Hours</p>
            </div>

            <div className="glass-card p-5 border-t-4 border-t-emerald-500 space-y-1">
              <p className="text-xs font-bold text-slate-500">Est. EB Electricity Cost</p>
              <p className="text-2xl font-black text-emerald-600">₹{analytics.washerExtractor?.estimatedEbCost || 0}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{analytics.washerExtractor?.estimatedEbUnits || 0} kWh Units</p>
            </div>

            <div className="glass-card p-5 border-t-4 border-t-amber-500 space-y-1">
              <p className="text-xs font-bold text-slate-500">Dryer Total Runs</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{analytics.dryer?.totalCycles || 0} Runs</p>
              <p className="text-[10px] text-amber-600 font-bold">{analytics.dryer?.totalHours || 0} Total Hours</p>
            </div>

            <div className="glass-card p-5 border-t-4 border-t-rose-500 space-y-1">
              <p className="text-xs font-bold text-slate-500">LPG Gas Cylinder Expense</p>
              <p className="text-2xl font-black text-rose-600">₹{analytics.dryer?.totalGasCostThisMonth || 0}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{analytics.dryer?.cylindersChangedThisMonth || 0} Cylinders Changed</p>
            </div>
          </div>

          {/* Program Breakdown */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Washer Extractor Program Run Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {(analytics.washerExtractor?.programsBreakdown || []).map((p: any) => (
                <div key={p.program} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center space-y-1">
                  <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{p.program}</p>
                  <p className="text-lg font-black text-cyan-600">{p.count} Runs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
