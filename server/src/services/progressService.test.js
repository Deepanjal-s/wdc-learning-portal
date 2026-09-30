import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgressSummary } from './progressService.js';

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
