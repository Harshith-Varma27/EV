import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    if (user.role === 'ADMIN')   navigate('/admin');
    else if (user.role === 'MANAGER') navigate('/manager');
    else navigate('/user');
  }

  const roles = [
    { icon: '🚗', title: 'EV User', desc: 'Find charging stations, book slots, and manage your sessions.', path: '/login?role=USER' },
    { icon: '⚡', title: 'Station Manager', desc: 'Manage your station, chargers, slots and bookings.', path: '/login?role=MANAGER' },
    { icon: '🛡️', title: 'Admin', desc: 'Oversee the entire platform, stations, managers and analytics.', path: '/login?role=ADMIN' },
  ];

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>Smart <span>EV Charging</span><br />Optimization System</h1>
        <p>Find nearby charging stations, book slots instantly, and get real-time updates on your charging sessions.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Get Started Free</button>
          <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}
                  onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>

      <div className="landing-cards">
        {roles.map(r => (
          <div key={r.title} className="role-card" onClick={() => navigate(r.path)}>
            <div className="role-icon">{r.icon}</div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>Login as {r.title}</button>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '24px', textAlign: 'center',
                    color: 'rgba(255,255,255,.3)', fontSize: '.8rem' }}>
        © 2024 EV Charging Platform · Smart Mobility Solutions
      </div>
    </div>
  );
}
