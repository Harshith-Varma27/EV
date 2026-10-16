import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CITIES = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Coimbatore', 'Kochi'];

export default function NearbyStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
          fetchNearby(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLocationDenied(true);
          setLocating(false);
          setLoading(false);
        }
      );
    } else {
      setLocationDenied(true);
      setLocating(false);
      setLoading(false);
    }
  }, []);

  const fetchNearby = (lat, lng) => {
    setLoading(true);
    api.get(`/user/stations/nearby?lat=${lat}&lng=${lng}`)
      .then(r => setStations(r.data))
      .catch(() => toast.error('Failed to load stations'))
      .finally(() => setLoading(false));
  };

  const fetchByCity = () => {
    if (!city) return toast.warn('Please select a city');
    setLoading(true);
    api.get(`/user/stations/city?city=${city}`)
      .then(r => setStations(r.data))
      .catch(() => toast.error('Failed to load stations'))
      .finally(() => setLoading(false));
  };

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const availPercent = (s) => s.totalChargers > 0 ? Math.round((s.totalChargers / s.totalChargers) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>📍 Nearby Charging Stations</h1>
        <p>Find EV charging stations within 30km of your location</p>
      </div>

      {/* Location detecting */}
      {locating && (
        <div className="card" style={{ marginBottom: 20, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="spinner" style={{ width: 20, height: 20 }} />
            <span style={{ color: '#1d4ed8', fontWeight: 500 }}>Detecting your location...</span>
          </div>
        </div>
      )}

      {/* Location detected */}
      {userLocation && !locating && (
        <div className="card" style={{ marginBottom: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, color: '#15803d' }}>Location detected</div>
              <div style={{ fontSize: '.8rem', color: '#6b7280' }}>
                Showing stations within 30km · Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
              </div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}
              onClick={() => fetchNearby(userLocation.lat, userLocation.lng)}>
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {/* Location denied — city search */}
      {locationDenied && (
        <div className="card" style={{ marginBottom: 20, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <span style={{ fontWeight: 600, color: '#c2410c' }}>Location access denied</span>
            </div>
            <p style={{ fontSize: '.875rem', color: '#6b7280', marginBottom: 12 }}>
              Please allow location access or search by city below.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">📌 Select Your City</label>
                <select className="form-control" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">-- Select City --</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={fetchByCity}>Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <input className="form-control"
            placeholder="🔍 Search stations by name, address or city..."
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📍</div>
          <p>No stations found within 30km.</p>
          {!locationDenied && <p style={{ fontSize: '.85rem', color: '#9ca3af' }}>Try searching by city using the option above.</p>}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12, color: '#6b7280', fontSize: '.875rem' }}>
            Showing <strong>{filtered.length}</strong> charging station{filtered.length !== 1 ? 's' : ''}
            {userLocation ? ' within 30km of your location' : ` in ${city}`}
          </div>
          <div className="grid-3">
            {filtered.map(s => (
              <div key={s.id} className="station-card">
                <div className="station-card-header">
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: '.8rem', opacity: .8 }}>📍 {s.city}</div>
                  {s.distance != null && (
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: 'rgba(255,255,255,.2)', borderRadius: 99, padding: '2px 10px',
                                  fontSize: '.8rem', fontWeight: 600 }}>
                      🛣️ {s.distance} km away
                    </div>
                  )}
                </div>
                <div className="station-card-body">
                  <div className="station-stat"><span>🏠</span><span>{s.address}</span></div>
                  <div className="station-stat">
                    <span>⚡</span><span>Total Chargers: <strong>{s.totalChargers}</strong></span>
                  </div>
                  <div className="station-stat">
                    <span>⚡</span>
                    <span>Chargers: <strong style={{ color: '#16a34a' }}>{s.totalChargers} available</strong></span>
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate(`/user/stations/${s.id}`)}>
                    ⚡ View & Book →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
