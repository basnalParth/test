import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Health'
  | 'Shopping'
  | 'Utilities'
  | 'Education'
  | 'Other';

export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Education', 'Other'],
    },
    description: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
