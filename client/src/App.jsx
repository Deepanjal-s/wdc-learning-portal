import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { apiRequest } from './services/api.js';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const navItems = [
  { label: 'Overview', to: '/' },
  { label: 'Roadmap', to: '/roadmap' },
  { label: 'Resources', to: '/resources' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Recruitment', to: '/recruitment' },
];

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center text-sm font-medium text-muted">Loading your WDC workspace…</div>;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function TrackSwitcher() {
  const { trackIds, currentTrackId, selectTrack } = useTrack();
  const { data } = useApiData(trackIds.length > 1 ? '/tracks' : null);
  const options = (data?.tracks || []).filter((track) => trackIds.includes(String(track._id)));
  if (options.length < 2) return null;
  return (
    <select
      aria-label="Switch learning track"
      value={currentTrackId || ''}
      onChange={(event) => selectTrack(event.target.value)}
      className="max-w-[10rem] truncate rounded-full border border-line bg-white px-3 py-2 text-xs font-medium"
    >
      {options.map((track) => <option key={track._id} value={String(track._id)}>{track.title}</option>)}
    </select>
  );
}

function SiteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'W';
  async function handleLogout() {
    try { await logout(); } finally { navigate('/login', { replace: true }); }
  }
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="WDC Learning Portal home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest font-bold text-ink">W</span>
            <span><span className="block text-sm font-bold tracking-tight">WDC Learn</span><span className="block text-xs text-muted">NIT Sikkim</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `rounded-full px-3 py-2 text-sm font-medium ${isActive ? 'bg-mint text-forest' : 'text-muted hover:bg-canvas hover:text-ink'}`}>{item.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <TrackSwitcher />
            <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-sm font-semibold" aria-label="Your profile">{initials}</Link>
            <button onClick={handleLogout} className="hidden text-sm font-medium text-muted hover:text-ink sm:block">Log out</button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `shrink-0 rounded-full px-3 py-2 text-xs font-medium ${isActive ? 'bg-mint text-forest' : 'text-muted'}`}>{item.label}</NavLink>)}
          <button onClick={handleLogout} className="shrink-0 rounded-full px-3 py-2 text-xs font-medium text-muted">Log out</button>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"><Outlet /></main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-xs text-muted sm:px-8">Built for the WDC learning community · NIT Sikkim</footer>
    </div>
  );
}

function Notice({ children, tone = 'error' }) {
  if (!children) return null;
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm ${tone === 'error' ? 'bg-red-50 text-red-800' : 'bg-mint text-forest'}`}>{children}</div>;
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [availableTracks, setAvailableTracks] = useState([]);
  useEffect(() => {
    if (!isRegister) return;
    let active = true;
    apiRequest('/tracks')
      .then((result) => { if (active) setAvailableTracks(result.tracks || []); })
      .catch(() => { if (active) setAvailableTracks([]); });
    return () => { active = false; };
  }, [isRegister]);
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const selectedTracks = form.getAll('tracks').map(String);
    try {
      if (isRegister) {
        await register({ name: values.name, email: values.email, password: values.password, branch: values.branch, year: values.year || undefined, tracks: selectedTracks });
      }
      else await login({ email: values.email, password: values.password });
      navigate('/', { replace: true });
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }
  const inputClass = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10';
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-citrus font-bold text-ink">W</span><span className="text-sm font-bold">WDC Learn</span></Link>
        <div className="relative z-10 max-w-xl"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-citrus">NIT SIKKIM · WEB DEVELOPMENT CELL</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">A clearer path from curiosity to craft.</h1><p className="mt-5 max-w-lg leading-7 text-white/70">Learn the skills, practice with purpose, and prepare for your next WDC recruitment round.</p></div>
        <p className="text-xs text-white/50">A learning space made for the WDC community.</p><div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full border border-white/10" />
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-md">
        <Link to="/" className="text-sm font-semibold text-forest lg:hidden">← WDC Learn</Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-forest">{isRegister ? 'Get started' : 'Welcome back'}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{isRegister ? 'Create a profile to start your WDC preparation path.' : 'Continue your learning journey with WDC.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {isRegister && <label className="block text-sm font-medium">Full name<input className={inputClass} name="name" autoComplete="name" minLength="2" maxLength="80" required placeholder="Your name" /></label>}
          <label className="block text-sm font-medium">Email<input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label className="block text-sm font-medium">Password<input className={inputClass} name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="8" required placeholder={isRegister ? 'At least 8 characters' : 'Your password'} /></label>
          {isRegister && <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Branch <span className="font-normal text-muted">(optional)</span><input className={inputClass} name="branch" maxLength="80" placeholder="e.g. CSE" /></label><label className="block text-sm font-medium">Year<input className={`${inputClass} bg-canvas`} name="year" value="2" readOnly /></label></div>}
          {isRegister && availableTracks.length > 0 && <fieldset className="block text-sm font-medium"><legend className="mb-2">Learning tracks <span className="font-normal text-muted">(choose one or both)</span></legend><div className="space-y-2">{availableTracks.map((track) => <label key={track.slug} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3"><input className="mt-0.5 h-4 w-4 accent-[#176b52]" type="checkbox" name="tracks" value={track.slug} defaultChecked={track.slug === 'ui-ux'} /><span><span className="font-medium">{track.title}</span>{track.description && <span className="mt-0.5 block text-xs leading-5 text-muted">{track.description}</span>}</span></label>)}</div></fieldset>}
          <Notice>{error}</Notice><button disabled={busy} className="w-full rounded-xl bg-forest px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#10563f] disabled:cursor-wait disabled:opacity-60">{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">{isRegister ? 'Already have an account?' : 'New to WDC Learn?'} <Link className="font-semibold text-forest hover:underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
      </div></section>
    </div>
  );
}

function useApiData(path, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const refresh = useCallback(() => {
    let active = true;
    if (!path) {
      setState({ data: null, loading: false, error: '' });
      return () => { active = false; };
    }
    setState((current) => ({ ...current, loading: true, error: '' }));
    apiRequest(path).then((data) => { if (active) setState({ data, loading: false, error: '' }); })
      .catch((error) => { if (active) setState({ data: null, loading: false, error: error.message }); });
    return () => { active = false; };
  // Dependencies intentionally come from the calling page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => refresh(), [refresh]);
  return { ...state, refresh };
}

const TrackContext = createContext(null);

// Tracks the user's enrolled tracks and which one is currently active in the UI.
// The active track id persists in localStorage; it always falls back to the
// user's first enrolled track when the stored value is missing or stale.
function TrackProvider({ user, children }) {
  const trackIds = useMemo(() => {
    if (Array.isArray(user?.selectedTrackIds) && user.selectedTrackIds.length > 0) return user.selectedTrackIds;
    if (user?.selectedTrackId) return [user.selectedTrackId];
    return [];
  }, [user]);
  const [storedId, setStoredId] = useState(() => {
    try { return localStorage.getItem('wdc-track-id'); } catch { return null; }
  });
  const currentTrackId = trackIds.includes(storedId) ? storedId : (trackIds[0] || null);
  const selectTrack = useCallback((id) => {
    setStoredId(id);
    try { localStorage.setItem('wdc-track-id', id); } catch { /* storage unavailable */ }
  }, []);
  const value = useMemo(() => ({ trackIds, currentTrackId, selectTrack }), [trackIds, currentTrackId, selectTrack]);
  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

function useTrack() {
  const context = useContext(TrackContext);
  if (!context) throw new Error('useTrack must be used within TrackProvider.');
  return context;
}

function LoadingBlock() { return <div className="rounded-2xl border border-line bg-white p-8 text-sm text-muted">Loading portal content…</div>; }
function ApiProblem({ error }) {
  if (!error) return null;
  return <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950"><h2 className="font-semibold">Could not load this information</h2><p className="mt-1">{error}</p><p className="mt-2 text-amber-800">Check that the backend is running, MongoDB is connected, and the WDC content seed has been run.</p></section>;
}
function ProgressBar({ value = 0 }) { return <div className="h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }
function Eyebrow({ children }) { return <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{children}</p>; }
function PageHeading({ eyebrow, title, description }) { return <header className="mb-7"><Eyebrow>{eyebrow}</Eyebrow><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl leading-7 text-muted">{description}</p>}</header>; }
function Pill({ children }) { return <span className="inline-flex rounded-full bg-mint px-3 py-1 text-xs font-semibold capitalize text-forest">{children}</span>; }

function DashboardPage() {
  const { currentTrackId } = useTrack();
  const { data, loading, error } = useApiData(currentTrackId ? `/student/dashboard?trackId=${currentTrackId}` : null, [currentTrackId]);
  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  if (!data) return <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">Choose a learning track in your profile to get started.</section>;
  const { user, track, progress, currentGoals = [], currentTask, upcomingRounds = [] } = data;
  const taskDone = currentTask && progress?.completedTaskIds?.includes(String(currentTask._id));
  return <>
    <section className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-9 text-white shadow-card sm:px-10 sm:py-12"><div className="absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10" /><p className="text-sm font-medium text-citrus">WEB DEVELOPMENT CELL · NIT SIKKIM</p><h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">Welcome, {user.name.split(' ')[0]}.</h1><p className="mt-3 max-w-xl leading-7 text-white/70">Small, steady practice adds up. Here’s your next step in the WDC learning path.</p>
    </section>
    {track && <>
      <section className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-line bg-white p-5"><Eyebrow>Selected track</Eyebrow><h2 className="mt-2 text-lg font-semibold">{track.title}</h2><p className="mt-1 text-sm text-muted">Your WDC preparation path</p></article><article className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><Eyebrow>Overall progress</Eyebrow><strong className="text-lg">{progress?.percentage ?? 0}%</strong></div><div className="mt-3"><ProgressBar value={progress?.percentage} /></div><p className="mt-2 text-xs text-muted">{progress?.completedCount ?? 0} of {progress?.totalCount ?? 0} learning steps complete</p></article><article className="rounded-2xl border border-line bg-white p-5"><Eyebrow>Current week</Eyebrow><h2 className="mt-2 text-lg font-semibold">{progress?.currentWeek ? `Week ${progress.currentWeek.number}` : 'All caught up'}</h2><p className="mt-1 text-sm text-muted">{progress?.currentWeek?.title || 'You completed this roadmap.'}</p></article></section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="flex items-center justify-between gap-4"><div><Eyebrow>Current learning goals</Eyebrow><h2 className="mt-2 text-xl font-semibold">{progress?.currentWeek?.title || 'Roadmap complete'}</h2></div><Link to="/roadmap" className="text-sm font-semibold text-forest">Open roadmap →</Link></div><div className="mt-5 space-y-3">{currentGoals.length ? currentGoals.slice(0, 4).map((goal) => <div key={goal.topicKey} className="flex items-center gap-3 rounded-xl bg-canvas/80 p-3"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${goal.completed ? 'bg-forest text-white' : 'border border-line bg-white text-muted'}`}>{goal.completed ? '✓' : '·'}</span><span className={`text-sm ${goal.completed ? 'text-muted line-through' : 'font-medium'}`}>{goal.title}</span></div>) : <p className="text-sm text-muted">No outstanding topics. Take a look at your next recommendation.</p>}</div></article>
        <article className="rounded-3xl border border-line bg-[#eef3ed] p-6 sm:p-8"><Eyebrow>Your next step</Eyebrow>{progress?.nextStep ? <><h2 className="mt-3 text-xl font-semibold">{progress.nextStep.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{progress.nextStep.type === 'topic' ? 'Review this topic, then mark it complete in your roadmap.' : 'Open the task to review the instructions and work through it.'}</p><Link to={progress.nextStep.type === 'task' ? `/tasks/${progress.nextStep.id}` : '/roadmap'} className="mt-5 inline-flex rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white">Continue learning <span className="ml-2">→</span></Link></> : <><h2 className="mt-3 text-xl font-semibold">Ready for a challenge?</h2><p className="mt-2 text-sm leading-6 text-muted">Your learning roadmap is complete. Try the timed mock task when you’re ready.</p><Link to="/tasks" className="mt-5 inline-flex rounded-full bg-forest px-4 py-2.5 text-sm font-semibold text-white">View practice tasks →</Link></>}</article>
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl border border-line bg-white p-6"><Eyebrow>Current task</Eyebrow>{currentTask ? <><h2 className="mt-2 text-lg font-semibold">{currentTask.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{currentTask.description}</p><Link to={`/tasks/${currentTask._id}`} className="mt-4 inline-flex text-sm font-semibold text-forest">{taskDone ? 'Review completed task' : 'View task details'} →</Link></> : <p className="mt-3 text-sm text-muted">No current task. Your practice activities will show up here.</p>}</article><article className="rounded-3xl border border-line bg-white p-6"><div className="flex items-center justify-between"><Eyebrow>Recruitment status</Eyebrow><Link to="/recruitment" className="text-sm font-semibold text-forest">View rounds →</Link></div>{upcomingRounds.length ? upcomingRounds.map((round) => <div key={round._id} className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3"><div><p className="text-sm font-semibold">{round.title}</p><p className="mt-1 text-xs capitalize text-muted">{round.status}</p></div><Pill>{round.status}</Pill></div>) : <p className="mt-3 text-sm text-muted">Round information will appear here when published.</p>}</article></section>
    </>}
  </>;
}

function RoadmapPage() {
  const { currentTrackId } = useTrack();
  const { data, loading, error, refresh } = useApiData(currentTrackId ? `/roadmap/${currentTrackId}` : null, [currentTrackId]);
  const [actionError, setActionError] = useState('');
  async function toggleTopic(topicKey, completed) {
    setActionError('');
    try { await apiRequest('/student/progress/complete', { method: 'POST', body: JSON.stringify({ type: 'topic', id: topicKey, completed: !completed, trackId: currentTrackId }) }); refresh(); }
    catch (requestError) { setActionError(requestError.message); }
  }
  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  if (!data) return <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">Choose a learning track in your profile to see your roadmap.</section>;
  return <><PageHeading eyebrow={`${data.track.title} learning path`} title="Your roadmap" description="Work through topics in order, and use the practice tasks to put each week into action." />{actionError && <div className="mb-4"><Notice>{actionError}</Notice></div>}<section className="mb-6 rounded-3xl border border-line bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><Eyebrow>Path progress</Eyebrow><p className="mt-2 text-sm font-medium">{data.progress.completedCount} of {data.progress.totalCount} learning steps</p></div><span className="text-2xl font-semibold">{data.progress.percentage}%</span></div><div className="mt-4"><ProgressBar value={data.progress.percentage} /></div></section>
    <div className="space-y-5">{data.weeks.map((week) => <section key={week.weekKey} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card"><header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-7"><div><Eyebrow>WEEK {String(week.number).padStart(2, '0')}</Eyebrow><h2 className="mt-1 text-xl font-semibold">{week.title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{week.description}</p></div>{data.progress.currentWeek?.weekKey === week.weekKey && <Pill>Current week</Pill>}</header><div className="grid gap-0 lg:grid-cols-[1fr_0.65fr]"><div className="p-5 sm:p-7"><h3 className="text-sm font-semibold">Learning goals</h3><div className="mt-3 space-y-2">{week.topics.map((topic) => <label key={topic.topicKey} className="flex cursor-pointer items-start gap-3 rounded-xl p-3 transition hover:bg-canvas"><input className="mt-0.5 h-4 w-4 accent-[#176b52]" type="checkbox" checked={topic.completed} onChange={() => toggleTopic(topic.topicKey, topic.completed)} /><span><span className={`text-sm font-medium ${topic.completed ? 'text-muted line-through' : ''}`}>{topic.title}</span>{topic.description && <span className="mt-0.5 block text-xs leading-5 text-muted">{topic.description}</span>}</span></label>)}</div></div><aside className="border-t border-line bg-canvas/60 p-5 sm:p-7 lg:border-l lg:border-t-0"><h3 className="text-sm font-semibold">Practice this week</h3>{week.tasks.length ? week.tasks.map((task) => <Link key={task._id} to={`/tasks/${task._id}`} className="mt-3 block rounded-2xl border border-line bg-white p-4 transition hover:border-forest/30"><span className="text-sm font-semibold">{task.title}</span><span className="mt-1 block text-xs capitalize text-muted">{task.difficulty}{task.estimatedMinutes ? ` · ${task.estimatedMinutes} min` : ''}</span></Link>) : <p className="mt-3 text-sm text-muted">Topic practice tasks are being prepared.</p>}{(week.weekResources?.length || week.topics.some((topic) => topic.resources?.length)) > 0 && <><h3 className="mt-6 text-sm font-semibold">Helpful resources</h3>{[...(week.weekResources || []), ...week.topics.flatMap((topic) => topic.resources || [])].slice(0, 3).map((resource) => <a key={resource._id} className="mt-2 block text-sm text-forest hover:underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title} ↗</a>)}</>}</aside></div></section>)}</div>
  </>;
}

function ResourcesPage() {
  const { currentTrackId } = useTrack();
  const [weekKey, setWeekKey] = useState('');
  const trackQuery = useApiData(currentTrackId ? `/tracks/${currentTrackId}` : null, [currentTrackId]);
  const { data, loading, error } = useApiData(currentTrackId ? `/resources?trackId=${currentTrackId}${weekKey ? `&weekKey=${weekKey}` : ''}` : null, [weekKey, currentTrackId]);
  const progressQuery = useApiData(currentTrackId ? `/student/progress?trackId=${currentTrackId}` : null, [currentTrackId]);
  const [completionError, setCompletionError] = useState('');
  useEffect(() => { setWeekKey(''); }, [currentTrackId]);
  async function toggleResource(resourceId, completed) {
    setCompletionError('');
    try {
      await apiRequest('/student/progress/complete', { method: 'POST', body: JSON.stringify({ type: 'resource', id: resourceId, completed: !completed, trackId: currentTrackId }) });
      progressQuery.refresh();
    } catch (requestError) { setCompletionError(requestError.message); }
  }
  if (loading || trackQuery.loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  if (!data) return <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">Choose a learning track in your profile to see resources.</section>;
  const resources = data.resources || [];
  const completedResourceIds = new Set(progressQuery.data?.progress?.completedResourceIds || []);
  const typeLabels = { youtube: 'YouTube', course: 'Course', documentation: 'Documentation', 'figma-community': 'Figma Community', article: 'Article', practice: 'Practice' };
  const weekFilters = [['', 'All weeks'], ...(trackQuery.data?.track?.weeks || []).map((week) => [week.weekKey, `Week ${week.number}`])];
  return <><PageHeading eyebrow="Curated for your track" title="Learning resources" description="A short list of references tied to your roadmap. Choose a week to focus your reading and practice."/>
    {completionError && <div className="mb-4"><Notice>{completionError}</Notice></div>}
    <div className="mb-5 flex flex-wrap items-center gap-2">{weekFilters.map(([key, label]) => <button key={key || 'all'} onClick={() => setWeekKey(key)} className={`rounded-full px-4 py-2 text-sm font-medium ${weekKey === key ? 'bg-forest text-white' : 'border border-line bg-white text-muted hover:text-ink'}`}>{label}</button>)}</div>
    {resources.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{resources.map((resource) => { const completed = completedResourceIds.has(String(resource._id)); return <article key={resource._id} className="flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card"><div className="flex items-center justify-between gap-2"><Pill>{typeLabels[resource.type] || resource.type}</Pill><span className="text-xs font-medium text-muted">{resource.weekKey.replace('-', ' ').toUpperCase()}</span></div><h2 className="mt-4 text-lg font-semibold">{resource.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted">{resource.description}</p><p className="mt-4 text-xs capitalize text-muted">{resource.difficulty}{resource.estimatedMinutes ? ` · ${resource.estimatedMinutes} min` : ''}</p><a className="mt-4 inline-flex text-sm font-semibold text-forest hover:underline" href={resource.url} target="_blank" rel="noreferrer">Open resource <span className="ml-2">↗</span></a><button onClick={() => toggleResource(String(resource._id), completed)} className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${completed ? 'border border-line text-muted hover:bg-canvas' : 'bg-mint text-forest hover:bg-[#d2eadd]'}`}>{completed ? 'Completed ✓' : 'Mark as complete'}</button></article>; })}</div> : <div className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">No resources found for that week yet.</div>}
  </>;
}

function TaskCard({ task }) { return <Link to={`/tasks/${task._id}`} className="group rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-forest/30"><div className="flex items-center justify-between"><Pill>{task.weekKey?.replace('-', ' ') || 'Recruitment'}</Pill><span className="text-xs capitalize text-muted">{task.difficulty}</span></div><h2 className="mt-4 text-lg font-semibold group-hover:text-forest">{task.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{task.description}</p><div className="mt-5 flex items-center justify-between text-xs text-muted"><span>{task.estimatedMinutes ? `${task.estimatedMinutes} min` : 'Self-paced'}</span><span className="text-sm font-semibold text-forest">View task →</span></div></Link>; }

function TasksPage() {
  const { currentTrackId } = useTrack();
  const { data, loading, error } = useApiData(currentTrackId ? `/tasks?trackId=${currentTrackId}` : null, [currentTrackId]);
  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  if (!data) return <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">Choose a learning track in your profile to see practice tasks.</section>;
  return <><PageHeading eyebrow="Put learning into practice" title="Practice tasks" description="Short briefs to apply the skills from each week. Task completion is tracked in your progress." />{data.tasks.length ? <div className="grid gap-4 md:grid-cols-2">{data.tasks.map((task) => <TaskCard key={task._id} task={task} />)}</div> : <div className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">No published tasks are available yet.</div>}</>;
}

function TaskDetailPage() {
  const { taskId } = useParams();
  const { data, loading, error } = useApiData(`/tasks/${taskId}`, [taskId]);
  const [progress, setProgress] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const taskTrackId = data?.task?.trackId?._id || data?.task?.trackId || null;
  useEffect(() => {
    let active = true;
    if (!taskTrackId) return () => { active = false; };
    apiRequest(`/student/progress?trackId=${taskTrackId}`).then((result) => {
      if (!active) return;
      setProgress(result.progress);
      const submitted = result.progress.taskSubmissions?.find((item) => String(item.taskId) === String(taskId));
      setLinkUrl(submitted?.submissionUrl || submitted?.figmaUrl || '');
    }).catch(() => {});
    return () => { active = false; };
  }, [taskId, taskTrackId]);
  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  const task = data.task;
  const completed = progress?.completedTaskIds?.includes(String(task._id)) || false;
  const submissionType = task.submissionType || 'mark-complete';
  const requiresFigmaLink = submissionType === 'design-link';
  const requiresCodeLink = submissionType === 'code-link';
  const requiresLink = requiresFigmaLink || requiresCodeLink;
  const submission = progress?.taskSubmissions?.find((item) => String(item.taskId) === String(task._id));
  const submittedUrl = submission?.submissionUrl || submission?.figmaUrl || '';
  const linkValid = (() => {
    try {
      const url = new URL(linkUrl.trim());
      const hostname = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' || !hostname.includes('.')) return false;
      if (requiresFigmaLink) return (hostname === 'figma.com' || hostname.endsWith('.figma.com')) && url.pathname.length > 1;
      return true;
    } catch { return false; }
  })();
  async function submitLink(event) {
    event.preventDefault();
    setFeedback('');
    if (!linkValid) {
      setFeedback(requiresFigmaLink ? 'Please enter a valid Figma link.' : 'Please enter a valid link starting with https://.');
      return;
    }
    setBusy(true);
    try {
      const body = { type: 'task', id: String(task._id), completed: true, trackId: taskTrackId };
      if (requiresFigmaLink) body.figmaUrl = linkUrl.trim();
      else body.submissionUrl = linkUrl.trim();
      const result = await apiRequest('/student/progress/complete', { method: 'POST', body: JSON.stringify(body) });
      setProgress(result.progress);
      setFeedback(completed ? 'Submission link updated.' : 'Task marked complete. Nice work!');
    } catch (requestError) { setFeedback(requestError.message); }
    finally { setBusy(false); }
  }
  async function toggleComplete() {
    setBusy(true); setFeedback('');
    try { const result = await apiRequest('/student/progress/complete', { method: 'POST', body: JSON.stringify({ type: 'task', id: String(task._id), completed: !completed, trackId: taskTrackId }) }); setProgress(result.progress); setFeedback(!completed ? 'Task marked complete. Nice work!' : 'Task completion removed.'); }
    catch (requestError) { setFeedback(requestError.message); }
    finally { setBusy(false); }
  }
  return <><Link to="/tasks" className="text-sm font-semibold text-forest hover:underline">← All tasks</Link><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]"><article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-9"><div className="flex flex-wrap items-center gap-2"><Pill>{task.weekKey?.replace('-', ' ') || 'Recruitment'}</Pill><span className="text-xs capitalize text-muted">{task.difficulty}{task.estimatedMinutes ? ` · ${task.estimatedMinutes} minutes` : ''}</span></div><h1 className="mt-4 text-3xl font-semibold tracking-tight">{task.title}</h1><p className="mt-3 text-base leading-7 text-muted">{task.description}</p><div className="mt-8 border-t border-line pt-6"><h2 className="text-lg font-semibold">Your brief</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{task.instructions}</p></div>{task.referenceImageUrl && <div className="mt-7"><h2 className="text-lg font-semibold">Reference</h2><a className="mt-2 inline-flex text-sm font-semibold text-forest hover:underline" href={task.referenceImageUrl} target="_blank" rel="noreferrer">Open reference image ↗</a></div>}</article><aside className="h-fit rounded-3xl border border-line bg-white p-6"><Eyebrow>What to check</Eyebrow><ul className="mt-4 space-y-3">{task.evaluationCriteria.map((criterion) => <li key={criterion} className="flex gap-2 text-sm leading-6 text-muted"><span className="text-forest">✓</span>{criterion}</li>)}</ul>{requiresLink && <form onSubmit={submitLink} className="mt-6 border-t border-line pt-5"><p className="mb-3 text-xs leading-5 text-muted">{requiresFigmaLink ? 'Make sure your Figma file is accessible through the submitted link (Anyone with the link → Can view).' : 'Share a link to your code — a GitHub repository, CodePen, or live demo works.'}</p><label className="block text-sm font-semibold" htmlFor="submission-link">{requiresFigmaLink ? 'Figma Design Link' : 'Code / Demo Link'}<input id="submission-link" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10" type="text" inputMode="url" autoComplete="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder={requiresFigmaLink ? 'https://www.figma.com/…' : 'https://github.com/username/repo'} /></label><button disabled={busy || !linkValid} className="mt-3 w-full rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-[#10563f] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Saving…' : completed ? 'Update Link' : 'Mark as Done'}</button>{submittedUrl && <p className="mt-3 text-xs text-muted">Submitted: <a className="font-semibold text-forest underline" href={submittedUrl} target="_blank" rel="noreferrer">Open submitted link ↗</a></p>}{feedback && <p role="status" className="mt-3 text-sm text-muted">{feedback}</p>}</form>}
{requiresLink && completed && <button disabled={busy} onClick={toggleComplete} className="mt-3 w-full rounded-xl border border-line px-4 py-3 text-sm font-semibold text-muted hover:bg-canvas disabled:opacity-60">Mark as not complete</button>}
{!requiresLink && <div className="mt-6 border-t border-line pt-5"><button disabled={busy} onClick={toggleComplete} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${completed ? 'border border-line text-muted hover:bg-canvas' : 'bg-forest text-white hover:bg-[#10563f]'} disabled:cursor-not-allowed disabled:opacity-60`}>{busy ? 'Saving…' : completed ? 'Mark as not complete' : 'Mark task complete'}</button>{feedback && <p role="status" className="mt-3 text-sm text-muted">{feedback}</p>}</div>}
</aside></div></>;
}

function RecruitmentPage() {
  const { data, loading, error } = useApiData('/recruitment-rounds');
  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  return <><PageHeading eyebrow="WDC selection process" title="Recruitment rounds" description="Understand what each stage is preparing you for. Round details and requirements will be updated by WDC seniors as they are confirmed." />{data.rounds.length ? <div className="space-y-4">{data.rounds.map((round) => <article key={round._id} className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><Eyebrow>ROUND {round.roundNumber}</Eyebrow><h2 className="mt-2 text-2xl font-semibold">{round.title}</h2></div><Pill>{round.status}</Pill></div><p className="mt-4 max-w-3xl leading-7 text-muted">{round.description}</p>{(round.releaseDateTime || round.deadline) && <p className="mt-4 text-sm font-medium">{round.releaseDateTime ? `Release date & time: ${new Date(round.releaseDateTime).toLocaleString()}` : `Deadline: ${new Date(round.deadline).toLocaleDateString()}`}</p>}
<div className="mt-7 grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-semibold">Requirements</h3><ul className="mt-3 space-y-2">{round.requirements.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-muted"><span className="text-forest">•</span>{item}</li>)}</ul></div><div><h3 className="text-sm font-semibold">Evaluation criteria</h3><ul className="mt-3 space-y-2">{round.evaluationCriteria.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-muted"><span className="text-forest">•</span>{item}</li>)}</ul></div></div>{round.submissionInstructions && <div className="mt-6 rounded-2xl bg-canvas p-4"><h3 className="text-sm font-semibold">Submission instructions</h3><p className="mt-1 text-sm leading-6 text-muted">{round.submissionInstructions}</p></div>}{round.taskIds?.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold">Preparation tasks</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{round.taskIds.map((task) => <TaskCard key={task._id} task={{ ...task, weekKey: 'round-task' }} />)}</div></div>}</article>)}</div> : <div className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">No recruitment rounds have been published yet.</div>}</>;
}

function ProfilePage() {
  const { data, loading, error, refresh } = useApiData('/student/profile');
  const { updateUser } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const tracksQuery = useApiData('/tracks');
  if (loading || tracksQuery.loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} />;
  const user = data.user;
  const enrolledIds = Array.isArray(user.selectedTrackIds) && user.selectedTrackIds.length > 0
    ? user.selectedTrackIds
    : (user.selectedTrackId ? [user.selectedTrackId] : []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setFeedback('');
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    values.year = values.year ? Number(values.year) : null;
    values.selectedTrackIds = form.getAll('selectedTrackIds').map(String);
    try { const result = await apiRequest('/student/profile', { method: 'PATCH', body: JSON.stringify(values) }); updateUser(result.user); refresh(); setFeedback('Your profile has been updated.'); }
    catch (requestError) { setFeedback(requestError.message); }
    finally { setBusy(false); }
  }
  const inputClass = 'mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10';
  return <><PageHeading eyebrow="Student account" title="Your profile" description="Keep the information you share with WDC up to date. Only the essentials are required."/><form onSubmit={save} className="max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Name<input className={inputClass} name="name" required minLength="2" maxLength="80" defaultValue={user.name}/></label><label className="text-sm font-medium">Email<input className={`${inputClass} bg-canvas text-muted`} type="email" value={user.email} disabled/></label><label className="text-sm font-medium">Branch<input className={inputClass} name="branch" maxLength="80" defaultValue={user.branch} placeholder="Optional"/></label><label className="text-sm font-medium">Year<input className={`${inputClass} bg-canvas`} name="year" value={2} readOnly /></label><fieldset className="text-sm font-medium sm:col-span-2"><legend className="mb-2">Learning tracks <span className="font-normal text-muted">(choose one or both)</span></legend><div className="grid gap-2 sm:grid-cols-2">{(tracksQuery.data?.tracks || []).map((track) => <label key={track._id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-3"><input className="h-4 w-4 accent-[#176b52]" type="checkbox" name="selectedTrackIds" value={String(track._id)} defaultChecked={enrolledIds.includes(String(track._id))} /><span className="font-medium">{track.title}</span></label>)}</div></fieldset><label className="text-sm font-medium">GitHub profile <span className="font-normal text-muted">(optional)</span><input className={inputClass} type="url" name="githubUrl" maxLength="500" defaultValue={user.githubUrl} placeholder="https://github.com/username"/></label><label className="text-sm font-medium">Portfolio <span className="font-normal text-muted">(optional)</span><input className={inputClass} type="url" name="portfolioUrl" maxLength="500" defaultValue={user.portfolioUrl} placeholder="https://your-portfolio.com"/></label></div><div className="mt-6 flex flex-wrap items-center gap-4"><button disabled={busy} className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save profile'}</button>{feedback && <p role="status" className="text-sm text-muted">{feedback}</p>}</div></form></>;
}

function NotFoundPage() { return <section className="rounded-3xl border border-line bg-white p-8"><Eyebrow>404</Eyebrow><h1 className="mt-2 text-3xl font-semibold">This page isn’t here.</h1><Link className="mt-4 inline-block text-sm font-semibold text-forest" to="/">Back to your overview →</Link></section>; }

function TrackProviderHost({ children }) {
  const { user } = useAuth();
  return <TrackProvider user={user}>{children}</TrackProvider>;
}

function AuthenticatedApp() {
  return <TrackProviderHost><Routes><Route element={<ProtectedRoute />}><Route element={<SiteLayout />}><Route index element={<DashboardPage/>}/><Route path="roadmap" element={<RoadmapPage/>}/><Route path="resources" element={<ResourcesPage/>}/><Route path="tasks" element={<TasksPage/>}/><Route path="tasks/:taskId" element={<TaskDetailPage/>}/><Route path="recruitment" element={<RecruitmentPage/>}/><Route path="profile" element={<ProfilePage/>}/></Route></Route><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/><Route path="*" element={<NotFoundPage/>}/></Routes></TrackProviderHost>;
}

export default function App() { return <AuthProvider><AuthenticatedApp/><Analytics /><SpeedInsights /></AuthProvider>; }
