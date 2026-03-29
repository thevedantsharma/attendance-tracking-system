import express from 'express';
import { verifyJWT, authorizeRoles } from '../middleware/auth.js';
import User from '../models/User.js';
import { ActivityLog, Enrollment, Session, Attendance } from '../models/CoreModels.js';

const router = express.Router();

router.get('/logs', [verifyJWT, authorizeRoles('admin')], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('user_id', 'name role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ActivityLog.countDocuments();

    const formattedLogs = logs.map(l => ({
      ...l,
      name: l.user_id ? l.user_id.name : 'System',
      role: l.user_id ? l.user_id.role : 'system',
      user_id: l.user_id ? l.user_id._id : null
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reports', [verifyJWT, authorizeRoles('admin', 'teacher')], async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('name roll_no photo_url').lean();
    const reportData = [];
    
    for (const s of students) {
      const enrollments = await Enrollment.find({ student_id: s._id }).lean();
      const classIds = enrollments.map(e => e.class_id);
      
      const sessions = await Session.find({ class_id: { $in: classIds } }).lean();
      const sessionIds = sessions.map(se => se._id);

      const presentCount = await Attendance.countDocuments({ 
        student_id: s._id, 
        session_id: { $in: sessionIds }, 
        status: 'present' 
      });

      const totalSessions = sessions.length;
      const percentage = totalSessions === 0 ? 100 : Math.round((presentCount / totalSessions) * 100);
      const riskFactor = percentage < 75 ? 'High' : (percentage < 85 ? 'Medium' : 'Low');

      reportData.push({
        id: s._id,
        name: s.name,
        roll: s.roll_no,
        avatar: s.photo_url,
        percentage,
        riskFactor
      });
    }

    res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
});

export default router;
