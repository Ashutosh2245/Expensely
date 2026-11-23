import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction
}) => {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-purple mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-md">{description}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
        >
          {actionText}
        </Link>
      )}
      {actionText && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-brand-purple to-brand-indigo hover:opacity-95 transition shadow-glow"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
