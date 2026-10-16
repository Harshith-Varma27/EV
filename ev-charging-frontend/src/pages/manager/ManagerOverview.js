import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ManagerOverview() {
  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/manager/station'),
      api.get('/manager/station/chargers'),
      api.get('/manager/bookings'),
    ]).then(([sRes, cRes, bRes]) => {
      setStation(sRes.data);
      setChargers(cRes.data);
      setBookings(bRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  const activeChargers  = chargers.filter(c => c.status === 'ACTIVE').length;
  const activeBookings  = bookings.filter(b => b.status === 'ACTIVE').length;

  return (
    <div>
      <div className="page-header">
        <h1>📊 Station Overview</h1>
        <p>{station?.name} — {station?.address}</p>
      </div>

      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { icon:'⚡', value: station?.totalChargers, label:'Total Chargers', bg:'#dcfce7' },
          { icon:'🟢', value: activeChargers,         label:'Active Chargers', bg:'#dbeafe' },
          { icon:'📋', value: activeBookings,         label:'Active Bookings', bg:'#ede9fe' },
          { icon:'📊', value: bookings.length,        label:'Total Bookings',  bg:'#fef9c3' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value ?? '—'}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:16 }}>Recent Bookings</h2>
          {bookings.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No bookings yet.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>User</th><th>Charger</th><th>Duration</th><th>Battery %</th><th>Start Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bookings.slice(0,8).map(b => (
                    <tr key={b.id}>
                      <td>{b.userName}</td>
                      <td><strong>{b.chargerNumber}</strong> ({b.chargerType})</td>
                      <td>{b.durationMinutes} min</td>
                      <td>🔋 {b.batteryPercentage}%</td>
                      <td>{b.startTime ? new Date(b.startTime).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—'}</td>
                      <td>
                        <span className={`badge ${{ACTIVE:'badge-green',COMPLETED:'badge-gray',CANCELLED:'badge-red'}[b.status]||'badge-gray'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
