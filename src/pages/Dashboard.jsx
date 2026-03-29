import React from 'react';
import { 
  Users, UserCheck, ShieldAlert, AlertTriangle, TrendingUp 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    totalPresent: 0, totalClasses: 0, trends: [], attendancePercentage: 0, defaultersCount: 0, proxiesPrevented: 0, subjectStats: [], defaultersList: []
  });
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const statsRes = await apiFetch('/attendance/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            ...data,
            attendancePercentage: data.attendancePercentage || 0,
            defaultersCount: data.totalDefaulters || 0, 
            proxiesPrevented: data.proxiesPrevented || 0,
            subjectStats: data.subjectStats || [],
            defaultersList: data.defaultersList || []
          });
        }

        if (user.role === 'admin') {
          const logsRes = await apiFetch('/admin/logs?limit=10');
          if(logsRes.ok) {
            const logsData = await logsRes.json();
            setLogs(logsData.data || []);
          }
        }
      } catch (error) {
        console.error("Failed fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user?.role]);

  if (loading) return <div className="dashboard-container"><div style={{padding: '2rem', textAlign: 'center'}}>Loading Dashboard...</div></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="dashboard-container"
    >
      <header className="dashboard-header">
        <h1 className="dashboard-title">{user.role === 'student' ? `Welcome, ${user.name?.split(' ')[0]} 👋` : 'System Analytics Overview'}</h1>
        <p className="dashboard-subtitle">{user.role === 'student' ? 'Track your presence and stay on top of your schedule.' : 'Real-time institutional performance metrics.'}</p>
      </header>

      {user.role === 'student' && (
        <div className="glass-panel" style={{padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: `6px solid ${stats.attendancePercentage >= 75 ? '#10b981' : stats.attendancePercentage >= 60 ? '#f59e0b' : '#ef4444'}`}}>
          <div>
            <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: 2}}>Student ID Card</div>
            <div style={{fontWeight: 700, fontSize: '1.2rem', color: '#f8fafc'}}>{user.name}</div>
            <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: 2}}>{user.email}</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: '2.5rem', fontWeight: 800, color: stats.attendancePercentage >= 75 ? '#10b981' : stats.attendancePercentage >= 60 ? '#f59e0b' : '#ef4444'}}>{stats.attendancePercentage}%</div>
            <div style={{fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1}}>Overall Score</div>
          </div>
          <div style={{padding: '8px 20px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', background: stats.attendancePercentage >= 75 ? 'rgba(16,185,129,0.1)' : stats.attendancePercentage >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: stats.attendancePercentage >= 75 ? '#10b981' : stats.attendancePercentage >= 60 ? '#f59e0b' : '#ef4444', border: `1px solid ${stats.attendancePercentage >= 75 ? '#10b98140' : stats.attendancePercentage >= 60 ? '#f59e0b40' : '#ef444440'}`}}>
            {stats.attendancePercentage >= 75 ? 'ELIGIBLE' : stats.attendancePercentage >= 60 ? 'WARNING' : 'INELIGIBLE'}
          </div>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span>Average Attendance</span>
            <div className="stat-icon-wrapper" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                <UserCheck size={20} className="stat-icon" style={{color: '#3b82f6'}} />
            </div>
          </div>
          <div className="stat-value">{stats.attendancePercentage}%</div>
          <div className="stat-subtext positive">
            <TrendingUp size={14} /> +2.4% vs last term
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span>Security Flags</span>
            <div className="stat-icon-wrapper" style={{background: 'rgba(245, 158, 11, 0.1)'}}>
                <ShieldAlert size={20} className="stat-icon" style={{color: '#f59e0b'}} />
            </div>
          </div>
          <div className="stat-value">{stats.proxiesPrevented}</div>
          <div className="stat-subtext">Attempts Blocked</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span>Critical Deficits</span>
            <div className="stat-icon-wrapper" style={{background: 'rgba(239, 68, 68, 0.1)'}}>
                <AlertTriangle size={20} className="stat-icon" style={{color: '#ef4444'}} />
            </div>
          </div>
          <div className="stat-value">{stats.defaultersCount}</div>
          <div className="stat-subtext negative">Below 75% Limit</div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span>Active Classes</span>
            <div className="stat-icon-wrapper" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                <Users size={20} className="stat-icon" style={{color: '#10b981'}} />
            </div>
          </div>
          <div className="stat-value">{stats.totalClasses}</div>
          <div className="stat-subtext">Current Semester</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="charts-column">
          <div className="chart-panel glass-panel">
            <h3>Attendance Progress</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[0, 100]} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} 
                  />
                  <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="average" stroke="#64748b" strokeDasharray="6 6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-panel glass-panel">
            <h3>Subject Performance</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" domain={[0, 100]} tick={{fontSize: 12}} hide />
                  <YAxis dataKey="subject" type="category" stroke="#f1f5f9" width={100} tickLine={false} axisLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  />
                  <Bar dataKey="attendance" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="list-column">
          {user.role === 'admin' ? (
            <motion.div className="list-panel glass-panel">
              <h3 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  System Logs
                  <span style={{fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 10}}>LIVE</span>
              </h3>
              <div className="defaulters-list" style={{maxHeight: 480, overflowY: 'auto'}}>
                {logs.length === 0 && <p style={{color: '#64748b', textAlign: 'center', padding: '2rem'}}>No recent system activity.</p>}
                {logs.map((log, idx) => (
                  <div key={idx} className="defaulter-item" style={{borderLeft: '2px solid #3b82f630', background: 'rgba(255,255,255,0.01)'}}>
                    <div className="defaulter-info">
                      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <strong style={{color: '#f1f5f9', fontSize: '0.9rem'}}>{log.name}</strong>
                        <span style={{fontSize: '0.7rem', color: '#64748b'}}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: 4}}>{log.action.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div className="list-panel glass-panel">
                <h3>Top Performers</h3>
                <div style={{color: '#64748b', marginBottom: 15, fontSize: '0.85rem'}}>Students with 100% attendance this month.</div>
                <div className="defaulters-list">
                  <div className="defaulter-item" style={{background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)'}}>
                    <div style={{fontSize: 24}}>🏆</div>
                    <div className="defaulter-info">
                      <div className="defaulter-name" style={{color: '#f59e0b'}}>Sarah Chen</div>
                      <div className="defaulter-roll" style={{color: '#94a3b8'}}>CS-2026 Dept.</div>
                    </div>
                    <div style={{color: '#f59e0b', fontWeight: 800}}>100%</div>
                  </div>
                  <div className="defaulter-item">
                    <div style={{fontSize: 24}}>⭐</div>
                    <div className="defaulter-info">
                      <div className="defaulter-name">Marcus Aurelius</div>
                      <div className="defaulter-roll">History Dept.</div>
                    </div>
                    <div style={{color: '#10b981', fontWeight: 800}}>99%</div>
                  </div>
                </div>
              </motion.div>

              <div className="list-panel glass-panel">
                <h3>Defaulters Alert</h3>
                <div className="defaulters-list">
                  {stats.defaultersList.length === 0 && <p style={{color: '#64748b', fontSize: '0.85rem'}}>No defaulters found. Great job!</p>}
                  {stats.defaultersList.map(student => (
                    <div key={student.id} className="defaulter-item" style={{borderLeft: `3px solid ${student.percentage < 60 ? '#ef4444' : '#f59e0b'}`}}>
                      <div className="defaulter-info">
                        <div className="defaulter-name">{student.name}</div>
                        <div className="defaulter-roll">{student.roll}</div>
                      </div>
                      <div className={`defaulter-risk risk-${student.riskFactor}`} style={{fontWeight: 700}}>
                        {student.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '1.25rem', padding: '10px' }}>Generate Alert Reports</button>
              </div>
            </>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default Dashboard;
