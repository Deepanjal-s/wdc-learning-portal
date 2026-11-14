import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

/**
 * Coordinator admin dashboard (Phase 2).
 * Read-only views over /api/admin/*; students are redirected away.
 */

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-medium text-muted">Loading your WDC workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Eyebrow({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{children}</p>;
}

function LoadingBlock() {
  return <div className="grid min-h-48 place-items-center rounded-3xl border border-line bg-white p-10 text-sm font-medium text-muted">Loading coordinator data…</div>;
}

function ApiProblem({ error, onRetry }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-8">
      <Eyebrow>Something went wrong</Eyebrow>
      <p className="mt-2 text-sm text-muted">{error?.message || 'The coordinator data could not be loaded.'}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white">Try again</button>}
    </section>
  );
}

function ProgressBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuenow={clamped} aria-valuemin="0" aria-valuemax="100">
      <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

function TrackPills({ tracks }) {
  if (!tracks?.length) return <span className="text-xs text-muted">No track assigned</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {tracks.map((track) => (
        <span key={track.trackId} className="inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-forest">{track.title}</span>
      ))}
    </span>
  );
}

function formatActivity(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function useAdminFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiRequest(path)
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, nonce, ...deps]);
  return { data, loading, error, refresh: () => setNonce((count) => count + 1) };
}

export function AdminOverviewPage() {
  const { data, loading, error, refresh } = useAdminFetch('/admin/overview');

  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} onRetry={refresh} />;

  const overview = data?.overview ?? {};
  const stats = [
    { label: 'Total students', value: overview.totalStudents ?? 0, note: 'Registered across all tracks' },
    { label: 'Average progress', value: `${overview.averageProgressPercent ?? 0}%`, note: 'Across every student × track' },
    { label: 'Tasks completed', value: overview.totalTasksCompleted ?? 0, note: 'All practice tasks marked done' },
    { label: 'Submissions', value: overview.totalSubmissions ?? 0, note: 'Figma, code & demo links shared' },
  ];

  return (
    <>
      <header className="mb-7">
        <Eyebrow>WDC coordinators</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Admin dashboard</h1>
        <p className="mt-2 max-w-2xl leading-7 text-muted">Track enrollment, progress, and submissions across the learning tracks — no more manual database checks.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-line bg-white p-5">
            <Eyebrow>{stat.label}</Eyebrow>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Eyebrow>Enrollment by track</Eyebrow>
            <h2 className="mt-2 text-xl font-semibold">Students per learning track</h2>
          </div>
          <Link to="/admin/students" className="text-sm font-semibold text-forest">View students →</Link>
        </div>
        <div className="mt-5 space-y-3">
          {(overview.studentsByTrack ?? []).map((entry) => (
            <Link key={entry.slug} to={`/admin/students?track=${entry.slug}`} className="flex items-center justify-between gap-4 rounded-2xl bg-canvas/70 px-5 py-4 transition hover:bg-canvas">
              <span className="text-sm font-semibold">{entry.title}</span>
              <span className="text-sm text-muted">{entry.count} {entry.count === 1 ? 'student' : 'students'}</span>
            </Link>
          ))}
          {(overview.studentsByTrack ?? []).length === 0 && <p className="text-sm text-muted">No tracks yet.</p>}
        </div>
      </section>
    </>
  );
}

export function AdminStudentsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [track, setTrack] = useState(searchParams.get('track') || '');
  useEffect(() => { setTrack(searchParams.get('track') || ''); }, [searchParams]);
  const query = useMemo(() => {
    const parts = [];
    if (search.trim()) parts.push(`search=${encodeURIComponent(search.trim())}`);
    if (track) parts.push(`track=${encodeURIComponent(track)}`);
    return parts.length ? `?${parts.join('&')}` : '';
  }, [search, track]);
  const { data, loading, error, refresh } = useAdminFetch(`/admin/students${query}`, [query]);

  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} onRetry={refresh} />;

  const students = data?.students ?? [];
  const tracks = data?.tracks ?? [];

  return (
    <>
      <header className="mb-7">
        <Eyebrow>WDC coordinators</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Students</h1>
        <p className="mt-2 max-w-2xl leading-7 text-muted">Search and filter the cohort, then open a student to see week-by-week progress and submissions.</p>
      </header>

      <section className="mb-6 flex flex-col gap-3 rounded-3xl border border-line bg-white p-5 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search students by name or email"
          className="w-full rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm outline-none transition focus:border-forest sm:max-w-sm"
        />
        <select
          value={track}
          onChange={(event) => setTrack(event.target.value)}
          aria-label="Filter students by track"
          className="rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm font-medium outline-none transition focus:border-forest"
        >
          <option value="">All tracks</option>
          {tracks.map((entry) => <option key={entry.id} value={entry.slug}>{entry.title}</option>)}
        </select>
        <p className="text-sm text-muted sm:ml-auto">{students.length} {students.length === 1 ? 'student' : 'students'}</p>
      </section>

      {students.length === 0 ? (
        <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">No students match these filters.</section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-line bg-white">
          <ul className="divide-y divide-line">
            {students.map((student) => (
              <li key={student.id}>
                <Link to={`/admin/students/${student.id}`} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-canvas/50 sm:px-7 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{student.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">{student.email}</p>
                    <div className="mt-2"><TrackPills tracks={student.tracks} /></div>
                  </div>
                  <div className="w-full lg:w-56">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">Overall</span>
                      <strong className="text-sm">{student.overallProgress}%</strong>
                    </div>
                    <div className="mt-2"><ProgressBar value={student.overallProgress} /></div>
                  </div>
                  <div className="lg:w-32 lg:text-right">
                    <p className="text-xs text-muted">Last activity</p>
                    <p className="mt-1 text-sm font-medium">{formatActivity(student.lastActivity)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const stepTypeLabels = { topic: 'Topic', resource: 'Resource', task: 'Practice task' };

export function AdminStudentDetailPage() {
  const { studentId } = useParams();
  const { data, loading, error, refresh } = useAdminFetch(`/admin/students/${studentId}`, [studentId]);

  if (loading) return <LoadingBlock />;
  if (error) return <ApiProblem error={error} onRetry={refresh} />;
  if (!data?.student) return <ApiProblem error={new Error('Student was not found.')} />;

  const student = data.student;

  return (
    <>
      <Link to="/admin/students" className="text-sm font-semibold text-forest">← All students</Link>
      <header className="mb-7 mt-4">
        <Eyebrow>Student detail</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{student.name}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {student.email}
          {student.branch ? ` · ${student.branch}` : ''}
          {student.year ? ` · Year ${student.year}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {student.githubUrl && <a href={student.githubUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-forest hover:underline">GitHub ↗</a>}
          {student.portfolioUrl && <a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-forest hover:underline">Portfolio ↗</a>}
        </div>
      </header>

      {student.tracks.length === 0 && (
        <section className="rounded-3xl border border-line bg-white p-8 text-sm text-muted">This student is not enrolled in any track yet.</section>
      )}

      <div className="space-y-6">
        {student.tracks.map((trackProgress) => (
          <section key={trackProgress.trackId} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <header className="border-b border-line px-5 py-5 sm:px-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Eyebrow>{trackProgress.title}</Eyebrow>
                  <h2 className="mt-1 text-xl font-semibold">Track progress</h2>
                </div>
                <strong className="text-2xl">{trackProgress.percentage}%</strong>
              </div>
              <div className="mt-4"><ProgressBar value={trackProgress.percentage} /></div>
              <p className="mt-2 text-xs text-muted">
                {trackProgress.completedCount} of {trackProgress.totalCount} learning steps complete
                {trackProgress.lastActivity && ` · Last activity ${formatActivity(trackProgress.lastActivity)}`}
              </p>
            </header>

            {trackProgress.submissions.length > 0 && (
              <div className="border-b border-line bg-canvas/60 px-5 py-5 sm:px-7">
                <h3 className="text-sm font-semibold">Submissions ({trackProgress.submissions.length})</h3>
                <ul className="mt-3 space-y-2">
                  {trackProgress.submissions.map((submission) => (
                    <li key={submission.taskId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{submission.taskTitle}</p>
                        <p className="text-xs capitalize text-muted">{submission.submissionType.replace('-', ' ')}</p>
                      </div>
                      {submission.submissionUrl
                        ? <a href={submission.submissionUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-forest hover:underline">Open link ↗</a>
                        : <span className="text-xs text-muted">Marked complete · no link</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4 px-5 py-6 sm:px-7">
              {trackProgress.weeks.map((week) => (
                <div key={week.weekKey} className="rounded-2xl border border-line">
                  <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold">Week {week.number} · {week.title}</p>
                    <span className="text-xs text-muted">{week.completedCount}/{week.totalCount} done</span>
                  </div>
                  <ul className="divide-y divide-line">
                    {week.steps.map((step) => (
                      <li key={`${step.type}-${step.id}`} className="flex items-center gap-3 px-4 py-2.5">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${step.completed ? 'bg-forest text-white' : 'border border-line bg-white text-muted'}`}>
                          {step.completed ? '✓' : '·'}
                        </span>
                        <span className={`text-sm ${step.completed ? 'text-muted line-through' : ''}`}>{step.title}</span>
                        <span className="ml-auto text-[11px] uppercase tracking-wide text-muted">{stepTypeLabels[step.type] || step.type}</span>
                      </li>
                    ))}
                    {week.steps.length === 0 && <li className="px-4 py-3 text-xs text-muted">No steps in this week yet.</li>}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
