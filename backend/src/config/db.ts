import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intelligentlaundry';
    console.log(`[DB] Attempting to connect to MongoDB at: ${connStr.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    // Set serverSelectionTimeoutMS
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,
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
