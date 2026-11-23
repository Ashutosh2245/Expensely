import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time updates on bill splits, settlements, and invitations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filter === 'unread' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <Bell className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white mb-1">No Notifications</h3>
          <p className="text-xs text-slate-400">
            {filter === 'unread' ? 'You have read all your notifications!' : 'Your notification inbox is clean.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden">
          {filtered.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                if (!notif.isRead) markAsRead(notif._id);
              }}
              className={`p-4 flex items-start justify-between gap-4 transition cursor-pointer hover:bg-white/5 ${
                !notif.isRead ? 'bg-brand-purple/5' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.isRead
                      ? 'bg-brand-purple/20 text-brand-purple'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{notif.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-purple shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
