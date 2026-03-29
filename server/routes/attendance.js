import express from 'express';
import { verifyJWT, authorizeRoles } from '../middleware/auth.js';
import { markAttendance, getStats, generateQR, markBatchAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/mark', verifyJWT, markAttendance);
router.post('/batch-mark', [verifyJWT, authorizeRoles('teacher', 'admin')], markBatchAttendance);
router.get('/stats', verifyJWT, getStats);
router.get('/generate-qr/:session_id', [verifyJWT, authorizeRoles('teacher', 'admin')], generateQR);

// Ported older records route
import { Session, Attendance } from '../models/CoreModels.js';
router.get('/class/:classId', verifyJWT, async (req, res, next) => {
  try {
    const sessions = await Session.find({ class_id: req.params.classId });
    const sessionIds = sessions.map(s => s._id);
    
    let records = [];
    if(req.user.role === 'student') {
      records = await Attendance.find({ session_id: { $in: sessionIds }, student_id: req.user.id }).populate('session_id', 'date').lean();
    } else {
      records = await Attendance.find({ session_id: { $in: sessionIds } }).populate('student_id', 'name roll_no').populate('session_id', 'date').lean();
    }
    
    const formatted = records.map(r => ({
      ...r,
      student_name: r.student_id ? r.student_id.name : 'Unknown',
      date: r.session_id ? r.session_id.date : 'Unknown Date'
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

export default router;
