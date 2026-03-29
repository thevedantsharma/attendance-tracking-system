import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  roll_no: String,
  batch: String,
  photo_url: String,
  faceDescriptor: String,
  refresh_token: String,
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
export default User;
