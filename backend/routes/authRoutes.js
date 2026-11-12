import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
const email = body('email').isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false });

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    email,
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);
router.post('/login', [email, body('password').notEmpty().withMessage('Password is required')], validate, login);
router.get('/me', protect, me);

export default router;
