import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getDb } from '../db';

interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const router = Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

const sanitizeEmail = (email: string): string => email.trim().toLowerCase();

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
      const normalizedEmail = sanitizeEmail(email);
      const db = await getDb();

      const existing = await db.get<DbUser>('SELECT * FROM users WHERE email = ?', normalizedEmail);
      if (existing) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }

      const now = new Date().toISOString();
      const userId = randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);

      await db.run(
        'INSERT INTO users (id, name, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        userId,
        name.trim(),
        normalizedEmail,
        passwordHash,
        now,
        now
      );

      const secret = getJwtSecret();
      const token = jwt.sign({ userId }, secret, { expiresIn: '7d' });

      res.status(201).json({ token, user: { id: userId, name: name.trim(), email: normalizedEmail } });
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
      const normalizedEmail = sanitizeEmail(email);
      const db = await getDb();

      const user = await db.get<DbUser>('SELECT * FROM users WHERE email = ?', normalizedEmail);
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const secret = getJwtSecret();
      const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;
