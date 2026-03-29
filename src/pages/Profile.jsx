import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Shield, Edit3, Save, Link as LinkIcon, Camera, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user, login } = useAuth();
  const [userProfile, setUserProfile] = useState(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    photo_url: user?.photo_url || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/users/me');
      if(res.ok) {
        const result = await res.json();
        const latestUser = result.data || result.user;
        setUserProfile(latestUser);
        setFormData({
          name: latestUser.name || '',
          email: latestUser.email || '',
          phone: latestUser.phone || '',
          photo_url: latestUser.photo_url || '',
          password: ''
        });
        // Sync context
        login(latestUser);
      }
    } catch(e) {
      console.error("Profile fetch failed", e);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if(res.ok) {
        setMessage({ text: 'Institutional profile updated successfully!', type: 'success' });
        setUserProfile(data.user);
        setIsEditing(false);
        login(data.user);
      } else {
        setMessage({ text: data.error || 'Identity update failed', type: 'error' });
      }
    } catch(e) {
      setMessage({ text: 'Network connection interrupted', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading identity...</div>;

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} style={{maxWidth: 850, margin: '0 auto'}}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">Digital Identity</h1>
        <p className="dashboard-subtitle">Manage your institutional credentials and security profile.</p>
      </header>

      <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '2.5rem'}}>
        
        {message.text && (
          <motion.div 
            initial={{opacity: 0, y: -10}} 
            animate={{opacity: 1, y: 0}}
            style={{
                padding: '1rem 1.5rem', 
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: message.type === 'success' ? '#10b981' : '#ef4444', 
                border: `1px solid ${message.type === 'success' ? '#10b98140' : '#ef444440'}`, 
                borderRadius: 12,
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10
            }}
          >
            {message.type === 'success' ? <Shield size={18}/> : <Shield size={18} style={{color: '#ef4444'}}/>}
            {message.text}
          </motion.div>
        )}

        {/* Profile Header Block */}
        <div style={{display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap'}}>
          <div style={{position: 'relative'}}>
            <div style={{width: 140, height: 140, borderRadius: 24, overflow: 'hidden', border: '4px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'}}>
                <img 
                  src={userProfile.photo_url || `https://ui-avatars.com/api/?name=${userProfile.name}&background=3b82f6&color=fff&size=200`} 
                  alt="Profile Avatar" 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
            </div>
            {isEditing && (
                <div style={{position: 'absolute', bottom: -10, right: -10, background: '#3b82f6', p: 8, borderRadius: '50%', border: '4px solid #0f172a', color: 'white', cursor: 'pointer', padding: 8}}>
                    <Camera size={16}/>
                </div>
            )}
          </div>
          
          <div style={{flex: 1, minWidth: 250}}>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={{fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '0.5rem 1rem', width: '100%'}}
              />
            ) : (
              <h2 style={{fontSize: '2.25rem', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.025em'}}>{userProfile.name}</h2>
            )}
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 8}}>
                <span style={{color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 12px', borderRadius: 20}}>
                    {userProfile.role}
                </span>
                <span style={{color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6}}>
                  <MapPin size={14} style={{color: '#3b82f6'}}/> Main Campus
                </span>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '1rem'}}>
            {!isEditing ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)} style={{padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12}}>
                <Edit3 size={18}/> Modify Identity
              </button>
            ) : (
              <div style={{display: 'flex', gap: '0.75rem'}}>
                <button className="btn-secondary" onClick={() => setIsEditing(false)} style={{borderRadius: 12}}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={loading} style={{borderRadius: 12, background: '#10b981'}}>
                  <Save size={18} style={{marginRight: 8}}/> {loading ? 'Syncing...' : 'Validate & Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} style={{display: 'flex', flexDirection: 'column', gap: 8}}>
             <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase'}}>Public Avatar URL</span>
             <div style={{display: 'flex', alignItems: 'center', gap: 12, background: '#0f172a', padding: '12px 16px', borderRadius: 12, border: '1px solid #1e293b'}}>
                <LinkIcon size={18} color="#3b82f6"/>
                <input 
                  type="text" 
                  value={formData.photo_url}
                  onChange={e => setFormData({...formData, photo_url: e.target.value})}
                  placeholder="https://example.com/photo.png"
                  style={{background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.95rem'}}
                />
             </div>
          </motion.div>
        )}

        <div style={{height: 1, background: 'linear-gradient(90deg, transparent, #1e293b, transparent)'}} />

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase'}}>Identity Verification</span>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, background: '#0f172a', padding: '16px 20px', borderRadius: 16, border: '1px solid #1e293b'}}>
              <div style={{background: 'rgba(59, 130, 246, 0.1)', p: 10, borderRadius: 12, padding: 8}}>
                <Mail size={20} color="#3b82f6"/>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2}}>Email Address</div>
                {isEditing ? (
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontWeight: 600, fontSize: '1rem'}} />
                ) : (
                    <span style={{fontWeight: 600, color: '#f1f5f9'}}>{userProfile.email}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <span style={{color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase'}}>System Credentials</span>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, background: '#0f172a', padding: '16px 20px', borderRadius: 16, border: '1px solid #1e293b'}}>
              <div style={{background: 'rgba(16, 185, 129, 0.1)', p: 10, borderRadius: 12, padding: 8}}>
                <Shield size={20} color="#10b981"/>
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2}}>Account Security</div>
                {isEditing ? (
                    <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="New password (optional)" style={{background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontWeight: 600, fontSize: '1rem'}} />
                ) : (
                    <span style={{fontWeight: 600, color: '#10b981'}}>Protected Mode Active</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Profile;
