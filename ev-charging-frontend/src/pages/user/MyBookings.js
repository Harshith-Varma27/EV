import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bookings');

  const load = () => {
    Promise.all([
      api.get('/user/bookings'),
      api.get('/user/waitlist')
    ]).then(([bRes, wRes]) => {
      setBookings(bRes.data);
      setWaitlist(wRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/user/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      load();
    } catch { toast.error('Cancel failed'); }
  };

  const statusStyle = (status) => ({
    ACTIVE:    { background: '#dcfce7', color: '#16a34a' },
    COMPLETED: { background: '#f1f5f9', color: '#64748b' },
    CANCELLED: { background: '#fee2e2', color: '#dc2626' },
  }[status] || {});

  return (
    <div>
      <div className="page-header">
        <h1>📋 My Bookings</h1>
        <p>Track your charging sessions and waitlist</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['bookings', `⚡ Bookings (${bookings.length})`], ['waitlist', `⏳ Waitlist (${waitlist.length})`]].map(([key, label]) => (
          <button key={key}
            className={`btn ${tab === key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        tab === 'bookings' ? (
          bookings.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No bookings yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map(b => (
                <div key={b.id} className="card">
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{b.stationName}</div>
                      <div style={{ color: '#6b7280', fontSize: '.85rem' }}>
                        Charger: <strong>{b.chargerNumber}</strong> ({b.chargerType}) · {b.durationMinutes} min
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '.82rem', marginTop: 4 }}>
                        🔋 Battery: {b.batteryPercentage}% ·
                        {b.startTime && <> Started: {new Date(b.startTime).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
                        {b.endTime && <> · Ends: {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ ...statusStyle(b.status), borderRadius: 99, padding: '4px 14px', fontSize: '.78rem', fontWeight: 700 }}>
                        {b.status}
                      </span>
                      {b.status === 'ACTIVE' && (
                        <button className="btn btn-danger btn-sm" onClick={() => cancel(b.id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          waitlist.length === 0 ? (
            <div className="empty-state"><div className="icon">⏳</div><p>You are not in any waitlist.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {waitlist.map(w => (
                <div key={w.id} className="card" style={{ border: '2px solid #fde68a' }}>
                  <div className="card-body">
                    <div style={{ fontWeight: 700 }}>{w.stationName}</div>
                    <div style={{ color: '#6b7280', fontSize: '.85rem' }}>
                      Charger: <strong>{w.chargerNumber}</strong> · {w.durationMinutes} min
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: '.82rem' }}>🔋 Battery: <strong>{w.batteryPercentage}%</strong></span>
                      <span style={{ fontSize: '.82rem' }}>🏆 Priority: <strong>{w.priorityScore}/100</strong></span>
                    </div>
                    <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: 6 }}>
                      You will be notified when the charger is free for you.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}
    </div>
  );
}
