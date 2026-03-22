import { Schema, model, Document } from 'mongoose';

interface IExpense extends Document {
  userId: string;
  category: string;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default model<IExpense>('Expense', expenseSchema);
