import React, { useState, useEffect } from 'react';
import { Calendar, User, Book, Users, Check, X, RotateCcw } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AttendanceMarking = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [yearSession, setYearSession] = useState('2025-2026');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherName, setTeacherName] = useState(user?.name || '');
  const [topicCovered, setTopicCovered] = useState('');
  const [showMarkingBox, setShowMarkingBox] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'present' | 'absent' | 'na' }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const res = await apiFetch('/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.data || []);
      }
    };
    fetchClasses();
  }, []);

  const handleViewStudents = async () => {
    if (!selectedClassId) {
      alert("Please select a subject first.");
      return;
    }
    setLoading(true);
    try {
      // Fetch students enrolled in this class
      // Assume classes endpoint returns students or we have an endpoint for this.
      // From previous exploration, I saw classes have totalStudents. 
      // I'll fetch students for the class.
      const res = await apiFetch(`/users/students?class_id=${selectedClassId}`);
      if (res.ok) {
        const data = await res.json();
        const studentList = data.data || [];
        setStudents(studentList);
        
        // Initialize records
        const initial = {};
        studentList.forEach(s => {
          initial[s.id] = 'present'; // Default to present
        });
        setAttendanceRecords(initial);
        setShowMarkingBox(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const setAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setAttendanceRecords(updated);
  };

  const resetAll = () => {
    const updated = {};
    students.forEach(s => { updated[s.id] = 'present'; });
    setAttendanceRecords(updated);
  };

  const getCounts = () => {
    const vals = Object.values(attendanceRecords);
    return {
      present: vals.filter(v => v === 'present').length,
      absent: vals.filter(v => v === 'absent').length,
      total: students.length
    };
  };

  const handleSave = async () => {
    const counts = getCounts();
    if (counts.total === 0) return;

    try {
      const attendance_data = Object.entries(attendanceRecords).map(([id, status]) => ({
        student_id: id,
        status: status === 'na' ? 'absent' : status // backend might not support 'na'
      }));

      const body = {
        class_id: selectedClassId,
        date: attendanceDate,
        teacher_name: teacherName,
        topic: topicCovered,
        year_session: yearSession,
        attendance_data
      };

      const res = await apiFetch('/attendance/batch-mark', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert("Attendance saved successfully!");
        setShowMarkingBox(false);
        setTopicCovered('');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save attendance");
      }
    } catch (e) {
      alert("Error saving attendance");
    }
  };

  const counts = getCounts();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: '4rem' }}>
      <header className="dashboard-header">
        <h1 className="dashboard-title">Manual Attendance Entry</h1>
        <p className="dashboard-subtitle">Record and manage attendance for your class sessions.</p>
      </header>

      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group">
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Year Session</label>
          <select 
            value={yearSession} 
            onChange={e => setYearSession(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 8 }}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Attendance Date</label>
          <input 
            type="date" 
            value={attendanceDate} 
            onChange={e => setAttendanceDate(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 8, colorScheme: 'dark' }}
          />
        </div>

        <div className="form-group">
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Subject / Class</label>
          <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 8 }}
          >
            <option value="">Select Subject</option>
            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Teacher Name</label>
          <input 
            type="text" 
            value={teacherName} 
            onChange={e => setTeacherName(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 8 }}
            placeholder="Enter teacher name"
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Topic Covered</label>
          <input 
            type="text" 
            value={topicCovered} 
            onChange={e => setTopicCovered(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 10, background: '#0f172a', color: 'white', border: '1px solid #1e293b', marginTop: 8 }}
            placeholder="e.g. Introduction to Neural Networks"
          />
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleViewStudents}
            disabled={loading}
            style={{ 
              padding: '1rem 3rem', 
              fontSize: '1rem', 
              transition: 'all 0.3s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Fetching Students...' : 'View Student'}
          </button>
        </div>
      </div>

      {showMarkingBox && (
        <div className="glass-panel" style={{ padding: '2rem', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Student Attendance List</h2>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: 8 }}>
                 <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Present: {counts.present}</span>
                 <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Absent: {counts.absent}</span>
                 <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Total: {counts.total}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setAll('present')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>All Present</button>
              <button onClick={() => setAll('absent')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>All Absent</button>
              <button onClick={resetAll} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#94a3b8' }}><RotateCcw size={14}/> Reset</button>
            </div>
          </div>

          <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #1e293b', borderRadius: 12, marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#1a1d2d', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.75rem' }}>
                  <th style={{ padding: '1rem' }}>SR NO.</th>
                  <th style={{ padding: '1rem' }}>STUDENT ID</th>
                  <th style={{ padding: '1rem' }}>FULL NAME</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>ATTENDANCE</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '1rem', color: '#f1f5f9', fontWeight: 600 }}>{student.roll_no}</td>
                    <td style={{ padding: '1rem', color: '#f1f5f9' }}>{student.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        {['present', 'absent', 'na'].map(status => (
                          <label key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: attendanceRecords[student.id] === status ? 1 : 0.4, transition: '0.2s' }}>
                            <input 
                              type="radio" 
                              name={`attn-${student.id}`} 
                              checked={attendanceRecords[student.id] === status} 
                              onChange={() => handleStatusChange(student.id, status)}
                              style={{ accentColor: status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#94a3b8' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{status.charAt(0).toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button onClick={() => setShowMarkingBox(false)} className="btn-secondary">Cancel</button>
             <button onClick={handleSave} className="btn-primary" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>Save Attendance</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-group { display: flex; flexDirection: column; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4); }
      `}</style>
    </div>
  );
};

export default AttendanceMarking;
