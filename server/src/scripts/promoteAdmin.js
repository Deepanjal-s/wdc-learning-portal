import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import User from '../models/User.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run promote-admin -- student@example.org');
  process.exitCode = 1;
} else {
  try {
    const connected = await connectDatabase();
    if (!connected) throw new Error('Set MONGODB_URI before promoting an admin.');
    const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { returnDocument: 'after' });
    if (!user) throw new Error(`No account found for ${email}. Register that account before promoting it.`);
    console.log(`Admin access granted to ${user.email}.`);
  } catch (error) {
    console.error('Could not promote admin:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
