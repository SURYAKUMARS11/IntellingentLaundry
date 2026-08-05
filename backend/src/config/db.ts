import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/laundry_db';
    console.log(`[DB] Attempting to connect to MongoDB at: ${connStr}`);
    
    // Set low selection timeout so it fails fast if local MongoDB isn't running and can log helpful message
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.warn(`[DB WARNING] Could not connect to MongoDB Atlas/Local instance: ${error.message}`);
    console.warn(`[DB WARNING] Standard Mongo database server is currently offline or MONGODB_URI is not reachable.`);
    console.warn(`[DB WARNING] Please check your MONGODB_URI in backend/.env file.`);
    return false;
  }
};
