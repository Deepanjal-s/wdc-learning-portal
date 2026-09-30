export function buildProgressSummary(track, tasks, progress, resources = []) {
  const completedTopicKeys = new Set(progress?.completedTopicKeys ?? []);
  const completedResourceIds = new Set((progress?.completedResourceIds ?? []).map((id) => String(id)));
  const completedTaskIds = new Set((progress?.completedTaskIds ?? []).map((id) => String(id)));
  const taskSubmissions = (progress?.taskSubmissions ?? []).map((submission) => ({
    taskId: String(submission.taskId),
    figmaUrl: submission.figmaUrl,
  }));
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
    taskSubmissions,
    steps: orderedSteps,
  };
}

export function isValidFigmaUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2048) return false;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    return url.protocol === 'https:'
      && (hostname === 'figma.com' || hostname.endsWith('.figma.com'))
      && url.pathname.length > 1;
  } catch {
    return false;
  }
}

export function isWeekUnlocked(track, summary, weekKey) {
  const weekIndex = track.weeks.findIndex((week) => week.weekKey === weekKey);
  if (weekIndex < 0) return false;
  if (summary?.currentWeek === null) return true;

  const currentWeekIndex = summary?.currentWeek
    ? track.weeks.findIndex((week) => week.weekKey === summary.currentWeek.weekKey)
    : -1;

  return weekIndex <= currentWeekIndex;
}
