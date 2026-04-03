import { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import {
  Sun, Moon, LayoutDashboard, Users as UsersIcon,
  TrendingUp, RefreshCw, CalendarDays, Settings2, Crosshair,
  ClipboardList, Clock, Activity, AlertTriangle,
} from 'lucide-react';

import { useAdminStats } from './hooks/useAdminStats';
import { useInfrastructure } from './hooks/useInfrastructure';
import { isAuthenticated, clearTokens } from './hooks/fetchWithAuth';
import { computePercentile } from './utils/percentile';

import MetricCard from './components/MetricCard';
import SectionLabel from './components/SectionLabel';
import StatusPanel from './components/StatusPanel';
import InfrastructureLogs from './components/InfrastructureLogs';
import UserManagement from './components/UserManagement';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  RadialLinearScale, Title, Tooltip, Legend, Filler
);

// --- Chart color helpers ---
function chartColors(isDark) {
  return {
    title:  isDark ? '#f4f4f5' : '#0f172a',
    ticks:  isDark ? '#71717a' : '#94a3b8',
    grid:   isDark ? '#27272a' : '#f1f5f9',
    legend: isDark ? '#a1a1aa' : '#64748b',
  };
}

// --- Chart data builders ---
function buildCpuChartData(metrics) {
  if (!metrics) return null;
  const backend  = metrics['cyclelink-dev-backend']?.CPUUtilization || [];
  const bikeRoute = metrics['cyclelink-dev-bike-route']?.CPUUtilization || [];
  const labels   = backend.map(p => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  return {
    labels,
    datasets: [
      { label: 'Backend CPU %',    data: backend.map(p => Math.round(p.value)),   borderColor: 'rgb(34,197,94)',   backgroundColor: 'rgba(34,197,94,0.1)',  fill: true, tension: 0.3, pointRadius: 0 },
      { label: 'Bike Route CPU %', data: bikeRoute.map(p => Math.round(p.value)), borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, pointRadius: 0 },
    ],
  };
}

function buildLatencyChartData(metrics) {
  if (!metrics) return null;
  const rt = metrics.alb?.TargetResponseTime || [];
  const labels = rt.map(p => new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  return {
    labels,
    datasets: [{ label: 'Response Time (ms)', data: rt.map(p => Math.round(p.value)), borderColor: 'rgb(249,115,22)', fill: false, tension: 0.3, pointRadius: 2 }],
  };
}

function lineOptions(title, isDark) {
  const c = chartColors(isDark);
  return {
    responsive: true,
    plugins: {
      title:  { display: true, text: title, color: c.title },
      legend: { labels: { color: c.legend } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: c.ticks }, grid: { color: c.grid } },
      x: { ticks: { color: c.ticks, maxTicksLimit: 12 }, grid: { display: false } },
    },
  };
}

// --- Static chart data (placeholders) ---
const satisfactionData = {
  labels: ['Shade', 'Weather', 'Heritage', 'Difficulty'],
  datasets: [{ label: 'Avg Satisfaction (1–5)', data: [4.2, 3.8, 4.5, 3.6], backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(168,85,247,0.7)', 'rgba(249,115,22,0.7)'], borderRadius: 8 }],
};
function satisfactionOptions(isDark) {
  const c = chartColors(isDark);
  return {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: 'Post-Ride Satisfaction by Dimension', color: c.title } },
    scales: { y: { beginAtZero: true, max: 5, ticks: { color: c.ticks }, grid: { color: c.grid } }, x: { ticks: { color: c.ticks }, grid: { display: false } } },
  };
}

const heritageData = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
  datasets: [{ label: 'Heritage Waypoint Visits', data: [12, 19, 24, 31, 28, 35], borderColor: 'rgb(168,85,247)', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4, pointRadius: 4 }],
};
function heritageOptions(isDark) {
  const c = chartColors(isDark);
  return {
    responsive: true,
    plugins: { title: { display: true, text: 'Heritage Waypoint Engagement (Weekly)', color: c.title } },
    scales: { y: { beginAtZero: true, ticks: { color: c.ticks }, grid: { color: c.grid } }, x: { ticks: { color: c.ticks }, grid: { display: false } } },
  };
}

const radarData = {
  labels: ['Shade', 'Weather', 'Heritage', 'Difficulty', 'Distance'],
  datasets: [
    { label: 'Config A (Current)',  data: [0.8, 0.6, 0.7, 0.5, 0.9], borderColor: 'rgb(34,197,94)',  backgroundColor: 'rgba(34,197,94,0.15)',  pointBackgroundColor: 'rgb(34,197,94)' },
    { label: 'Config B (Proposed)', data: [0.6, 0.8, 0.9, 0.4, 0.7], borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: 'rgb(59,130,246)' },
  ],
};
function radarOptions(isDark) {
  const c = chartColors(isDark);
  return {
    responsive: true,
    plugins: { title: { display: true, text: 'Weight Config A vs B', color: c.title } },
    scales: { r: { beginAtZero: true, max: 1, ticks: { color: c.ticks, stepSize: 0.2 }, grid: { color: isDark ? '#27272a' : '#e2e8f0' }, pointLabels: { color: isDark ? '#a1a1aa' : '#475569', font: { size: 12 } } } },
  };
}

const alignmentData = {
  labels: ['Shade', 'Weather', 'Heritage', 'Difficulty', 'Distance'],
  datasets: [{ label: 'Preference Alignment %', data: [78, 65, 82, 58, 71], backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(168,85,247,0.7)', 'rgba(249,115,22,0.7)', 'rgba(236,72,153,0.7)'], borderRadius: 6 }],
};
function alignmentOptions(isDark) {
  const c = chartColors(isDark);
  return {
    indexAxis: 'y', responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: 'Preference Alignment % per Dimension', color: c.title } },
    scales: { x: { beginAtZero: true, max: 100, ticks: { color: c.ticks, callback: v => `${v}%` }, grid: { color: c.grid } }, y: { ticks: { color: c.ticks }, grid: { display: false } } },
  };
}

function daysUntilReview() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const nextQuarterMonth = quarter * 3;
  const target = new Date(now.getFullYear(), nextQuarterMonth, 1);
  if (target <= now) target.setMonth(target.getMonth() + 3);
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

// --- Latency card colour ---
function latencyClass(ms, p) {
  if (ms == null) return '';
  if (p === 'avg') return ms > 300 ? 'text-amber-500' : 'text-green-500';
  if (p === 'p95') return ms > 300 ? 'text-amber-500' : 'text-green-500';
  if (p === 'p99') return ms > 500 ? 'text-red-400' : ms > 300 ? 'text-amber-500' : 'text-green-500';
  return '';
}

// --- Main component ---
export default function EvaluationDashboard() {
  const { data, loading, error, refetch } = useAdminStats();
  const { health, metrics, logs, loading: infraLoading } = useInfrastructure();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Dark mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cl_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('cl_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (data || health) setLastUpdated(new Date());
  }, [data, health]);

  if (!isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }

  function handleLogout() {
    clearTokens();
    window.location.href = '/login';
  }

  // Latency stats derived from ALB data
  const rtValues = (metrics?.alb?.TargetResponseTime || []).map(p => p.value);
  const latAvg = rtValues.length ? Math.round(rtValues.reduce((s, v) => s + v, 0) / rtValues.length) : null;
  const latp95 = computePercentile(rtValues, 95);
  const latp99 = computePercentile(rtValues, 99);

  // Chart panel class
  const chartPanel = 'bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-5';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            CycleLink — Evaluation Dashboard
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-600 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Live · {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(d => !d)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 flex gap-1">
        {[
          { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={13} /> },
          { key: 'users',    label: 'Users',    icon: <UsersIcon size={13} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {activeTab === 'users' && (
          <UserManagement users={data?.users} loading={loading} error={error} />
        )}

        {activeTab === 'overview' && (<>

          {/* === Section 1 === */}
          <SectionLabel number={1} title="User Engagement" description="Sign-ups, retention, and satisfaction metrics" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MetricCard title="Total Sign-ups" value={data ? data.totalUsers : '—'} icon={<UsersIcon size={14} />} loading={loading} error={error} onRetry={refetch} />
            <MetricCard title="Ride Completion" value="87%" subtitle="Placeholder" icon={<TrendingUp size={14} />} loading={loading} error={error} />
            <MetricCard title="7-Day Return" value="62%" subtitle="Placeholder" icon={<RefreshCw size={14} />} loading={loading} error={error} />
            <MetricCard title="30-Day Return" value="41%" subtitle="Placeholder" icon={<CalendarDays size={14} />} loading={loading} error={error} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className={chartPanel}><Bar data={satisfactionData} options={satisfactionOptions(isDark)} /></div>
            <div className={chartPanel}><Line data={heritageData} options={heritageOptions(isDark)} /></div>
          </div>

          <hr className="border-slate-200 dark:border-zinc-800 my-8" />

          {/* === Section 2 === */}
          <SectionLabel number={2} title="System Performance" description="Infrastructure health, latency percentiles, and logs — polls every 30s" />

          {/* Latency cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard
              title="Avg Response Time"
              value={latAvg != null ? `${latAvg} ms` : '—'}
              subtitle="24h mean · ALB data"
              icon={<Clock size={14} />}
              loading={infraLoading}
              valueClassName={latAvg != null ? latencyClass(latAvg, 'avg') : undefined}
            />
            <MetricCard
              title="p95 Response Time"
              value={latp95 != null ? `${latp95} ms` : '—'}
              subtitle="Derived from ALB windows"
              icon={<Activity size={14} />}
              loading={infraLoading}
              valueClassName={latp95 != null ? latencyClass(latp95, 'p95') : undefined}
            />
            <MetricCard
              title="p99 Response Time"
              value={latp99 != null ? `${latp99} ms` : '—'}
              subtitle="Derived from ALB windows"
              icon={<AlertTriangle size={14} />}
              loading={infraLoading}
              valueClassName={latp99 != null ? latencyClass(latp99, 'p99') : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <StatusPanel health={health} loading={infraLoading} />
            <div className="lg:col-span-2">
              <InfrastructureLogs logs={logs} loading={infraLoading} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className={chartPanel}>
              {metrics && buildCpuChartData(metrics) && (
                <Line data={buildCpuChartData(metrics)} options={lineOptions('CPU Utilization (24h)', isDark)} />
              )}
            </div>
            <div className={chartPanel}>
              {metrics && buildLatencyChartData(metrics) && (
                <Line data={buildLatencyChartData(metrics)} options={lineOptions('ALB Response Time (ms)', isDark)} />
              )}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-zinc-800 my-8" />

          {/* === Section 3 === */}
          <SectionLabel number={3} title="Routing Quality" description="Weight configs, preference alignment, and validation schedule" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <MetricCard title="Active Weight Config" value="Config A" subtitle="Since Mar 2026" icon={<Settings2 size={14} />} />
            <MetricCard title="Avg Alignment Score" value="71%" subtitle="Placeholder" icon={<Crosshair size={14} />} />
            <MetricCard title="Next Validation Review" value={`${daysUntilReview()} days`} icon={<ClipboardList size={14} />} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className={chartPanel}><Radar data={radarData} options={radarOptions(isDark)} /></div>
            <div className={chartPanel}><Bar data={alignmentData} options={alignmentOptions(isDark)} /></div>
          </div>

        </>)}
      </main>
    </div>
  );
}
