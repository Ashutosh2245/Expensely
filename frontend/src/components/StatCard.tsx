import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'coral' | 'purple' | 'neutral';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral',
  trend
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/40',
          bgIcon: 'bg-emerald-500/10 text-emerald-400',
          valueColor: 'text-emerald-400',
          glow: 'hover:shadow-glow-emerald'
        };
      case 'coral':
        return {
          border: 'border-coral-500/20 hover:border-coral-500/40',
          bgIcon: 'bg-coral-500/10 text-coral-400',
          valueColor: 'text-coral-400',
          glow: 'hover:shadow-glow-coral'
        };
      case 'purple':
        return {
          border: 'border-brand-purple/20 hover:border-brand-purple/40',
          bgIcon: 'bg-brand-purple/10 text-brand-purple',
          valueColor: 'text-white',
          glow: 'hover:shadow-glow'
        };
      default:
        return {
          border: 'border-white/10 hover:border-white/20',
          bgIcon: 'bg-slate-800 text-slate-300',
          valueColor: 'text-white',
          glow: 'hover:shadow-premium'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border transition-all duration-300 ${styles.border} ${styles.glow} relative overflow-hidden group`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl ${styles.bgIcon} transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className={`text-2xl font-bold tracking-tight ${styles.valueColor}`}>
          {value}
        </h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs text-slate-400">
          <span className="font-medium text-slate-300">{trend}</span>
        </div>
      )}
    </div>
  );
};
