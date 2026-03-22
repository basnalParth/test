import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, email, password } = req.body as { name: string; email: string; password: string };

      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }

      const user = new User({ name, email, password });
      await user.save();

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' });

      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body as { email: string; password: string };

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '7d' });

      res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;
