import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Staff from './models/Staff';
import Attendance from './models/Attendance';

dotenv.config();

const seedAugustAttendance = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) process.exit(1);

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas for August Attendance Seeding...');

    const staffList = await Staff.find();
    if (staffList.length === 0) {
      console.log('No staff members found. Exiting.');
      process.exit(0);
    }

    const currentYear = 2026;
    const currentMonth = 7; // August (0-indexed)

    // Seed August 1 to August 12 (12 days)
    for (let day = 1; day <= 12; day++) {
      const targetDate = new Date(currentYear, currentMonth, day, 9, 0, 0);

      for (const s of staffList) {
        // Avoid duplicate seeding for the same date & staff
        const startOfDay = new Date(currentYear, currentMonth, day, 0, 0, 0);
        const endOfDay = new Date(currentYear, currentMonth, day, 23, 59, 59);

        const existing = await Attendance.findOne({
          staff: s._id,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!existing) {
          // Determine status randomly or patterned (mostly Present, occasional Half Day or Leave)
          let status = 'Present';
          if (day === 4 && s.name === 'Suresh') status = 'Half Day';
          if (day === 7 && s.name === 'Vignesh') status = 'Leave';
          if (day === 10 && s.name === 'Manickam') status = 'Absent';
          if (day === 2 && s.name === 'Selvam') status = 'Half Day';

          await Attendance.create({
            staff: s._id,
            staffName: s.name,
            date: targetDate,
            status,
            clockIn: status === 'Absent' || status === 'Leave' ? '-' : '09:00 AM',
            clockOut: status === 'Absent' || status === 'Leave' ? '-' : status === 'Half Day' ? '01:30 PM' : '06:00 PM',
            overtimeHours: status === 'Present' && day % 3 === 0 ? 1 : 0,
          });
        }
      }
    }

    console.log('August 1-12 attendance records seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding August attendance:', error);
    process.exit(1);
  }
};

seedAugustAttendance();
