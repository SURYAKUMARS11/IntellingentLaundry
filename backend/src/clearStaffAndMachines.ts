import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Staff from './models/Staff';
import Attendance from './models/Attendance';
import IroningWorkLog from './models/IroningWorkLog';
import MachineLog from './models/MachineLog';
import GasCylinderLog from './models/GasCylinderLog';

dotenv.config();

const clearStaffAndMachineData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in environment.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for database cleanup...');

    const staffRes = await Staff.deleteMany({});
    const attRes = await Attendance.deleteMany({});
    const ironingRes = await IroningWorkLog.deleteMany({});
    const machineRes = await MachineLog.deleteMany({});
    const gasRes = await GasCylinderLog.deleteMany({});

    console.log(`[CLEANUP COMPLETE] Removed:`);
    console.log(`- ${staffRes.deletedCount} Staff members`);
    console.log(`- ${attRes.deletedCount} Attendance records`);
    console.log(`- ${ironingRes.deletedCount} Ironing Work logs`);
    console.log(`- ${machineRes.deletedCount} Machine Extractor/Dryer logs`);
    console.log(`- ${gasRes.deletedCount} Gas Cylinder logs`);

    process.exit(0);
  } catch (err: any) {
    console.error('Error clearing data:', err.message);
    process.exit(1);
  }
};

clearStaffAndMachineData();
