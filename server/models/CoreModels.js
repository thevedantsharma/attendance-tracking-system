import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: String,
  created_at: { type: Date, default: Date.now }
});

const EnrollmentSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  created_at: { type: Date, default: Date.now }
});
EnrollmentSchema.index({ student_id: 1, class_id: 1 }, { unique: true });

const SessionSchema = new mongoose.Schema({
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  lat: Number,
  lng: Number,
  date: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const AttendanceSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['present', 'absent', 'proxy_suspected'], required: true },
  method: { type: String, enum: ['face', 'qr', 'manual'], required: true },
  distance_meters: Number,
  created_at: { type: Date, default: Date.now }
});
AttendanceSchema.index({ session_id: 1, student_id: 1 }, { unique: true });

const ActivityLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
});

export const Class = mongoose.model('Class', ClassSchema);
export const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
export const Session = mongoose.model('Session', SessionSchema);
export const Attendance = mongoose.model('Attendance', AttendanceSchema);
export const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
