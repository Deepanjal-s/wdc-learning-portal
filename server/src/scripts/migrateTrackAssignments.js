// Backfills User.selectedTrackIds for accounts created before the
// multi-track assignment model existed.
//
// For each user whose selectedTrackIds is missing or empty:
//   - selectedTrackIds becomes [selectedTrackId] when one is set,
//     preserving every existing UI/UX assignment exactly;
//   - users with no track at all fall back to the active UI/UX track,
//     matching the registration default;
//   - selectedTrackId is left untouched when already set.
//
// Safe to run multiple times. Does not touch tracks, resources, tasks,
// progress documents, or any other user field.
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import Track from '../models/Track.js';
import User from '../models/User.js';

async function migrate() {
  const connected = await connectDatabase();
  if (!connected) throw new Error('Set MONGODB_URI before running the migration.');

  const fallbackTrack = await Track.findOne({ slug: 'ui-ux', isActive: true }).select('_id');
  const users = await User.find({
    $or: [{ selectedTrackIds: { $exists: false } }, { selectedTrackIds: { $size: 0 } }],
  }).select('_id selectedTrackId selectedTrackIds');

  let migrated = 0;
  for (const user of users) {
    const assigned = user.selectedTrackId ? [user.selectedTrackId] : [];
    if (assigned.length === 0 && fallbackTrack) assigned.push(fallbackTrack._id);
    user.selectedTrackIds = assigned;
    if (!user.selectedTrackId && assigned.length > 0) user.selectedTrackId = assigned[0];
    await user.save();
    migrated += 1;
  }

  console.log(`Migrated ${migrated} user(s): selectedTrackIds backfilled from the existing selectedTrackId.`);
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
