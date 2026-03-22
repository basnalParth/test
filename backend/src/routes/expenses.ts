import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { randomUUID } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getDb } from '../db';

interface DbExpense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const router = Router();

const mapExpense = (expense: DbExpense) => ({
  _id: expense.id,
  userId: expense.userId,
  title: expense.title,
  amount: expense.amount,
  category: expense.category,
  description: expense.description ?? undefined,
  date: expense.date,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

const normalizeDate = (value?: string): string | null => {
  if (!value) return null;
  const parsedDate = new Date(value);
  if (isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toISOString();
};

// All routes require authentication
router.use(authenticate);

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, search } = req.query as Record<string, string>;
    const db = await getDb();

    const conditions: string[] = ['userId = ?'];
    const params: Array<string | number> = [req.userId ?? ''];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    const normalizedStart = normalizeDate(startDate);
    if (normalizedStart) {
      conditions.push('date >= ?');
      params.push(normalizedStart);
    }

    const normalizedEnd = normalizeDate(endDate);
    if (normalizedEnd) {
      conditions.push('date <= ?');
      params.push(normalizedEnd);
    }

    if (minAmount) {
      conditions.push('amount >= ?');
      params.push(Number(minAmount));
    }

    if (maxAmount) {
      conditions.push('amount <= ?');
      params.push(Number(maxAmount));
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const likeQuery = `%${search}%`;
      params.push(likeQuery, likeQuery);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const expenses = await db.all<DbExpense[]>(
      `SELECT * FROM expenses ${whereClause} ORDER BY date DESC`,
      params
    );

    res.json(expenses.map(mapExpense));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { title, amount, category, description, date } = req.body as {
        title: string;
        amount: number;
        category: string;
        description?: string;
        date?: string;
      };

      const now = new Date().toISOString();
      const expenseDate = date ? normalizeDate(date) : now;
      if (date && !expenseDate) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }
      const expenseId = randomUUID();
      const db = await getDb();

      await db.run(
        'INSERT INTO expenses (id, userId, title, amount, category, description, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        expenseId,
        req.userId ?? '',
        title.trim(),
        amount,
        category,
        description ? description.trim() : null,
        expenseDate,
        now,
        now
      );

      const created = await db.get<DbExpense>('SELECT * FROM expenses WHERE id = ?', expenseId);
      if (!created) {
        res.status(500).json({ error: 'Failed to create expense' });
        return;
      }
      res.status(201).json(mapExpense(created));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }
);

// GET /api/expenses/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const expense = await db.get<DbExpense>(
      'SELECT * FROM expenses WHERE id = ? AND userId = ?',
      req.params.id,
      req.userId ?? ''
    );
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    res.json(mapExpense(expense));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

const updateExpense = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { title, amount, category, description, date } = req.body as {
      title?: string;
      amount?: number;
      category?: string;
      description?: string;
      date?: string;
    };

    const fields: string[] = [];
    const params: Array<string | number | null> = [];
    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title.trim());
    }
    if (amount !== undefined) {
      fields.push('amount = ?');
      params.push(amount);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description ? description.trim() : null);
    }
    if (date !== undefined) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }
      fields.push('date = ?');
      params.push(normalizedDate);
    }

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());

    const db = await getDb();
    const result = await db.run(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      ...params,
      req.params.id,
      req.userId ?? ''
    );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    const updated = await db.get<DbExpense>('SELECT * FROM expenses WHERE id = ?', req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    res.json(mapExpense(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// PUT /api/expenses/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
  ],
  updateExpense
);

// PATCH /api/expenses/:id
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
  ],
  updateExpense
);

// DELETE /api/expenses/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const result = await db.run('DELETE FROM expenses WHERE id = ? AND userId = ?', req.params.id, req.userId ?? '');
    if (result.changes === 0) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
