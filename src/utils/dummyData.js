export const dashboardStats = {
  attendancePercentage: 86.4,
  proxiesPrevented: 14,
  defaultersCount: 12,
  totalStudents: 340
};

export const attendanceTrends = [
  { name: 'Mon', attendance: 88, average: 85 },
  { name: 'Tue', attendance: 85, average: 85 },
  { name: 'Wed', attendance: 92, average: 85 },
  { name: 'Thu', attendance: 81, average: 85 },
  { name: 'Fri', attendance: 86, average: 85 }
];

export const subjectStats = [
  { subject: 'Advanced Algorithms', attendance: 74, total: 60 },
  { subject: 'System Design', attendance: 91, total: 60 },
  { subject: 'Machine Learning', attendance: 85, total: 60 },
  { subject: 'Database Systems', attendance: 88, total: 60 },
];

export const defaultersList = [
  { id: '101', name: 'Alex Johnson', roll: 'CS-042', percentage: 68, riskFactor: 'High', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '102', name: 'Samantha Lee', roll: 'CS-015', percentage: 72, riskFactor: 'Medium', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '103', name: 'Marcus Chen', roll: 'CS-088', percentage: 65, riskFactor: 'High', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '104', name: 'Emma Davis', roll: 'CS-112', percentage: 74, riskFactor: 'Low', avatar: 'https://i.pravatar.cc/150?u=4' },
];

export const recentAlerts = [
  { id: 1, type: 'proxy', message: 'Potential proxy detected in Room 402 (Rapid concurrent scans)', time: '10 mins ago' },
  { id: 2, type: 'warning', message: 'Alex Johnson crossed <75% threshold in Algorithms', time: '1 hour ago' },
  { id: 3, type: 'info', message: 'Machine learning mid-semester attendance report generated', time: '3 hours ago' }
];
