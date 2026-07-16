import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { EmployeesModule } from './modules/employees/EmployeesModule';
import { LeaveModule } from './modules/leave/LeaveModule';
import { ExpenseModule } from './modules/expense/ExpenseModule';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { AIBar } from './ai/AIBar';

const NAV = [
  { to: '/dashboard', label: '仪表盘' },
  { to: '/employees', label: '员工管理' },
  { to: '/leave', label: '请假管理' },
  { to: '/expense', label: '报销管理' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">AI-Native Demo</div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="nav-item">
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardModule />} />
          <Route path="/employees" element={<EmployeesModule />} />
          <Route path="/leave" element={<LeaveModule />} />
          <Route path="/expense" element={<ExpenseModule />} />
        </Routes>
      </main>
      <AIBar />
    </div>
  );
}
