import express from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, logout, refresh } from '../controllers/authController.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'teacher', 'student']).withMessage('Invalid role'),
  validate,
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], login);

router.post('/logout', logout);
router.post('/refresh', refresh);

export default router;
