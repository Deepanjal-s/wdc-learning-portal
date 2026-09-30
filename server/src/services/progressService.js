export function buildProgressSummary(track, tasks, progress, resources = []) {
  const completedTopicKeys = new Set(progress?.completedTopicKeys ?? []);
  const completedResourceIds = new Set((progress?.completedResourceIds ?? []).map((id) => String(id)));
  const completedTaskIds = new Set((progress?.completedTaskIds ?? []).map((id) => String(id)));
  const orderedSteps = [];

  for (const week of track.weeks) {
    for (const topic of week.topics) {
      orderedSteps.push({
        type: 'topic',
        id: topic.topicKey,
        title: topic.title,
        weekKey: week.weekKey,
        weekNumber: week.number,
        completed: completedTopicKeys.has(topic.topicKey),
      });
    }

    for (const resource of resources.filter((item) => item.weekKey === week.weekKey)) {
      orderedSteps.push({
        type: 'resource',
        id: String(resource._id),
        title: resource.title,
        weekKey: week.weekKey,
        weekNumber: week.number,
        completed: completedResourceIds.has(String(resource._id)),
      });
    }

    for (const task of tasks.filter((item) => item.weekKey === week.weekKey)) {
      orderedSteps.push({
        type: 'task',
        id: String(task._id),
        slug: task.slug,
        title: task.title,
        weekKey: week.weekKey,
        weekNumber: week.number,
        completed: completedTaskIds.has(String(task._id)),
      });
    }
  }

  const totalCount = orderedSteps.length;
  const completedCount = orderedSteps.filter((step) => step.completed).length;
  const nextStep = orderedSteps.find((step) => !step.completed) ?? null;
  const currentWeek = nextStep
    ? track.weeks.find((week) => week.weekKey === nextStep.weekKey) ?? null
    : null;

  return {
    trackId: String(track._id),
    percentage: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    currentWeek: currentWeek
      ? { weekKey: currentWeek.weekKey, number: currentWeek.number, title: currentWeek.title }
      : null,
    nextStep,
    completedTopicKeys: [...completedTopicKeys],
    completedResourceIds: [...completedResourceIds],
    completedTaskIds: [...completedTaskIds],
    steps: orderedSteps,
  };
}
