import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { recruitmentRoundSeed, resourceSeeds, taskSeeds, uiuxTrackSeed } from '../seed/uiuxSeed.js';
import { technicalResourceSeeds, technicalTaskSeeds, technicalTrackSeed } from '../seed/technicalSeed.js';

async function seedTrack(trackSeed, resourceSeedList, taskSeedList) {
  const track = await Track.findOneAndUpdate(
    { slug: trackSeed.slug },
    { $set: trackSeed },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );

  for (const resource of resourceSeedList) {
    await Resource.findOneAndUpdate(
      { slug: resource.slug },
      { $set: { ...resource, trackId: track._id, isPublished: true } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
  }

  for (const task of taskSeedList) {
    await Task.findOneAndUpdate(
      { slug: task.slug },
      { $set: { ...task, trackId: track._id, roundId: null, isPublished: true } },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
    );
  }

  return track;
}

async function seed() {
  const connected = await connectDatabase();
  if (!connected) throw new Error('Set MONGODB_URI before running the seed script.');

  const uiuxTrack = await seedTrack(uiuxTrackSeed, resourceSeeds, taskSeeds);
  const technicalTrack = await seedTrack(technicalTrackSeed, technicalResourceSeeds, technicalTaskSeeds);

  const resources = await Resource.find({ trackId: uiuxTrack._id, slug: { $in: resourceSeeds.map((item) => item.slug) } }).select('_id');
  const tasks = await Task.find({ trackId: uiuxTrack._id, slug: { $in: taskSeeds.map((item) => item.slug) } }).select('_id slug');
  const roundTask = tasks.find((task) => task.slug === 'two-hour-design-recreation');
  const round = await RecruitmentRound.findOneAndUpdate(
    { roundNumber: recruitmentRoundSeed.roundNumber },
    {
      $set: {
        ...recruitmentRoundSeed,
        trackIds: [uiuxTrack._id],
        resourceIds: resources.map((resource) => resource._id),
        taskIds: roundTask ? [roundTask._id] : [],
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );

  if (roundTask) await Task.updateOne({ _id: roundTask._id }, { $set: { roundId: round._id } });

  const technicalResources = await Resource.countDocuments({ trackId: technicalTrack._id });
  const technicalTasks = await Task.countDocuments({ trackId: technicalTrack._id });
  console.log(`Seeded ${uiuxTrack.title}: ${uiuxTrack.weeks.length} weeks, ${resources.length} resources, ${tasks.length} tasks, and Round ${round.roundNumber}.`);
  console.log(`Seeded ${technicalTrack.title}: ${technicalTrack.weeks.length} weeks, ${technicalResources} resources, ${technicalTasks} tasks.`);
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
