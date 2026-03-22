import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Budget from '../models/Budget';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/budgets
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.userId };
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const budgets = await Budget.find(filter).sort({ year: -1, month: -1 });
    res.json(budgets);
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

      // Upsert: update existing budget for the same category/month/year, or create new one
      const budget = await Budget.findOneAndUpdate(
        { userId: req.userId, category, month, year },
        { $set: { limit } },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(201).json(budget);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save budget' });
    }
  }
);

// GET /api/budgets/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.userId });
    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT /api/budgets/:id
router.put(
  '/:id',
  [
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

      const updates: Record<string, unknown> = {};
      if (category !== undefined) updates.category = category;
      if (limit !== undefined) updates.limit = limit;
      if (month !== undefined) updates.month = month;
      if (year !== undefined) updates.year = year;

      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }
      res.json(budget);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update budget' });
    }
  }
);

// DELETE /api/budgets/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!budget) {
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
