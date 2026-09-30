import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import Progress from '../models/Progress.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import User from '../models/User.js';

try {
  const connected = await connectDatabase();
  if (!connected) throw new Error('Set MONGODB_URI before creating indexes.');
  for (const model of [User, Track, Resource, Task, Progress, RecruitmentRound]) {
    await model.createIndexes();
    console.log(`Indexes verified for ${model.collection.collectionName}.`);
  }
} catch (error) {
  console.error('Index creation failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
