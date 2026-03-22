import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white w-64 min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-indigo-600">
        <h1 className="text-xl font-bold tracking-tight">💰 Expense Tracker</h1>
        {user && <p className="text-indigo-200 text-sm mt-1 truncate">{user.name}</p>}
      </div>

      <ul className="flex-1 py-4 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900 text-white'
                    : 'text-indigo-100 hover:bg-indigo-600'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-600 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </nav>
  );
}
