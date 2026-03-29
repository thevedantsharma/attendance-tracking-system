import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const Reports = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user.role === 'student') {
        const res = await apiFetch('/attendance/stats');
        if (res.ok) {
          const result = await res.json();
          setMyStats(result);
        }
      } else {
        const res = await apiFetch('/admin/reports');
        if (res.ok) {
          const result = await res.json();
          setReportData(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user?.role]);

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading Reports...</div>;

  // ==== STUDENT VIEW ====
  if (user.role === 'student') {
    const overall = myStats?.attendancePercentage ?? null;
    const totalSessions = myStats?.totalClasses ?? 0;
    const totalPresent = myStats?.totalPresent ?? 0;
    const subjectStats = myStats?.subjectStats ?? [];
    const riskColor = overall === null ? '#6b7280' : overall >= 75 ? '#10b981' : overall >= 60 ? '#f59e0b' : '#ef4444';
    const riskLabel = overall === null ? '—' : overall >= 75 ? 'Good Standing' : overall >= 60 ? 'At Risk' : 'Critical';

    return (
      <div style={{maxWidth: 900, margin: '0 auto'}}>
        <header className="dashboard-header">
          <h1 className="dashboard-title">My Attendance Records</h1>
          <p className="dashboard-subtitle">A detailed breakdown of your academic attendance.</p>
        </header>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
          {[
            { label: 'Overall Attendance', value: overall !== null ? `${overall}%` : 'N/A', color: riskColor },
            { label: 'Sessions Attended', value: totalPresent, color: '#3b82f6' },
            { label: 'Total Sessions', value: totalSessions, color: '#f3f4f6' },
            { label: 'Status', value: riskLabel, color: riskColor }
          ].map(card => (
            <div key={card.label} className="glass-panel" style={{padding: '1.25rem'}}>
              <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6}}>{card.label}</div>
              <div style={{fontSize: '1.6rem', fontWeight: 700, color: card.color}}>{card.value}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{padding: '1.5rem'}}>
          <h3 style={{marginBottom: '1.25rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1}}>Detailed Subject Summary</h3>
          {subjectStats.length === 0 ? (
            <p style={{color: '#94a3b8', padding: '1rem 0'}}>No records found yet.</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              {subjectStats.map((s, i) => {
                const pct = s.attendance;
                const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                const StatusIcon = pct >= 75 ? CheckCircle2 : pct >= 60 ? AlertCircle : XCircle;
                return (
                  <div key={i} style={{display: 'flex', alignItems: 'center', gap: '1.25rem'}}>
                    <div style={{background: `${color}15`, padding: 8, borderRadius: 10}}>
                        <StatusIcon size={20} style={{color, flexShrink: 0}} />
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                        <span style={{fontWeight: 600, color: '#f8fafc'}}>{s.subject}</span>
                        <span style={{fontWeight: 700, color}}>{pct}%</span>
                      </div>
                      <div style={{height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden', border: '1px solid #334155'}}>
                        <div style={{height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: 4}} />
                      </div>
                    </div>
                    <div style={{padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, minWidth: 70, textAlign: 'center'}}>
                      {pct >= 75 ? 'PASS' : pct >= 60 ? 'WARN' : 'FAIL'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: 12, fontSize: '0.85rem', color: '#cbd5e1', border: '1px solid rgba(59,130,246,0.2)'}}>
            <strong style={{color: '#3b82f6'}}>Note:</strong> Attendance is tracked in real-time. Minimum required for examination eligibility is <span style={{color: '#ef4444', fontWeight: 600}}>75%</span>.
          </div>
        </div>
        <div className="glass-panel" style={{padding: '1.5rem', marginTop: '1.5rem'}}>
          <h3 style={{marginBottom: '1.25rem', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1}}>Attendance Log History</h3>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
              <thead>
                <tr style={{borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.8rem'}}>
                  <th style={{padding: '1rem 0.5rem'}}>SR NO.</th>
                  <th style={{padding: '1rem 0.5rem'}}>DATE & TIME</th>
                  <th style={{padding: '1rem 0.5rem'}}>LECTURE NAME</th>
                  <th style={{padding: '1rem 0.5rem'}}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {(myStats?.attendanceLogs || []).map((log, idx) => (
                  <tr key={log.id} style={{borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem'}}>
                    <td style={{padding: '1rem 0.5rem', color: '#94a3b8'}}>{idx + 1}</td>
                    <td style={{padding: '1rem 0.5rem', color: '#f1f5f9'}}>{log.date} | {log.time}</td>
                    <td style={{padding: '1rem 0.5rem', color: '#f1f5f9'}}>{log.subject}</td>
                    <td style={{padding: '1rem 0.5rem'}}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: '0.75rem',
                        background: log.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: log.status === 'present' ? '#10b981' : '#ef4444',
                        border: `1px solid ${log.status === 'present' ? '#10b98130' : '#ef444430'}`
                      }}>{log.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(myStats?.attendanceLogs || []).length === 0 && <div style={{padding: '2rem', textAlign: 'center', color: '#64748b'}}>No logs available.</div>}
          </div>
        </div>
      </div>
    );
  }

  // ==== ADMIN / TEACHER VIEW ====
  return (
    <div style={{maxWidth: 1000, margin: '0 auto'}}>
      <header className="dashboard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
        <div>
          <h1 className="dashboard-title">System Analytics</h1>
          <p className="dashboard-subtitle">Comprehensive institutional reports and data exports.</p>
        </div>
        <div style={{display: 'flex', gap: '0.75rem'}}>
          <button className="btn-secondary" onClick={() => {
            const tableData = reportData.filter(s => filter === 'all' || (filter === 'high' && s.percentage < 75)).map(s => ({
              "Student Name": s.name, "ID/Roll": s.roll, "Overall %": s.percentage, "Risk factor": s.riskFactor
            }));
            const worksheet = XLSX.utils.json_to_sheet(tableData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
            XLSX.writeFile(workbook, "AttendX_Report.xlsx");
          }} style={{display: 'flex', gap: 8, alignItems: 'center'}}><FileText size={16}/> Excel</button>
          
          <button className="btn-primary" onClick={() => {
            const doc = new jsPDF();
            doc.text("AttendX Institutional Report", 14, 15);
            const tableData = reportData.filter(s => filter === 'all' || (filter === 'high' && s.percentage < 75)).map(s => [
              s.name, s.roll, `${s.percentage}%`, s.riskFactor
            ]);
            doc.autoTable({
              head: [['Student Name', 'ID/Roll', 'Overall %', 'Risk factor']],
              body: tableData,
              startY: 20
            });
            doc.save("AttendX_Report.pdf");
          }} style={{display: 'flex', gap: 8, alignItems: 'center'}}><Download size={16}/> Export PDF</button>
        </div>
      </header>

      <div className="glass-panel" style={{padding: '1.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
          <div className="search-bar" style={{margin: 0, maxWidth: 350, background: '#0f172a', border: '1px solid #1e293b'}}>
            <Search size={18} className="search-icon" style={{color: '#64748b'}} />
            <input type="text" placeholder="Filter by name or roll number..." style={{color: 'white'}} />
          </div>
          
          <div style={{display: 'flex', gap: 10, background: '#0f172a', padding: 4, borderRadius: 10, border: '1px solid #1e293b'}}>
            <button 
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                background: filter === 'all' ? '#3b82f6' : 'transparent',
                color: filter === 'all' ? 'white' : '#94a3b8'
              }}
            >All Students</button>
            <button 
              onClick={() => setFilter('high')}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                background: filter === 'high' ? '#ef4444' : 'transparent',
                color: filter === 'high' ? 'white' : '#94a3b8'
              }}
            >Defaulters (&lt;75%)</button>
          </div>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #1e293b', color: '#94a3b8'}}>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Student Profile</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Roll Number</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Attendance</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Risk Level</th>
                <th style={{padding: '1.25rem 1rem', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reportData.filter(s => filter === 'all' || (filter === 'high' && s.percentage < 75)).map(student => (
                <tr key={student.id} style={{borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s'}}>
                  <td style={{padding: '1rem', display: 'flex', alignItems: 'center', gap: 12}}>
                    {student.avatar ? <img src={student.avatar} alt={student.name} style={{width: 38, height: 38, borderRadius: 10, objectFit: 'cover'}}/> : <div style={{width: 38, height: 38, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem'}}>{student.name.charAt(0)}</div>}
                    <span style={{fontWeight: 600, color: '#f1f5f9'}}>{student.name}</span>
                  </td>
                  <td style={{padding: '1rem', color: '#94a3b8'}}>{student.roll}</td>
                  <td style={{padding: '1rem', fontWeight: 700, color: student.percentage < 75 ? '#ef4444' : '#10b981'}}>{student.percentage}%</td>
                  <td style={{padding: '1rem'}}>
                    <span style={{
                      padding: '4px 12px', 
                      borderRadius: 12, 
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: student.riskFactor === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: student.riskFactor === 'High' ? '#ef4444' : '#10b981',
                      border: `1px solid ${student.riskFactor === 'High' ? '#ef444440' : '#10b98140'}`
                    }}>
                      {student.riskFactor.toUpperCase()}
                    </span>
                  </td>
                  <td style={{padding: '1rem'}}>
                    <button style={{color: '#3b82f6', background: 'transparent', border: 'none', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', hover: {textDecoration: 'underline'}}}>View History</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length === 0 && <div style={{padding: '3rem', textAlign: 'center', color: '#64748b'}}>No student data records available.</div>}
        </div>
      </div>
    </div>
  );
};

export default Reports;
