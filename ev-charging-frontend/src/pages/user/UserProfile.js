import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Your account information</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24,
                        paddingBottom:24, borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ width:72, height:72, background:'#16a34a', borderRadius:'50%',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontSize:'1.8rem', fontWeight:700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'1.2rem' }}>{user?.name}</div>
              <div style={{ color:'#6b7280', fontSize:'.875rem' }}>{user?.email}</div>
              <span className="badge badge-green" style={{ marginTop:6 }}>EV User</span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { label: 'Email',          value: user?.email || '—' },
              { label: 'User ID',        value: `#${user?.userId}` },
              { label: 'Role',           value: user?.role },
              { label: 'Account Status', value: 'Active' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between',
                                        padding:'12px 0', borderBottom:'1px solid #f9fafb' }}>
                <span style={{ color:'#6b7280', fontSize:'.875rem' }}>{label}</span>
                <span style={{ fontWeight:600, fontSize:'.875rem' }}>{value}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-danger w-full" style={{ marginTop:24 }}
                  onClick={() => { logout(); navigate('/'); }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
