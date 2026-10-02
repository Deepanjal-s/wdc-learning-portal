export const technicalTrackSeed = {
  slug: 'technical',
  title: 'Technical Development',
  description: 'A four-week path from HTML and CSS fundamentals to JavaScript interactivity and a timed Round 2 mock exam.',
  isActive: true,
  weeks: [
    {
      weekKey: 'week-1',
      number: 1,
      title: 'HTML Fundamentals',
      description: 'Structure web pages with semantic tags, links, images, and forms.',
      topics: [
        { topicKey: 'html-structure', title: 'Document structure', description: 'Doctype, head, body, and how a page is organized.' },
        { topicKey: 'html-tags', title: 'Common tags', description: 'Headings, paragraphs, links, images, and lists.' },
        { topicKey: 'semantic-html', title: 'Semantic HTML', description: 'Use header, nav, main, section, article, and footer meaningfully.' },
        { topicKey: 'html-forms', title: 'Forms', description: 'Inputs, labels, buttons, and basic form behavior.' },
      ],
    },
    {
      weekKey: 'week-2',
      number: 2,
      title: 'CSS Fundamentals',
      description: 'Style pages with selectors, the box model, Flexbox, and responsive basics.',
      topics: [
        { topicKey: 'css-selectors', title: 'Selectors', description: 'Target elements with type, class, and id selectors.' },
        { topicKey: 'box-model', title: 'Box model', description: 'Content, padding, border, and margin — and how they add up.' },
        { topicKey: 'flexbox', title: 'Flexbox', description: 'Lay out navbars, cards, and heroes with flexible boxes.' },
        { topicKey: 'responsive-basics', title: 'Responsive basics', description: 'Relative units and media queries for smaller screens.' },
      ],
    },
    {
      weekKey: 'week-3',
      number: 3,
      title: 'JavaScript Fundamentals',
      description: 'Make pages interactive with variables, functions, the DOM, and events.',
      topics: [
        { topicKey: 'js-variables', title: 'Variables and data', description: 'let, const, strings, numbers, arrays, and objects.' },
        { topicKey: 'js-functions', title: 'Functions', description: 'Define and call functions; understand parameters and return values.' },
        { topicKey: 'dom-manipulation', title: 'DOM manipulation', description: 'Select elements and change text, styles, and content.' },
        { topicKey: 'js-events', title: 'Events', description: 'Respond to clicks and input with event listeners.' },
      ],
    },
    {
      weekKey: 'week-4',
      number: 4,
      title: 'Round 2 Mock Exam',
      description: 'Revise HTML, CSS, and JavaScript, then practice under a realistic two-hour time limit.',
      topics: [
        { topicKey: 'revision', title: 'Revision', description: 'Review the HTML, CSS, and JavaScript concepts from Weeks 1–3.' },
        { topicKey: 'timed-practice', title: 'Timed practice', description: 'Plan a small build and manage the two hours intentionally.' },
        { topicKey: 'exam-checklist', title: 'Exam checklist', description: 'Verify structure, styling, interactivity, and code readability before finishing.' },
      ],
    },
  ],
};

export const technicalResourceSeeds = [
  { slug: 'mdn-html-basics', title: 'HTML basics', description: 'MDN guide to structuring content: headings, paragraphs, links, and images.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', type: 'documentation', weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 40 },
  { slug: 'mdn-html-elements', title: 'HTML elements reference', description: 'Look up any HTML element and its correct usage on MDN.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element', type: 'documentation', weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 30 },
  { slug: 'mdn-html-forms', title: 'Your first form', description: 'Build an accessible form with labels, inputs, and buttons.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Your_first_form', type: 'documentation', weekKey: 'week-1', topicKey: 'html-forms', difficulty: 'beginner', estimatedMinutes: 45 },
  { slug: 'mdn-css-basics', title: 'CSS basics', description: 'MDN introduction to selectors, properties, and styling text and boxes.', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/CSS_basics', type: 'documentation', weekKey: 'week-2', difficulty: 'beginner', estimatedMinutes: 40 },
  { slug: 'mdn-css-flexbox', title: 'Flexbox', description: 'Learn flexible box layout for navbars, cards, and page sections.', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox', type: 'documentation', weekKey: 'week-2', topicKey: 'flexbox', difficulty: 'intermediate', estimatedMinutes: 50 },
  { slug: 'mdn-responsive-design', title: 'Responsive design', description: 'Make layouts adapt to phones and desktops with media queries.', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design', type: 'documentation', weekKey: 'week-2', topicKey: 'responsive-basics', difficulty: 'beginner', estimatedMinutes: 40 },
  { slug: 'javascript-info-intro', title: 'The Modern JavaScript Tutorial', description: 'Clear, thorough JavaScript tutorial from language basics to advanced topics.', url: 'https://javascript.info/', type: 'documentation', weekKey: 'week-3', difficulty: 'beginner', estimatedMinutes: 120 },
  { slug: 'mdn-js-first-steps', title: 'JavaScript first steps', description: 'MDN path through variables, functions, and first scripts.', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps', type: 'documentation', weekKey: 'week-3', topicKey: 'js-variables', difficulty: 'beginner', estimatedMinutes: 60 },
  { slug: 'mdn-dom-intro', title: 'Introduction to the DOM', description: 'Understand the document object model before manipulating pages.', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', type: 'documentation', weekKey: 'week-3', topicKey: 'dom-manipulation', difficulty: 'beginner', estimatedMinutes: 45 },
  { slug: 'mdn-js-guide', title: 'JavaScript Guide', description: 'Deeper MDN reference for revision: grammar, functions, and objects.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'documentation', weekKey: 'week-4', topicKey: 'revision', difficulty: 'intermediate', estimatedMinutes: 90 },
];

export const technicalTaskSeeds = [
  {
    slug: 'semantic-html-page', title: 'Build a semantic HTML page', description: 'Structure a simple page using semantic tags and a working form.',
    instructions: 'Create a single HTML page for a fictional club or event. Use header, nav, main, section, and footer. Include a heading hierarchy (h1 → h2 → h3), one image with alt text, one list, and a small form with name, email, and message fields plus a submit button. Keep it simple — styling comes next week.',
    weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 45, submissionType: 'mark-complete',
    evaluationCriteria: ['Semantic tags are used instead of plain divs', 'Headings follow a logical order', 'The image has descriptive alt text', 'Form fields have associated labels'],
  },
  {
    slug: 'accessible-html-form', title: 'Build an accessible form', description: 'Practice labels, input types, and required fields.',
    instructions: 'Build a standalone registration form with fields for name, email, phone (optional), and a short bio. Use label elements for every input, mark required fields, use the correct input types (email, tel), and group related fields with fieldset and legend.',
    weekKey: 'week-1', difficulty: 'beginner', estimatedMinutes: 30, submissionType: 'mark-complete',
    evaluationCriteria: ['Every input has a label', 'Required fields are marked', 'Input types match the expected data', 'Related fields are grouped sensibly'],
  },
  {
    slug: 'profile-card-css', title: 'Style a profile card with CSS', description: 'Apply the box model, colors, and spacing to a simple component.',
    instructions: 'Take a plain HTML profile card (avatar placeholder, name, role, short bio, one button) and style it with CSS: set a max-width, add padding and a border or shadow, round the corners, choose two text colors with good contrast, and space the elements comfortably. No layout frameworks — plain CSS in a style tag or stylesheet.',
    weekKey: 'week-2', difficulty: 'beginner', estimatedMinutes: 45, submissionType: 'mark-complete',
    evaluationCriteria: ['Box model is used deliberately (padding, border, margin)', 'Text has clear hierarchy and readable contrast', 'The card looks balanced and uncluttered', 'CSS is organized and readable'],
  },
  {
    slug: 'flexbox-navbar-hero', title: 'Build a navbar and hero with Flexbox', description: 'Lay out a navbar and hero section using Flexbox, then share your code.',
    instructions: 'Build a simple page section with a navbar (logo on the left, links on the right) and a hero (headline, short paragraph, one button) using Flexbox for alignment. Push your code to GitHub or save it on CodePen, then submit the link below so coordinators can review it.',
    weekKey: 'week-2', difficulty: 'intermediate', estimatedMinutes: 60, submissionType: 'code-link',
    evaluationCriteria: ['Flexbox is used for alignment, not floats or tables', 'Navbar and hero align cleanly', 'Layout holds together at desktop width', 'Submitted link opens and shows the work'],
  },
  {
    slug: 'dom-events-counter', title: 'DOM events: interactive counter', description: 'Wire up buttons to change the page with JavaScript.',
    instructions: 'Create a page with a number display and three buttons: increment, decrement, and reset. Use addEventListener to update the displayed number when each button is clicked. Keep the JavaScript in a script tag at the end of the body.',
    weekKey: 'week-3', difficulty: 'beginner', estimatedMinutes: 30, submissionType: 'mark-complete',
    evaluationCriteria: ['Buttons respond to clicks', 'The display updates correctly', 'Reset returns the counter to zero', 'Code uses event listeners, not inline handlers'],
  },
  {
    slug: 'todo-list-javascript', title: 'Tiny to-do list in JavaScript', description: 'Manage a small list with arrays and DOM updates.',
    instructions: 'Build a to-do list: an input field, an add button, and a list. Typing text and clicking add appends the item; each item gets a remove button. Store the items in a JavaScript array and re-render the list from it.',
    weekKey: 'week-3', difficulty: 'intermediate', estimatedMinutes: 60, submissionType: 'mark-complete',
    evaluationCriteria: ['Items can be added and removed', 'The list is rendered from an array', 'Empty input does not create blank items', 'Code is split into small, named functions'],
  },
  {
    slug: 'two-hour-html-css-js-mock', title: '2-hour HTML/CSS/JS mock exam', description: 'A timed practice exam mirroring the Round 2 format.',
    instructions: 'Set a two-hour timer. Build a small landing page for a fictional product or event: a header with navigation, a hero section, three feature cards, and a footer — styled with CSS. Then add one piece of JavaScript interactivity (a mobile menu toggle, an FAQ accordion, or a theme switcher). Spend the first 15 minutes planning the structure, and the last 10 minutes checking structure, styling, interactivity, and code readability.',
    weekKey: 'week-4', difficulty: 'advanced', estimatedMinutes: 120, submissionType: 'mark-complete',
    evaluationCriteria: ['All required sections are present and structured', 'CSS layout is deliberate and responsive at desktop width', 'The JavaScript interaction works', 'Code is readable and organized'],
  },
];
