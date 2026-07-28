import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#06b6d4', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#eab308', '#94a3b8'];

const axis = { stroke: 'hsl(200 15% 55%)', fontSize: 10 };
const grid = { stroke: 'hsl(210 20% 18%)' };
const tooltipStyle = { background: 'hsl(210 28% 11%)', border: '1px solid hsl(210 20% 18%)', borderRadius: 8, fontSize: 11, color: 'hsl(200 20% 95%)' };

function ChartCard({ title, children, height = 200 }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <h4 className="text-xs font-semibold text-foreground mb-2">{title}</h4>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AnalyticsCharts({ charts = {} }) {
  const has = (arr) => Array.isArray(arr) && arr.length > 0;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {has(charts.dailyActions) && (
        <ChartCard title="Daily Actions">
          <BarChart data={charts.dailyActions} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="date" {...axis} tickFormatter={(d) => d.slice(5)} />
            <YAxis {...axis} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {has(charts.banTrends) && (
        <ChartCard title="Ban Trends (monthly)">
          <LineChart data={charts.banTrends} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="month" {...axis} />
            <YAxis {...axis} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ChartCard>
      )}

      {has(charts.topModerators) && (
        <ChartCard title="Top Moderators">
          <BarChart layout="vertical" data={charts.topModerators} margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis type="number" {...axis} allowDecimals={false} />
            <YAxis type="category" dataKey="name" {...axis} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#a855f7" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {has(charts.mostModeratedMembers) && (
        <ChartCard title="Most Moderated Members">
          <BarChart layout="vertical" data={charts.mostModeratedMembers} margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis type="number" {...axis} allowDecimals={false} />
            <YAxis type="category" dataKey="name" {...axis} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {has(charts.mostModeratedRooms) && (
        <ChartCard title="Most Moderated Rooms">
          <BarChart layout="vertical" data={charts.mostModeratedRooms} margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis type="number" {...axis} allowDecimals={false} />
            <YAxis type="category" dataKey="name" {...axis} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#22c55e" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {has(charts.commonReasons) && (
        <ChartCard title="Most Common Reasons">
          <BarChart layout="vertical" data={charts.commonReasons} margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis type="number" {...axis} allowDecimals={false} />
            <YAxis type="category" dataKey="reason" {...axis} width={90} tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#ec4899" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {has(charts.muteDurationDistribution) && (
        <ChartCard title="Mute Duration Distribution">
          <PieChart>
            <Pie data={charts.muteDurationDistribution} dataKey="count" nameKey="bucket" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10 }}>
              {charts.muteDurationDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ChartCard>
      )}

      {has(charts.reportResolutionTime) && (
        <ChartCard title="Report Resolution Time">
          <BarChart data={charts.reportResolutionTime} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" {...grid} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="hours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartCard>
      )}
    </div>
  );
}