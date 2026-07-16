import { useState } from 'react';
import { useEmployeeStore } from '../employees/employees.store';
import { useLeaveStore } from '../leave/leave.store';
import { useExpenseStore } from '../expense/expense.store';

type Range = '本月' | '本季' | '全年';

export function DashboardModule() {
  const employees = useEmployeeStore((s) => s.list);
  const leaves = useLeaveStore((s) => s.list);
  const expenses = useExpenseStore((s) => s.list);
  const [range, setRange] = useState<Range>('本月');

  // demo 用倍率模拟不同时间口径
  const factor = range === '本月' ? 1 : range === '本季' ? 3 : 12;

  const pendingLeave = leaves.filter((l) => l.status === '待审批').length;
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0) * factor;

  const cards = [
    { label: '员工总数', value: employees.length },
    { label: '待审批请假', value: pendingLeave },
    { label: `${range}报销总额`, value: `¥${totalExpense}` },
  ];

  return (
    <div data-ai-module="dashboard" data-ai-label="仪表盘" data-ai-route="/dashboard">
      <div className="page-head">
        <div className="page-title">仪表盘</div>
        <div className="toolbar">
          <button className="btn" data-ai-action="dashboard.rangeMonth" data-ai-label="切换到本月数据" onClick={() => setRange('本月')}>
            本月
          </button>
          <button className="btn" data-ai-action="dashboard.rangeQuarter" data-ai-label="切换到本季数据" onClick={() => setRange('本季')}>
            本季
          </button>
          <button className="btn" data-ai-action="dashboard.rangeYear" data-ai-label="切换到全年数据" onClick={() => setRange('全年')}>
            全年
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 12, color: '#86909c', fontSize: 13 }}>当前口径：{range}</div>
      <div className="cards">
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="card-value">{c.value}</div>
            <div className="card-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
