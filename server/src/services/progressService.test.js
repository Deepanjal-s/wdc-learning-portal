import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressSummary, isValidFigmaUrl, isValidHttpsUrl, isWeekUnlocked } from './progressService.js';

const track = {
  _id: 'track-1',
  weeks: [
    { weekKey: 'week-1', number: 1, title: 'Figma Basics', topics: [{ topicKey: 'frames', title: 'Frames' }, { topicKey: 'layers', title: 'Layers' }] },
    { weekKey: 'week-2', number: 2, title: 'UI Fundamentals', topics: [{ topicKey: 'type', title: 'Typography' }] },
  ],
};
const tasks = [
  { _id: 'task-1', slug: 'practice-one', title: 'Practice One', weekKey: 'week-1' },
  { _id: 'task-2', slug: 'practice-two', title: 'Practice Two', weekKey: 'week-2' },
];

test('calculates initial progress and recommends the first topic', () => {
  const summary = buildProgressSummary(track, tasks, null);
  assert.equal(summary.percentage, 0);
  assert.equal(summary.totalCount, 5);
  assert.deepEqual(summary.currentWeek, { weekKey: 'week-1', number: 1, title: 'Figma Basics' });
  assert.equal(summary.nextStep.id, 'frames');
});

test('calculates percentage and advances to the next incomplete step', () => {
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: ['frames', 'layers'],
    completedResourceIds: [],
    completedTaskIds: ['task-1'],
  });
  assert.equal(summary.percentage, 60);
  assert.deepEqual(summary.currentWeek, { weekKey: 'week-2', number: 2, title: 'UI Fundamentals' });
  assert.equal(summary.nextStep.id, 'type');
});

test('returns no current week when every topic and task is complete', () => {
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: ['frames', 'layers', 'type'],
    completedResourceIds: [],
    completedTaskIds: ['task-1', 'task-2'],
  });
  assert.equal(summary.percentage, 100);
  assert.equal(summary.currentWeek, null);
  assert.equal(summary.nextStep, null);
});

test('counts curated resources and recognizes resource completion', () => {
  const resources = [
    { _id: 'resource-1', title: 'Figma guide', weekKey: 'week-1' },
    { _id: 'resource-2', title: 'Type guide', weekKey: 'week-2' },
  ];
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: ['frames'],
    completedResourceIds: ['resource-1'],
    completedTaskIds: [],
  }, resources);
  assert.equal(summary.totalCount, 7);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.percentage, 29);
  assert.ok(summary.steps.some((step) => step.type === 'resource' && step.id === 'resource-1' && step.completed));
});

test('locks future weeks until the previous week is fully completed', () => {
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: ['frames'],
    completedResourceIds: [],
    completedTaskIds: [],
  });

  assert.equal(isWeekUnlocked(track, summary, 'week-1'), true);
  assert.equal(isWeekUnlocked(track, summary, 'week-2'), false);

  const nextSummary = buildProgressSummary(track, tasks, {
    completedTopicKeys: ['frames', 'layers', 'type'],
    completedResourceIds: [],
    completedTaskIds: ['task-1', 'task-2'],
  });

  assert.equal(isWeekUnlocked(track, nextSummary, 'week-2'), true);
});

test('accepts valid HTTPS Figma share links only', () => {
  assert.equal(isValidFigmaUrl('https://www.figma.com/design/abc123/example'), true);
  assert.equal(isValidFigmaUrl('https://figma.com/proto/abc123/example'), true);
  assert.equal(isValidFigmaUrl(''), false);
  assert.equal(isValidFigmaUrl('https://example.com/design'), false);
  assert.equal(isValidFigmaUrl('http://www.figma.com/design/abc123'), false);
  assert.equal(isValidFigmaUrl('https://figma.com'), false);
});

test('includes the student task submission URL in the progress summary', () => {
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: [],
    completedResourceIds: [],
    completedTaskIds: [],
    taskSubmissions: [{ taskId: 'task-1', figmaUrl: 'https://www.figma.com/design/abc123/example' }],
  });

  assert.deepEqual(summary.taskSubmissions, [{
    taskId: 'task-1',
    figmaUrl: 'https://www.figma.com/design/abc123/example',
    submissionUrl: 'https://www.figma.com/design/abc123/example',
  }]);
});

test('prefers submissionUrl over the legacy figmaUrl in the progress summary', () => {
  const summary = buildProgressSummary(track, tasks, {
    completedTopicKeys: [],
    completedResourceIds: [],
    completedTaskIds: [],
    taskSubmissions: [{ taskId: 'task-1', submissionUrl: 'https://github.com/wdc/student-repo' }],
  });

  assert.deepEqual(summary.taskSubmissions, [{
    taskId: 'task-1',
    figmaUrl: null,
    submissionUrl: 'https://github.com/wdc/student-repo',
  }]);
});

test('accepts valid HTTPS links for code submissions', () => {
  assert.equal(isValidHttpsUrl('https://github.com/wdc/student-repo'), true);
  assert.equal(isValidHttpsUrl('https://codepen.io/student/pen/abc123'), true);
  assert.equal(isValidHttpsUrl('https://student-demo.vercel.app/'), true);
  assert.equal(isValidHttpsUrl('http://github.com/wdc/repo'), false);
  assert.equal(isValidHttpsUrl('not-a-url'), false);
  assert.equal(isValidHttpsUrl(''), false);
  assert.equal(isValidHttpsUrl(undefined), false);
});
