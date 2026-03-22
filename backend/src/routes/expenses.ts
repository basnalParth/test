import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import Expense from '../models/Expense';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all expenses for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filter: any = { userId: req.userId };

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
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