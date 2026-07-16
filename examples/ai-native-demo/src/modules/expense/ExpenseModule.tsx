import { useState } from 'react';
import { Table, type Column } from '../../components/Table';
import { ExpenseForm } from './ExpenseForm';
import { useExpenseStore, type Expense } from './expense.store';

export function ExpenseModule() {
  const { list, filterCategory, setFilter } = useExpenseStore();
  const [open, setOpen] = useState(false);

  const filtered = filterCategory ? list.filter((e) => e.category === filterCategory) : list;

  const columns: Column<Expense>[] = [
    { key: 'category', title: '类别' },
    { key: 'amount', title: '金额', render: (r) => `¥${r.amount}` },
    { key: 'date', title: '日期' },
    { key: 'note', title: '备注' },
  ];

  return (
    <div>
      <div className="page-head">
        <div className="page-title">报销管理</div>
        <div className="toolbar">
          <select
            data-ai-field="expense.filterCategory"
            data-ai-label="按类别筛选"
            data-ai-type="select"
            data-ai-options="差旅,餐饮,办公,其他"
            value={filterCategory}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '7px 10px', border: '1px solid #d0d3d9', borderRadius: 6 }}
          >
            <option value="">全部类别</option>
            <option value="差旅">差旅</option>
            <option value="餐饮">餐饮</option>
            <option value="办公">办公</option>
            <option value="其他">其他</option>
          </select>
          <button className="btn" data-ai-action="expense.filter" data-ai-label="应用报销筛选">
            筛选
          </button>
          <button className="btn btn-primary" data-ai-action="expense.create" data-ai-label="新增报销" onClick={() => setOpen(true)}>
            新增报销
          </button>
        </div>
      </div>
      <Table columns={columns} data={filtered} rowKey={(r) => r.id} empty="暂无报销记录" />
      <ExpenseForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
