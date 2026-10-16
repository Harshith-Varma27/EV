import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const WORKFLOW = { CONFIRMED: 'CHARGING', CHARGING: 'COMPLETED' };

export default function ManagerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = () => {
    api.get('/manager/bookings').then(r => setBookings(r.data))
    .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const advance = async (id, current) => {
    const next = WORKFLOW[current];
    if (!next) return;
    try {
      await api.put(`/manager/bookings/${id}/status?status=${next}`);
      toast.success(`Status updated to ${next}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/manager/bookings/${id}/status?status=CANCELLED`);
      toast.success('Booking cancelled');
      load();
    } catch { toast.error('Cancel failed'); }
  };

  const statusBadge = (s) => {
    const map = { CONFIRMED:'badge-blue', CHARGING:'badge-green', COMPLETED:'badge-gray', CANCELLED:'badge-red' };
    return <span className={`badge ${map[s]||'badge-gray'}`}>{s}</span>;
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const fmt = d => d ? new Date(d).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}) : '—';

  return (
    <div>
      <div className="page-header">
        <h1>📋 Station Bookings</h1>
        <p>Manage and advance booking workflow</p>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['ALL','CONFIRMED','CHARGING','COMPLETED','CANCELLED'].map(s => (
          <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-outline'}`}
                  onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Vehicle</th><th>Slot</th><th>Type</th><th>Booked</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>{b.userName}</td>
                    <td>{b.vehicleNumber || '—'}</td>
                    <td><strong>{b.slotNumber}</strong></td>
                    <td>{b.chargerType}</td>
                    <td>{fmt(b.bookingTime)}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {WORKFLOW[b.status] && (
                          <button className="btn btn-sm btn-secondary" onClick={() => advance(b.id, b.status)}>
                            → {WORKFLOW[b.status]}
                          </button>
                        )}
                        {['CONFIRMED','CHARGING'].includes(b.status) && (
                          <button className="btn btn-sm btn-danger" onClick={() => cancel(b.id)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state"><div className="icon">📋</div><p>No bookings found.</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
