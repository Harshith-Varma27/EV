import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ManageManagers() {
  const [managers, setManagers] = useState([]);
  const [stations, setStations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', stationId:'' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.get('/admin/managers'), api.get('/admin/stations')])
    .then(([mRes, sRes]) => { setManagers(mRes.data); setStations(sRes.data); })
    .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.warn('Fill all required fields');
    try {
      await api.post('/admin/managers', form);
      toast.success('Manager created!');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', stationId:'' });
      load();
    } catch { toast.error('Failed to create manager'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this manager?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Manager removed'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div><h1>⚡ Manage Station Managers</h1><p>Create and assign managers to stations</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Manager</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Assigned Station</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {managers.map(m => {
                  const station = stations.find(s => s.managerId === m.id);
                  return (
                    <tr key={m.id}>
                      <td><div style={{ fontWeight:600 }}>{m.name}</div></td>
                      <td>{m.email}</td>
                      <td>{station ? station.name : <span style={{ color:'#9ca3af' }}>Unassigned</span>}</td>
                      <td><span className={`badge ${m.isActive ? 'badge-green' : 'badge-red'}`}>{m.isActive?'Active':'Inactive'}</span></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {managers.length === 0 && <div className="empty-state"><p>No managers yet.</p></div>}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Station Manager</h2>
              <span className="modal-close" onClick={() => setShowModal(false)}>✕</span>
            </div>
            {[
              { label:'Full Name *', key:'name', type:'text', placeholder:'John Manager' },
              { label:'Email *',     key:'email', type:'email', placeholder:'manager@example.com' },
              { label:'Password *',  key:'password', type:'password', placeholder:'Min. 8 characters' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input className="form-control" type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Assign to Station (optional)</label>
              <select className="form-control" value={form.stationId}
                      onChange={e => setForm({...form, stationId:e.target.value})}>
                <option value="">-- Select Station --</option>
                {stations.filter(s => !s.managerId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create Manager</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
