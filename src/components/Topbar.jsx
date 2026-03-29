import React, { useState } from 'react';
import { Menu, Bell, Search, Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const Topbar = ({ toggleSidebar, theme, toggleTheme }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  return (
    <header className="topbar glass-nav">
      <div className="topbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search students, classes, reports..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div style={{position: 'relative'}}>
          <button className="icon-btn notif-btn" onClick={() => setShowNotif(!showNotif)}>
            <Bell size={20} />
            <span className="notif-badge">1</span>
          </button>
          {showNotif && (
            <div className="glass-panel" style={{position: 'absolute', top: '120%', right: 0, width: 250, padding: '1rem', zIndex: 100}}>
              <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)'}}>System Notifications</p>
              <div style={{marginTop: 10, fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8}}>
                <strong>Welcome {user.name}</strong><br/>
                <span style={{fontSize: '0.8rem', opacity: 0.7}}>Your role is {user.role}. Start tracking attendance.</span>
              </div>
            </div>
          )}
        </div>
        <div className="user-profile">
          <img src={user.photo_url || "https://i.pravatar.cc/150?img=11"} alt={user.name} className="avatar" style={{width: 36, height: 36, objectFit: 'cover'}} />
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role" style={{textTransform: 'capitalize'}}>{user.role}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={handleLogout} title="Logout" style={{marginLeft: '0.5rem', color: 'var(--accent-red)'}}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
