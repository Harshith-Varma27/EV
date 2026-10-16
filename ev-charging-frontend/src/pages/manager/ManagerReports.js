import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function ManagerReports() {
  const [bookings, setBookings] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/manager/bookings'), api.get('/manager/station/chargers')])
    .then(([bRes, cRes]) => { setBookings(bRes.data); setChargers(cRes.data); })
    .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-IN');
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);

  const todayBookings  = bookings.filter(b => new Date(b.bookingTime).toLocaleDateString('en-IN') === today);
  const weeklyBookings = bookings.filter(b => new Date(b.bookingTime) >= weekAgo);
  const completed      = bookings.filter(b => b.status === 'COMPLETED').length;
  const utilRate       = bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0;

  const statusData = ['CONFIRMED','CHARGING','COMPLETED','CANCELLED'].map(s => ({
    name: s, value: bookings.filter(b => b.status === s).length
  })).filter(d => d.value > 0);

  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6-i)*24*60*60*1000);
    const label = d.toLocaleDateString('en-IN', { weekday:'short' });
    const count = bookings.filter(b => new Date(b.bookingTime).toDateString() === d.toDateString()).length;
    return { day: label, bookings: count };
  });

  const chargerTypeData = ['FAST','NORMAL','SUPER'].map(t => ({
    name: t,
    count: chargers.filter(c => c.chargerType === t).length
  })).filter(d => d.count > 0);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <h1>📈 Station Reports</h1>
        <p>Performance metrics and booking analytics</p>
      </div>

      <div className="grid-4" style={{ marginBottom:28 }}>
        {[
          { icon:'📅', value: todayBookings.length,  label:"Today's Bookings",  bg:'#dcfce7' },
          { icon:'📆', value: weeklyBookings.length, label:'Weekly Bookings',    bg:'#dbeafe' },
          { icon:'✅', value: completed,             label:'Completed Sessions', bg:'#fef9c3' },
          { icon:'📊', value: `${utilRate}%`,        label:'Utilization Rate',   bg:'#ede9fe' },
        ].map(s => (
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
            <h3 style={{ fontWeight:700, marginBottom:20, fontSize:'1rem' }}>Daily Bookings (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize:12 }} />
                <YAxis tick={{ fontSize:12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:20, fontSize:'1rem' }}>Booking Status Breakdown</h3>
            {statusData.length === 0 ? (
              <div className="empty-state"><p>No data yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={e=>e.name}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'1rem' }}>Charger Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chargerTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize:12 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:12 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'1rem' }}>Summary</h3>
            {[
              ['Total Bookings',    bookings.length],
              ["Today's Sessions",  todayBookings.length],
              ['Weekly Sessions',   weeklyBookings.length],
              ['Completed',         completed],
              ['Utilization Rate',  `${utilRate}%`],
              ['Active Chargers',   chargers.filter(c=>c.status==='ACTIVE').length],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between',
                                        padding:'10px 0', borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ color:'#6b7280', fontSize:'.875rem' }}>{label}</span>
                <strong style={{ fontSize:'.875rem' }}>{val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
