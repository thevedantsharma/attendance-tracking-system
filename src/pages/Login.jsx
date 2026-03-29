import React, { useState } from 'react';
import './Login.css';
import { Fingerprint, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('student');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r) => {
    setRole(r);
    setEmail('');
    setPassword('');
    setError('');
  };


  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://attendance-tracking-system-1cbj.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password
        })
      });
const navigate = useNavigate();
      const data = await res.json();
      console.log(data);

      if (data.success) {
        alert("Login Successful 🔥");

        // 👉 optional: redirect
        navigate= "/";
      } else {
        alert(data.message || "Login failed");
      }

    } catch (err) {
      console.error(err);
      alert("Error occurred");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <div className="glass-panel login-card">
        <div className="login-brand">
          <div className="brand-logo-large">A</div>
          <h2>Welcome to <span className="gradient-text">AttendX</span></h2>
          <p className="login-subtitle">The intelligent attendance tracking system</p>
        </div>

        <div className="role-selector">
          <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => handleRoleSelect('student')}>Student</button>
          <button type="button" className={`role-btn ${role === 'teacher' ? 'active' : ''}`} onClick={() => handleRoleSelect('teacher')}>Teacher</button>
          <button type="button" className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => handleRoleSelect('admin')}>Admin</button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="error-alert">{error}</div>}
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password">Forgot Password?</a>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing In...' : 'Sign In'} <Fingerprint size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
