import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Mail, GraduationCap, Grid, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', email: '', roll_no: '', batch: '', password: ''
  });

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/users/students');
      if(res.ok) {
          const result = await res.json();
          setStudents(result.data || []);
      }
    } catch(e) {
      console.error("Fetch students failed", e);
    }
  };

  useEffect(() => { if (user) fetchStudents(); }, [user]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalError('');
    try {
      const res = await apiFetch('/users/students', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if(res.ok) {
        setShowModal(false);
        fetchStudents();
        setFormData({ name: '', email: '', roll_no: '', batch: '', password: '' });
      } else {
        setModalError(data.error || 'Server error during registration');
      }
    } catch(err) {
      setModalError("Network communication failure");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this student permanently?")) return;
    try {
      const res = await apiFetch(`/users/students/${id}`, { method: 'DELETE' });
      if(res.ok) {
        fetchStudents();
      } else {
        const err = await res.json();
        alert("Failed to delete: " + err.error);
      }
    } catch(e) {
      alert("Network error processing deletion");
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if(user?.role === 'student') return <div style={{padding: '2rem', textAlign: 'center', color: '#ef4444'}}>Access Denied</div>;

  return (
    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="dashboard-container" style={{maxWidth: 1000, margin: '0 auto'}}>
      <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <h1 className="dashboard-title">Student Management</h1>
            <span style={{padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800, border: '1px solid rgba(59,130,246,0.2)'}}>{students.length} Total</span>
          </div>
          <p className="dashboard-subtitle">Maintain the institutional academic database.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18}/> New Admission
        </button>
      </header>

      <div className="glass-panel" style={{padding: '1.5rem', marginTop: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: 12, marginBottom: '2rem', width: '100%', maxWidth: 400, border: '1px solid #1e293b'}}>
          <Search size={18} style={{color: '#64748b', marginRight: 12}}/>
          <input 
            type="text" 
            placeholder="Search by name, roll, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{background: 'transparent', border: 'none', color: '#f1f5f9', outline: 'none', width: '100%', fontSize: '0.95rem'}}
          />
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1}}>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600}}>Name & Profile</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600}}>Academic ID</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600}}>Primary Contact</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600}}>Class Section</th>
                {user.role === 'admin' && <th style={{padding: '1.25rem 1rem', textAlign: 'right'}}>Tools</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.id} style={{borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s'}}>
                  <td style={{padding: '1rem', fontWeight: 600, color: '#f8fafc'}}>{s.name}</td>
                  <td style={{padding: '1rem', color: '#94a3b8', fontFamily: 'monospace'}}>{s.roll_no}</td>
                  <td style={{padding: '1rem', color: '#3b82f6', fontSize: '0.9rem'}}>{s.email}</td>
                  <td style={{padding: '1rem'}}>
                    <span style={{padding: '4px 12px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid #a78bfa30', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600}}>{s.batch}</span>
                  </td>
                  {user.role === 'admin' && (
                    <td style={{padding: '1rem', textAlign: 'right'}}>
                      <button onClick={() => handleDelete(s.id)} style={{color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, transition: 'background 0.2s'}}>
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && <div style={{padding: '3rem', textAlign: 'center', color: '#64748b'}}>No students matching your search criteria.</div>}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div style={{position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <motion.div 
               initial={{scale: 0.9, opacity: 0}}
               animate={{scale: 1, opacity: 1}}
               exit={{scale: 0.9, opacity: 0}}
               className="glass-panel" 
               style={{width: '95%', maxWidth: 550, padding: '2.5rem'}}
            >
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontSize: '1.75rem', fontWeight: 800}}>Register New Student</h2>
                <button onClick={() => { setShowModal(false); setModalError(''); }} style={{background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer'}}><Plus size={24} style={{transform: 'rotate(45deg)'}}/></button>
              </div>
              
              {modalError && <div style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef444440', padding: '0.75rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600}}>{modalError}</div>}

              <form onSubmit={handleAddStudent} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8}}>Official Name</label>
                  <div style={{position: 'relative'}}>
                    <GraduationCap size={18} style={{position: 'absolute', left: 14, top: 14, color: '#64748b'}}/>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', color: 'white', fontSize: '1rem'}} placeholder="Full legal name"/>
                  </div>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8}}>Email Identifier</label>
                  <div style={{position: 'relative'}}>
                    <Mail size={18} style={{position: 'absolute', left: 14, top: 14, color: '#64748b'}}/>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', color: 'white', fontSize: '1rem'}} placeholder="student@university.edu"/>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1.25rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8}}>Roll Number</label>
                    <input required type="text" value={formData.roll_no} onChange={e => setFormData({...formData, roll_no: e.target.value})} style={{width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', color: 'white'}} placeholder="e.g. CS2026-XP"/>
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8}}>Allotted Batch</label>
                    <div style={{position: 'relative'}}>
                        <Grid size={18} style={{position: 'absolute', left: 12, top: 14, color: '#64748b'}}/>
                        <input list="batch-suggestions" required type="text" value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} style={{width: '100%', padding: '0.85rem 1rem 0.85rem 2.5rem', borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', color: 'white'}} placeholder="Batch A"/>
                        <datalist id="batch-suggestions">
                            {[...new Set(students.map(s => s.batch))].filter(Boolean).map(b => <option key={b} value={b}/>)}
                        </datalist>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8}}>Initial Security Key</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{width: '100%', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #1e293b', background: '#0f172a', color: 'white'}} placeholder="Min 6 characters"/>
                </div>
                
                <div style={{display: 'flex', gap: '1.25rem', marginTop: '1.5rem'}}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{flex: 1, padding: '1rem'}}>Discard</button>
                  <button type="submit" className="btn-primary" style={{flex: 1, padding: '1rem'}} disabled={loading}>{loading ? 'Registering...' : 'Register Candidate'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Students;
