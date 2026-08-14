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
// 2. LPG Gas Cylinder Tracking (Dryer)
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
    const { changeDate, quantity, vendorName, cylinderSize, notes } = req.body;
    const targetDate = changeDate ? new Date(changeDate) : new Date();

    // Calculate days lasted from previous cylinder entry
    const previousLog = await GasCylinderLog.findOne({
      changeDate: { $lt: targetDate },
    }).sort({ changeDate: -1 });

    let daysLasted = 0;
    if (previousLog) {
      const diffMs = targetDate.getTime() - new Date(previousLog.changeDate).getTime();
      daysLasted = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    const newLog = new GasCylinderLog({
      changeDate: targetDate,
      quantity: Number(quantity) || 1,
      daysLasted,
      vendorName: vendorName || 'LPG Supplier',
      cylinderSize: cylinderSize || '19kg Commercial',
      notes: notes || '',
    });

    await newLog.save();
    return res.status(201).json({
      success: true,
      log: newLog,
      message: `Gas cylinder change recorded (${newLog.quantity} cylinder(s)${daysLasted > 0 ? `, previous lasted ${daysLasted} days` : ''}).`,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGasCylinder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await GasCylinderLog.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Cylinder log not found.' });
    }
    return res.json({ success: true, message: 'Cylinder log deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// 3. Utility Performance Analytics (Washer Extractor & Dryer LPG)
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

    // 3. Gas Cylinder Replacements in period
    const cylinders = await GasCylinderLog.find({
      changeDate: { $gte: range.start, $lte: range.end },
    }).sort({ changeDate: -1 });

    const totalCylindersUsed = cylinders.reduce((sum, c) => sum + (c.quantity || 1), 0);

    // Calculate Average Longevity in Days across all cylinder logs
    const allCylinders = await GasCylinderLog.find().sort({ changeDate: 1 });
    let totalDays = 0;
    let countedCylinders = 0;

    for (let i = 1; i < allCylinders.length; i++) {
      const prev = new Date(allCylinders[i - 1].changeDate);
      const curr = new Date(allCylinders[i].changeDate);
      const diffMs = curr.getTime() - prev.getTime();
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      totalDays += days;
      countedCylinders++;
    }

    const avgDaysPerCylinder = countedCylinders > 0 ? (totalDays / countedCylinders).toFixed(1) : 'N/A';

    return res.json({
      success: true,
      period,
      washerExtractor: {
        totalHours: washerTotalHours,
        totalCycles: totalWasherCycles,
        programsBreakdown: Object.keys(washerProgramsMap).map((k) => ({ program: k, count: washerProgramsMap[k] })),
      },
      dryer: {
        totalHours: dryerTotalHours,
        totalCycles: totalDryerCycles,
        totalCylindersUsed,
        avgDaysPerCylinder,
      },
      recentCylinders: cylinders.slice(0, 10),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
