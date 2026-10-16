import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, completed: 0, notifications: 0 });
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/user/bookings'),
      api.get('/user/notifications'),
    ]).then(([bRes, nRes]) => {
      const bookings = bRes.data;
      setStats({
        bookings: bookings.length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        notifications: nRes.data.filter(n => !n.isRead).length,
      });
      setRecentBookings(bookings.slice(0, 3));
    }).catch(() => {});
  }, []);

  const statusBadge = (s) => {
    const map = { CONFIRMED:'badge-blue', CHARGING:'badge-green', COMPLETED:'badge-gray', CANCELLED:'badge-red' };
    return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name} 👋</h1>
        <p>Manage your EV charging sessions and find stations near you.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>📋</div>
          <div className="stat-value">{stats.bookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>✅</div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Completed Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef9c3' }}>🔔</div>
          <div className="stat-value">{stats.notifications}</div>
          <div className="stat-label">Unread Notifications</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate('/user/stations')}>
                📍 Find Nearby Stations
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/user/bookings')}>
                📋 View My Bookings
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/user/notifications')}>
                🔔 Check Notifications
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Bookings</h2>
            {recentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📋</div>
                <p>No bookings yet. Find a station to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentBookings.map(b => (
                  <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                           padding:'12px', background:'#f9fafb', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{b.stationName}</div>
                      <div style={{ fontSize: '.78rem', color: '#6b7280' }}>Slot {b.slotNumber} · {b.chargerType}</div>
                    </div>
                    {statusBadge(b.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
