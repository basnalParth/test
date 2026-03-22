import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb } from '../db';

interface DbBudget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

const router = Router();

const mapBudget = (budget: DbBudget) => ({
  _id: budget.id,
  userId: budget.userId,
  category: budget.category,
  limit: budget.limitAmount,
  month: budget.month,
  year: budget.year,
  createdAt: budget.createdAt,
  updatedAt: budget.updatedAt,
});

// All routes require authentication
router.use(authenticate);

// GET /api/budgets
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query as Record<string, string>;
    const db = await getDb();

    const conditions: string[] = ['userId = ?'];
    const params: Array<string | number> = [req.userId ?? ''];
    if (month) {
      conditions.push('month = ?');
      params.push(Number(month));
    }
    if (year) {
      conditions.push('year = ?');
      params.push(Number(year));
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const budgets = await db.all<DbBudget[]>(
      `SELECT * FROM budgets ${whereClause} ORDER BY year DESC, month DESC`,
      params
    );
    res.json(budgets.map(mapBudget));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// POST /api/budgets
router.post(
  '/',
  [
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('limit').isFloat({ min: 0 }).withMessage('Limit must be a non-negative number'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year').isInt({ min: 2000 }).withMessage('Year must be 2000 or later'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { category, limit, month, year } = req.body as {
        category: string;
        limit: number;
        month: number;
        year: number;
      };

      const now = new Date().toISOString();
      const budgetId = randomUUID();
      const db = await getDb();

      await db.run(
        `INSERT INTO budgets (id, userId, category, limitAmount, month, year, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId, category, month, year)
         DO UPDATE SET limitAmount = excluded.limitAmount, updatedAt = excluded.updatedAt`,
        budgetId,
        req.userId ?? '',
        category.trim(),
        limit,
        month,
        year,
        now,
        now
      );

      const budget = await db.get<DbBudget>(
        'SELECT * FROM budgets WHERE userId = ? AND category = ? AND month = ? AND year = ?',
        req.userId ?? '',
        category.trim(),
        month,
        year
      );

      if (!budget) {
        res.status(500).json({ error: 'Failed to save budget' });
        return;
      }

      res.status(201).json(mapBudget(budget));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save budget' });
    }
  }
);

// GET /api/budgets/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const budget = await db.get<DbBudget>(
      'SELECT * FROM budgets WHERE id = ? AND userId = ?',
      req.params.id,
      req.userId ?? ''
    );
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json(mapBudget(budget));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT /api/budgets/:id
router.put(
  '/:id',
  [
    body('category').if(body('category').exists()).trim().notEmpty().withMessage('Category cannot be empty'),
    body('limit').optional().isFloat({ min: 0 }).withMessage('Limit must be a non-negative number'),
    body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year').optional().isInt({ min: 2000 }).withMessage('Year must be 2000 or later'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { category, limit, month, year } = req.body as {
        category?: string;
        limit?: number;
        month?: number;
        year?: number;
      };

      const fields: string[] = [];
      const params: Array<string | number> = [];
      if (category !== undefined) {
        fields.push('category = ?');
        params.push(category.trim());
      }
      if (limit !== undefined) {
        fields.push('limitAmount = ?');
        params.push(limit);
      }
      if (month !== undefined) {
        fields.push('month = ?');
        params.push(month);
      }
      if (year !== undefined) {
        fields.push('year = ?');
        params.push(year);
      }

      fields.push('updatedAt = ?');
      params.push(new Date().toISOString());

      const db = await getDb();
      const result = await db.run(
        `UPDATE budgets SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
        ...params,
        req.params.id,
        req.userId ?? ''
      );

      if (result.changes === 0) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      const budget = await db.get<DbBudget>('SELECT * FROM budgets WHERE id = ?', req.params.id);
      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }
      res.json(mapBudget(budget));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update budget' });
    }
  }
);

// DELETE /api/budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM budgets WHERE id = ? AND userId = ?', req.params.id, req.userId ?? '');
    if (result.changes === 0) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

export default router;
