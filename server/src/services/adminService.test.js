import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildStudentDetail,
  buildStudentRow,
  computeOverview,
  countStudentsByTrack,
  enrolledTrackIds,
  lastActivityFor,
} from './adminService.js';

function makeTrack(suffix, slug, title) {
  return {
    _id: suffix,
    slug,
    title,
    weeks: [
      {
        weekKey: `${suffix}-w1`,
        number: 1,
        title: 'Week 1',
        topics: [{ topicKey: `${suffix}-topic`, title: 'Topic one' }],
      },
    ],
  };
}

const uiux = makeTrack('t1', 'ui-ux', 'UI/UX Design');
const technical = makeTrack('t2', 'technical', 'Technical Development');

const tasks = [
  { _id: 'task1', trackId: 't1', weekKey: 't1-w1', slug: 'uiux-task', title: 'UI/UX weekly task', submissionType: 'design-link' },
  { _id: 'task2', trackId: 't2', weekKey: 't2-w1', slug: 'tech-task', title: 'Technical weekly task', submissionType: 'code-link' },
];
const resources = [
  { _id: 'res1', trackId: 't1', weekKey: 't1-w1', title: 'UI/UX resource' },
  { _id: 'res2', trackId: 't2', weekKey: 't2-w1', title: 'Technical resource' },
];

// Each fixture track has exactly 3 steps: 1 topic + 1 resource + 1 task.
const studentUiux = {
  _id: 's1',
  name: 'Uiux Student',
  email: 'uiux@example.com',
  branch: 'CSE',
  selectedTrackId: null,
  selectedTrackIds: ['t1'],
};
const studentTechnicalLegacy = {
  _id: 's2',
  name: 'Tech Student',
  email: 'tech@example.com',
  branch: 'ECE',
  selectedTrackId: 't2', // legacy single-track field, no multi array
  selectedTrackIds: [],
};
const studentBoth = {
  _id: 's3',
  name: 'Both Student',
  email: 'both@example.com',
  branch: 'CSE',
  selectedTrackId: 't1',
  selectedTrackIds: ['t1', 't2'],
};

const progressUiux = {
  userId: 's1',
  trackId: 't1',
  completedTopicKeys: ['t1-topic'],
  completedResourceIds: ['res1'],
  completedTaskIds: ['task1'],
  taskSubmissions: [{ taskId: 'task1', figmaUrl: 'https://www.figma.com/design/abc' }],
  updatedAt: new Date('2026-10-01T10:00:00Z'),
};
const progressTechLegacy = {
  userId: 's2',
  trackId: 't2',
  completedTopicKeys: [],
  completedResourceIds: [],
  completedTaskIds: [],
  taskSubmissions: [],
  updatedAt: new Date('2026-10-02T08:00:00Z'),
};

describe('enrolledTrackIds', () => {
  it('prefers selectedTrackIds and falls back to the legacy selectedTrackId', () => {
    assert.deepEqual(enrolledTrackIds(studentUiux), ['t1']);
    assert.deepEqual(enrolledTrackIds(studentTechnicalLegacy), ['t2']);
    assert.deepEqual(enrolledTrackIds({ selectedTrackIds: [], selectedTrackId: null }), []);
  });
});

describe('countStudentsByTrack', () => {
  it('counts a dual-track student under both tracks', () => {
    const counts = countStudentsByTrack([studentUiux, studentTechnicalLegacy, studentBoth], [uiux, technical]);
    assert.deepEqual(counts, [
      { slug: 'ui-ux', title: 'UI/UX Design', count: 2 },
      { slug: 'technical', title: 'Technical Development', count: 2 },
    ]);
  });
});

describe('lastActivityFor', () => {
  it('returns the latest updatedAt, or null when there is no progress', () => {
    assert.equal(lastActivityFor([progressUiux, progressTechLegacy]), progressTechLegacy.updatedAt);
    assert.equal(lastActivityFor([]), null);
  });
});

describe('computeOverview', () => {
  const overview = computeOverview({
    students: [studentUiux, studentTechnicalLegacy, studentBoth],
    tracks: [uiux, technical],
    tasks,
    resources,
    progressDocs: [progressUiux, progressTechLegacy],
  });

  it('reports total students and per-track enrollment', () => {
    assert.equal(overview.totalStudents, 3);
    assert.deepEqual(overview.studentsByTrack.map((entry) => [entry.slug, entry.count]), [
      ['ui-ux', 2],
      ['technical', 2],
    ]);
  });

  it('sums completed tasks and submissions across progress docs', () => {
    assert.equal(overview.totalTasksCompleted, 1);
    assert.equal(overview.totalSubmissions, 1);
  });

  it('averages progress across every (student, enrolled track) pair', () => {
    // s1/ui-ux 100%, s3/ui-ux 0%, s2/technical 0%, s3/technical 0% -> 25%.
    assert.equal(overview.averageProgressPercent, 25);
  });

  it('handles an empty portal without dividing by zero', () => {
    assert.deepEqual(computeOverview({ students: [], tracks: [], tasks: [], resources: [], progressDocs: [] }), {
      totalStudents: 0,
      studentsByTrack: [],
      totalTasksCompleted: 0,
      totalSubmissions: 0,
      averageProgressPercent: 0,
    });
  });
});

describe('buildStudentRow', () => {
  it('includes per-track progress, overall progress, and last activity', () => {
    const row = buildStudentRow({
      user: studentUiux,
      tracks: [uiux, technical],
      tasks,
      resources,
      progressDocs: [progressUiux],
    });
    assert.equal(row.id, 's1');
    assert.equal(row.name, 'Uiux Student');
    assert.equal(row.email, 'uiux@example.com');
    assert.deepEqual(row.tracks, [{
      trackId: 't1',
      slug: 'ui-ux',
      title: 'UI/UX Design',
      percentage: 100,
      completedCount: 3,
      totalCount: 3,
    }]);
    assert.equal(row.overallProgress, 100);
    assert.equal(row.lastActivity, progressUiux.updatedAt);
    assert.ok(!('passwordHash' in row), 'row must not carry auth secrets');
  });

  it('reports 0% progress and null last activity for a student who has not started', () => {
    const row = buildStudentRow({
      user: { ...studentBoth, _id: 's9' },
      tracks: [uiux, technical],
      tasks,
      resources,
      progressDocs: [],
    });
    assert.equal(row.overallProgress, 0);
    assert.equal(row.lastActivity, null);
    assert.deepEqual(row.tracks.map((track) => track.percentage), [0, 0]);
  });
});

describe('buildStudentDetail', () => {
  const detail = buildStudentDetail({
    user: studentUiux,
    tracks: [uiux],
    tasks,
    resources,
    progressDocs: [progressUiux],
  });

  it('carries identity without auth secrets', () => {
    assert.equal(detail.id, 's1');
    assert.equal(detail.email, 'uiux@example.com');
    assert.ok(!('passwordHash' in detail), 'detail must not carry auth secrets');
  });

  it('groups steps week by week with completion flags', () => {
    const track = detail.tracks[0];
    assert.equal(track.slug, 'ui-ux');
    assert.equal(track.percentage, 100);
    assert.equal(track.weeks.length, 1);
    assert.deepEqual(track.weeks[0].steps.map((step) => [step.type, step.completed]), [
      ['topic', true],
      ['resource', true],
      ['task', true],
    ]);
  });

  it('resolves submission links with task titles and the legacy figmaUrl fallback', () => {
    const [submission] = detail.tracks[0].submissions;
    assert.equal(submission.taskTitle, 'UI/UX weekly task');
    assert.equal(submission.submissionType, 'design-link');
    assert.equal(submission.submissionUrl, 'https://www.figma.com/design/abc');
    assert.equal(submission.figmaUrl, 'https://www.figma.com/design/abc');
  });

  it('labels submissions whose task no longer exists', () => {
    const orphan = buildStudentDetail({
      user: studentTechnicalLegacy,
      tracks: [technical],
      tasks: [],
      resources: [],
      progressDocs: [{
        userId: 's2',
        trackId: 't2',
        completedTopicKeys: [],
        completedResourceIds: [],
        completedTaskIds: [],
        taskSubmissions: [{ taskId: 'gone', submissionUrl: 'https://example.com/x' }],
        updatedAt: new Date(),
      }],
    });
    assert.equal(orphan.tracks[0].submissions[0].taskTitle, 'Removed task');
    assert.equal(orphan.tracks[0].submissions[0].submissionUrl, 'https://example.com/x');
  });
});
