export const uiuxTrackSeed = {
  slug: 'ui-ux',
  title: 'UI/UX Design',
  description: 'A four-week path from Figma fundamentals to recruitment-style design practice.',
  isActive: true,
  weeks: [
    {
      weekKey: 'week-1',
      number: 1,
      title: 'Figma Basics',
      description: 'Get comfortable with the canvas and build a simple interface from the ground up.',
      topics: [
        { topicKey: 'frames', title: 'Frames', description: 'Create frames for common device sizes and organize screens.' },
        { topicKey: 'layers', title: 'Layers', description: 'Name, group, reorder, and navigate layers confidently.' },
        { topicKey: 'text', title: 'Text', description: 'Use text styles and establish clear type hierarchy.' },
        { topicKey: 'shapes-images', title: 'Shapes and images', description: 'Combine basic shapes, fills, and placed images.' },
        { topicKey: 'spacing', title: 'Basic spacing', description: 'Use consistent padding, gaps, and alignment.' },
        { topicKey: 'components-intro', title: 'Basic components', description: 'Turn repeated interface elements into reusable components.' },
      ],
    },
    {
      weekKey: 'week-2',
      number: 2,
      title: 'UI Design Fundamentals',
      description: 'Build visual clarity through type, color, spacing, and hierarchy.',
      topics: [
        { topicKey: 'typography', title: 'Typography', description: 'Choose readable type scales and control line length.' },
        { topicKey: 'color', title: 'Color', description: 'Build a small, accessible color palette with meaningful roles.' },
        { topicKey: 'spacing-system', title: 'Spacing system', description: 'Apply a consistent spacing scale across the screen.' },
        { topicKey: 'alignment', title: 'Alignment', description: 'Use grids and alignment to create deliberate layouts.' },
        { topicKey: 'visual-hierarchy', title: 'Visual hierarchy', description: 'Guide attention with scale, contrast, and placement.' },
        { topicKey: 'consistency', title: 'Consistency', description: 'Reuse visual decisions across related interface elements.' },
      ],
    },
    {
      weekKey: 'week-3',
      number: 3,
      title: 'Components + Auto Layout',
      description: 'Design flexible interfaces with reusable, responsive building blocks.',
      topics: [
        { topicKey: 'components', title: 'Components', description: 'Create and use components for repeated patterns.' },
        { topicKey: 'variants', title: 'Variants', description: 'Model component states and sizes with variants.' },
        { topicKey: 'auto-layout', title: 'Auto Layout', description: 'Use padding, spacing, and resizing rules to create flexible layouts.' },
        { topicKey: 'reusable-elements', title: 'Reusable elements', description: 'Organize buttons, fields, cards, and navigation into a small system.' },
      ],
    },
    {
      weekKey: 'week-4',
      number: 4,
      title: 'Recruitment Practical Preparation',
      description: 'Revise the fundamentals and practice under a realistic time limit.',
      topics: [
        { topicKey: 'revision', title: 'Revision', description: 'Review the design decisions and Figma skills from Weeks 1–3.' },
        { topicKey: 'timed-practice', title: 'Timed practice', description: 'Plan a screen recreation and manage time intentionally.' },
        { topicKey: 'design-review', title: 'Design review', description: 'Check hierarchy, spacing, consistency, and presentation before sharing.' },
      ],
    },
  ],
};

export const resourceSeeds = [
  { slug: 'figma-get-started', title: 'Get started with Figma', description: 'Official guides for the editor, files, and core canvas concepts.', url: 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started-with-Figma', type: 'documentation', weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 30 },
  { slug: 'figma-design-basics', title: 'Figma design basics', description: 'Learn the tools and concepts used to create interface designs.', url: 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started-with-Figma', type: 'course', weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 45 },
  { slug: 'figma-components', title: 'Create and use components', description: 'Official component guidance for reusable design elements.', url: 'https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma', type: 'documentation', weekKey: 'week-3', topicKey: 'components', difficulty: 'beginner', estimatedMinutes: 25 },
  { slug: 'figma-auto-layout', title: 'Explore auto layout', description: 'Learn layout direction, spacing, padding, and resizing behavior.', url: 'https://help.figma.com/hc/en-us/articles/5731482952599-Explore-auto-layout-properties', type: 'documentation', weekKey: 'week-3', topicKey: 'auto-layout', difficulty: 'intermediate', estimatedMinutes: 35 },
  { slug: 'material-design-type', title: 'Material Design: Typography', description: 'A practical reference for readable type scales and roles.', url: 'https://m3.material.io/styles/typography/overview', type: 'documentation', weekKey: 'week-2', topicKey: 'typography', difficulty: 'beginner', estimatedMinutes: 20 },
  { slug: 'material-color', title: 'Material Design: Color', description: 'Explore color roles, palettes, and accessible contrast.', url: 'https://m3.material.io/styles/color/overview', type: 'documentation', weekKey: 'week-2', topicKey: 'color', difficulty: 'beginner', estimatedMinutes: 20 },
  { slug: 'figma-community-ui-kits', title: 'Figma Community', description: 'Browse interface kits and inspect how designers structure files.', url: 'https://www.figma.com/community', type: 'figma-community', weekKey: 'week-3', difficulty: 'beginner', estimatedMinutes: 20 },
  { slug: 'practice-visual-hierarchy', title: 'Practice visual hierarchy', description: 'Study an interface and note the first, second, and third things you notice.', url: 'https://m3.material.io/foundations', type: 'practice', weekKey: 'week-2', topicKey: 'visual-hierarchy', difficulty: 'beginner', estimatedMinutes: 15 },
];

export const taskSeeds = [
  {
    slug: 'recreate-simple-profile', title: 'Recreate a simple profile screen', description: 'Practice the Figma canvas, text, shapes, and basic spacing.',
    instructions: 'Create a mobile profile screen in Figma with an avatar placeholder, a name and short bio, three profile details, and one primary action. Use frames, sensible layer names, and consistent spacing. Share a Figma link when ready; for now, mark complete after checking your work.',
    weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 60, submissionType: 'mark-complete',
    evaluationCriteria: ['Layers are clearly named and grouped', 'Text has a clear hierarchy', 'Spacing and alignment feel consistent', 'The primary action is easy to identify'],
  },
  {
    slug: 'recreate-service-screen', title: 'Recreate a service booking screen', description: 'Apply typography, color, alignment, and visual hierarchy to a detailed interface.',
    instructions: 'Design a mobile service-booking screen with a top bar, service title, provider details, date selector, price summary, and primary booking button. Establish a type scale, use a restrained palette, and align related information. Add your Figma link in your own notes; file submission will be added later.',
    weekKey: 'week-2', difficulty: 'intermediate', estimatedMinutes: 90, submissionType: 'mark-complete',
    evaluationCriteria: ['The most important action is visually prominent', 'Typography is readable and consistent', 'Color choices support meaning and contrast', 'Layout uses consistent alignment and spacing'],
  },
  {
    slug: 'build-reusable-ui-kit', title: 'Build a small reusable UI kit', description: 'Create reusable components and demonstrate at least two variants.',
    instructions: 'Build a compact mobile interface containing buttons, input fields, and information cards. Turn each repeated element into a component, create variants for relevant states or sizes, and use Auto Layout so the components resize cleanly.',
    weekKey: 'week-3', difficulty: 'intermediate', estimatedMinutes: 100, submissionType: 'mark-complete',
    evaluationCriteria: ['Repeated UI is componentized', 'Variants communicate meaningful states', 'Auto Layout responds to content changes', 'Component names and properties are understandable'],
  },
  {
    slug: 'two-hour-design-recreation', title: '2-hour design recreation mock', description: 'A timed practical that brings together the full four-week learning path.',
    instructions: 'Set a two-hour timer. Recreate a polished mobile app screen of your choice from a publicly viewable reference. Spend the first 10 minutes identifying layout, typography, and color; build the screen in Figma; then use the final 10 minutes to review spacing, hierarchy, consistency, and file organization. Keep a link to your finished Figma file.',
    weekKey: 'week-4', difficulty: 'advanced', estimatedMinutes: 120, submissionType: 'mark-complete',
    evaluationCriteria: ['A clear plan was made before building', 'Major layout and hierarchy match the chosen reference', 'Spacing and typography are deliberate', 'The file is organized and ready to present'],
  },
];

export const recruitmentRoundSeed = {
  roundNumber: 2,
  title: 'Round 2 · UI/UX Practical',
  description: 'A practical design exercise to assess interface thinking, Figma fundamentals, and how clearly you communicate design decisions.',
  requirements: ['Complete the four-week UI/UX preparation roadmap', 'Be comfortable creating and organizing a Figma file', 'Explain key choices around hierarchy, spacing, and consistency'],
  submissionInstructions: 'Submission format and deadline will be announced by WDC seniors. Keep your Figma file shareable and prepare a short explanation of your design decisions.',
  evaluationCriteria: ['Visual hierarchy and clarity', 'Spacing, alignment, and consistency', 'Figma file organization', 'Ability to explain design decisions'],
  status: 'upcoming',
};
