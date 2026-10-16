import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function BookingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  if (!state?.slot) {
    return (
      <div className="empty-state">
        <div className="icon">⚠️</div>
        <p>No slot selected. Please go back and select a slot.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const { station, charger, slot } = state;
  const typeColors = { FAST: '#d97706', NORMAL: '#2563eb', SUPER: '#7c3aed' };

  const handleBook = async () => {
    setLoading(true);
    try {
      await api.post('/user/bookings', {
        stationId: station.id,
        chargerId: charger.id,
        slotId: slot.id,
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
      });
      toast.success('Booking confirmed! Check notifications for details.');
      navigate('/user/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Back
      </button>

      <div className="page-header">
        <h1>Confirm Booking</h1>
        <p>Review your slot details before confirming</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: '1rem' }}>Booking Summary</h3>
          {[
            ['🏢 Station', station.name],
            ['📍 Address', station.address],
            ['⚡ Charger', `${charger.chargerNumber} (${charger.chargerType})`],
            ['🔋 Power Output', `${charger.powerOutput} kW`],
            ['🔢 Slot', slot.slotNumber],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                      padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: '.875rem' }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: typeColors[charger.chargerType] + '20',
                        color: typeColors[charger.chargerType],
                        borderRadius: 99, padding: '6px 16px', fontWeight: 700, fontSize: '.85rem' }}>
            {charger.chargerType} CHARGER
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Schedule (Optional)</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-control" type="datetime-local"
                     value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-control" type="datetime-local"
                     value={scheduledEnd} onChange={e => setScheduledEnd(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-lg w-full" onClick={handleBook} disabled={loading}>
        {loading ? 'Confirming...' : '✅ Confirm Booking'}
      </button>
    </div>
  );
}
