import { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gold';
  icon: ReactNode;
  trend?: string;
  trendIsDown?: boolean;
  trendIsUnavailable?: boolean;
}

const colorClasses = {
  blue: 'text-sky-400 bg-sky-400/10 border-sky-400/15',
  purple: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/15',
  green: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/15',
  orange: 'text-orange-400 bg-orange-400/10 border-orange-400/15',
  red: 'text-rose-400 bg-rose-400/10 border-rose-400/15',
  gold: 'text-cinema-gold bg-cinema-gold/10 border-cinema-gold/15',
};

export default function StatsCard({
  label,
  value,
  color,
  icon,
  trend,
  trendIsDown,
  trendIsUnavailable,
}: StatsCardProps) {
  const TrendIcon = trendIsUnavailable ? Minus : trendIsDown ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/45 p-5 shadow-lg shadow-black/10 transition-colors hover:border-primary/25">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorClasses[color]}`}>
          {icon}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
              trendIsUnavailable
                ? 'bg-muted text-muted-foreground'
                : trendIsDown
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trend}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
      </div>

      <div className="mt-5 border-t border-border/50 pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          {trend ? 'So với kỳ báo cáo trước' : 'Tổng lũy kế trong hệ thống'}
        </p>
      </div>
    </div>
  );
}
