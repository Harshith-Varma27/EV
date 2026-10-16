import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const icons = {
  BOOKING_CONFIRMED: '✅',
  CHARGING_COMPLETED: '🔋',
  WAITLIST_JOINED: '⏳',
  CHARGER_AVAILABLE: '🚨',
  GENERAL: '📢',
};

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/user/notifications').then(r => setNotifications(r.data))
       .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markAllRead = async () => {
    await api.put('/user/notifications/mark-all-read').catch(() => {});
    load();
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>🔔 Notifications</h1>
          <p>{unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> :
        notifications.length === 0 ? (
          <div className="empty-state"><div className="icon">🔔</div><p>No notifications yet.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map(n => (
              <div key={n.id} className="card" style={{
                border: n.isRead ? '1px solid #e5e7eb' : '2px solid #2563eb',
                background: n.isRead ? '#fff' : '#eff6ff'
              }}>
                <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icons[n.type] || '📢'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{n.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '.85rem', marginTop: 4 }}>{n.message}</div>
                    <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 6 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 6 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
