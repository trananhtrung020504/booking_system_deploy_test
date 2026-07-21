'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

export interface ChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface ChartProps {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  valueType?: 'number' | 'currency';
  color?: 'primary' | 'gold' | 'green' | 'rose';
}

const chartColors = {
  primary: '#ff2d5f',
  gold: '#f6b73c',
  green: '#10d27a',
  rose: '#f43f5e',
};

const statusColors = ['#ff2d5f', '#10d27a', '#f6b73c', '#38bdf8', '#a78bfa'];

const formatValue = (value: number, valueType: 'number' | 'currency') => (
  valueType === 'currency' ? formatCurrency(value) : value.toLocaleString()
);

function EmptyChart({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Chưa có dữ liệu trong khoảng thời gian này
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, valueType = 'number' }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-xl">
      <p className="text-xs font-bold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatValue(Number(payload[0].value || 0), valueType)}
      </p>
    </div>
  );
}

export function BarChart({ title, subtitle, data, valueType = 'number', color = 'primary' }: ChartProps) {
  const hasData = data.some((item) => item.value > 0);

  if (!data.length || !hasData) {
    return <EmptyChart title={title} subtitle={subtitle} />;
  }

  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 16, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              minTickGap={8}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value) => valueType === 'currency' ? `${Number(value).toLocaleString('vi-VN')}` : String(value)}
            />
            <Tooltip content={<ChartTooltip valueType={valueType} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" fill={chartColors[color]} radius={[10, 10, 4, 4]} maxBarSize={58} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LineMetricChart({ title, subtitle, data, valueType = 'number', color = 'gold' }: ChartProps) {
  const hasData = data.some((item) => item.value > 0);

  if (!data.length || !hasData) {
    return <EmptyChart title={title} subtitle={subtitle} />;
  }

  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value) => valueType === 'currency' ? `${Number(value).toLocaleString('vi-VN')}` : String(value)}
            />
            <Tooltip content={<ChartTooltip valueType={valueType} />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors[color]}
              strokeWidth={3}
              dot={{ r: 4, fill: chartColors[color], strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusChart({ title, subtitle, data }: ChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data.length || total === 0) {
    return <EmptyChart title={title} subtitle={subtitle} />;
  }

  return (
    <div className="rounded-[2rem] border border-border/50 bg-card/40 p-6 shadow-xl">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="86%" paddingAngle={4}>
                {data.map((item, index) => (
                  <Cell key={item.label} fill={statusColors[index % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 self-center">
          {data.map((item, index) => {
            const percent = Math.round((item.value / total) * 100);
            return (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[index % statusColors.length] }} />
                  <span className="truncate text-xs font-bold uppercase tracking-wider text-foreground">{item.label}</span>
                </div>
                <span className="shrink-0 text-xs font-bold text-muted-foreground">{item.value.toLocaleString()} ({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BarChart;
