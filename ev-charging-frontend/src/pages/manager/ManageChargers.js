import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ManageChargers() {
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/manager/station/chargers').then(r => setChargers(r.data))
    .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleMaintenance = async (id, isMaintenance) => {
    try {
      await api.put(`/manager/chargers/${id}/maintenance?maintenance=${!isMaintenance}`);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const typeColors = { FAST:'#d97706', NORMAL:'#2563eb', SUPER:'#7c3aed' };

  return (
    <div>
      <div className="page-header">
        <h1>⚡ Manage Chargers</h1>
        <p>Monitor and control your station chargers</p>
      </div>

      {loading ? <div className="loading-center"><div className="spinner"/></div> : (
        chargers.length === 0 ? (
          <div className="empty-state">
            <div className="icon">⚡</div>
            <p>No chargers assigned to your station yet.</p>
            <p style={{ fontSize:'.85rem', color:'#9ca3af' }}>Contact the admin to add chargers.</p>
          </div>
        ) : (
          <div className="grid-2">
            {chargers.map(c => (
              <div key={c.id} className="card">
                <div className="card-body">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'1rem', color: typeColors[c.chargerType] }}>
                        {c.chargerNumber}
                      </div>
                      <div style={{ fontSize:'.8rem', color:'#6b7280' }}>{c.chargerType} · {c.powerOutput} kW</div>
                    </div>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontSize:'.85rem', color:'#6b7280', marginBottom:16 }}>
                    {c.status === 'ACTIVE' ? '🟢 Available for booking' : '🔴 Under maintenance'}
                  </div>
                  <button className={`btn btn-sm ${c.status === 'MAINTENANCE' ? 'btn-secondary' : 'btn-outline'}`}
                          onClick={() => toggleMaintenance(c.id, c.status === 'MAINTENANCE')}>
                    {c.status === 'MAINTENANCE' ? '✅ Release from Maintenance' : '🔧 Set Maintenance'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
