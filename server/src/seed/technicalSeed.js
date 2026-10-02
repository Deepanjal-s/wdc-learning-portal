// Technical learning track seed.
//
// Placeholder content only: this file defines the Technical track's structure
// (weeks and topics) so the portal can list the track, show its roadmap, and
// record per-student progress. The actual curriculum (resources, weekly tasks,
// submissions) will be added by WDC seniors later and seeded alongside this
// track without changing the Track/Resource/Task/Progress models or APIs.
//
// The UI/UX track seed lives in uiuxSeed.js and is intentionally untouched.

export const technicalTrackSeed = {
  slug: 'technical',
  title: 'Technical Development',
  description:
    'Placeholder: the four-week Technical track is being prepared by the WDC team. The weeks and topics below are structure placeholders, not the final curriculum.',
  isActive: true,
  weeks: [
    {
      weekKey: 'week-1',
      number: 1,
      title: 'HTML Foundations',
      description:
        'Placeholder: an introduction to semantic HTML and page structure. Final topics will be added by WDC seniors.',
      topics: [
        { topicKey: 'html-document', title: 'HTML document structure', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'html-semantics', title: 'Semantic markup', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'html-forms', title: 'Forms and inputs', description: 'Placeholder topic. The technical curriculum is being prepared.' },
      ],
    },
    {
      weekKey: 'week-2',
      number: 2,
      title: 'CSS Styling and Layout',
      description:
        'Placeholder: styling and layout with CSS. Final topics will be added by WDC seniors.',
      topics: [
        { topicKey: 'css-selectors', title: 'Selectors and the box model', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'css-layout', title: 'Flexbox and grid', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'css-responsive', title: 'Responsive design basics', description: 'Placeholder topic. The technical curriculum is being prepared.' },
      ],
    },
    {
      weekKey: 'week-3',
      number: 3,
      title: 'JavaScript Essentials',
      description:
        'Placeholder: core JavaScript for the browser. Final topics will be added by WDC seniors.',
      topics: [
        { topicKey: 'js-syntax', title: 'Syntax, data types, and functions', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'js-dom', title: 'DOM manipulation', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'js-events', title: 'Events and interactivity', description: 'Placeholder topic. The technical curriculum is being prepared.' },
      ],
    },
    {
      weekKey: 'week-4',
      number: 4,
      title: 'Practical Exam Preparation',
      description:
        'Placeholder: revision and timed practice for the two-hour Round 2 exam. Final topics will be added by WDC seniors.',
      topics: [
        { topicKey: 'revision', title: 'Revision', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'timed-practice', title: 'Timed practice', description: 'Placeholder topic. The technical curriculum is being prepared.' },
        { topicKey: 'code-review', title: 'Code review checklist', description: 'Placeholder topic. The technical curriculum is being prepared.' },
      ],
    },
  ],
};
