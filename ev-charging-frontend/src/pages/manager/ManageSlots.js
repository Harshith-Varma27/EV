import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const STATES = ['AVAILABLE', 'RESERVED', 'CHARGING', 'MAINTENANCE'];
const stateClass = { AVAILABLE:'slot-available', RESERVED:'slot-reserved', CHARGING:'slot-charging', MAINTENANCE:'slot-maintenance' };
const stateIcon  = { AVAILABLE:'✅', RESERVED:'🔒', CHARGING:'⚡', MAINTENANCE:'🔧' };

export default function ManageSlots() {
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    api.get('/manager/station/chargers').then(r => setChargers(r.data))
    .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeState = async (slotId, state) => {
    try {
      await api.put(`/manager/slots/${slotId}/state?state=${state}`);
      toast.success(`Slot set to ${state}`);
      setSelected(null);
      load();
    } catch { toast.error('Failed to update slot'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <h1>🔌 Manage Slots</h1>
        <p>Click any slot to change its state</p>
      </div>

      {chargers.map(c => (
        <div key={c.id} className="card" style={{ marginBottom:16 }}>
          <div className="card-body">
            <div style={{ fontWeight:700, marginBottom:4 }}>{c.chargerNumber} — {c.chargerType}</div>
            <div style={{ color:'#6b7280', fontSize:'.8rem', marginBottom:16 }}>
              {c.slots?.filter(s=>s.slotState==='AVAILABLE').length}/{c.totalSlots} available
            </div>
            <div className="slot-grid">
              {c.slots?.map(slot => (
                <div key={slot.id} className={`slot-item ${stateClass[slot.slotState]} ${selected?.id===slot.id?'slot-selected':''}`}
                     onClick={() => setSelected(selected?.id === slot.id ? null : slot)}>
                  <span style={{ fontSize:'1.2rem' }}>{stateIcon[slot.slotState]}</span>
                  <span style={{ fontSize:'.72rem' }}>{slot.slotNumber}</span>
                  <span style={{ fontSize:'.65rem', opacity:.8 }}>{slot.slotState}</span>
                </div>
              ))}
            </div>

            {selected && c.slots?.find(s => s.id === selected.id) && (
              <div style={{ marginTop:16, padding:16, background:'#f9fafb', borderRadius:8 }}>
                <div style={{ fontWeight:600, marginBottom:10, fontSize:'.875rem' }}>
                  Change state of {selected.slotNumber}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {STATES.map(state => (
                    <button key={state} className="btn btn-sm btn-outline"
                            style={{ background: state===selected.slotState?'#1f2937':undefined,
                                     color: state===selected.slotState?'#fff':undefined }}
                            onClick={() => changeState(selected.id, state)}>
                      {stateIcon[state]} {state}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
