import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Staff from './models/Staff';
import IroningWorkLog from './models/IroningWorkLog';
import MachineLog from './models/MachineLog';
import GasCylinderLog from './models/GasCylinderLog';
import Attendance from './models/Attendance';

dotenv.config();

const seedStaffAndMachines = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas...');

    // 1. Staff Profiles
    const existingStaffCount = await Staff.countDocuments();
    if (existingStaffCount === 0) {
      const defaultStaff = [
        { name: 'Ramesh', mobile: '9876543210', role: 'Ironing', assignedTable: 'Table 1', dailyWage: 600, status: 'Active' },
        { name: 'Suresh', mobile: '9876543211', role: 'Ironing', assignedTable: 'Table 2', dailyWage: 600, status: 'Active' },
        { name: 'Vignesh', mobile: '9876543212', role: 'Ironing', assignedTable: 'Table 3', dailyWage: 600, status: 'Active' },
        { name: 'Manickam', mobile: '9876543213', role: 'Washer Operator', assignedTable: 'N/A', dailyWage: 700, status: 'Active' },
        { name: 'Selvam', mobile: '9876543214', role: 'Dryer Operator', assignedTable: 'N/A', dailyWage: 650, status: 'Active' },
      ];
      await Staff.insertMany(defaultStaff);
      console.log('Inserted default staff members (Ironing Table 1, Table 2, Table 3, Washer, Dryer).');
    }

    // 2. Attendance for today
    const staffList = await Staff.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const s of staffList) {
      const att = await Attendance.findOne({ staff: s._id, date: today });
      if (!att) {
        await Attendance.create({
          staff: s._id,
          staffName: s.name,
          date: today,
          status: 'Present',
          clockIn: '09:00 AM',
          clockOut: '06:00 PM',
          overtimeHours: 0,
        });
      }
    }

    // 3. Initial Sample Ironing Logs
    const logCount = await IroningWorkLog.countDocuments();
    if (logCount === 0) {
      const sampleLogs = [
        { staffName: 'Ramesh', tableName: 'Table 1', itemName: 'Shirts', quantity: 45, date: new Date() },
        { staffName: 'Ramesh', tableName: 'Table 1', itemName: 'Pants', quantity: 30, date: new Date() },
        { staffName: 'Suresh', tableName: 'Table 2', itemName: 'Sarees', quantity: 20, date: new Date() },
        { staffName: 'Suresh', tableName: 'Table 2', itemName: 'Shirts', quantity: 35, date: new Date() },
        { staffName: 'Vignesh', tableName: 'Table 3', itemName: 'Suits', quantity: 10, date: new Date() },
        { staffName: 'Vignesh', tableName: 'Table 3', itemName: 'Bedsheets', quantity: 15, date: new Date() },
      ];
      await IroningWorkLog.insertMany(sampleLogs);
      console.log('Inserted initial ironing work logs.');
    }

    // 4. Initial Sample Machine Logs
    const machineLogCount = await MachineLog.countDocuments();
    if (machineLogCount === 0) {
      const sampleMachineLogs = [
        { machineType: 'Washer Extractor', programName: 'Normal Wash (45m)', durationMinutes: 45, cyclesCount: 3, operatorName: 'Manickam', date: new Date() },
        { machineType: 'Washer Extractor', programName: 'Heavy Stain Wash (60m)', durationMinutes: 60, cyclesCount: 2, operatorName: 'Manickam', date: new Date() },
        { machineType: 'Dryer', programName: 'Dryer Standard (30m)', durationMinutes: 30, cyclesCount: 5, operatorName: 'Selvam', date: new Date() },
      ];
      await MachineLog.insertMany(sampleMachineLogs);
      console.log('Inserted initial machine logs.');
    }

    // 5. Initial Gas Cylinder Log
    const gasCount = await GasCylinderLog.countDocuments();
    if (gasCount === 0) {
      await GasCylinderLog.create({
        changeDate: new Date(),
        cost: 1850,
        vendorName: 'SuperGas LPG',
        cylinderSize: '19kg Commercial',
        totalCyclesCompleted: 42,
        notes: 'Installed new commercial LPG cylinder for dryer',
      });
      console.log('Inserted initial LPG Gas Cylinder record.');
    }

    console.log('====================================================');
    console.log(' ✅ STAFF & MACHINE SEEDING COMPLETED!');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Error seeding staff and machines:', err.message);
    process.exit(1);
  }
};

seedStaffAndMachines();
