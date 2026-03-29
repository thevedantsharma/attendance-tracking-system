import { Session, Attendance, ActivityLog, Enrollment, Class } from '../models/CoreModels.js';
import User from '../models/User.js';
import { verifyQRToken, generateQRToken } from '../utils/cryptoUtils.js';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
};

export const markAttendance = async (req, res, next) => {
  try {
    const { session_id, method, coords, qr_token } = req.body;
    
    if (method === 'qr') {
      if (!qr_token) throw new Error('QR Token is required for QR attendance');
      const decoded = verifyQRToken(qr_token);
      if (!decoded || decoded.sessionId !== session_id) {
        throw new Error('Invalid or Expired QR Code');
      }
    }
    
    const session = await Session.findById(session_id);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    let distance = null;
    if (coords && session.lat && session.lng) {
      distance = getDistance(session.lat, session.lng, coords.latitude, coords.longitude);
      if (distance > 100) {
        await new ActivityLog({ user_id: req.user.id, action: 'GEOFENCE_VIOLATION', metadata: { distance, session: session_id } }).save();
        const err = new Error('You are too far from the classroom');
        err.statusCode = 403;
        throw err;
      }
    }

    const existing = await Attendance.findOne({ session_id, student_id: req.user.id });
    if (existing) {
      const err = new Error('Attendance already marked for this session');
      err.statusCode = 400;
      throw err;
    }

    const attendance = new Attendance({
      session_id, 
      student_id: req.user.id, 
      status: 'present', 
      method, 
      distance_meters: distance
    });
    await attendance.save();

    await new ActivityLog({ user_id: req.user.id, action: `ATTENDANCE_MARKED_${method.toUpperCase()}`, metadata: { session: session_id } }).save();

    res.json({ success: true, message: 'Attendance recorded successfully', distance });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const getLast7Days = () => {
      const dates = [];
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    };
    const dates = getLast7Days();
    
    if(req.user.role === 'student') {
      const enrollments = await Enrollment.find({ student_id: req.user.id }).populate('class_id', 'name');
      const classIds = enrollments.map(e => e.class_id ? e.class_id._id : null).filter(Boolean);
      
      const sessions = await Session.find({ class_id: { $in: classIds } });
      const sessionIds = sessions.map(s => s._id);

      const attendances = await Attendance.find({ student_id: req.user.id, session_id: { $in: sessionIds } });
      const presentCount = attendances.filter(a => a.status === 'present').length;
      const proxyCount = attendances.filter(a => a.status === 'proxy_suspected').length;
      
      const trends = dates.map(date => {
        const daySessions = sessions.filter(s => s.date === date);
        if(daySessions.length === 0) return { name: new Date(date).toLocaleDateString('en-US', {weekday:'short'}), attendance: 100, average: 100 };
        
        const daySessionIds = daySessions.map(s => s._id.toString());
        const dayAttended = attendances.filter(a => daySessionIds.includes(a.session_id.toString()) && a.status === 'present').length;
        
        return {
          name: new Date(date).toLocaleDateString('en-US', {weekday:'short'}),
          attendance: Math.round((dayAttended / (daySessions.length || 1)) * 100),
          average: 75
        };
      });

      const subjectStats = enrollments.map(e => {
        if(!e.class_id) return null;
        const subSessions = sessions.filter(s => s.class_id.toString() === e.class_id._id.toString());
        const subAttended = attendances.filter(a => subSessions.map(s => s._id.toString()).includes(a.session_id.toString()) && a.status === 'present').length;
        return {
          subject: e.class_id.name,
          attendance: subSessions.length ? Math.round((subAttended / subSessions.length) * 100) : 100
        };
      }).filter(Boolean);
      
      const logs = sessions.map(s => {
        const attendance = attendances.find(a => a.session_id.toString() === s._id.toString());
        return {
          id: s._id,
          date: s.date,
          time: attendance ? attendance.created_at.toTimeString().split(' ')[0] : '—',
          subject: enrollments.find(e => e.class_id && e.class_id._id.toString() === s.class_id.toString())?.class_id.name || 'Unknown',
          status: attendance ? attendance.status : 'absent'
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      return res.json({
        success: true,
        totalClasses: sessionIds.length,
        totalPresent: presentCount,
        totalDefaulters: 0, 
        proxiesPrevented: proxyCount,
        attendancePercentage: sessionIds.length ? Math.round((presentCount / sessionIds.length) * 100) : 100,
        trends,
        subjectStats,
        attendanceLogs: logs,
        defaultersList: []
      });
    }

    let classFilter = {};
    if (req.user.role === 'teacher') {
      const myClasses = await Class.find({ teacher_id: req.user.id });
      classFilter = { class_id: { $in: myClasses.map(c => c._id) } };
    }
    
    const sessions = await Session.find(classFilter);
    const sessionIds = sessions.map(s => s._id);
    const allAttendances = await Attendance.find({ session_id: { $in: sessionIds } });
    
    const presents = allAttendances.filter(a => a.status === 'present').length;
    const proxyAttempts = allAttendances.filter(a => a.status === 'proxy_suspected').length;
    
    let totalPossible = 0;
    for (const s of sessions) {
      const eCount = await Enrollment.countDocuments({ class_id: s.class_id });
      totalPossible += eCount;
    }

    const trends = dates.map(date => {
      const daySessions = sessions.filter(s => s.date === date).map(s => s._id.toString());
      if(daySessions.length === 0) return { name: new Date(date).toLocaleDateString('en-US', {weekday:'short'}), attendance: 100, average: 100 };
      
      const dayAttended = allAttendances.filter(a => daySessions.includes(a.session_id.toString()) && a.status === 'present').length;
      return {
        name: new Date(date).toLocaleDateString('en-US', {weekday:'short'}),
        attendance: Math.round((dayAttended / (daySessions.length * 30 || 1)) * 100) || 85,
        average: 80
      };
    });

    const subjectStats = await Promise.all(sessions.map(async (s) => {
      const cls = await Class.findById(s.class_id);
      const sAtt = allAttendances.filter(a => a.session_id.toString() === s._id.toString() && a.status === 'present').length;
      const sTotal = await Enrollment.countDocuments({ class_id: s.class_id });
      return {
        subject: cls ? cls.name : 'Unknown',
        attendance: sTotal ? Math.round((sAtt / sTotal) * 100) : 100
      };
    }));

    // Grouping by subject and averaging
    const groupedStats = {};
    subjectStats.forEach(s => {
      if(!groupedStats[s.subject]) groupedStats[s.subject] = { sum: 0, count: 0 };
      groupedStats[s.subject].sum += s.attendance;
      groupedStats[s.subject].count += 1;
    });
    
    const finalSubjectStats = Object.keys(groupedStats).map(name => ({
      subject: name,
      attendance: Math.round(groupedStats[name].sum / groupedStats[name].count)
    }));

    res.json({
      success: true,
      totalClasses: sessions.length,
      totalPresent: presents,
      totalDefaulters: 0, 
      proxiesPrevented: proxyAttempts,
      attendancePercentage: totalPossible ? Math.round((presents / totalPossible) * 100) : 100,
      trends,
      subjectStats: finalSubjectStats.length ? finalSubjectStats : [{ subject: 'No Sessions', attendance: 100 }],
      defaultersList: []
    });
  } catch (err) {
    next(err);
  }
};

export const generateQR = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const session = await Session.findById(session_id);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    const qrToken = generateQRToken(session_id);
    res.json({ success: true, qr_token: qrToken });
  } catch (error) {
    next(error);
  }
};

export const markBatchAttendance = async (req, res, next) => {
  try {
    const { session_id, attendance_data, teacher_name, topic } = req.body;
    
    // Find the session (or create if needed - though usually already exists)
    let session = await Session.findById(session_id);
    if (!session) {
       const { class_id, date } = req.body;
       session = await Session.findOne({ class_id, date });
       if (!session) {
         session = new Session({ class_id, date });
         await session.save();
       }
    }

    // Update Activity Log for the teacher action
    await new ActivityLog({ 
      user_id: req.user.id, 
      action: 'BATCH_ATTENDANCE_SAVED', 
      metadata: { session: session._id, teacher: teacher_name, topic } 
    }).save();

    for (const record of attendance_data) {
      await Attendance.findOneAndUpdate(
        { session_id: session._id, student_id: record.student_id },
        { 
          status: record.status, 
          method: 'manual' 
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Batch attendance updated successfully' });
  } catch (error) {
    next(error);
  }
};
