import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/bookings').then(r => setBookings(r.data))
    .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusBadge = (s) => {
    const map = { CONFIRMED:'badge-blue', CHARGING:'badge-green', COMPLETED:'badge-gray', CANCELLED:'badge-red' };
    return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
  };

  const filtered = bookings
    .filter(b => filter === 'ALL' || b.status === filter)
    .filter(b => !search || b.userName?.toLowerCase().includes(search.toLowerCase()) ||
                 b.stationName?.toLowerCase().includes(search.toLowerCase()));

  const fmt = d => d ? new Date(d).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—';

  return (
    <div>
      <div className="page-header">
        <h1>📋 All Platform Bookings</h1>
        <p>Complete booking history across all stations</p>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-control" style={{ maxWidth:280 }} placeholder="🔍 Search user or station..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:6 }}>
          {['ALL','CONFIRMED','CHARGING','COMPLETED','CANCELLED'].map(s => (
            <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-outline'}`}
                    onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="card">
          <div style={{ padding:'12px 20px', borderBottom:'1px solid #f3f4f6', fontSize:'.85rem', color:'#6b7280' }}>
            Showing <strong>{filtered.length}</strong> of {bookings.length} bookings
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>User</th><th>Station</th><th>Slot</th><th>Type</th><th>Booked At</th><th>Status</th><th>Cost</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ color:'#9ca3af' }}>#{b.id}</td>
                    <td><div style={{ fontWeight:600 }}>{b.userName}</div><div style={{ color:'#9ca3af', fontSize:'.75rem' }}>{b.vehicleNumber}</div></td>
                    <td>{b.stationName}</td>
                    <td><strong>{b.slotNumber}</strong></td>
                    <td>{b.chargerType}</td>
                    <td>{fmt(b.bookingTime)}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>{b.totalCost ? `₹${b.totalCost}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state"><p>No bookings found.</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
