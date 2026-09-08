'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { useAnalytics } from '@/hooks/use-analytics';

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#71717A',
  TODO: '#8B5CF6',
  IN_PROGRESS: '#22D3EE',
  IN_REVIEW: '#FBBF24',
  DONE: '#4ADE80',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#71717A',
  MEDIUM: '#22D3EE',
  HIGH: '#FBBF24',
  URGENT: '#F87171',
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-atlas-panel-border bg-atlas-panel/50 p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 h-56">{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return <p className="px-8 py-10 text-sm text-muted-foreground">Loading analytics...</p>;
  }

  const statusData = Object.entries(data.statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count,
    color: STATUS_COLORS[status] ?? '#71717A',
  }));

  const priorityData = Object.entries(data.priorityCounts).map(([priority, count]) => ({
    name: priority,
    value: count,
    color: PRIORITY_COLORS[priority] ?? '#71717A',
  }));

  const trendData = data.completedTrend.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: d.count,
  }));

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.totalTasks} tasks across {data.totalProjects} projects.
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <ChartCard title="Tasks by status">
            {statusData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-xs text-muted-foreground">No tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#13141c',
                      border: '1px solid #212330',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <ChartCard title="Tasks by priority">
            {priorityData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-xs text-muted-foreground">No tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212330" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#13141c',
                      border: '1px solid #212330',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </motion.div>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4"
      >
        <ChartCard title="Tasks completed — last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#212330" vertical={false} />
              <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#13141c',
                  border: '1px solid #212330',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#completedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeUp}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-4 rounded-xl border border-atlas-panel-border bg-atlas-panel/50"
      >
        <div className="border-b border-atlas-panel-border px-5 py-4">
          <h3 className="font-display text-sm font-semibold text-foreground">Project progress</h3>
        </div>
        <ul className="divide-y divide-atlas-panel-border">
          {data.projectProgress.map((project) => (
            <li key={project.id} className="px-5 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{project.name}</span>
                <span className="text-muted-foreground">
                  {project.doneTasks}/{project.totalTasks} tasks · {project.completionPercent}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-atlas-ink">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.completionPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-atlas-violet to-atlas-cyan"
                />
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}