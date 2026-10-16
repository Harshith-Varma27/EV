import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/admin/users').then(r => setUsers(r.data))
    .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (id) => {
    try { await api.put(`/admin/users/${id}/toggle`); toast.success('Status updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>👥 Manage Users</h1>
        <p>View and manage all registered EV users</p>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-body" style={{ padding:'14px 20px' }}>
          <input className="form-control" placeholder="🔍 Search users by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>City</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.vehicleNumber || '—'}</td>
                    <td>{u.city || '—'}</td>
                    <td><span className={`badge ${u.isActive?'badge-green':'badge-red'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => toggle(u.id)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state"><p>No users found.</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
