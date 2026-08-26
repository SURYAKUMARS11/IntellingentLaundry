import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intelligentlaundry';
    console.log(`[DB] Attempting to connect to MongoDB at: ${connStr.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
    
    // Disable buffering so queries fail fast with clear error when DB is unreachable
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 8000,
    });
    
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.error(`[DB ERROR] Could not connect to MongoDB Atlas: ${error.message}`);
    console.error(`[DB ERROR] Check MONGODB_URI & Network Access (0.0.0.0/0) in MongoDB Atlas.`);
    return false;
  }
};
