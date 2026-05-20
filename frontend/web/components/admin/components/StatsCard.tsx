import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gold';
  icon: ReactNode;
  trend?: string;
  trendIsDown?: boolean;
}

const colorClasses = {
  blue: 'text-primary',
  purple: 'text-rose-500',
  green: 'text-emerald-500',
  orange: 'text-orange-500',
  red: 'text-destructive',
  gold: 'text-cinema-gold',
};

export default function StatsCard({ label, value, color, icon, trend, trendIsDown }: StatsCardProps) {
  return (
    <div className="bg-card/40 backdrop-blur-md rounded-3xl p-6 border border-border/50 transition-all hover:scale-[1.02] duration-300 shadow-xl shadow-black/10 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-muted/50 ${colorClasses[color === 'blue' ? 'gold' : color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-black px-2 py-1 rounded-lg ${trendIsDown ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-500'}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>

      {/* Sparkline chart placeholder */}
      <div className="mt-4 h-8 w-full overflow-hidden">
        <svg viewBox="0 0 100 20" className="w-full h-full preserve-3d">
          <path
            d={trendIsDown ? "M0 5 Q 25 15, 50 10 T 100 18" : "M0 15 Q 25 5, 50 12 T 100 2"}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={trendIsDown ? 'text-destructive' : 'text-green-500'}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
