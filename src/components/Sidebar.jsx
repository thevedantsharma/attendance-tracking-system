import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ScanLine, FileText, UserCircle, Check } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, setOpen }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    ...(user.role === 'admin' || user.role === 'teacher' ? [{ name: 'Students', path: '/students', icon: <UserCircle size={20} /> }] : []),
    { name: user.role === 'student' ? 'My Subjects' : 'Classes', path: '/classes', icon: <Users size={20} /> },
    ...(user.role !== 'student' ? [{ name: 'Mark Attendance', path: '/attendance-marking', icon: <Check size={20} /> }] : []),
    { name: user.role === 'student' ? 'My Attendance' : 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Profile', path: '/profile', icon: <UserCircle size={20} /> }
  ];

  return (
    <aside className={`sidebar glass-nav ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">A</div>
        <h1 className="brand-text">AttendX</h1>
      </div>

      <div className="sidebar-servers">
        {/* Discord-style server icons stub */}
        <div className="server-icon active">S1</div>
        <div className="server-icon">S2</div>
        <div className="server-icon">S3</div>
        <div className="server-indicator"></div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-group-title">MAIN MENU</p>

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)} // close on mobile after navigation
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
