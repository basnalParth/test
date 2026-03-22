import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import Expense from '../models/Expense';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/expenses
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, search } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { userId: req.userId };
// Get all expenses for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter: any = { userId: req.userId };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) (filter.amount as Record<string, unknown>).$gte = Number(minAmount);
      if (maxAmount) (filter.amount as Record<string, unknown>).$lte = Number(maxAmount);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
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

      const expense = new Expense({
        userId: req.userId,
        title,
        amount,
        category,
        description,
        date: date ? new Date(date) : new Date(),
      });

      await expense.save();
      res.status(201).json(expense);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create expense' });
    }
  }
);

// GET /api/expenses/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// PUT /api/expenses/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
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
        title?: string;
        amount?: number;
        category?: string;
        description?: string;
        date?: string;
      };

      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (amount !== undefined) updates.amount = amount;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (date !== undefined) updates.date = new Date(date);

      const expense = await Expense.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      res.json(expense);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update expense' });
    }
  }
);

// PATCH /api/expenses/:id
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
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
        title?: string;
        amount?: number;
        category?: string;
        description?: string;
        date?: string;
      };

      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (amount !== undefined) updates.amount = amount;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (date !== undefined) updates.date = new Date(date);

      const expense = await Expense.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!expense) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      res.json(expense);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to patch expense' });
    }
  }
);

// DELETE /api/expenses/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) {
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
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense
router.post('/', authenticate, [
  body('category').notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('description').optional()
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { category, amount, description, date } = req.body;
    const expense = new Expense({
      userId: req.userId,
      category,
      amount,
      description,
      date: date ? new Date(date) : new Date()
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    Object.assign(expense, req.body);
    expense.updatedAt = new Date();
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
