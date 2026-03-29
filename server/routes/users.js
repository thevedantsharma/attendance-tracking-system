import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyJWT, authorizeRoles } from '../middleware/auth.js';
import User from '../models/User.js';
import { ActivityLog, Enrollment, Attendance } from '../models/CoreModels.js';

const router = express.Router();

router.get('/students', [verifyJWT, authorizeRoles('admin', 'teacher')], async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password -faceDescriptor').lean();
    const formatted = students.map(s => ({...s, id: s._id}));
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

router.post('/students', [verifyJWT, authorizeRoles('admin', 'teacher')], async (req, res, next) => {
  const { name, email, roll_no, batch, photo_url, password, faceDescriptor } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password || 'student123', salt);
    
    const student = new User({
      name, email, password: hash, role: 'student',
      roll_no, batch, photo_url: photo_url || null,
      faceDescriptor: faceDescriptor ? JSON.stringify(faceDescriptor) : null
    });
    
    await student.save();
    await new ActivityLog({ user_id: req.user.id, action: `CREATED_STUDENT: ${name}` }).save();

    res.status(201).json({ success: true, id: student._id, message: 'Student created successfully' });
  } catch (err) {
    next(err);
  }
});

router.delete('/students/:id', [verifyJWT, authorizeRoles('admin')], async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    await Attendance.deleteMany({ student_id: req.params.id });
    await Enrollment.deleteMany({ student_id: req.params.id });
    await ActivityLog.deleteMany({ user_id: req.params.id });
    await User.deleteOne({ _id: req.params.id });
    
    await new ActivityLog({ user_id: req.user.id, action: `DELETED_STUDENT: ${student.name}` }).save();

    res.json({ success: true, message: 'Student and all associated records deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.put('/me/face', verifyJWT, async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;
    if (!faceDescriptor) return res.status(400).json({ success: false, error: 'Face descriptor is required' });
    
    await User.findByIdAndUpdate(req.user.id, { 
      faceDescriptor: JSON.stringify(faceDescriptor) 
    });
    
    await new ActivityLog({ user_id: req.user.id, action: 'FACE_REGISTERED' }).save();
    res.json({ success: true, message: 'Face descriptor saved successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', verifyJWT, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: { ...user, id: user._id } });
  } catch (err) {
    next(err);
  }
});

router.put('/profile', verifyJWT, async (req, res, next) => {
  try {
    const { name, email, phone, photo_url, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    await new ActivityLog({ user_id: req.user.id, action: 'UPDATED_PROFILE' }).save();
    
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
  }
});

export default router;