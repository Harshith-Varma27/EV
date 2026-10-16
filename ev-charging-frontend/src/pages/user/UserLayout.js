import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NAV = [
  { to: '/user',              icon: '🏠', label: 'Home',           end: true },
  { to: '/user/stations',     icon: '📍', label: 'Nearby Stations' },
  { to: '/user/bookings',     icon: '📋', label: 'My Bookings' },
  { to: '/user/notifications',icon: '🔔', label: 'Notifications' },
  { to: '/user/profile',      icon: '👤', label: 'Profile' },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/user/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="logo-text">EV Charging</div>
            <div className="logo-sub">Smart Platform</div>
          </div>
        </div>

        <div style={{ padding: '12px 0', flex: 1 }}>
          <div className="sidebar-section">Main Menu</div>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
              {n.label === 'Notifications' && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="topbar-title">EV Charging Platform</div>
          <div className="topbar-right">
            <div style={{ fontSize: '.85rem', color: '#6b7280' }}>Welcome, <strong>{user?.name}</strong></div>
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
