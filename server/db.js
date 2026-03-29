import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { Class, Enrollment, Session } from './models/CoreModels.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default instances if system is empty
    const adminCount = await User.countDocuments({ email: 'admin@school.com' });
    if (adminCount === 0) {
      console.log("Seeding Database...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      const admin = await User.create({ name: 'System Admin', email: 'admin@school.com', password: hash, role: 'admin' });
      
      const teacherHash = await bcrypt.hash('teacher123', salt);
      const teacher = await User.create({ name: 'John Teacher', email: 'teacher@school.com', password: teacherHash, role: 'teacher' });
      
      const studentHash = await bcrypt.hash('student123', salt);
      const student = await User.create({ name: 'Alice Student', email: 'student@school.com', password: studentHash, role: 'student', roll_no: 'CS2026-01', batch: 'Batch A' });

      const newClass = await Class.create({ name: 'Computer Science 101', teacher_id: teacher._id, schedule: '2026-03-24T10:00' });
      await Enrollment.create({ student_id: student._id, class_id: newClass._id });

      const today = new Date().toISOString().split('T')[0];
      await Session.create({ class_id: newClass._id, lat: 37.7749, lng: -122.4194, date: today });
      console.log("Seeding Complete!");
    }
  } catch(e) {
    console.error("MongoDB Connection Error:", e.message);
    process.exit(1);
  }
};

export default connectDB;
