import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { activityApi } from '../services/api';
import { ActivityItem } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { History, Search, Filter } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        const { data } = await activityApi.getUserActivities();
        if (data.success) {
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  const filtered = activities.filter((act) => {
    const desc = act.description?.toLowerCase() || '';
    const group = act.groupId?.name?.toLowerCase() || '';
    const user = act.userId?.fullName?.toLowerCase() || '';
    const q = search.toLowerCase();
    return desc.includes(q) || group.includes(q) || user.includes(q);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Activity Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit feed of expenses, settlements, and member changes across all your groups
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity feed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={5} className="h-20" />
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <History className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">No Activity Found</h3>
          <p className="text-xs text-slate-400">
            {search ? 'Try adjusting your search keywords.' : 'Add an expense or group to generate activities.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {filtered.map((act) => (
            <div key={act._id} className="p-4 flex items-start gap-3.5 hover:bg-white/5 transition">
              <img
                src={act.userId?.avatar}
                alt={act.userId?.fullName}
                className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-white/10 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                  {act.description}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  {act.groupId && (
                    <span className="font-semibold text-brand-purple">
                      {act.groupId.name}
                    </span>
                  )}
                  {act.groupId && <span>•</span>}
                  <span>
                    {new Date(act.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
