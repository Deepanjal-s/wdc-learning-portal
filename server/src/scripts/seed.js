import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { recruitmentRoundSeed, resourceSeeds, taskSeeds, uiuxTrackSeed } from '../seed/uiuxSeed.js';
import { technicalResourceSeeds, technicalTaskSeeds, technicalTrackSeed } from '../seed/technicalSeed.js';

async function seedTrack(trackSeed, resourceSeedList, taskSeedList, { pruneStale = false } = {}) {
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

  // The Technical curriculum was rewritten while unmerged; drop curriculum docs
  // that are no longer in the seed so stale weeks/tasks cannot linger in a
  // database seeded with the old version. Scoped to the Technical track only —
  // UI/UX documents are never pruned. Progress references to removed docs are
  // cleaned up; progress itself is never deleted.
  if (pruneStale) {
    const resourceSlugs = resourceSeedList.map((item) => item.slug);
    const taskSlugs = taskSeedList.map((item) => item.slug);
    const staleResources = await Resource.find({ trackId: track._id, slug: { $nin: resourceSlugs } }).select('_id');
    const staleTasks = await Task.find({ trackId: track._id, slug: { $nin: taskSlugs } }).select('_id');
    const staleResourceIds = staleResources.map((item) => item._id);
    const staleTaskIds = staleTasks.map((item) => item._id);
    if (staleResourceIds.length > 0 || staleTaskIds.length > 0) {
      await Resource.deleteMany({ _id: { $in: staleResourceIds } });
      await Task.deleteMany({ _id: { $in: staleTaskIds } });
      await Progress.updateMany(
        { trackId: track._id },
        {
          $pull: {
            completedResourceIds: { $in: staleResourceIds },
            completedTaskIds: { $in: staleTaskIds },
            taskSubmissions: { taskId: { $in: staleTaskIds } },
          },
        },
      );
    }
  }

  return track;
}

async function seed() {
  const connected = await connectDatabase();
  if (!connected) throw new Error('Set MONGODB_URI before running the seed script.');

  const uiuxTrack = await seedTrack(uiuxTrackSeed, resourceSeeds, taskSeeds);
  const technicalTrack = await seedTrack(technicalTrackSeed, technicalResourceSeeds, technicalTaskSeeds, { pruneStale: true });

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
