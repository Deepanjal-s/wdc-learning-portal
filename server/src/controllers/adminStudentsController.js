import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import User from '../models/User.js';
import { buildStudentDetail, buildStudentRow, computeOverview } from '../services/adminService.js';
import { getUserTrackIds } from '../utils/userTracks.js';
import HttpError from '../utils/HttpError.js';

// Never expose auth secrets: passwordHash is select:false on the schema and is
// deliberately absent from every projection below.
const STUDENT_LIST_SELECT = 'name email branch year selectedTrackId selectedTrackIds createdAt';
const STUDENT_DETAIL_SELECT = 'name email branch year githubUrl portfolioUrl selectedTrackId selectedTrackIds createdAt';

export async function getOverview(_request, response) {
  const [tracks, students, tasks, resources] = await Promise.all([
    Track.find({ isActive: true }).sort({ title: 1 }).lean(),
    User.find({ role: 'student' }).select(STUDENT_LIST_SELECT).lean(),
    Task.find({ isPublished: true }).lean(),
    Resource.find({ isPublished: true }).lean(),
  ]);
  const progressDocs = students.length === 0
    ? []
    : await Progress.find({ userId: { $in: students.map((student) => student._id) } }).lean();
  return response.json({
    overview: computeOverview({ students, tracks, tasks, resources, progressDocs }),
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listStudents(request, response) {
  const search = String(request.query.search ?? '').trim();
  const trackSlug = String(request.query.track ?? '').trim().toLowerCase();

  const query = { role: 'student' };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { email: pattern }];
  }

  let filterTrackId = null;
  if (trackSlug) {
    const track = await Track.findOne({ slug: trackSlug }).select('_id slug title');
    if (!track) return response.json({ students: [], tracks: [] });
    filterTrackId = String(track._id);
  }

  const [students, tracks, tasks, resources] = await Promise.all([
    User.find(query).select(STUDENT_LIST_SELECT).sort({ name: 1 }).lean(),
    Track.find({ isActive: true }).sort({ title: 1 }).lean(),
    Task.find({ isPublished: true }).lean(),
    Resource.find({ isPublished: true }).lean(),
  ]);
  const progressDocs = students.length === 0
    ? []
    : await Progress.find({ userId: { $in: students.map((student) => student._id) } }).lean();

  const rows = students
    .map((user) => {
      const userProgress = progressDocs.filter((progress) => String(progress.userId) === String(user._id));
      return buildStudentRow({ user, tracks, tasks, resources, progressDocs: userProgress });
    })
    // Track membership uses the multi-track/legacy fallback, so filter in
    // memory instead of trying to express it in a Mongo query.
    .filter((row) => !filterTrackId || row.tracks.some((track) => track.trackId === filterTrackId));

  return response.json({
    students: rows,
    tracks: tracks.map((track) => ({ id: String(track._id), slug: track.slug, title: track.title })),
  });
}

export async function getStudentDetail(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'Student id is invalid.');

  const user = await User.findOne({ _id: id, role: 'student' })
    .select(STUDENT_DETAIL_SELECT)
    .lean();
  if (!user) throw new HttpError(404, 'Student was not found.');

  const enrolledIds = getUserTrackIds(user);
  const [tracks, tasks, resources, progressDocs] = await Promise.all([
    Track.find({ _id: { $in: enrolledIds } }).lean(),
    Task.find({ trackId: { $in: enrolledIds }, isPublished: true }).sort({ title: 1 }).lean(),
    Resource.find({ trackId: { $in: enrolledIds }, isPublished: true }).lean(),
    Progress.find({ userId: user._id }).lean(),
  ]);

  return response.json({
    student: buildStudentDetail({ user, tracks, tasks, resources, progressDocs }),
  });
}
