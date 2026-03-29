import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, X, QrCode, Calendar, MapPin } from 'lucide-react';
import DynamicQR from '../components/DynamicQR';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [mySubjectStats, setMySubjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [newClass, setNewClass] = useState({ name: '', schedule: '' });
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollSearch, setEnrollSearch] = useState('');
  const [qrModal, setQrModal] = useState({ show: false, classId: null, sessionId: null });

  const fetchClasses = async () => {
    try {
      const res = await apiFetch('/classes');
      if(res.ok) {
          const result = await res.json();
          setClasses(result.data || []);
      }
    } catch (e) {
      console.error("Fetch classes failed:", e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiFetch('/users/students');
      if(res.ok) {
          const result = await res.json();
          setStudents(result.data || []);
      }
    } catch(e) {}
  };

  const fetchMyStats = async () => {
    try {
      const res = await apiFetch('/attendance/stats');
      if (res.ok) {
        const data = await res.json();
        if (data?.subjectStats) {
          const map = {};
          data.subjectStats.forEach(s => { map[s.subject] = s.attendance; });
          setMySubjectStats(map);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await fetchClasses();
        if (user?.role !== 'student') {
          await fetchStudents();
        } else {
          await fetchMyStats();
        }
        setLoading(false);
    };
    if (user) init();
  }, [user?.role]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify(newClass)
      });
      if(res.ok) {
        setShowCreateModal(false);
        setNewClass({ name: '', schedule: '' });
        fetchClasses();
      } else {
        const data = await res.json();
        alert("Creation failed: " + data.error);
      }
    } catch(e) {
      alert("Network Error");
    }
  };

  const handleStartSession = async (cls) => {
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const body = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const res = await apiFetch(`/classes/${cls.id}/sessions`, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        if(res.ok) {
          const data = await res.json();
          setQrModal({ show: true, classId: cls.id, sessionId: data.session_id });
          fetchClasses(); 
        } else {
          alert('Failed to start session');
        }
      }, () => alert("Location required to start a session securely."));
    } catch(e) {}
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if(!enrollStudentId || !selectedClass) return;
    try {
      const res = await apiFetch(`/classes/${selectedClass.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ student_id: enrollStudentId })
      });
      if(res.ok) {
        setSelectedClass(null);
        setEnrollStudentId('');
        fetchClasses(); 
      } else {
        const data = await res.json();
        alert(data.error || "Failed to enroll");
      }
    } catch(e) {}
  };

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading Subjects...</div>;

  return (
    <div className="classes-container" style={{maxWidth: 1000, margin: '0 auto'}}>
      <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'}}>
        <div>
          <h1 className="dashboard-title">{user.role === 'student' ? 'Academic Roster' : 'Department Subjects'}</h1>
          <p className="dashboard-subtitle">Manage class schedules and real-time statistics.</p>
        </div>
        {user.role !== 'student' && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18}/> Create Subject
          </button>
        )}
      </header>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem'}}>
        {classes.map(cls => (
          <div key={cls.id} className="glass-panel" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', borderTop: `4px solid ${cls.active_session_id ? '#3b82f6' : 'transparent'}`}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <h3 style={{fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4}}>{cls.name}</h3>
                <span style={{fontSize: '0.8rem', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4}}>{cls.teacher_name}</span>
              </div>
              <div style={{background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '10px', color: '#3b82f6'}}>
                <BookOpen size={22} />
              </div>
            </div>
            
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem'}}>
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8}}>
                  <span style={{color: '#94a3b8'}}>{user.role === 'student' ? 'My Attendance Score' : 'Overall Statistics'}</span>
                  <span style={{fontWeight: 800, color: (() => {
                    const pct = user.role === 'student' ? (mySubjectStats[cls.name] ?? null) : (cls.totalStudents ? Math.round((cls.presentToday / cls.totalStudents) * 100) : 0);
                    return pct === null ? '#64748b' : pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                  })()}}>
                    {user.role === 'student' ? (mySubjectStats[cls.name] !== undefined ? `${mySubjectStats[cls.name]}%` : '—') : `${cls.totalStudents ? Math.round((cls.presentToday / cls.totalStudents) * 100) : 0}%`}
                  </span>
                </div>
                <div style={{height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden', border: '1px solid #334155'}}>
                  <div style={{height: '100%', width: `${user.role === 'student' ? (mySubjectStats[cls.name] ?? 0) : (cls.totalStudents ? Math.round((cls.presentToday / cls.totalStudents) * 100) : 0)}%`, background: '#3b82f6', transition: 'width 0.8s' }}></div>
                </div>
              </div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Calendar size={14}/> {cls.schedule ? new Date(cls.schedule).toLocaleString([], {weekday:'short', hour:'2-digit', minute:'2-digit'}) : 'No schedule'}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Users size={14}/> {cls.totalStudents} Enrolled Students</div>
            </div>

            {user.role !== 'student' && (
              <div style={{display: 'flex', gap: '10px', marginTop: '0.5rem'}}>
                <button 
                  onClick={() => setSelectedClass(cls)}
                  style={{flex: 1, padding: '10px', background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600}}
                >
                  Enroll User
                </button>
                <button 
                  onClick={() => cls.active_session_id ? setQrModal({show: true, classId: cls.id, sessionId: cls.active_session_id}) : handleStartSession(cls)}
                  style={{flex: 1, padding: '10px', background: cls.active_session_id ? '#1e293b' : '#3b82f6', border: cls.active_session_id ? '1px solid #3b82f6' :'none', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}
                >
                  <QrCode size={16}/> {cls.active_session_id ? 'Active Session' : 'Quick Start'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enroll Student Modal */}
      {selectedClass && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div className="glass-panel" style={{width: 450, padding: '2.5rem'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center'}}>
               <h2 style={{fontSize: '1.5rem', fontWeight: 800}}>Add to {selectedClass.name}</h2>
               <button onClick={() => setSelectedClass(null)} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'}}><X size={24}/></button>
             </div>
             
             <form onSubmit={handleEnroll} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
               <div>
                  <label style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600}}>Search Student</label>
                  <div style={{position: 'relative', marginTop: 6, marginBottom: 12}}>
                    <input 
                      type="text" 
                      placeholder="Type name or roll number..." 
                      value={enrollSearch}
                      onChange={e => setEnrollSearch(e.target.value)}
                      style={{width: '100%', padding: '0.8rem 1rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', fontSize: '0.9rem'}}
                    />
                  </div>
                  
                  <label style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600}}>Select Candidate</label>
                  <select required value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} style={{width: '100%', padding: '1rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 6, fontSize: '1rem'}}>
                    <option value="">-- {enrollSearch ? 'Found Matches' : 'Choose Candidate'} --</option>
                    {students
                      .filter(s => 
                        !enrollSearch || 
                        s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || 
                        s.roll_no.toLowerCase().includes(enrollSearch.toLowerCase())
                      )
                      .map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>)
                    }
                  </select>
               </div>
               <div style={{display: 'flex', gap: 10, marginTop: '1rem'}}>
                  <button type="button" onClick={() => setSelectedClass(null)} className="btn-secondary" style={{flex: 1}}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{flex: 1}}>Enroll Student</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {qrModal.show && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{position: 'relative', width: '100%', maxWidth: 450, display: 'flex', justifyContent: 'center'}}>
            <button onClick={() => setQrModal({show: false, classId: null, sessionId: null})} style={{position: 'absolute', top: -50, right: 0, background: '#ef4444', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><X size={24}/></button>
            <DynamicQR classId={qrModal.classId} sessionId={qrModal.sessionId} />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div className="glass-panel" style={{width: 450, padding: '2.5rem'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                 <h2 style={{fontSize: '1.5rem', fontWeight: 800}}>New Subject</h2>
                 <button onClick={() => setShowCreateModal(false)} style={{background: 'transparent', border: 'none', color: '#94a3b8'}}><X size={24}/></button>
             </div>
             <form onSubmit={handleCreateClass} style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
               <div>
                  <label style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600}}>Subject Title</label>
                  <input required type="text" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} style={{width: '100%', padding: '1rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 6, fontSize: '1rem'}} placeholder="e.g. Advanced AI & ML"/>
               </div>
               <div>
                  <label style={{fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600}}>Standard Schedule</label>
                  <input required type="datetime-local" value={newClass.schedule} onChange={e => setNewClass({...newClass, schedule: e.target.value})} style={{width: '100%', padding: '1rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 6, colorScheme: 'dark', fontSize: '1rem'}} />
               </div>
               <button type="submit" className="btn-primary" style={{marginTop: '1rem', padding: '1rem'}}>Confirm Subject Creation</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
