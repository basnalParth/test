import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import type { Expense, ExpenseFormData, ExpenseFilters } from '../types';
import { EXPENSE_CATEGORIES } from '../types';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM: ExpenseFormData = {
  title: '',
  amount: 0,
  category: 'Other',
  description: '',
  date: today(),
};

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

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [search, setSearch] = useState('');

  const fetchExpenses = (f?: ExpenseFilters) => {
    setLoading(true);
    api
      .getExpenses(f)
      .then((res) => setExpenses(res.data))
      .catch(() => setError('Failed to load expenses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      description: expense.description ?? '',
      date: expense.date.split('T')[0],
    });
    setEditingId(expense._id);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateExpense(editingId, form);
      } else {
        await api.createExpense(form);
      }
      setShowModal(false);
      fetchExpenses(filters);
    } catch {
      setError('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch {
      setError('Failed to delete expense');
    }
  };

  const handleSearch = () => {
    const f: ExpenseFilters = { ...filters, search: search || undefined };
    setFilters(f);
    fetchExpenses(f);
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    const f = { ...filters, [key]: value || undefined };
    setFilters(f);
    fetchExpenses(f);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your spending records</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 text-sm border-none outline-none bg-transparent"
          />
          <button
            onClick={handleSearch}
            className="text-xs text-indigo-600 hover:underline shrink-0"
          >
            Search
          </button>
        </div>

        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          value={filters.category ?? ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          value={filters.startDate ?? ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="From"
        />
        <input
          type="date"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          value={filters.endDate ?? ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="To"
        />
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm mb-3">No expenses found.</p>
            <button
              onClick={openCreate}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Add first expense
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{expense.title}</p>
                    {expense.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{expense.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[expense.category]}`}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(expense)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Expense' : 'New Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value as ExpenseFormData['category'] }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
