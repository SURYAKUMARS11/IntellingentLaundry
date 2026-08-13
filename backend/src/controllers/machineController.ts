import { Request, Response } from 'express';
import MachineLog from '../models/MachineLog';
import GasCylinderLog from '../models/GasCylinderLog';

// Helper to calculate start & end date based on period filter
const calculateDateRange = (period: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  let s = new Date();
  let e = new Date();

  if (period === 'custom' && startDate && endDate && startDate !== 'undefined' && endDate !== 'undefined') {
    s = new Date(startDate);
    e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
  }

  if (period === 'today') {
    s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === 'year') {
    s = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    // Default: Current Month
    s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start: s, end: e };
};

// -------------------------------------------------------------
// 1. Machine Cycle Logging (Washer Extractor & Dryer)
// -------------------------------------------------------------
export const getMachineLogs = async (req: Request, res: Response) => {
  try {
    const { machineType, period = 'month', startDate, endDate } = req.query;
    let query: any = {};

    if (machineType) {
      query.machineType = machineType;
    }

    const range = calculateDateRange(period as string, startDate as string, endDate as string);
    query.date = { $gte: range.start, $lte: range.end };

    const logs = await MachineLog.find(query).sort({ date: -1 });
    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logMachineCycle = async (req: Request, res: Response) => {
  try {
    const { machineType, programName, durationMinutes, cyclesCount, operatorName, notes, date } = req.body;

    if (!machineType || !programName) {
      return res.status(400).json({ success: false, message: 'Machine type and program name are required.' });
    }

    const newLog = new MachineLog({
      machineType,
      date: date ? new Date(date) : new Date(),
      programName: programName.trim(),
      durationMinutes: Number(durationMinutes) || (machineType === 'Dryer' ? 30 : 45),
      cyclesCount: Number(cyclesCount) || 1,
      operatorName: operatorName ? operatorName.trim() : '',
      notes: notes || '',
    });

    await newLog.save();
    return res.status(201).json({ success: true, log: newLog, message: `${machineType} cycle logged successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 2. LPG Gas Cylinder Replacements (Dryer)
// -------------------------------------------------------------
export const getGasCylinderLogs = async (req: Request, res: Response) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const range = calculateDateRange(period as string, startDate as string, endDate as string);

    const logs = await GasCylinderLog.find({
      changeDate: { $gte: range.start, $lte: range.end },
    }).sort({ changeDate: -1 });

    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logGasCylinder = async (req: Request, res: Response) => {
  try {
    const { changeDate, cost, vendorName, cylinderSize, totalCyclesCompleted, notes } = req.body;

    if (!cost) {
      return res.status(400).json({ success: false, message: 'Cylinder cost is required.' });
    }

    const newLog = new GasCylinderLog({
      changeDate: changeDate ? new Date(changeDate) : new Date(),
      cost: Number(cost),
      vendorName: vendorName || 'LPG Supplier',
      cylinderSize: cylinderSize || '19kg Commercial',
      totalCyclesCompleted: Number(totalCyclesCompleted) || 0,
      notes: notes || '',
    });

    await newLog.save();
    return res.status(201).json({ success: true, log: newLog, message: 'Gas cylinder change recorded.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 3. Utility Performance & EB Bill / Cylinder Cost Analytics
// -------------------------------------------------------------
export const getMachineUtilityAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const range = calculateDateRange(period as string, startDate as string, endDate as string);

    // 1. Washer Extractor Logs
    const washerLogs = await MachineLog.find({
      machineType: 'Washer Extractor',
      date: { $gte: range.start, $lte: range.end },
    });

    let totalWasherMinutes = 0;
    let totalWasherCycles = 0;
    const washerProgramsMap: { [prog: string]: number } = {};

    washerLogs.forEach((log) => {
      const minutes = (log.durationMinutes || 45) * (log.cyclesCount || 1);
      totalWasherMinutes += minutes;
      totalWasherCycles += log.cyclesCount || 1;
      washerProgramsMap[log.programName] = (washerProgramsMap[log.programName] || 0) + (log.cyclesCount || 1);
    });

    const washerTotalHours = (totalWasherMinutes / 60).toFixed(1);
    // Estimated Electricity Units (3.5 kWh rating)
    const estimatedEbUnits = (Number(washerTotalHours) * 3.5).toFixed(1);
    const estimatedEbCost = (Number(estimatedEbUnits) * 8.5).toFixed(0);

    // 2. Dryer Logs
    const dryerLogs = await MachineLog.find({
      machineType: 'Dryer',
      date: { $gte: range.start, $lte: range.end },
    });

    let totalDryerMinutes = 0;
    let totalDryerCycles = 0;
    dryerLogs.forEach((log) => {
      const minutes = (log.durationMinutes || 30) * (log.cyclesCount || 1);
      totalDryerMinutes += minutes;
      totalDryerCycles += log.cyclesCount || 1;
    });

    const dryerTotalHours = (totalDryerMinutes / 60).toFixed(1);

    // 3. Gas Cylinder Replacements
    const cylinders = await GasCylinderLog.find({
      changeDate: { $gte: range.start, $lte: range.end },
    }).sort({ changeDate: -1 });

    const totalCylinderCost = cylinders.reduce((sum, c) => sum + (c.cost || 0), 0);

    return res.json({
      success: true,
      period,
      washerExtractor: {
        totalHours: washerTotalHours,
        totalCycles: totalWasherCycles,
        estimatedEbUnits,
        estimatedEbCost,
        programsBreakdown: Object.keys(washerProgramsMap).map((k) => ({ program: k, count: washerProgramsMap[k] })),
      },
      dryer: {
        totalHours: dryerTotalHours,
        totalCycles: totalDryerCycles,
        cylindersChangedThisMonth: cylinders.length,
        totalGasCostThisMonth: totalCylinderCost,
      },
      recentCylinders: cylinders.slice(0, 5),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
