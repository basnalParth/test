import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getExpenses } from '../services/api';
import type { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../types';

const COLORS = [
  '#6366f1', '#f97316', '#22c55e', '#ec4899',
  '#eab308', '#14b8a6', '#8b5cf6', '#64748b',
];

export default function Analytics() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpenses()
      .then((res) => setExpenses(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Monthly totals for the last 6 months
  const monthlyData = (() => {
    const months: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((s, e) => s + e.amount, 0);
      months.push({ label, total });
    }
    return months;
  })();

  // Category breakdown (all time)
  const categoryData = EXPENSE_CATEGORIES.map((cat, i) => ({
    name: cat,
    value: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: COLORS[i % COLORS.length],
  })).filter((c) => c.value > 0);

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Visual breakdown of your spending</p>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No expense data yet. Add some expenses to see analytics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Spending (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category pie chart + summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                  />
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Category Summary</h2>
              <ul className="space-y-3">
                {categoryData.map((c) => (
                  <li key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">${c.value.toFixed(2)}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {((c.value / totalSpend) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Total</span>
                <span className="font-bold text-gray-900">${totalSpend.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
