import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Receipt, PiggyBank, AlertCircle } from 'lucide-react';
import { getExpenses } from '../services/api';
import type { Expense, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getExpenses()
      .then((res) => setExpenses(res.data))
      .catch(() => setError('Failed to load expenses'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalThisMonth = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals: CategoryTotal[] = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    total: currentMonthExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const categoryColors: Record<string, string> = {
    Food: 'bg-orange-100 text-orange-700',
    Transport: 'bg-blue-100 text-blue-700',
    Entertainment: 'bg-purple-100 text-purple-700',
    Health: 'bg-green-100 text-green-700',
    Shopping: 'bg-pink-100 text-pink-700',
    Utilities: 'bg-yellow-100 text-yellow-700',
    Education: 'bg-indigo-100 text-indigo-700',
    Other: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good day, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your spending overview</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <TrendingDown size={18} className="text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalThisMonth.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{currentMonthExpenses.length} expenses</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Receipt size={18} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">All Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalAllTime.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.length} total expenses</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <PiggyBank size={18} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Avg/Expense</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${expenses.length ? (totalAllTime / expenses.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-gray-400 mt-1">per transaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Spending by Category (This Month)
          </h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : categoryTotals.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses this month.</p>
          ) : (
            <ul className="space-y-3">
              {categoryTotals.map(({ category, total }) => (
                <li key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[category]}`}
                    >
                      {category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">${total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Expenses</h2>
            <Link to="/expenses" className="text-xs text-indigo-600 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : recentExpenses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">No expenses yet.</p>
              <Link
                to="/expenses"
                className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add your first expense
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentExpenses.map((expense) => (
                <li key={expense._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{expense.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(expense.date).toLocaleDateString()} · {expense.category}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ${expense.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
