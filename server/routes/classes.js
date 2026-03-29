import express from 'express';
import { verifyJWT, authorizeRoles } from '../middleware/auth.js';
import User from '../models/User.js';
import { Class, Enrollment, Session, Attendance } from '../models/CoreModels.js';

const router = express.Router();

router.get('/', verifyJWT, async (req, res, next) => {
  try {
    let classes = [];
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher_id: req.user.id }).populate('teacher_id', 'name').lean();
    } else if (req.user.role === 'admin') {
      classes = await Class.find().populate('teacher_id', 'name').lean();
    } else {
      const enrollments = await Enrollment.find({ student_id: req.user.id }).lean();
      const classIds = enrollments.map(e => e.class_id);
      classes = await Class.find({ _id: { $in: classIds } }).populate('teacher_id', 'name').lean();
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const enrichedClasses = await Promise.all(classes.map(async (c) => {
      const enrolledCount = await Enrollment.countDocuments({ class_id: c._id });
      const session = await Session.findOne({ class_id: c._id, date: today });
      let presentCount = 0;
      if (session) {
        presentCount = await Attendance.countDocuments({ session_id: session._id, status: "present" });
      }

      return { 
        ...c, 
        id: c._id,
        teacher_name: c.teacher_id ? c.teacher_id.name : 'Unknown',
        totalStudents: enrolledCount, 
        presentToday: presentCount,
        active_session_id: session ? session._id : null
      };
    }));

    res.json({ success: true, data: enrichedClasses });
  } catch (error) {
    next(error);
  }
});

router.post('/', [verifyJWT, authorizeRoles('teacher', 'admin')], async (req, res, next) => {
  try {
    const { name, schedule, teacher_id } = req.body;
    const targetTeacher = req.user.role === 'teacher' ? req.user.id : (teacher_id || req.user.id);
    
    const newClass = new Class({ name, teacher_id: targetTeacher, schedule });
    await newClass.save();
    res.status(201).json({ success: true, id: newClass._id, message: 'Class created successfully' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/enroll', [verifyJWT, authorizeRoles('teacher', 'admin')], async (req, res, next) => {
  try {
    const { student_id } = req.body;
    const existing = await Enrollment.findOne({ student_id, class_id: req.params.id });
    if(existing) return res.status(400).json({ success: false, error: 'Already enrolled' });

    const enrollment = new Enrollment({ student_id, class_id: req.params.id });
    await enrollment.save();
    res.json({ success: true, message: 'Student successfully enrolled' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/sessions', [verifyJWT, authorizeRoles('teacher', 'admin')], async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const existing = await Session.findOne({ class_id: req.params.id, date: today });
    if (existing) {
      if(lat && lng) {
        existing.lat = lat; 
        existing.lng = lng;
        await existing.save();
      }
      return res.json({ success: true, message: 'Session already active today', session_id: existing._id });
    }

    const session = new Session({ class_id: req.params.id, lat, lng, date: today });
    await session.save();
    res.status(201).json({ success: true, message: 'Session started successfully', session_id: session._id });
  } catch (e) {
    next(e);
  }
});

export default router;
