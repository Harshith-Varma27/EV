import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#16a34a','#2563eb','#d97706','#7c3aed','#dc2626'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/admin/analytics'), api.get('/admin/bookings')])
    .then(([aRes, bRes]) => { setAnalytics(aRes.data); setBookings(bRes.data); })
    .catch(() => {});
  }, []);

  if (!analytics) return <div className="loading-center"><div className="spinner"/></div>;

  const weeklyData = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
    // find the most recent occurrence of this weekday within last 7 days
    const today = new Date();
    const todayDay = today.getDay(); // 0=Sun,1=Mon,...
    const targetDay = i === 6 ? 0 : i + 1; // Mon=1,...,Sun=0
    let diff = todayDay - targetDay;
    if (diff < 0) diff += 7;
    const d = new Date(today);
    d.setDate(today.getDate() - diff);
    return {
      day,
      bookings: bookings.filter(b => new Date(b.createdAt).toDateString() === d.toDateString()).length
    };
  });

  const statusData = ['ACTIVE','COMPLETED','CANCELLED'].map(s => ({
    name: s, value: bookings.filter(b => b.status === s).length
  })).filter(d => d.value > 0);

  const statCards = [
    { icon:'👥', value: analytics.totalUsers,    label:'Total Users',     bg:'#dcfce7', path:'/admin/users' },
    { icon:'🏢', value: analytics.totalStations, label:'Total Stations',  bg:'#dbeafe', path:'/admin/stations' },
    { icon:'📋', value: analytics.totalBookings, label:'Total Bookings',  bg:'#fef9c3', path:'/admin/bookings' },
    { icon:'⚡', value: analytics.managers,      label:'Station Managers',bg:'#ede9fe', path:'/admin/managers' },
    { icon:'🔌', value: analytics.totalChargers,             label:'Total Chargers',       bg:'#fee2e2' },
    { icon:'📅', value: analytics.todayBookings,             label:"Today's Bookings",     bg:'#fef3c7' },
    { icon:'⚡', value: `${analytics.weeklyEnergyKwh} kWh`, label:'Energy This Week',     bg:'#dcfce7' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>📊 Platform Analytics</h1>
        <p>Real-time overview of the entire EV charging network</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {statCards.slice(0,4).map(s => (
          <div key={s.label} className="stat-card" onClick={() => s.path && navigate(s.path)}
               style={{ cursor: s.path ? 'pointer' : 'default' }}>
            <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {statCards.slice(4).map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background:s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:20, fontSize:'1rem' }}>Bookings — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:12 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#16a34a" strokeWidth={2}
                      fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:20, fontSize:'1rem' }}>Booking Status Distribution</h3>
            {statusData.length === 0 ? (
              <div className="empty-state"><p>No bookings yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                       dataKey="value" label={e=>`${e.name} (${e.value})`} labelLine={false}>
                    {statusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop:20 }}>
        <div className="card-body">
          <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'1rem' }}>Recent Bookings</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Station</th><th>Charger</th><th>Duration</th><th>Battery %</th><th>Booked At</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.slice(0,8).map(b => (
                  <tr key={b.id}>
                    <td>{b.userName}</td>
                    <td>{b.stationName}</td>
                    <td><strong>{b.chargerNumber}</strong> ({b.chargerType})</td>
                    <td>{b.durationMinutes} min</td>
                    <td>🔋 {b.batteryPercentage}%</td>
                    <td>{new Date(b.createdAt).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'})}</td>
                    <td>
                      <span className={`badge ${{ACTIVE:'badge-green',COMPLETED:'badge-gray',CANCELLED:'badge-red'}[b.status]}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <div className="empty-state"><p>No bookings yet.</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
